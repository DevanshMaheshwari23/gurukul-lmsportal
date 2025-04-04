import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gurukul';

let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI);
    
    // Handle initial connection errors
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    // Successful connection
    mongoose.connection.once('open', () => {
      console.log('MongoDB connected successfully');
    });

    cachedConnection = mongoose;
    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
} 