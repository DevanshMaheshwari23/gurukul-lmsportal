const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gurukul';
    
    if (mongoose.connection.readyState >= 1) {
      return;
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// Define Course schema
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructor: { type: String, required: true },
  duration: { type: String, required: true },
  level: { type: String, required: true },
  image: { type: String, required: true },
  isPublic: { type: Boolean, default: false },
  sections: [{
    title: String,
    chapters: [{
      title: String,
      lectures: [{
        title: String,
        videoUrl: String,
        description: String,
        duration: Number
      }]
    }]
  }]
}, { timestamps: true });

// Create Course model if it doesn't exist already
const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

const samplePublicCourses = [
  {
    title: 'Introduction to Web Development',
    description: 'Learn the basics of HTML, CSS, and JavaScript to build your first website.',
    instructor: 'John Doe',
    duration: '8 weeks',
    level: 'Beginner',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1352&q=80',
    isPublic: true,
    sections: [
      {
        title: 'HTML Basics',
        chapters: [
          {
            title: 'Introduction to HTML',
            lectures: [
              {
                title: 'What is HTML?',
                videoUrl: 'https://example.com/video1',
                description: 'Learn about HTML and its role in web development',
                duration: 15
              }
            ]
          }
        ]
      }
    ]
  },
  {
    title: 'Python Programming for Beginners',
    description: 'Start your programming journey with Python, one of the most popular programming languages.',
    instructor: 'Jane Smith',
    duration: '10 weeks',
    level: 'Beginner',
    image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    isPublic: true,
    sections: [
      {
        title: 'Python Basics',
        chapters: [
          {
            title: 'Getting Started with Python',
            lectures: [
              {
                title: 'Installing Python',
                videoUrl: 'https://example.com/video2',
                description: 'Learn how to install Python on your computer',
                duration: 20
              }
            ]
          }
        ]
      }
    ]
  }
];

async function seedPublicCourses() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Connected to database');

    // Check if any public courses exist
    const existingPublicCourses = await Course.find({ isPublic: true });
    console.log(`Found ${existingPublicCourses.length} existing public courses`);

    if (existingPublicCourses.length === 0) {
      console.log('No public courses found. Seeding sample courses...');
      const createdCourses = await Course.create(samplePublicCourses);
      console.log(`Created ${createdCourses.length} public courses`);
    } else {
      console.log('Public courses already exist. Skipping seeding.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding public courses:', error);
    process.exit(1);
  }
}

seedPublicCourses(); 