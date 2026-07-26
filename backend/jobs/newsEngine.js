require('dotenv').config();
const Parser = require('rss-parser');
const Groq = require('groq-sdk');
const Article = require('../models/Article');
const { processArticleIntoEvent } = require('./eventEngine');
const { broadcastArticle } = require('../utils/socialBroadcast');

const parser = new Parser();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
Based on the following news headline and description, return a valid JSON object with three exact fields:
1. "summary": A professional editorial summary of about 150 words in a neutral, informative tone. Do not copy phrases directly.
2. "social_caption": An engaging Instagram caption starting with a catchy emoji hook headline (e.g. 🚨 BREAKING: or 🤖 AI UPDATE:), followed by a brief 2-3 bullet point breakdown, ending with a call to action.
3. "social_hashtags": An array of 10-14 viral, relevant hashtags (e.g. ["#NewsAI", "#TechNews", "#AI", "#Geopolitics"]).

Original Title: ${title}
Original Description: ${description}
Sector: ${sector}

Return ONLY valid JSON without any markdown code blocks or commentary. Example format:
{"summary": "...", "social_caption": "...", "social_hashtags": ["#NewsAI", "#Breaking"]}`;

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
        social_hashtags: Array.isArray(parsed.social_hashtags) ? parsed.social_hashtags : [`#${sector}`, '#NewsAI', '#BreakingNews']
      };
    }
  } catch (error) {
    console.error('❌ Groq Synthesis Error:', error.message);
  }

  // Fallback if LLM fails
  return {
    summary: description,
    social_caption: `🚨 ${title}\n\n${description.slice(0, 180)}...\n\nRead full intelligence dispatch on NewsAI.`,
    social_hashtags: [`#${sector}`, '#NewsAI', '#BreakingNews', '#TechNews', '#Geopolitics']
  };
};

// --- Enterprise Image Pipeline (Dynamic Contextual Generation) ---
const generateAndHostImage = (summaryText, sector, articleTitle) => {
  try {
    const contextSnippet = articleTitle ? articleTitle.slice(0, 60) : sector;
    
    let imagePrompt;
    if (sector === 'Geopolitics' || sector === 'Finance' || sector === 'Crypto' || sector === 'Defense') {
      imagePrompt = `Professional financial news visual representing: ${contextSnippet}, cinematic Bloomberg style, dark moody lighting, luxury editorial design, no text, no watermark`;
    } else {
      imagePrompt = `Professional editorial tech news illustration representing: ${contextSnippet}, clean modern cinematic lighting, sharp details, no text, no watermark`;
    }
    
    const encodedPrompt = encodeURIComponent(imagePrompt);
    const randomSeed = Math.floor(Math.random() * 1000000);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&nologo=true&seed=${randomSeed}`;
  } catch (error) {
    console.error('❌ Image Pipeline Error:', error.message);
    return ''; 
  }
};

// --- Process Batches to Respect API Limits ---
const processBatch = async (articlesBatch, sectorName) => {
  for (const item of articlesBatch) {
    try {
      // Layer 1: Pre-LLM Deduplication
      const alreadyExists = await Article.findOne({ title: item.title });
      if (alreadyExists) {
        console.log(`⏭️ Skipped (Pre-LLM Dedup): ${item.title}`);
        continue;
      }

      console.log(`\n⏳ Processing: ${item.title}`);
      
      const { summary, social_caption, social_hashtags } = await synthesizeWithGroq(
        item.title, 
        item.contentSnippet || item.title, 
        sectorName
      );
      
      // Synchronous dynamic unique image generation URL (800x800 square for IG / social compatibility)
      const frontendImageUrl = generateAndHostImage(summary, sectorName, item.title);

      const newArticle = new Article({
        title: item.title,
        unique_summary: summary,
        sector: sectorName,
        image_url: frontendImageUrl,
        social_caption: social_caption,
        social_hashtags: social_hashtags,
        broadcast_status: 'pending'
      });

      await newArticle.save();
      console.log(`✅ Saved successfully (Summary + IG Caption + Hashtags generated)`);

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