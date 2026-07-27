require('dotenv').config();
const Parser = require('rss-parser');
const axios = require('axios');
const { synthesizeWithGroq, extractRssImage, generateAndHostImage } = require('./newsEngine');

const parser = new Parser();

const FEEDS_TO_TEST = [
  { name: 'BBC Tech News', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', sector: 'Tech' },
  { name: 'CNBC Finance News', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664', sector: 'Finance' },
  { name: 'ESPN Sports News', url: 'https://www.espn.com/espn/rss/news', sector: 'Sports' }
];

const testHybridPipeline = async () => {
  console.log('🚀 Starting Test: Hybrid Real Photography + FLUX Realism AI Photojournalism Engine\n');
  console.log('================================================================================');

  for (const feedInfo of FEEDS_TO_TEST) {
    console.log(`\n📡 Fetching Live RSS Feed: [${feedInfo.name}] (${feedInfo.sector})...`);
    try {
      const feed = await parser.parseURL(feedInfo.url);
      const item = feed.items[0];

      if (!item) {
        console.log(`⚠️ No items found in feed.`);
        continue;
      }

      console.log(`📰 Article Headline: "${item.title}"`);
      
      // Test Step 1: Extract Real News Channel Image
      const realImage = extractRssImage(item);
      if (realImage) {
        console.log(`✅ [Real Photography Extraction]: Found live broadcast image in RSS feed!`);
        console.log(`   URL: ${realImage}`);
      } else {
        console.log(`ℹ️ [Real Photography Extraction]: No media tag found in RSS item.`);
      }

      // Test Step 2: Llama 3 Photojournalism Director
      console.log(`\n🧠 Invoking Llama 3 (Groq) for 150-word summary & Photojournalistic Image Prompt...`);
      const synthResult = await synthesizeWithGroq(item.title, item.contentSnippet || item.title, feedInfo.sector);
      console.log(`   📝 Editorial Summary Snippet: "${synthResult.summary.slice(0, 100)}..."`);
      console.log(`   🎬 Llama 3 Image Prompt: "${synthResult.image_prompt}"`);

      // Test Step 3: FLUX Realism AI Image Generation URL
      const aiImageUrl = generateAndHostImage(synthResult.image_prompt, feedInfo.sector, item.title);
      console.log(`\n🤖 [FLUX Realism AI Generation]: Generated photojournalism artwork URL:`);
      console.log(`   URL: ${aiImageUrl}`);

      // Test Step 4: Verify Image Reachability
      const finalUrlToVerify = realImage || aiImageUrl;
      console.log(`\n🔍 Verifying HTTP reachability for chosen image (${realImage ? 'Real RSS Photo' : 'FLUX Realism AI Photo'})...`);
      try {
        const response = await axios.head(finalUrlToVerify, { timeout: 10000 });
        console.log(`✅ [HTTP Status]: ${response.status} OK (${response.headers['content-type'] || 'image valid'})`);
      } catch (httpErr) {
        // Pollinations sometimes requires GET instead of HEAD
        try {
          const getRes = await axios.get(finalUrlToVerify, { responseType: 'stream', timeout: 10000 });
          console.log(`✅ [HTTP Status]: ${getRes.status} OK (Image Stream Verified)`);
        } catch (getErr) {
          console.log(`⚠️ [HTTP Notice]: Image URL generated, but network check returned: ${getErr.message}`);
        }
      }

      console.log('--------------------------------------------------------------------------------');
    } catch (err) {
      console.error(`❌ Error testing feed ${feedInfo.name}:`, err.message);
    }
  }

  console.log('\n🎉 Hybrid Image Pipeline Test Complete!');
  process.exit(0);
};

testHybridPipeline();
