'use client';

import React from 'react';
import { CourseProgress } from '../lib/types';
import Link from 'next/link';

interface ProgressCardProps {
  progress: CourseProgress;
}

export default function ProgressCard({ progress }: ProgressCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{progress.courseName}</h3>
        <span className="text-sm text-gray-500">
          Last accessed: {new Date(progress.lastAccessed).toLocaleDateString()}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 my-4">
        <div 
          className="bg-green-600 h-2.5 rounded-full" 
          style={{ width: `${progress.completed}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-gray-700">{progress.completed}% completed</p>
        <Link 
          href={`/courses/${progress.courseId}`}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Continue Learning →
        </Link>
      </div>
      
      <div className="mt-4">
        <p className="text-xs text-gray-500 mb-1">
          {progress.completedModules.length} of {progress.completedModules.length + 2} modules completed
        </p>
        <div className="flex space-x-1">
          {Array.from({ length: progress.completedModules.length + 2 }).map((_, index) => (
            <div 
              key={index}
              className={`h-1 flex-1 rounded-full ${
                index < progress.completedModules.length ? 'bg-green-600' : 'bg-gray-200'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
} 