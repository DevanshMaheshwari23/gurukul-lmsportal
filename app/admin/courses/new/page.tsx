'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FiX, FiPlus } from 'react-icons/fi';
import { motion } from 'framer-motion';
import AdminNavbar from '../../../../components/AdminNavbar';
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
  title: string;
  description: string;
  thumbnailUrl: string;
  sections: Section[];
}

export default function NewCourse() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  
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
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          router.push('/login');
          return;
        }
        
        const userResponse = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (userResponse.data.user.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
        
        setUser(userResponse.data.user);
        setLoading(false);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);
  
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
    
    // Validation
    if (!course.title.trim()) {
      toast.error('Course title is required');
      return;
    }
    
    if (!course.description.trim()) {
      toast.error('Course description is required');
      return;
    }
    
    if (!thumbnailFile && !thumbnailPreview) {
      toast.error('Course thumbnail is required');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      let thumbnailUrl = course.thumbnailUrl;
      
      // Upload thumbnail if a new one was selected
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
      
      // Prepare course data
      const courseData = {
        ...course,
        thumbnailUrl
      };
      
      // Create course
      await axios.post('/api/admin/courses', courseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Course created successfully!');
      router.push('/admin/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-pulse">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Course</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Fill out the form to create a new course
          </p>
        </motion.div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Course Information</h2>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Course Title *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={course.title}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    placeholder="e.g. Complete Web Development Bootcamp"
                    required
                  />
                </div>
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description *
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={course.description}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    placeholder="Provide a detailed description of your course..."
                    required
                  ></textarea>
                </div>
              </div>
              
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Course Thumbnail *
                </label>
                <div className="mt-1 flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    {thumbnailPreview ? (
                      <div className="relative">
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="h-32 w-48 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          className="absolute top-0 right-0 -mt-2 -mr-2 p-1 bg-red-500 rounded-full text-white"
                          onClick={() => {
                            setThumbnailPreview('');
                            setThumbnailFile(null);
                          }}
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="h-32 w-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center">
                        <div className="text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Add thumbnail</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      id="thumbnail"
                      name="thumbnail"
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="thumbnail"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      {thumbnailPreview ? 'Change Thumbnail' : 'Upload Thumbnail'}
                    </label>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Course Structure */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Course Structure</h2>
              <button
                type="button"
                onClick={addSection}
                className="inline-flex items-center px-3 py-1.5 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700"
              >
                <FiPlus className="mr-1" /> Add Section
              </button>
            </div>
            
            <div className="space-y-6">
              {course.sections.map((section, sectionIndex) => (
                <div
                  key={sectionIndex}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex-grow">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => handleSectionChange(sectionIndex, 'title', e.target.value)}
                        className="block w-full border-0 border-b border-transparent bg-gray-50 dark:bg-transparent focus:border-primary-600 focus:ring-0 sm:text-sm font-medium text-gray-900 dark:text-white"
                        placeholder="Section Title"
                        required
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => addChapter(sectionIndex)}
                        className="inline-flex items-center p-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-700"
                      >
                        <FiPlus size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(sectionIndex)}
                        className="inline-flex items-center p-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mt-4">
                    {section.chapters.map((chapter, chapterIndex) => (
                      <div
                        key={`${sectionIndex}-${chapterIndex}`}
                        className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex-grow">
                            <input
                              type="text"
                              value={chapter.title}
                              onChange={(e) => handleChapterChange(sectionIndex, chapterIndex, 'title', e.target.value)}
                              className="block w-full border-0 border-b border-transparent bg-white dark:bg-transparent focus:border-primary-600 focus:ring-0 sm:text-sm font-medium text-gray-900 dark:text-white"
                              placeholder="Chapter Title"
                              required
                            />
                          </div>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => addLecture(sectionIndex, chapterIndex)}
                              className="inline-flex items-center p-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                            >
                              <FiPlus size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeChapter(sectionIndex, chapterIndex)}
                              className="inline-flex items-center p-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700"
                            >
                              <FiX size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-3 mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                          {chapter.lectures.map((lecture, lectureIndex) => (
                            <div
                              key={`${sectionIndex}-${chapterIndex}-${lectureIndex}`}
                              className="bg-gray-50 dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex-grow">
                                  <input
                                    type="text"
                                    value={lecture.title}
                                    onChange={(e) => handleLectureChange(sectionIndex, chapterIndex, lectureIndex, 'title', e.target.value)}
                                    className="block w-full border-0 border-b border-transparent bg-gray-50 dark:bg-transparent focus:border-primary-600 focus:ring-0 sm:text-sm font-medium text-gray-900 dark:text-white"
                                    placeholder="Lecture Title"
                                    required
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeLecture(sectionIndex, chapterIndex, lectureIndex)}
                                  className="inline-flex items-center p-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700"
                                >
                                  <FiX size={12} />
                                </button>
                              </div>
                              
                              <div className="mt-2">
                                <input
                                  type="text"
                                  value={lecture.videoUrl || ''}
                                  onChange={(e) => handleLectureChange(sectionIndex, chapterIndex, lectureIndex, 'videoUrl', e.target.value)}
                                  className="block w-full text-xs border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm"
                                  placeholder="Video URL (optional)"
                                />
                              </div>
                              
                              <div className="mt-2">
                                <textarea
                                  value={lecture.content || ''}
                                  onChange={(e) => handleLectureChange(sectionIndex, chapterIndex, lectureIndex, 'content', e.target.value)}
                                  className="block w-full text-xs border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm"
                                  rows={3}
                                  placeholder="Lecture content"
                                  required
                                ></textarea>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push('/admin/courses')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                submitting ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 