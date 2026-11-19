import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';


export const PublicRoute: React.FC = () => {
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  // 1. Սպասում ենք մինչև Zustand-ը կարդա LocalStorage-ը
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 2. Եթե յուզերը արդեն մուտք է գործել, նրան չի կարելի գնալ /login
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Եթե հյուր է (չգրանցված), թույլ ենք տալիս տեսնել Login/Register էջերը (Outlet)
  return <Outlet />;
};