require('dotenv').config();
const Groq = require('groq-sdk');
const Event = require('../models/Event');
const Article = require('../models/Article');
const { repairAndParseJson } = require('../utils/jsonRepair');
const { recordAiSuccess, recordAiFailure } = require('../utils/aiTelemetry');
const { computeEfsaScore } = require('../utils/efsaEngine');
const { updatePublisherCredibility } = require('../utils/dpcsEngine');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const {
  calculateJaccardSimilarity,
  calculateSemanticCosineSimilarity
} = require('../utils/textSimilarity');

const TIME_WINDOW_HOURS = 48;
const JACCARD_THRESHOLD = 0.12; // Optimal threshold with stop-word removal to prevent false positives and rate limits
const SEMANTIC_COSINE_THRESHOLD = 0.25; // Dense vector semantic similarity fallback (catches synonym-rich pairs Jaccard misses)


// ── STAGE 2: LLM Verification via Meta Llama 3 (Groq LPUs) ─────────────────
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

  const startMs = Date.now();
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
    });

    const latencyMs = Date.now() - startMs;
    recordAiSuccess({ model: 'llama-3.1-8b-instant', latencyMs, usage: completion.usage });

    const answer = completion.choices[0]?.message?.content?.trim().toUpperCase() || '';
    return answer.includes('SAME');
  } catch (error) {
    const latencyMs = Date.now() - startMs;
    recordAiFailure({ model: 'llama-3.1-8b-instant', latencyMs, error: error.message });
    console.error('Groq API Error in isSameEvent:', error.message);
    return false;
  }
};

// ── Hybrid Two-Stage Search Engine (Jaccard + Cosine → LLM) ─────────────────
const findMatchingEvent = async (article) => {
  const cutoffTime = new Date(Date.now() - TIME_WINDOW_HOURS * 60 * 60 * 1000);
  const recentEvents = await Event.find({
    sector: article.sector,
    first_reported: { $gte: cutoffTime },
  }).sort({ first_reported: -1 });

  for (const event of recentEvents) {
    const jaccard = calculateJaccardSimilarity(event.event_title, article.title);
    const cosine = calculateSemanticCosineSimilarity(event.event_title, article.title);
    const efsaResult = computeEfsaScore(article, event);

    const passesJaccard = jaccard >= JACCARD_THRESHOLD;
    const passesCosine = cosine >= SEMANTIC_COSINE_THRESHOLD;
    const passesEfsa = efsaResult.passesEfsa;

    if (passesJaccard || passesCosine || passesEfsa) {
      const triggerReason = passesEfsa
        ? `EFSA ${(efsaResult.S_EFSA * 100).toFixed(1)}%`
        : (passesJaccard ? `Jaccard ${(jaccard * 100).toFixed(1)}%` : `Cosine ${(cosine * 100).toFixed(1)}%`);
      console.log(`⚡ [${triggerReason}] threshold met for "${article.title}" vs "${event.event_title}". Calling Llama 3...`);
      const matches = await isSameEvent(event.event_title, article.title);
      if (matches) return event;
    } else {
      console.log(`⏩ Skipped LLM call (Jaccard ${(jaccard * 100).toFixed(1)}% | Cosine ${(cosine * 100).toFixed(1)}% | EFSA ${(efsaResult.S_EFSA * 100).toFixed(1)}%) for "${article.title}"`);
    }
  }
  return null;
};

// ── Confidence Scoring ───────────────────────────────────────────────────────
const calculateConfidence = (sourceCount) => {
  if (sourceCount === 1) return 35;
  if (sourceCount === 2) return 65;
  if (sourceCount >= 3) return 90;
  return 0;
};

// ── Multi-Source Evidence Fusion using Llama 3 ──────────────────────────────
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

