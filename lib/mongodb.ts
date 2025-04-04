import mongoose from 'mongoose';

// MongoDB connection URL - use environment variable or default to local DB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gurukul';

interface ConnectionCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global variable to maintain connection state across function invocations
let cached: ConnectionCache = global.mongoose || { conn: null, promise: null };
if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectToDatabase() {
  // If connection exists, return it
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection is already being established, wait for it
  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    // Set strict query mode for Mongoose
    mongoose.set('strictQuery', true);

    // Create new connection promise
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Connected to MongoDB');
      return mongoose;
    });
  }

  try {
    // Wait for connection
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    cached.promise = null; // Reset the promise on error
    throw error;
  }
} 