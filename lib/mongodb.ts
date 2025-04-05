import mongoose from 'mongoose';

// MongoDB connection URL - use environment variable or default to local DB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gurukul';

// Track connection status
let isConnected = false;
let connectionPromise: Promise<void> | null = null;

export async function connectToDatabase() {
  // If already connected, return
  if (isConnected) {
    return;
  }

  // If there's an ongoing connection attempt, return that promise
  if (connectionPromise) {
    return connectionPromise;
  }

  // Set strict query mode for Mongoose to prevent unknown field queries
  mongoose.set('strictQuery', true);

  // Create a new connection promise
  connectionPromise = (async () => {
    try {
      // Set connection options for better performance and reliability
      const options = {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        maxPoolSize: 10, // Maintain up to 10 socket connections
        minPoolSize: 5, // Maintain at least 5 socket connections
        connectTimeoutMS: 10000, // Give up initial connection after 10s
      };

      // Connect to MongoDB
      await mongoose.connect(MONGODB_URI, options);

      // Set connection status
      isConnected = true;

      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      isConnected = false;
      connectionPromise = null;
      throw error;
    }
  })();

  return connectionPromise;
} 