// ── Feature 1: Source Stance Detection & Divergence Agent ───────────────────
// Classifies each source article's reporting stance relative to the event's
// core claim: Supporting, Contradicting, or Neutral.
// Computes a quantitative divergence_score (0-100) indicating publisher disagreement.
const detectStancesAndDivergence = async (event, articles) => {
  if (articles.length < 2) {
    // Single source: stance is trivially Supporting, divergence 0
    return {
      stanceAnalysis: [{ 
        article_id: articles[0]?._id,
        publisher: extractPublisherFromTitle(articles[0]?.title),
        stance: 'Supporting', 
        framing: 'Single-source report', 
        rationale: 'No divergence analysis with only one source.' 
      }],
      divergenceScore: 0,
    };
  }

  const summariesForPrompt = articles
    .map((a, i) => `Source ${i + 1} [Title: "${a.title}"]: ${a.unique_summary?.slice(0, 200)}`)
    .join('\n\n');

  const prompt = `You are a media bias and stance analysis expert. Given this news event core claim and multiple source reports, classify each source's stance.

Event: "${event.event_title}"

Source Reports:
${summariesForPrompt}

For each source, respond with a JSON array where each object has:
- "source_index": (1-based number matching the source number above)
- "stance": one of "Supporting", "Contradicting", or "Neutral"
- "framing": a 3-5 word phrase describing this outlet's editorial framing (e.g. "regulatory", "economic", "geopolitical", "human interest")
- "rationale": one sentence explaining why you classified it this way

Return ONLY valid JSON array. No explanation before or after the JSON.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '[]';
    // Extract JSON array from response using repairAndParseJson
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const stanceData = repairAndParseJson(jsonMatch ? jsonMatch[0] : raw) || [];

    const stanceAnalysis = stanceData.map((s) => {
      const article = articles[s.source_index - 1];
      const publisher = extractPublisherFromTitle(article?.title);
      const stance = s.stance || 'Neutral';

      // Update DPCS online credibility model
      updatePublisherCredibility(publisher, { stance });

      return {
        article_id: article?._id,
        publisher,
        stance,
        framing: s.framing || '',
        rationale: s.rationale || '',
      };
    });

    // Divergence score = % of sources that are Contradicting
    const contradictingCount = stanceAnalysis.filter(s => s.stance === 'Contradicting').length;
    const divergenceScore = Math.round((contradictingCount / stanceAnalysis.length) * 100);

    console.log(`📡 Stance Detection: ${stanceAnalysis.map(s => s.stance).join(' | ')} | Divergence: ${divergenceScore}%`);
    return { stanceAnalysis, divergenceScore };
  } catch (error) {
    console.error('Stance Detection Error:', error.message);
    return {
      stanceAnalysis: articles.map(a => ({
        article_id: a._id,
        publisher: extractPublisherFromTitle(a.title),
        stance: 'Neutral',
        framing: 'Parse error',
        rationale: 'Stance detection unavailable.',
      })),
      divergenceScore: 0,
    };
  }
};

// ── Feature 2: Hallucination Guardrail Reflection Loop ──────────────────────
// Verifies that the LLM-generated fused summary contains no foreign entities,
// fabricated numbers, or unsupported claims relative to raw source snippets.
// If a hallucination is detected, forces a self-correcting re-generation.
const verifyFactualityAndReflect = async (fusedSummary, articles) => {
  const rawSnippets = articles
    .map((a, i) => `Source ${i + 1}: ${a.unique_summary?.slice(0, 300)}`)
    .join('\n\n');

  const verificationPrompt = `You are a rigorous fact-checking agent. Your job is to verify an AI-generated news summary against its raw source material.

RAW SOURCE MATERIAL:
${rawSnippets}

AI-GENERATED FUSED SUMMARY TO VERIFY:
"${fusedSummary}"

Check for the following hallucination types:
1. Fabricated numbers, statistics, or percentages not mentioned in the sources
2. Named entities (people, companies, places) not present in any source
3. Causal claims or conclusions not supported by the sources

Respond with a JSON object:
{
  "passed": true or false,
  "checks": [
    { "check": "Fabricated Numbers", "passed": true/false, "flagged_content": "quote the suspicious part or empty string" },
    { "check": "Unsupported Named Entities", "passed": true/false, "flagged_content": "quote or empty" },
    { "check": "Unsupported Causal Claims", "passed": true/false, "flagged_content": "quote or empty" }
  ],
  "correction_needed": "Describe exactly what to fix, or empty string if passed"
}

Return ONLY valid JSON. No explanation.`;

  try {
    const verifyCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: verificationPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
    });

    const raw = verifyCompletion.choices[0]?.message?.content?.trim() || '{}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const result = repairAndParseJson(jsonMatch ? jsonMatch[0] : raw) || { passed: true, checks: [], correction_needed: '' };

    const reflectionLogs = (result.checks || []).map(c => ({
      check: c.check,
      passed: c.passed,
      flagged_content: c.flagged_content || '',
    }));

    if (!result.passed && result.correction_needed) {
      console.log(`🔁 Hallucination detected! Re-generating with correction feedback...`);
      // Reflection Pass: re-generate summary with error feedback injected
      const correctionPrompt = `You are a senior news editor. Your previous summary contained inaccuracies. Rewrite it strictly from the sources below.

CORRECTION NEEDED: ${result.correction_needed}

Sources:
${rawSnippets}

Write ONE corrected consolidated summary (approx 150 words). Return ONLY the summary.`;

      const correctedCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: correctionPrompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.2,
      });

      const correctedSummary = correctedCompletion.choices[0]?.message?.content?.trim() || fusedSummary;
      console.log(`✅ Reflection loop complete — summary corrected.`);
      return { verifiedSummary: correctedSummary, factualityVerified: false, reflectionLogs };
    }

    console.log(`✅ Factuality check passed — no hallucinations detected.`);
    return { verifiedSummary: fusedSummary, factualityVerified: true, reflectionLogs };
  } catch (error) {
    console.error('Hallucination Guardrail Error:', error.message);
    return { verifiedSummary: fusedSummary, factualityVerified: false, reflectionLogs: [] };
  }
};

// ── Utility: Extract publisher hint from article title or URL ───────────────
const extractPublisherFromTitle = (title = '') => {
  // Heuristic: try to extract source from common news title patterns
  // e.g. "Reuters - Company X does Y" → "Reuters"
  const patterns = [
    /^(Reuters|Bloomberg|BBC|CNN|AP|CNBC|WSJ|FT|NYT|Guardian|Al Jazeera|TechCrunch|Forbes|Fortune|Axios|Politico|TheVerge|Wired|Nature|Science)\b/i,
    /\|\s*(Reuters|Bloomberg|BBC|CNN|AP|CNBC)\s*$/i,
  ];
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) return match[1];
  }
  return 'Wire Source';
};

// ── Combined Fusion + Stance + Reflection Orchestrator ──────────────────────
const updateEventFusion = async (event) => {
  const fullArticles = await Article.find({ _id: { $in: event.source_articles } });
  const confidence = calculateConfidence(fullArticles.length);

  let fusedSummary;
  let factualityVerified = false;
  let reflectionLogs = [];
  let stanceAnalysis = [];
  let divergenceScore = 0;

  if (fullArticles.length >= 2) {
    // Step 1: Generate initial fused summary
    fusedSummary = await fuseSummaries(fullArticles);

    // Step 2: Hallucination Guardrail Reflection Loop
    const reflectionResult = await verifyFactualityAndReflect(fusedSummary, fullArticles);
    fusedSummary = reflectionResult.verifiedSummary;
    factualityVerified = reflectionResult.factualityVerified;
    reflectionLogs = reflectionResult.reflectionLogs;

    // Step 3: Source Stance Detection & Divergence Analysis
    const stanceResult = await detectStancesAndDivergence(event, fullArticles);
    stanceAnalysis = stanceResult.stanceAnalysis;
    divergenceScore = stanceResult.divergenceScore;
  } else {
    fusedSummary = fullArticles[0]?.unique_summary || '';
    factualityVerified = true;
    stanceAnalysis = [{
      article_id: fullArticles[0]?._id,
      publisher: extractPublisherFromTitle(fullArticles[0]?.title),
      stance: 'Supporting',
      framing: 'Single source',
      rationale: 'Single-source event node — no divergence analysis needed.',
    }];
  }

  event.fused_summary = fusedSummary;
  event.confidence_score = confidence;
  event.factuality_verified = factualityVerified;
  event.reflection_logs = reflectionLogs;
  event.stance_analysis = stanceAnalysis;
  event.divergence_score = divergenceScore;
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
  console.log(`📊 Confidence: ${event.confidence_score}% | Sources: ${event.source_articles.length} | Divergence: ${event.divergence_score}%`);
  return event;
};

module.exports = {
  processArticleIntoEvent,
  isSameEvent,
  findMatchingEvent,
  calculateConfidence,
  calculateJaccardSimilarity,
  calculateSemanticCosineSimilarity,
  detectStancesAndDivergence,
  verifyFactualityAndReflect,
};