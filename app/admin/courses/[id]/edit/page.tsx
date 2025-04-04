'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { FiX, FiPlus, FiSave, FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';
import AdminNavbar from '../../../../../components/AdminNavbar';
import { toast } from 'react-hot-toast';

// Types for course structure
interface Lecture {
  _id?: string;
  title: string;
  content: string;
  videoUrl?: string;
  duration?: number;
}

interface Chapter {
  _id?: string;
  title: string;
  lectures: Lecture[];
}

interface Section {
  _id?: string;
  title: string;
  chapters: Chapter[];
}

interface Course {
  _id?: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  sections: Section[];
}

export default function EditCourse() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const [course, setCourse] = useState<Course>({
    title: '',
    description: '',
    thumbnailUrl: '',
    sections: [
      {
        title: 'Section 1',
        chapters: [
          {
            title: 'Chapter 1',
            lectures: [
              {
                title: 'Lecture 1',
                content: '',
                videoUrl: ''
              }
            ]
          }
        ]
      }
    ]
  });

  useEffect(() => {
    const checkAuthAndFetchCourse = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          router.push('/login');
          return;
        }
        
        // Fetch user data
        const userResponse = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (userResponse.data.user.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
        
        setUser(userResponse.data.user);
        
        // Fetch course data
        try {
          const courseResponse = await axios.get(`/api/admin/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const courseData = courseResponse.data.course;
          setCourse(courseData);
          
          if (courseData.thumbnailUrl) {
            setThumbnailPreview(courseData.thumbnailUrl);
          }
          
          setLoading(false);
        } catch (error: any) {
          console.error('Error fetching course:', error);
          setError('Failed to load course data. Please try again.');
          setLoading(false);
          if (error.response?.status === 404) {
            toast.error('Course not found');
            setTimeout(() => router.push('/admin/courses'), 2000);
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/login');
      }
    };
    
    checkAuthAndFetchCourse();
  }, [router, courseId]);
  
  // Handle thumbnail upload
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };
  
  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCourse(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle section changes
  const handleSectionChange = (index: number, field: string, value: string) => {
    setCourse(prev => {
      const updated = { ...prev };
      updated.sections[index][field] = value;
      return updated;
    });
  };
  
  // Handle chapter changes
  const handleChapterChange = (sectionIndex: number, chapterIndex: number, field: string, value: string) => {
    setCourse(prev => {
      const updated = { ...prev };
      updated.sections[sectionIndex].chapters[chapterIndex][field] = value;
      return updated;
    });
  };
  
  // Handle lecture changes
  const handleLectureChange = (
    sectionIndex: number,
    chapterIndex: number,
    lectureIndex: number,
    field: string,
    value: string
  ) => {
    setCourse(prev => {
      const updated = { ...prev };
      updated.sections[sectionIndex].chapters[chapterIndex].lectures[lectureIndex][field] = value;
      return updated;
    });
  };
  
  // Add new section
  const addSection = () => {
    setCourse(prev => {
      const updated = { ...prev };
      updated.sections.push({
        title: `Section ${updated.sections.length + 1}`,
        chapters: [{
          title: 'Chapter 1',
          lectures: [{
            title: 'Lecture 1',
            content: '',
            videoUrl: ''
          }]
        }]
      });
      return updated;
    });
  };
  
  // Remove section
  const removeSection = (index: number) => {
    if (course.sections.length <= 1) {
      toast.error('Course must have at least one section');
      return;
    }
    
    setCourse(prev => {
      const updated = { ...prev };
      updated.sections.splice(index, 1);
      return updated;
    });
  };
  
  // Add new chapter to section
  const addChapter = (sectionIndex: number) => {
    setCourse(prev => {
      const updated = { ...prev };
      const chapterCount = updated.sections[sectionIndex].chapters.length;
      updated.sections[sectionIndex].chapters.push({
        title: `Chapter ${chapterCount + 1}`,
        lectures: [{
          title: 'Lecture 1',
          content: '',
          videoUrl: ''
        }]
      });
      return updated;
    });
  };
  
  // Remove chapter
  const removeChapter = (sectionIndex: number, chapterIndex: number) => {
    if (course.sections[sectionIndex].chapters.length <= 1) {
      toast.error('Section must have at least one chapter');
      return;
    }
    
    setCourse(prev => {
      const updated = { ...prev };
      updated.sections[sectionIndex].chapters.splice(chapterIndex, 1);
      return updated;
    });
  };
  
  // Add new lecture to chapter
  const addLecture = (sectionIndex: number, chapterIndex: number) => {
    setCourse(prev => {
      const updated = { ...prev };
      const lectureCount = updated.sections[sectionIndex].chapters[chapterIndex].lectures.length;
      updated.sections[sectionIndex].chapters[chapterIndex].lectures.push({
        title: `Lecture ${lectureCount + 1}`,
        content: '',
        videoUrl: ''
      });
      return updated;
    });
  };
  
  // Remove lecture
  const removeLecture = (sectionIndex: number, chapterIndex: number, lectureIndex: number) => {
    if (course.sections[sectionIndex].chapters[chapterIndex].lectures.length <= 1) {
      toast.error('Chapter must have at least one lecture');
      return;
    }
    
    setCourse(prev => {
      const updated = { ...prev };
      updated.sections[sectionIndex].chapters[chapterIndex].lectures.splice(lectureIndex, 1);
      return updated;
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!course.title.trim()) {
      toast.error('Course title is required');
      return;
    }
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      let thumbnailUrl = course.thumbnailUrl;
      
      // Upload thumbnail if changed
      if (thumbnailFile) {
        const formData = new FormData();
        formData.append('file', thumbnailFile);
        
        const uploadResponse = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
        
        thumbnailUrl = uploadResponse.data.url;
      }
      
      // Prepare course data for update
      const courseData = {
        ...course,
        thumbnailUrl
      };
      
      // Update course
      await axios.put(`/api/admin/courses/${courseId}`, courseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Course updated successfully');
      
      // Redirect to course list
      router.push('/admin/courses');
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-primary-200 dark:bg-primary-700 rounded-full mb-4"></div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNavbar user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center">
            <button
              onClick={() => router.push('/admin/courses')}
              className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <FiArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Course</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Update course details, content, and structure
              </p>
            </div>
          </div>
        </motion.div>
        
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            {/* Course Details */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Course Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Course Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={course.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Introduction to Programming"
                      maxLength={100}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Course Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={course.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Provide a detailed description of the course..."
                      maxLength={1000}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Course Thumbnail
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {thumbnailPreview ? (
                        <div className="relative">
                          <img
                            src={thumbnailPreview}
                            alt="Thumbnail preview"
                            className="mx-auto h-32 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setThumbnailPreview('');
                              setThumbnailFile(null);
                              if (course.thumbnailUrl) {
                                setCourse(prev => ({ ...prev, thumbnailUrl: '' }));
                              }
                            }}
                            className="absolute top-1 right-1 bg-gray-800 bg-opacity-50 rounded-full p-1 hover:bg-opacity-70"
                          >
                            <FiX className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </>
                      )}
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 focus-within:outline-none"
                        >
                          <span className="px-1">Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Course Structure */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Course Structure</h2>
                <button
                  type="button"
                  onClick={addSection}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <FiPlus className="mr-1 -ml-0.5 h-4 w-4" />
                  Add Section
                </button>
              </div>
              
              <div className="space-y-6">
                {course.sections.map((section, sectionIndex) => (
                  <div
                    key={section._id || sectionIndex}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => handleSectionChange(sectionIndex, 'title', e.target.value)}
                        className="text-lg font-medium text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 w-full"
                        placeholder="Section Title"
                      />
                      <button
                        type="button"
                        onClick={() => removeSection(sectionIndex)}
                        className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                      {section.chapters.map((chapter, chapterIndex) => (
                        <div key={chapter._id || chapterIndex} className="py-2">
                          <div className="flex justify-between items-center mb-2">
                            <input
                              type="text"
                              value={chapter.title}
                              onChange={(e) => handleChapterChange(sectionIndex, chapterIndex, 'title', e.target.value)}
                              className="text-md font-medium text-gray-800 dark:text-gray-200 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 w-full"
                              placeholder="Chapter Title"
                            />
                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() => addLecture(sectionIndex, chapterIndex)}
                                className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                              >
                                <FiPlus className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeChapter(sectionIndex, chapterIndex)}
                                className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                              >
                                <FiX className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-3 pl-4 mt-2 border-l-2 border-gray-200 dark:border-gray-700">
                            {chapter.lectures.map((lecture, lectureIndex) => (
                              <div key={lecture._id || lectureIndex} className="flex items-start">
                                <div className="flex-1 pr-4">
                                  <input
                                    type="text"
                                    value={lecture.title}
                                    onChange={(e) => handleLectureChange(sectionIndex, chapterIndex, lectureIndex, 'title', e.target.value)}
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 w-full mb-1"
                                    placeholder="Lecture Title"
                                  />
                                  
                                  <input
                                    type="text"
                                    value={lecture.videoUrl || ''}
                                    onChange={(e) => handleLectureChange(sectionIndex, chapterIndex, lectureIndex, 'videoUrl', e.target.value)}
                                    className="text-sm text-gray-600 dark:text-gray-400 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary-500 w-full mb-1"
                                    placeholder="Video URL (optional)"
                                  />
                                  
                                  <textarea
                                    value={lecture.content}
                                    onChange={(e) => handleLectureChange(sectionIndex, chapterIndex, lectureIndex, 'content', e.target.value)}
                                    className="text-sm text-gray-600 dark:text-gray-400 bg-transparent border border-gray-300 dark:border-gray-600 rounded-md w-full p-2 focus:outline-none focus:border-primary-500 mt-2"
                                    placeholder="Lecture content..."
                                    rows={2}
                                  />
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={() => removeLecture(sectionIndex, chapterIndex, lectureIndex)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 mt-1"
                                >
                                  <FiX className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={() => addChapter(sectionIndex)}
                        className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 mt-2"
                      >
                        <FiPlus className="mr-1 -ml-0.5 h-3 w-3" />
                        Add Chapter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* Form Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="flex justify-end space-x-3"
            >
              <button
                type="button"
                onClick={() => router.push('/admin/courses')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2 -ml-1 h-4 w-4" />
                    Update Course
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  );
} 