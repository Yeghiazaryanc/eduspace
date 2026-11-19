import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommentsModal } from './CommentsModel';
import { useCourseActions } from '../hooks/useCourseActions';
import type { Course } from '../types';

interface CourseCardProps {
  course: Course;
  isEnrolled?: boolean; 
  onEnroll?: (courseId: number) => void; 
  onUnenroll?: (courseId: number) => void; 
  userRole?: string;
  onDeleteSuccess?: (courseId: number) => void; 
}

export const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  isEnrolled = false, 
  onEnroll, 
  onUnenroll, 
  userRole,
  onDeleteSuccess
}) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(course.comments_count || 0);

  // Բիզնես լոգիկայի կցում մեր ստեղծած Custom Hook-ից
  const { 
      isLiked, likesCount, isLikeLoading, isDeleting, toggleLike, deleteCourse 
  } = useCourseActions(course.id, course.is_liked_by_user, course.total_likes, onDeleteSuccess);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 transition-all flex flex-col h-full group relative overflow-hidden">
        
       {/* --- ԱԴՄԻՆԻ OVERLAY --- */}
        {userRole === 'admin' && (
            <div className="absolute inset-x-0 top-0 bottom-[72px] bg-gray-900/85 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 z-20">
                
                {/* 1. ԴԻՏԵԼՈՒ ԿՈՃԱԿ */}
                <button
                    onClick={(e) => { e.preventDefault(); navigate(`/courses/${course.id}`); }}
                    className="bg-green-500 hover:bg-green-400 text-white p-3.5 rounded-full shadow-xl transition-transform hover:scale-110 active:scale-95"
                    title="View Content"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </button>

                {/* 2. ԽՄԲԱԳՐԵԼՈՒ ԿՈՃԱԿ */}
                <button
                    onClick={(e) => { e.preventDefault(); navigate(`/courses/${course.id}`, { state: { openEdit: true, fromDashboardEdit: true } }); }}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-3.5 rounded-full shadow-xl transition-transform hover:scale-110 active:scale-95"
                    title="Quick Edit"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>

                {/* 3. ՋՆՋԵԼՈՒ ԿՈՃԱԿ */}
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteCourse(); }}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-500 text-white p-3.5 rounded-full shadow-xl transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
                    title="Delete Course"
                >
                    {isDeleting ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    )}
                </button>
            </div>
        )}

        <div className="flex-1 relative z-10">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 pr-8">{course.title}</h3>
          
          {/* Հրաժարվել դասընթացից */}
          {isEnrolled && onUnenroll && (
             <button onClick={() => onUnenroll(course.id)} title="Drop Course" className="absolute top-0 right-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
          )}
          
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4 mt-2">{course.description}</p>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700 mt-auto relative z-10">
         <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-sm font-medium">
            
            {/* Ուսանողների քանակ */}
            <div className="flex items-center gap-1.5" title="Enrolled Students">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              <span>{course.enrolled_count || 0}</span>
            </div>

            {/* Դասերի քանակ */}
            <div className="flex items-center gap-1.5" title="Total Lessons/Videos">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{course.lessons_count || 0}</span>
            </div>

          </div>

          <div className="flex items-center gap-2">
            {/* Կոմենտների կոճակ */}
            <button onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }} className="flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="text-sm font-bold">{commentsCount}</span>
            </button>

            {/* Լայքի կոճակ */}
            <button 
              onClick={(e) => { e.preventDefault(); toggleLike(userRole); }}
              disabled={isLikeLoading || !userRole}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200 ${
                isLiked ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
              }`}
            >
              <svg className={`w-5 h-5 ${isLiked ? 'scale-110' : 'scale-100'}`} fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isLiked ? 0 : 2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm font-bold">{likesCount || 0}</span>
            </button>
          </div>
        </div>

        {userRole === 'student' && (
          <div className="pt-3 flex justify-end relative z-10">
            {isEnrolled ? (
              <button onClick={() => navigate(`/courses/${course.id}`)} className="w-full bg-gray-900 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                Go to Course
              </button>
            ) : (
              <button onClick={() => onEnroll && onEnroll(course.id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                Enroll Now &rarr;
              </button>
            )}
          </div>
        )}
      </div>
  
      {isModalOpen && (
        <CommentsModal 
          courseId={course.id} courseTitle={course.title} isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)} onCommentAdded={() => setCommentsCount(prev => prev + 1)}
        />
      )}
    </>
  );
};