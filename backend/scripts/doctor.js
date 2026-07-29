/**
 * System Doctor Diagnostic CLI Tool
 * Purpose: Executes an automated diagnostic health inspection of environment configuration,
 * database connectivity, Groq API credentials, RSS stream reachability, and memory metrics.
 * Runs standalone without modifying runtime code.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Parser = require('rss-parser');
const connectDB = require('../config/db');
const Article = require('../models/Article');
const Event = require('../models/Event');

const runDoctor = async () => {
  const startTime = Date.now();
  console.log('====================================================');
  console.log('👨‍⚕️ NISE SYSTEM DOCTOR DIAGNOSTIC HEALTH INSPECTION');
  console.log('====================================================\n');

  const report = {
    timestamp: new Date().toISOString(),
    checks: [],
    overallStatus: 'PASS'
  };

  const addCheck = (name, passed, details) => {
    report.checks.push({ name, passed, details });
    const statusIcon = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${statusIcon} | ${name}: ${details}`);
    if (!passed) report.overallStatus = 'FAIL';
  };

  // 1. Node Version Check
  addCheck('Node.js Environment', true, `Version ${process.version} (${process.platform} ${process.arch})`);

  // 2. Memory Usage Check
  const mem = process.memoryUsage();
  const heapMb = (mem.heapUsed / (1024 * 1024)).toFixed(2);
  addCheck('System Memory', true, `Heap Used: ${heapMb} MB (RSS: ${(mem.rss / (1024 * 1024)).toFixed(2)} MB)`);

  // 3. Environment Variables Check
  const hasMongoUri = Boolean(process.env.MONGO_URI);
  const hasGroqKey = Boolean(process.env.GROQ_API_KEY);
  if (hasMongoUri && hasGroqKey) {
    addCheck('Environment Configuration', true, 'MONGO_URI and GROQ_API_KEY configured');
  } else {
    addCheck('Environment Configuration', false, `Missing: ${!hasMongoUri ? 'MONGO_URI ' : ''}${!hasGroqKey ? 'GROQ_API_KEY' : ''}`);
  }

  // 4. Database Connection & Index Check
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    const articleCount = await Article.countDocuments();
    const eventCount = await Event.countDocuments();
    const articleIndexes = await Article.collection.indexes();
    addCheck('MongoDB Database', true, `Connected cleanly. Articles: ${articleCount}, Events: ${eventCount}, Indexes: ${articleIndexes.length}`);
  } catch (err) {
    addCheck('MongoDB Database', false, `Connection error: ${err.message}`);
  }

  // 5. Groq API Configuration Check
  if (process.env.GROQ_API_KEY) {
    addCheck('Groq API Key', true, 'API Key present in environment (masked)');
  } else {
    addCheck('Groq API Key', false, 'GROQ_API_KEY is not configured');
  }

  // 6. RSS Stream Connectivity Check
  try {
    const parser = new Parser({ timeout: 5000 });
    const sampleFeedUrl = 'https://feeds.bbci.co.uk/news/world/rss.xml';
    const feed = await parser.parseURL(sampleFeedUrl);
    addCheck('RSS Stream Reachability', true, `Sample feed [${feed.title}] fetched ${feed.items?.length || 0} items`);
  } catch (err) {
    addCheck('RSS Stream Reachability', false, `Failed to fetch sample feed: ${err.message}`);
  }

  const durationMs = Date.now() - startTime;
  console.log('\n====================================================');
  console.log(`🩺 DOCTOR RESULT: ${report.overallStatus === 'PASS' ? '✅ ALL CHECKS PASSED' : '⚠️ ISSUES DETECTED'} (Completed in ${durationMs}ms)`);
  console.log('====================================================\n');

  if (require.main === module && mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }

  return report;
};

if (require.main === module) {
  runDoctor()
    .then((r) => process.exit(r.overallStatus === 'PASS' ? 0 : 1))
    .catch(() => process.exit(1));
}

module.exports = runDoctor;
