export interface CourseProgress {
  courseId: string;
  courseName: string;
  completed: number; // percentage
  lastAccessed: Date;
  completedModules: string[];
}

export interface UserProgress {
  userId: string;
  courses: CourseProgress[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'instructor';
  progress?: CourseProgress[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  modules: Module[];
  enrolledStudents: number;
  rating: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  date: Date;
  read: boolean;
  link?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  message: string;
  timestamp: Date;
  replies?: Comment[];
} 