const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const connectionString = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/internflow';

  mongoose.set('strictQuery', true);

  await mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  logger.info(`MongoDB connected: ${mongoose.connection.host}`);
};

module.exports = connectDB;
