export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'instructor';
  progress?: CourseProgress[];
}

export interface CourseProgress {
  courseId: string;
  courseName: string;
  completed: number; // Percentage completed (0-100)
  lastAccessed: Date;
  completedModules: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  modules: CourseModule[];
  enrolledCount?: number;
  rating?: number;
}

export interface CourseModule {
  id: string;
  title: string;
  content: string;
  duration: string;
  quizzes?: Quiz[];
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOption: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  date: Date;
}

export interface Discussion {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  replies?: DiscussionReply[];
}

export interface DiscussionReply {
  id: string;
  discussionId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
} 