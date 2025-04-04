'use client';

import { useState } from 'react';
import { Comment } from '../lib/types';
import { FiMessageSquare, FiSend } from 'react-icons/fi';

interface CourseDiscussionProps {
  courseId: string;
}

export default function CourseDiscussion({ courseId }: CourseDiscussionProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      userId: 'instructor1',
      userName: 'Dr. Sarah Johnson',
      userRole: 'instructor',
      message: 'Welcome to the course discussion! Feel free to ask questions about the course content here.',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      replies: []
    },
    {
      id: '2',
      userId: 'user1',
      userName: 'John Doe',
      userRole: 'student',
      message: 'This lecture was really helpful. Could someone explain the second example in more detail?',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      replies: [
        {
          id: '3',
          userId: 'instructor1',
          userName: 'Dr. Sarah Johnson',
          userRole: 'instructor',
          message: 'Great question! The second example demonstrates how closures work in JavaScript. Essentially, a closure is formed when a function retains access to variables from its parent scope, even after the parent function has completed execution.',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        }
      ]
    }
  ]);
  
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      userId: 'currentUser', // In a real app, get from auth context
      userName: 'You',
      userRole: 'student',
      message: newComment,
      timestamp: new Date(),
      replies: []
    };
    
    setComments([...comments, comment]);
    setNewComment('');
  };
  
  const handleAddReply = (commentId: string) => {
    if (!replyText.trim()) return;
    
    const reply: Comment = {
      id: Date.now().toString(),
      userId: 'currentUser', // In a real app, get from auth context
      userName: 'You',
      userRole: 'student',
      message: replyText,
      timestamp: new Date(),
    };
    
    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), reply]
        };
      }
      return comment;
    });
    
    setComments(updatedComments);
    setReplyText('');
    setReplyingTo(null);
  };

  return (
    <div className="mt-8 bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-6 flex items-center">
        <FiMessageSquare className="mr-2" />
        Course Discussion
      </h3>
      
      <div className="space-y-6 mb-6">
        {comments.map(comment => (
          <div key={comment.id} className="border-b pb-4 last:border-b-0">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                  {comment.userName.charAt(0)}
                </div>
                <div>
                  <span className="font-medium">{comment.userName}</span>
                  {comment.userRole === 'instructor' && (
                    <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                      Instructor
                    </span>
                  )}
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(comment.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="ml-10">
              <p className="text-gray-700">{comment.message}</p>
              
              <button 
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-sm text-indigo-600 mt-2 hover:text-indigo-800"
              >
                {replyingTo === comment.id ? 'Cancel' : 'Reply'}
              </button>
              
              {replyingTo === comment.id && (
                <div className="mt-3 flex">
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <button
                    className="bg-indigo-600 text-white px-3 rounded-r-lg hover:bg-indigo-700 flex items-center"
                    onClick={() => handleAddReply(comment.id)}
                  >
                    <FiSend size={16} />
                  </button>
                </div>
              )}
              
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 space-y-4">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                          {reply.userName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-medium">{reply.userName}</span>
                          {reply.userRole === 'instructor' && (
                            <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                              Instructor
                            </span>
                          )}
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(reply.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 ml-8 text-gray-700">{reply.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Add a Comment</h4>
        <div className="flex">
          <textarea
            className="flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Share your thoughts or questions..."
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          ></textarea>
          <button
            className="bg-indigo-600 text-white px-4 rounded-r-lg hover:bg-indigo-700 flex items-center justify-center"
            onClick={handleAddComment}
          >
            <FiSend size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Be respectful and constructive in your comments. All comments are moderated.
        </p>
      </div>
    </div>
  );
} 