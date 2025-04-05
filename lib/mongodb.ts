import mongoose from 'mongoose';

// MongoDB connection URL - use environment variable or default to local DB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gurukul';

// Track connection status
let isConnected = false;
let connectionPromise: Promise<void> | null = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

export async function connectToDatabase() {
  // If already connected, return
  if (isConnected) {
    return;
  }

  // If there's an ongoing connection attempt, return that promise
  if (connectionPromise) {
    return connectionPromise;
  }

  // Reset connection attempts if we've exceeded the max
  if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    connectionAttempts = 0;
    isConnected = false;
    connectionPromise = null;
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
        retryWrites: true,
        retryReads: true,
        maxIdleTimeMS: 60000, // Close idle connections after 60s
        heartbeatFrequencyMS: 10000, // Check connection every 10s
      };

      // Connect to MongoDB
      await mongoose.connect(MONGODB_URI, options);

      // Set up event listeners for connection monitoring
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        isConnected = false;
        connectionPromise = null;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        isConnected = false;
        connectionPromise = null;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
        isConnected = true;
      });

      // Set connection status
      isConnected = true;
      connectionAttempts = 0;

      console.log('Connected to MongoDB');
    } catch (error: any) {
      connectionAttempts++;
      console.error('MongoDB connection error:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        name: error?.name || 'Error',
        code: error?.code,
        attempt: connectionAttempts
      });
      
      isConnected = false;
      connectionPromise = null;
      
      if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
        throw new Error(`Failed to connect to MongoDB after ${MAX_CONNECTION_ATTEMPTS} attempts`);
      }
      
      throw error;
    }
  })();

  return connectionPromise;
} 