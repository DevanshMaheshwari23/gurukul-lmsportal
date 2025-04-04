'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Discussion, User } from '../../../../../lib/types';
import ThemeToggle from '../../../../../components/ThemeToggle';
// Removed unused import: useTheme

export default function CourseDiscussions() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [visibleReplies, setVisibleReplies] = useState<Record<string, boolean>>({});
  const [imageDragActive, setImageDragActive] = useState(false);

  const newDiscussionRef = useRef<HTMLTextAreaElement>(null);
  const endOfDiscussionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check authentication
    const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    // Fetch user data (mock)
    const mockUser: User = {
      id: 'user1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'student'
    };
    setUser(mockUser);

    // Fetch discussions (mock)
    const mockDiscussions: Discussion[] = [
      {
        id: 'disc1',
        courseId,
        userId: 'user2',
        userName: 'Sarah Johnson',
        message:
          'Does anyone understand the concept of closures in JavaScript? I\'m having trouble wrapping my head around it.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        replies: [
          {
            id: 'reply1',
            discussionId: 'disc1',
            userId: 'user3',
            userName: 'Michael Brown',
            message:
              'Closures are functions that "remember" the environment in which they were created. Think of them as functions that have access to variables from their parent scope even after the parent function has finished executing.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          },
          {
            id: 'reply2',
            discussionId: 'disc1',
            userId: 'user4',
            userName: 'Emily Davis',
            message:
              'I found this helpful resource explaining closures with examples: [link]. Hope it helps!',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
          }
        ]
      },
      {
        id: 'disc2',
        courseId,
        userId: 'user5',
        userName: 'James Wilson',
        message: 'I just completed the final project for this course. It was challenging but rewarding!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 48 hours ago
        replies: []
      }
    ];
    
    // Initialize visible replies state
    const initialVisibleReplies: Record<string, boolean> = {};
    mockDiscussions.forEach(discussion => {
      initialVisibleReplies[discussion.id] = (discussion.replies?.length ?? 0) > 0;
    });
    setVisibleReplies(initialVisibleReplies);
    
    setDiscussions(mockDiscussions);
    setLoading(false);
  }, [courseId, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;
    
    // In a real app, this would be an API call to save the message
    const newDiscussion: Discussion = {
      id: `disc${Date.now()}`,
      courseId,
      userId: user.id,
      userName: user.name,
      message: newMessage,
      timestamp: new Date(),
      replies: []
    };
    
    setDiscussions([newDiscussion, ...discussions]);
    setNewMessage('');
    
    // Focus back on the textarea
    if (newDiscussionRef.current) {
      newDiscussionRef.current.focus();
    }
  };
  
  const handleReply = (discussionId: string) => {
    if (!replyTexts[discussionId]?.trim() || !user) return;
    
    // In a real app, this would be an API call to save the reply
    const newReply = {
      id: `reply${Date.now()}`,
      discussionId,
      userId: user.id,
      userName: user.name,
      message: replyTexts[discussionId],
      timestamp: new Date()
    };
    
    setDiscussions(discussions.map(discussion => {
      if (discussion.id === discussionId) {
        return {
          ...discussion,
          replies: [...(discussion.replies || []), newReply]
        };
      }
      return discussion;
    }));
    
    // Clear the reply and close the reply box
    setReplyTexts({ ...replyTexts, [discussionId]: '' });
    setReplyingTo(null);
    
    // Make sure replies are visible for this discussion
    setVisibleReplies({ ...visibleReplies, [discussionId]: true });
    
    // Scroll to the end of the discussion
    setTimeout(() => {
      endOfDiscussionsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleReplies = (discussionId: string) => {
    setVisibleReplies({
      ...visibleReplies,
      [discussionId]: !visibleReplies[discussionId]
    });
  };

  const handleReplyTextChange = (discussionId: string, text: string) => {
    setReplyTexts({
      ...replyTexts,
      [discussionId]: text
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setImageDragActive(false);
    // In a real app, you would handle file uploads here
    alert('Image upload functionality would be implemented here');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setImageDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setImageDragActive(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl animate-pulse text-gray-700 dark:text-gray-300">Loading discussions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 pb-12 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Course
          </button>
          <ThemeToggle />
        </div>
        
        <div className="neumorphic p-6 mb-8 animate-fadeIn">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Course Discussions</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Join the conversation with your fellow learners</p>
          
          {/* New discussion form */}
          <form 
            onSubmit={handleSubmit} 
            className="mb-8"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <label htmlFor="new-discussion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start a new discussion
            </label>
            <div className={`relative ${imageDragActive ? 'ring-2 ring-primary-500' : ''}`}>
              <textarea
                id="new-discussion"
                ref={newDiscussionRef}
                rows={4}
                className="input w-full resize-none"
                placeholder="What&apos;s on your mind?"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              ></textarea>
              {imageDragActive && (
                <div className="absolute inset-0 bg-primary-100 dark:bg-primary-900 bg-opacity-70 dark:bg-opacity-70 flex items-center justify-center rounded-md">
                  <div className="text-primary-700 dark:text-primary-300 font-medium animate-pulse flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Drop to upload image
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3 flex justify-between items-center">
              <div className="flex space-x-2">
                <button 
                  type="button" 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Upload image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button 
                  type="button" 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Format code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </button>
              </div>
              <button
                type="submit"
                className="btn-primary flex items-center"
                disabled={!newMessage.trim()}
              >
                Post Discussion
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </button>
            </div>
          </form>
          
          {/* Discussion list */}
          <div className="space-y-6">
            {discussions.length === 0 ? (
              <div className="neumorphic-inset p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-center text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">No discussions yet</p>
                <p className="text-gray-400 dark:text-gray-500 mb-4">Be the first to start a conversation!</p>
                <button 
                  onClick={() => newDiscussionRef.current?.focus()}
                  className="btn-primary"
                >
                  Start a Discussion
                </button>
              </div>
            ) : (
              discussions.map((discussion, index) => (
                <div 
                  key={discussion.id} 
                  className={`card transform transition-all duration-300 hover:-translate-y-1 
                    ${index === 0 && discussions.length > 1 ? 'animate-slideIn' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400 rounded-full flex items-center justify-center font-semibold shadow-sm">
                          {discussion.userName.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{discussion.userName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(discussion.timestamp)}</p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-4 text-sm text-gray-800 dark:text-gray-200">
                      {discussion.message}
                    </div>
                  </div>
                  
                  {/* Replies */}
                  <div className="p-4">
                    {discussion.replies && discussion.replies.length > 0 && (
                      <div className="mb-4">
                        <button 
                          className="flex items-center text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 mb-2 transition-colors"
                          onClick={() => toggleReplies(discussion.id)}
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-4 w-4 mr-1 transition-transform duration-200 ${
                              visibleReplies[discussion.id] ? 'rotate-90' : ''
                            }`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          {discussion.replies.length} {discussion.replies.length === 1 ? 'Reply' : 'Replies'}
                        </button>
                        
                        {visibleReplies[discussion.id] && (
                          <div className="space-y-4 pl-6 border-l-2 border-gray-100 dark:border-gray-700">
                            {discussion.replies.map((reply) => (
                              <div 
                                key={reply.id} 
                                className="pl-4 animate-fadeIn" 
                                style={{ animationDelay: '0.1s' }}
                              >
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full flex items-center justify-center font-semibold text-xs">
                                    {reply.userName.charAt(0)}
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{reply.userName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(reply.timestamp)}</p>
                                  </div>
                                </div>
                                <div className="mt-2 ml-11 text-sm text-gray-700 dark:text-gray-300">
                                  {reply.message}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Reply form */}
                    {replyingTo === discussion.id ? (
                      <div className="mt-3">
                        <div className="flex space-x-3">
                          <div className="flex-1">
                            <textarea
                              className="input resize-none text-sm"
                              rows={2}
                              placeholder="Write a reply..."
                              value={replyTexts[discussion.id] || ''}
                              onChange={(e) => handleReplyTextChange(discussion.id, e.target.value)}
                              autoFocus
                            />
                          </div>
                          <div className="flex flex-col space-y-2">
                            <button
                              type="button"
                              className="btn-primary text-sm py-1 flex-grow flex items-center justify-center"
                              onClick={() => handleReply(discussion.id)}
                              disabled={!replyTexts[discussion.id]?.trim()}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              Send
                            </button>
                            <button
                              type="button"
                              className="btn-secondary text-sm py-1"
                              onClick={() => setReplyingTo(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-accent text-sm py-1 px-3 flex items-center"
                        onClick={() => setReplyingTo(discussion.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Reply
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={endOfDiscussionsRef}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
