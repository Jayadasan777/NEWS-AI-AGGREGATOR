require('dotenv').config();
const crypto = require('crypto');
const Parser = require('rss-parser');
const Groq = require('groq-sdk');
const Article = require('../models/Article');
const { processArticleIntoEvent } = require('./eventEngine');
const { broadcastArticle } = require('../utils/socialBroadcast');

const parser = new Parser();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
let dripOffsetCounter = 0;

// --- Massive Scale: 14 Multi-Source Feed Registry ---
const RSS_FEEDS = {
  Tech: [
    'https://techcrunch.com/feed/',
    'https://www.theverge.com/rss/index.xml'
  ],
  Finance: [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664'
  ],
  Geopolitics: [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://www.aljazeera.com/xml/rss/all.xml'
  ],
  Sports: [
    'https://feeds.bbci.co.uk/sport/rss.xml',
    'https://www.espn.com/espn/rss/news'
  ],
  AI: [
    'https://news.google.com/rss/search?q=Artificial+Intelligence&hl=en-US&gl=US&ceid=US:en'
  ],
  Startups: [
    'https://news.google.com/rss/search?q=Startup+funding&hl=en-US&gl=US&ceid=US:en'
  ],
  Crypto: [
    'https://cointelegraph.com/rss'
  ],
  Health: [
    'https://feeds.bbci.co.uk/news/health/rss.xml'
  ],
  Science: [
    'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml'
  ],
  Entertainment: [
    'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml'
  ],
  Environment: [
    'https://news.google.com/rss/search?q=Climate+Change&hl=en-US&gl=US&ceid=US:en'
  ],
  Automotive: [
    'https://news.google.com/rss/search?q=Electric+Vehicles+Automotive&hl=en-US&gl=US&ceid=US:en'
  ],
  Defense: [
    'https://news.google.com/rss/search?q=Global+Defense+Military&hl=en-US&gl=US&ceid=US:en'
  ],
  Space: [
    'https://news.google.com/rss/search?q=Space+Exploration+NASA+SpaceX&hl=en-US&gl=US&ceid=US:en'
  ]
};

const ARTICLES_PER_FEED = 3;

// --- API Throttling Utility ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Synthesize Article & Generate Instagram/Social Metadata using Llama 3 (Groq) ---
const synthesizeWithGroq = async (title, description, sector) => {
  const prompt = `You are a professional news editor and social media manager for an autonomous news agency called NewsAI.
Based on the following news headline and description, return a valid JSON object with four exact fields:
1. "summary": A professional editorial summary of about 150 words in a neutral, informative tone. Do not copy phrases directly.
2. "social_caption": An engaging Instagram caption starting with a catchy emoji hook headline (e.g. 🚨 BREAKING: or 🤖 AI UPDATE:), followed by a brief 2-3 bullet point breakdown, ending with a call to action.
3. "social_hashtags": An array of 10-14 viral, relevant hashtags (e.g. ["#NewsAI", "#TechNews", "#AI", "#Geopolitics"]).
4. "image_prompt": A detailed description for an AI image generator to create an authentic, Pulitzer-prize winning press photograph and broadcast journalism photo representing this event. Must use professional camera optics terms: 'Shot on 35mm lens, f/2.8, natural lighting, ultra-realistic press photograph, Reuters/AP News photojournalism style, 8k resolution, authentic candid shot, no text, no watermarks, no cartoons, no illustrations, no digital art.' Describe specific subjects, settings, and lighting relevant to the news story.

Original Title: ${title}
Original Description: ${description}
Sector: ${sector}

Return ONLY valid JSON without any markdown code blocks or commentary. Example format:
{"summary": "...", "social_caption": "...", "social_hashtags": ["#NewsAI", "#Breaking"], "image_prompt": "..."}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (content) {
      const parsed = JSON.parse(content);
      return {
        summary: parsed.summary || description,
        social_caption: parsed.social_caption || `🚨 ${title}\n\n${description.slice(0, 180)}...\n\nRead full intelligence dispatch on NewsAI.`,
        social_hashtags: Array.isArray(parsed.social_hashtags) ? parsed.social_hashtags : [`#${sector}`, '#NewsAI', '#BreakingNews'],
        image_prompt: parsed.image_prompt || `${title}, Reuters press photograph, shot on 35mm lens, natural lighting, ultra-realistic photojournalism style, 8k resolution`
      };
    }
  } catch (error) {
    console.error('❌ Groq Synthesis Error:', error.message);
  }

  // Fallback if LLM fails
  return {
    summary: description,
    social_caption: `🚨 ${title}\n\n${description.slice(0, 180)}...\n\nRead full intelligence dispatch on NewsAI.`,
    social_hashtags: [`#${sector}`, '#NewsAI', '#BreakingNews', '#TechNews', '#Geopolitics'],
    image_prompt: `${title}, Reuters press photograph, shot on 35mm lens, natural lighting, ultra-realistic photojournalism style, 8k resolution`
  };
};

// --- Extract Real Broadcast Image from RSS Feed (if available) ---
const extractRssImage = (item) => {
  try {
    if (item.enclosure && item.enclosure.url && (!item.enclosure.type || item.enclosure.type.startsWith('image/'))) {
      return item.enclosure.url;
    }
    if (item['media:content'] && item['media:content'].$ && item['media:content'].$.url) {
      return item['media:content'].$.url;
    }
    if (Array.isArray(item['media:content']) && item['media:content'][0] && item['media:content'][0].$ && item['media:content'][0].$.url) {
      return item['media:content'][0].$.url;
    }
    if (item['media:thumbnail'] && item['media:thumbnail'].$ && item['media:thumbnail'].$.url) {
      return item['media:thumbnail'].$.url;
    }
    if (Array.isArray(item['media:thumbnail']) && item['media:thumbnail'][0] && item['media:thumbnail'][0].$ && item['media:thumbnail'][0].$.url) {
      return item['media:thumbnail'][0].$.url;
    }
    const imgMatch = (item.content || item['content:encoded'] || '').match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }
  } catch (err) {
    // Ignore extraction error
  }
  return null;
};

