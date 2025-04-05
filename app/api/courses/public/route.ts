import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Course } from '@/lib/models/course';

export async function GET() {
  try {
    console.log('Public courses API called');
    
    // Connect to database
    await connectToDatabase();
    console.log('Successfully connected to database');

    try {
      console.log('Fetching public courses...');
      const courses = await Course.find({ isPublic: true })
        .select('_id title description instructor duration level image')
        .sort({ createdAt: -1 });
      
      console.log(`Found ${courses.length} public courses`);
      
      // Always return an array, even if empty
      return NextResponse.json({ data: courses || [] });
    } catch (error) {
      console.error('Error fetching public courses:', error);
      console.error('Error details:', JSON.stringify({
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      }));
      // Return empty array in case of error
      return NextResponse.json({ data: [] });
    }
  } catch (error: any) {
    console.error('Get public courses error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching public courses' },
      { status: 500 }
    );
  }
} 