import React from 'react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <div className="text-center px-4 max-w-3xl">
        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
          Welcome to <span className="text-blue-600 dark:text-blue-500">EduSpace</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
          The ultimate platform for modern learning. Join thousands of students and start your journey today.
        </p>
        <Link 
          to="/register" 
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all"
        >
          Start Learning for Free
        </Link>
      </div>
    </div>
  );
};