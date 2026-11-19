import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useComments } from '../hooks/useComments';

interface CommentsModalProps {
  courseId: number;
  courseTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded: () => void; // Որպեսզի դրսում (Card-ի վրա) թիվը ավելանա 1-ով
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ 
    courseId, courseTitle, isOpen, onClose, onCommentAdded 
}) => {
  const user = useAuthStore(state => state.user);
  const [newCommentText, setNewCommentText] = useState('');

  const {
    comments, loading, isSubmitting, hasMore, fetchComments, loadMore, addComment, deleteComment
  } = useComments(courseId);
 
  useEffect(() => {
    if (isOpen) {
      fetchComments(0);
    }
  }, [isOpen, fetchComments]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addComment(newCommentText, () => {
      setNewCommentText('');
      onCommentAdded();
    });
  };

  if(!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate pr-4">
            Comments: {courseTitle}
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
         
        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 dark:bg-gray-950">
          {loading && comments.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No comments yet. Be the first!</p>
          ) : (
           comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl relative group">
                  {user?.role === 'admin' && (
                      <button 
                          onClick={() => deleteComment(comment.id)}
                          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete Comment"
                      >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                      </button>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                      <img src={comment.avatar_url} alt={comment.author_name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">{comment.author_name}</h4>
                          <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">{comment.content}</p>
              </div>
            ))
          )}

          {hasMore && (
            <button 
              onClick={loadMore} 
              disabled={loading}
              className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              {loading ? 'Loading...' : 'Load More Comments'}
            </button>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input 
              type="text" 
              value={newCommentText} 
              onChange={e => setNewCommentText(e.target.value)}
              placeholder="Write a comment..." 
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-lg text-sm dark:text-white outline-none transition-colors"
            />
            <button 
              type="submit" 
              disabled={isSubmitting || !newCommentText.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              Post
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};