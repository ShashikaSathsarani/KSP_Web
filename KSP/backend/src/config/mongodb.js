const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI || `mongodb://127.0.0.1:27017/${process.env.DB_NAME || 'kandy_super_phone'}`;
let retryTimer = null;
let hasConnectedOnce = false;

async function attemptConnect() {
  try {
    console.log('🔄 Connecting to MongoDB...');

    await mongoose.connect(mongoURI);

    console.log('✓ MongoDB connected successfully');
    hasConnectedOnce = true;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    return mongoose.connection;
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    console.log('\n⚠️  Please make sure MongoDB is running:');
    console.log('   Windows: mongod.exe (from MongoDB installation)');
    console.log('   Or run: mongod --dbpath "C:\\data\\db"');
    console.log('\nℹ️  Server will continue running, but API calls requiring DB will fail.');
    console.log('↻ Retrying MongoDB connection in 5 seconds...\n');

    // Schedule a retry without blocking server startup
    retryTimer = setTimeout(attemptConnect, 5000);
    return null;
  }
}

const connectDB = async () => {
  // Try immediately, and if it fails, the retry scheduler takes over
  return attemptConnect();
};

module.exports = connectDB;
