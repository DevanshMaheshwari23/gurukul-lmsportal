import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/user';
import { Course } from '@/lib/models/course';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

// Only enable this route in development
const isDevelopment = process.env.NODE_ENV !== 'production';

export async function GET(request: Request) {
  // Security check - only allow this in development
  if (!isDevelopment) {
    return NextResponse.json(
      { error: 'This route is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    // Connect to the database
    await connectToDatabase();
    
    // Read the sample data
    const dataPath = path.join(process.cwd(), 'public', 'data', 'init-data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);
    
    // Process users - hash passwords properly
    const users = await Promise.all(
      data.users.map(async (user: any) => {
        // Generate a fresh hashed password for each user
        // Use "password123" as the default password for all test users
        const hashedPassword = await bcrypt.hash('password123', 10);
        return {
          ...user,
          password: hashedPassword,
        };
      })
    );
    
    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    
    // Insert new data
    await User.insertMany(users);
    await Course.insertMany(data.courses);
    
    return NextResponse.json({
      message: 'Database seeded successfully',
      userCredentials: data.users.map((user: any) => ({
        email: user.email,
        password: 'password123', // Let the user know the default password
        role: user.role
      }))
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: error.message },
      { status: 500 }
    );
  }
} 