/**
 * Database Index Verification & Synchronization Script
 * Purpose: Connects to MongoDB, inspects active collection indexes, and synchronizes
 * defined model indexes without altering data schemas or migrating existing fields.
 * Safe to execute standalone via CLI or automated deployment scripts.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('../models/Article');
const Event = require('../models/Event');
const connectDB = require('../config/db');

const verifyIndexes = async () => {
  const startTime = Date.now();
  console.log('🔍 Starting MongoDB Index Verification & Synchronization...\n');

  try {
    // 1. Connect to DB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    console.log('⚡ Synchronizing Article collection indexes...');
    const articleSyncResult = await Article.syncIndexes();
    console.log('✅ Article indexes synchronized:', articleSyncResult);

    console.log('⚡ Synchronizing Event collection indexes...');
    const eventSyncResult = await Event.syncIndexes();
    console.log('✅ Event indexes synchronized:', eventSyncResult);

    // 2. Fetch and list active indexes for verification
    const articleIndexes = await Article.collection.indexes();
    console.log('\n📊 Active Article Collection Indexes:');
    articleIndexes.forEach(idx => console.log(`   • ${idx.name}:`, JSON.stringify(idx.key)));

    const eventIndexes = await Event.collection.indexes();
    console.log('\n📊 Active Event Collection Indexes:');
    eventIndexes.forEach(idx => console.log(`   • ${idx.name}:`, JSON.stringify(idx.key)));

    const duration = Date.now() - startTime;
    console.log(`\n✨ Index verification completed successfully in ${duration}ms.\n`);

    return {
      success: true,
      durationMs: duration,
      articleIndexesCount: articleIndexes.length,
      eventIndexesCount: eventIndexes.length
    };
  } catch (error) {
    console.error('❌ Error during index verification:', error.message);
    throw error;
  } finally {
    // Only close connection if script was invoked directly from CLI
    if (require.main === module && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('👋 Database connection closed.');
    }
  }
};

// Execute if run directly from terminal
if (require.main === module) {
  verifyIndexes()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = verifyIndexes;