// --- Enterprise Image Pipeline (FLUX Realism Photojournalism Generation) ---
const generateAndHostImage = (customPrompt, sector, articleTitle) => {
  try {
    const basePrompt = customPrompt || `${articleTitle}, Reuters press photograph, shot on 35mm lens, natural lighting, ultra-realistic photojournalism style, 8k resolution`;
    const fullPrompt = `${basePrompt}, Pulitzer prize news photography, authentic broadcast journalism photo, no text, no watermark, no cartoon, no illustration`;
    
    const encodedPrompt = encodeURIComponent(fullPrompt);
    const randomSeed = Math.floor(Math.random() * 1000000);
    // Using model=flux-realism for photorealistic news photography
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&model=flux-realism&nologo=true&seed=${randomSeed}`;
  } catch (error) {
    console.error('❌ Image Pipeline Error:', error.message);
    return ''; 
  }
};

// --- Process Batches to Respect API Limits & Stagger Drip-Feeding ---
const processBatch = async (articlesBatch, sectorName) => {
  for (const item of articlesBatch) {
    try {
      const articleUrl = item.link || item.guid || item.url || '';
      const titleHash = crypto.createHash('md5').update((item.title || '').toLowerCase().trim()).digest('hex');

      // Layer 1: Strict Multi-Layer Anti-Duplication Lock (URL + Title Hash + Exact Title)
      const deduplicationConditions = [
        { title: item.title },
        { title_hash: titleHash }
      ];
      if (articleUrl) {
        deduplicationConditions.push({ url: articleUrl });
      }

      const alreadyExists = await Article.findOne({ $or: deduplicationConditions });
      if (alreadyExists) {
        console.log(`⏭️ Skipped (Multi-Layer Anti-Duplication Lock): ${item.title}`);
        continue;
      }

      console.log(`\n⏳ Processing: ${item.title}`);
      
      const { summary, social_caption, social_hashtags, image_prompt } = await synthesizeWithGroq(
        item.title, 
        item.contentSnippet || item.title, 
        sectorName
      );
      
      // Try extracting real broadcast image from RSS feed first, fallback to FLUX Realism AI Photojournalism
      const realRssImage = extractRssImage(item);
      const frontendImageUrl = realRssImage || generateAndHostImage(image_prompt, sectorName, item.title);
      if (realRssImage) {
        console.log(`📸 Extracted real news channel image from RSS feed`);
      } else {
        console.log(`🤖 Generated FLUX Realism AI photojournalism image`);
      }

      // Feature 2: Autonomous Smart-Queue Staggered Drip-Feeding (1-hour offsets between batch dispatches)
      const scheduledTime = new Date(Date.now() + (dripOffsetCounter * 3600000));
      dripOffsetCounter++;

      const newArticle = new Article({
        title: item.title,
        title_hash: titleHash,
        url: articleUrl,
        unique_summary: summary,
        sector: sectorName,
        image_url: frontendImageUrl,
        social_caption: social_caption,
        social_hashtags: social_hashtags,
        broadcast_status: 'pending',
        scheduled_broadcast_time: scheduledTime
      });

      await newArticle.save();
      console.log(`✅ Saved successfully (Summary + IG Caption + Hashtags + TitleHash generated, Drip Schedule: ${scheduledTime.toLocaleTimeString()})`);

      // Layer 2: Hybrid Jaccard + Llama 3 Event Clustering
      await processArticleIntoEvent(newArticle);

      // Layer 3: Autonomous Social Media Broadcast (if enabled)
      const isAutoEnabled = typeof global.AUTO_BROADCAST_ENABLED !== 'undefined' 
        ? global.AUTO_BROADCAST_ENABLED 
        : (process.env.AUTO_BROADCAST === 'true');

      if (isAutoEnabled) {
        console.log(`🤖 AUTO_BROADCAST is enabled! Attempting automated social dispatch...`);
        await broadcastArticle(newArticle);
      }

    } catch (error) {
      console.error(`❌ Failed to process "${item.title}":`, error.message);
    }
  }
};

// --- Run the full engine across all 14 feeds ---
const runNewsEngine = async () => {
  console.log('🚀 Starting Enterprise NISE run across all sectors...');
  dripOffsetCounter = 0;

  for (const [sectorName, feeds] of Object.entries(RSS_FEEDS)) {
    console.log(`\n=== 🌍 Processing Sector: ${sectorName} ===`);
    
    for (const feedUrl of feeds) {
      try {
        const feed = await parser.parseURL(feedUrl);
        const articlesToProcess = feed.items.slice(0, ARTICLES_PER_FEED);
        
        for (let i = 0; i < articlesToProcess.length; i += 5) {
          const batch = articlesToProcess.slice(i, i + 5);
          await processBatch(batch, sectorName);
          
          if (i + 5 < articlesToProcess.length) {
            console.log(`\n⏱️ API Limit Guard: Sleeping for 15 seconds...`);
            await sleep(15000);
          }
        }
      } catch (error) {
        console.error(`❌ Failed to fetch feed ${feedUrl}:`, error.message);
      }
    }
  }
  console.log('\n🎉 Enterprise NISE run complete!');
};

module.exports = runNewsEngine;
module.exports.synthesizeWithGroq = synthesizeWithGroq;
module.exports.extractRssImage = extractRssImage;
module.exports.generateAndHostImage = generateAndHostImage;