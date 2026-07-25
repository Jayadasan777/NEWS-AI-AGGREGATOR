require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Article = require('../models/Article');
const Event = require('../models/Event');
const { processArticleIntoEvent } = require('./eventEngine');

// Hand-crafted test cases: some should cluster together, some shouldn't.
const TEST_ARTICLES = [
  {
    title: 'Apple unveils new AI chip for iPhone 18',
    unique_summary: 'Apple announced a new AI processor at a keynote event, designed to power on-device machine learning features in upcoming iPhones.',
    sector: 'Tech',
    image_url: 'https://placeholder.com/1.png',
  },
  {
    title: 'Apple introduces AI silicon at keynote event',
    unique_summary: 'During its annual product announcement, Apple revealed a new AI-focused chip aimed at improving performance in future devices.',
    sector: 'Tech',
    image_url: 'https://placeholder.com/2.png',
  },
  {
    title: 'Apple stock rises 4% after chip announcement',
    unique_summary: 'Investors reacted positively to Apple\'s new chip reveal, pushing shares up in after-hours trading.',
    sector: 'Finance',
    image_url: 'https://placeholder.com/3.png',
  },
  {
    title: 'Manchester United signs new striker in £60m deal',
    unique_summary: 'The Premier League club completed the transfer of a top striker ahead of the new season.',
    sector: 'Sports',
    image_url: 'https://placeholder.com/4.png',
  },
];

const runTest = async () => {
  await connectDB();

  console.log('🧹 Cleaning up previous test data...');
  await Article.deleteMany({ title: { $in: TEST_ARTICLES.map((a) => a.title) } });
  await Event.deleteMany({});

  console.log('🧪 Running clustering test...\n');

  for (const testItem of TEST_ARTICLES) {
    const newArticle = new Article(testItem);
    await newArticle.save();
    console.log(`✅ Saved article: "${newArticle.title}" [${newArticle.sector}]`);

    await processArticleIntoEvent(newArticle);
    console.log(''); // spacing
  }

  console.log('\n📊 Final events created:');
  const events = await Event.find().populate('source_articles', 'title sector');

  events.forEach((event) => {
    console.log(`\n🗂️  Event: "${event.event_title}" [${event.sector}]`);
    console.log(`   Confidence: ${event.confidence_score}%`);
    console.log(`   Sources (${event.source_articles.length}):`);
    event.source_articles.forEach((a) => console.log(`     - ${a.title}`));
    console.log(`   Fused Summary: ${event.fused_summary}`);
  });

  mongoose.connection.close();
};

runTest();