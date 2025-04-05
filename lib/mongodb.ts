import mongoose from 'mongoose';

// MongoDB connection URL - use environment variable or default to local DB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gurukul';

// Track connection status
let isConnected = false;

export async function connectToDatabase() {
  // If already connected, return
  if (isConnected) {
    return;
  }

  // Set strict query mode for Mongoose to prevent unknown field queries
  mongoose.set('strictQuery', true);

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);

    // Set connection status
    isConnected = true;

    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
} 