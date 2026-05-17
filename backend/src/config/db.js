const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const connectionString = process.env.MONGO_URI ;

  mongoose.set('strictQuery', true);

  await mongoose.connect(connectionString);

  logger.info(`MongoDB connected: ${mongoose.connection.host}`);
};

module.exports = connectDB;
