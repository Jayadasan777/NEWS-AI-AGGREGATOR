require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const runNewsEngine = require('./newsEngine');

const main = async () => {
  await connectDB();
  await runNewsEngine();
  mongoose.connection.close();
};

main();