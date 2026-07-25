require('dotenv').config();
const Parser = require('rss-parser');
const Groq = require('groq-sdk');
const Article = require('../models/Article');
const { processArticleIntoEvent } = require('./eventEngine');

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

// --- Rewrite text using Meta Llama 3 (Groq) ---
const rewriteWithGroq = async (title, description) => {
  const prompt = `You are a professional news editor. Rewrite the following news headline and description into a completely original, unique summary of about 150 words. Do not copy phrases directly. Write in a clear, neutral, informative tone.
  Original Title: ${title}
  Original Description: ${description}
  Return ONLY the rewritten summary, nothing else.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
    });
    return completion.choices[0]?.message?.content?.trim() || description;
  } catch (error) {
    console.error('❌ Groq Rewrite Error:', error.message);
    return description;
  }
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
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=450&nologo=true&seed=${randomSeed}`;
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
      
      const rewrittenSummary = await rewriteWithGroq(item.title, item.contentSnippet || item.title);
      
      // Synchronous dynamic unique image generation URL
      const frontendImageUrl = generateAndHostImage(rewrittenSummary, sectorName, item.title);

      const newArticle = new Article({
        title: item.title,
        unique_summary: rewrittenSummary,
        sector: sectorName,
        image_url: frontendImageUrl,
      });

      await newArticle.save();
      console.log(`✅ Saved successfully (Unique Image ready for frontend)`);

      // Layer 2: Hybrid Jaccard + Llama 3 Event Clustering
      await processArticleIntoEvent(newArticle);

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