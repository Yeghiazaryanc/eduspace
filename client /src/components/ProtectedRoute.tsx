import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';


export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Outlet /> 
      </main>
    </div>
  );
};