require('dotenv').config();
const Groq = require('groq-sdk');
const Event = require('../models/Event');
const Article = require('../models/Article');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TIME_WINDOW_HOURS = 48;
const JACCARD_THRESHOLD = 0.05; // Lowered from 0.15 — paraphrased real-world
// headlines about the same event often share
// very few literal words (e.g., "Fed cuts
// rates" vs "Powell announces rate slash"),
// so a high threshold was rejecting genuine
// matches before the LLM ever saw them.

// --- STAGE 1: Algorithmic Pre-Filter (Jaccard Text Overlap) ---
const calculateJaccardSimilarity = (str1, str2) => {
  const set1 = new Set(str1.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/));
  const set2 = new Set(str2.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/));

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
};

// --- STAGE 2: LLM Verification via Meta Llama 3 (Groq LPUs) ---
const isSameEvent = async (titleA, titleB) => {
  const prompt = `You are a news analyst identifying duplicate event coverage across different news outlets.

Two different outlets often describe the SAME real-world event using completely different wording — different named people, different phrasing, different emphasis. Judge whether the underlying event is the same, NOT whether the wording matches.

However, be careful: two headlines about the SAME company, person, or topic are NOT automatically the same event. Only answer SAME if they describe the identical specific incident, decision, or occurrence. A company can have multiple genuinely different things happen to it on the same day.

Examples of SAME event (different wording, same occurrence):
- "US Federal Reserve cuts interest rates by 50 basis points" and "Jerome Powell announces major rate slash at FOMC meeting" → SAME
- "OpenAI releases GPT-5" and "Sam Altman unveils OpenAI's newest flagship model" → SAME

Examples of DIFFERENT events (same entity/topic, but genuinely separate occurrences):
- "Alphabet fined by EU for favouring its own apps" and "Alphabet reports record quarterly earnings" → DIFFERENT (same company, but a regulatory fine and an earnings report are unrelated events)
- "European Central Bank leaves interest rate unchanged" and "Fed funds futures price in chance of rate hike" → DIFFERENT (same general topic, but two different institutions making separate decisions)
- "Apple unveils new AI chip" and "Apple stock rises after chip announcement" → DIFFERENT (the announcement and the market's reaction to it are two distinct events)

Now judge this pair:
Headline A: "${titleA}"
Headline B: "${titleB}"

Do they describe the SAME specific real-world event, or DIFFERENT events? Respond with ONLY one word: "SAME" or "DIFFERENT". Do not write anything else.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
    });

    const answer = completion.choices[0]?.message?.content?.trim().toUpperCase() || '';
    return answer.includes('SAME');
  } catch (error) {
    console.error('Groq API Error in isSameEvent:', error.message);
    return false;
  }
};

// --- Hybrid Two-Stage Search Engine ---
const findMatchingEvent = async (article) => {
  const cutoffTime = new Date(Date.now() - TIME_WINDOW_HOURS * 60 * 60 * 1000);
  const recentEvents = await Event.find({
    sector: article.sector,
    first_reported: { $gte: cutoffTime },
  }).sort({ first_reported: -1 });

  for (const event of recentEvents) {
    const similarity = calculateJaccardSimilarity(event.event_title, article.title);

    if (similarity >= JACCARD_THRESHOLD) {
      console.log(`⚡ Jaccard similarity ${(similarity * 100).toFixed(1)}% met for "${article.title}" vs "${event.event_title}". Calling Llama 3...`);
      const matches = await isSameEvent(event.event_title, article.title);
      if (matches) return event;
    } else {
      console.log(`⏩ Skipped LLM call (Jaccard similarity only ${(similarity * 100).toFixed(1)}%) for "${article.title}"`);
    }
  }
  return null;
};

// --- Confidence Scoring ---
const calculateConfidence = (sourceCount) => {
  if (sourceCount === 1) return 35;
  if (sourceCount === 2) return 65;
  if (sourceCount >= 3) return 90;
  return 0;
};

// --- Multi-Source Evidence Fusion using Llama 3 ---
const fuseSummaries = async (articles) => {
  const sourceSummaries = articles
    .map((a, i) => `Source ${i + 1}: ${a.unique_summary}`)
    .join('\n\n');

  const prompt = `You are a senior news editor combining reports from multiple sources. Write ONE consolidated summary (approx 150 words) synthesizing the information below. Do not mention "Source 1". Highlight any conflicting details.
  ${sourceSummaries}
  Return ONLY the summary.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
    });

    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Groq API Error in fuseSummaries:', error.message);
    return articles[0]?.unique_summary || '';
  }
};

const updateEventFusion = async (event) => {
  const fullArticles = await Article.find({ _id: { $in: event.source_articles } });
  const confidence = calculateConfidence(fullArticles.length);

  let fusedSummary;
  if (fullArticles.length >= 2) {
    fusedSummary = await fuseSummaries(fullArticles);
  } else {
    fusedSummary = fullArticles[0]?.unique_summary || '';
  }

  event.fused_summary = fusedSummary;
  event.confidence_score = confidence;
  await event.save();
  return event;
};

const processArticleIntoEvent = async (article) => {
  const matchingEvent = await findMatchingEvent(article);
  let event;

  if (matchingEvent) {
    matchingEvent.source_articles.push(article._id);
    matchingEvent.last_updated = new Date();
    await matchingEvent.save();
    console.log(`🔗 Linked "${article.title}" to existing event: "${matchingEvent.event_title}"`);
    event = matchingEvent;
  } else {
    const newEvent = new Event({
      event_title: article.title,
      sector: article.sector,
      source_articles: [article._id],
      image_url: article.image_url,
    });
    await newEvent.save();
    console.log(`🆕 Created new event: "${newEvent.event_title}"`);
    event = newEvent;
  }

  await updateEventFusion(event);
  console.log(`📊 Confidence: ${event.confidence_score}% | Sources: ${event.source_articles.length}`);
  return event;
};

module.exports = {
  processArticleIntoEvent,
  isSameEvent,
  findMatchingEvent,
  calculateConfidence,
  calculateJaccardSimilarity,
};