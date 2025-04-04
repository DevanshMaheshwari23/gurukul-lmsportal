'use client';

import React, { useState } from 'react';
import { CourseProgress } from '../lib/types';
import Link from 'next/link';

interface ProgressCardProps {
  progress: CourseProgress;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ progress }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate days since last accessed
  const daysSinceLastAccess = Math.floor(
    (new Date().getTime() - new Date(progress.lastAccessed).getTime()) / (1000 * 60 * 60 * 24)
  );

  const progressColor = 
    progress.completed < 30 ? 'bg-yellow-500 dark:bg-yellow-600' :
    progress.completed < 70 ? 'bg-blue-500 dark:bg-blue-600' :
    'bg-green-500 dark:bg-green-600';

  return (
    <div 
      className="neumorphic p-5 transform transition-all duration-300 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-gray-800 dark:text-white group flex items-center gap-2">
          {progress.courseName}
          {progress.completed === 100 && (
            <span className="badge-success animate-pulse">Completed</span>
          )}
        </h3>
        <span 
          className={`badge-primary ${isHovered ? 'animate-scale animate-once' : ''}`}
        >
          {progress.completed}% complete
        </span>
      </div>
      
      <div className="neumorphic-inset w-full h-3 rounded-full overflow-hidden mb-4">
        <div 
          className={`h-full ${progressColor} transition-all duration-1000 ease-out rounded-full relative overflow-hidden`}
          style={{ 
            width: `${progress.completed}%`,
            backgroundImage: progress.completed > 20 ? 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)' : 'none',
            backgroundSize: '1rem 1rem',
          }}
        >
          <div className={`absolute inset-0 ${isHovered ? 'animate-shimmer' : ''}`} />
        </div>
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="mr-2">{progress.completedModules.length} modules completed</span>
        </div>
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {daysSinceLastAccess === 0 ? 'Today' : daysSinceLastAccess === 1 ? 'Yesterday' : `${daysSinceLastAccess} days ago`}
          </span>
        </div>
      </div>
      
      {/* Module progress visualization */}
      <div className="mt-4 mb-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Module completion:
        </p>
        <div className="flex space-x-1">
          {Array.from({ length: progress.completedModules.length + 2 }).map((_, index) => (
            <div 
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                index < progress.completedModules.length 
                  ? progressColor 
                  : 'bg-gray-200 dark:bg-gray-700'
              } ${isHovered && index === progress.completedModules.length ? 'animate-pulse' : ''}`}
            ></div>
          ))}
        </div>
      </div>
      
      <Link 
        href={`/courses/${progress.courseId}`}
        className={`block w-full py-2 text-center text-white rounded-md transition duration-200 transform ${
          isHovered ? 'bg-primary-600 hover:bg-primary-700 scale-105' : 'bg-primary-500 hover:bg-primary-600'
        }`}
      >
        <span className="flex justify-center items-center">
          Continue Learning
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </span>
      </Link>
    </div>
  );
};

export default ProgressCard; 