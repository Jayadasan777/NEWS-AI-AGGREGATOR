require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const runNewsEngine = require('./newsEngine');
const Event = require('../models/Event');

const main = async () => {
  await connectDB();

  console.log('Running full pipeline (articles + event clustering)...\n');
  await runNewsEngine();

  console.log('\n📊 Current events in database:');
  const events = await Event.find().populate('source_articles', 'title sector');

  events.forEach((event) => {
    console.log(`\n🗂️  Event: "${event.event_title}"`);
    console.log(`   Sector: ${event.sector}`);
    console.log(`   Sources (${event.source_articles.length}):`);
    event.source_articles.forEach((a) => console.log(`     - ${a.title}`));
  });

  mongoose.connection.close();
};

main();