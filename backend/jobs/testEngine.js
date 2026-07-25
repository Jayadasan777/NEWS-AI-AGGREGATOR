require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const Parser = require('rss-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Article = require('../models/Article');

const parser = new Parser();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const TECH_RSS_URL = 'https://feeds.bbci.co.uk/news/technology/rss.xml';

// --- Step A: Rewrite text using Gemini ---
const rewriteWithGemini = async (title, description) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const prompt = `You are a professional news editor. Rewrite the following 
news headline and description into a completely original, unique summary 
of about 150 words. Do not copy phrases directly. Write in a clear, 
neutral, informative tone suitable for a news website.

Original Title: ${title}
Original Description: ${description}

Return ONLY the rewritten 150-word summary, nothing else.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

// --- Step B: Generate an image using Pollinations.ai (free, no API key needed) ---
const generateImageWithPollinations = async (summaryText) => {
  const imagePrompt = `Professional editorial news thumbnail illustration, 
${summaryText.slice(0, 150)}, clean modern cinematic lighting, no text, no watermark`;

  const encodedPrompt = encodeURIComponent(imagePrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=450&nologo=true`;

  // Verify the image actually generates (checks the URL is valid/reachable)
  await axios.get(imageUrl, { responseType: 'arraybuffer' });

  return imageUrl;
};

// --- Step C: Save to MongoDB ---
const saveArticleToDB = async (title, summary, sector, imageUrl) => {
  const newArticle = new Article({
    title: title,
    unique_summary: summary,
    sector: sector,
    image_url: imageUrl,
  });

  const savedArticle = await newArticle.save();
  return savedArticle;
};

// --- Full pipeline test ---
const testFullPipeline = async () => {
  try {
    await connectDB();

    console.log('Step 1: Fetching RSS feed...');
    const feed = await parser.parseURL(TECH_RSS_URL);
    const firstArticle = feed.items[0];

    console.log('Original Title:', firstArticle.title);

    console.log('\nStep 2: Sending to Gemini for rewriting...');
    const rewrittenSummary = await rewriteWithGemini(
      firstArticle.title,
      firstArticle.contentSnippet
    );
    console.log('\n✅ AI-Rewritten Summary:\n', rewrittenSummary);

    console.log('\nStep 3: Generating image with Pollinations.ai...');
    const imageUrl = await generateImageWithPollinations(rewrittenSummary);
    console.log(`\n✅ Image URL: ${imageUrl}`);

    console.log('\nStep 4: Saving to MongoDB...');
    const saved = await saveArticleToDB(
      firstArticle.title,
      rewrittenSummary,
      'Tech',
      imageUrl
    );
    console.log('\n✅ Saved to MongoDB with ID:', saved._id);

    mongoose.connection.close();
    console.log('\n🎉 Full pipeline test complete!');

  } catch (error) {
    if (error.response?.data) {
      const errorText = Buffer.isBuffer(error.response.data)
        ? error.response.data.toString('utf-8')
        : JSON.stringify(error.response.data);
      console.error('❌ Error:', errorText);
    } else {
      console.error('❌ Error:', error.message);
    }
    mongoose.connection.close();
  }
};

testFullPipeline();