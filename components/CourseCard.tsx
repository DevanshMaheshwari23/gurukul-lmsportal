'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FiClock, FiBarChart2, FiUsers, FiChevronRight } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    instructor: string;
    duration: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    students: number;
    imageUrl?: string;
    category?: string;
  };
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Get level color
  const getLevelColor = () => {
    switch(course.level) {
      case 'Beginner': 
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'Intermediate': 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'Advanced': 
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-lg"
    >
      {/* Course image with overlay */}
      <div className="relative h-48 w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
          style={{ 
            backgroundImage: `url(${course.imageUrl || '/placeholder-course.jpg'})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
        
        {/* Category badge */}
        {course.category && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-800 backdrop-blur-sm">
            {course.category}
          </span>
        )}
      </div>

      {/* Course info */}
      <div className="p-5">
        <div className="flex justify-between mb-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor()}`}>
            {course.level}
          </span>
          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
            <FiUsers className="mr-1" />
            <span>{course.students} students</span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400">
          {course.title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {course.description}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
            <FiClock className="mr-1" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center text-gray-700 dark:text-gray-300 text-sm">
            <span className="font-medium">By {course.instructor}</span>
          </div>
        </div>
      </div>

      {/* Hover effect - action button */}
      <div 
        className={`absolute inset-0 flex items-end justify-center p-5 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Link 
          href={`/courses/${course.id}`}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg flex items-center justify-center transition-all group-hover:translate-y-0"
        >
          View Course <FiChevronRight className="ml-1" />
        </Link>
      </div>
    </motion.div>
  );
};

export default CourseCard; 