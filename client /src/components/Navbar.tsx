import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { ThemeToggle } from './ThemeToggle';
import toast from 'react-hot-toast';
import { NotificationsDropdown } from './NotificationsDropdown';





export const Navbar: React.FC = () => {
  

    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

   
    const handleLogout = () => {
        // 1. Անմիջապես տանում ենք հյուրի գոտի (Home)
        navigate('/', { replace: true });

        // 2. Ուշացումով մաքրում ենք state-ը (Race Condition-ի լուծում)
        setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('auth-storage');
            logout();

            // 3. Վերադարձնում ենք մաքուր (Light) ռեժիմի
            useThemeStore.getState().setTheme('light');
            toast.success('Successfully logged out.');
        }, 50);
    };

    return (
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors duration-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
          
                    <Link
                        to={user ? '/dashboard' : '/'}
                        className="flex items-center gap-2 group"
                    >
                        <div className="w-8 h-8 bg-blue-600 group-hover:bg-blue-700 transition-colors rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
                            E
                        </div>
                        <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">
                            EduSpace
                        </span>
                    </Link>
                   
                    <div className="flex items-center gap-4">
                        {user ? (
                            /* --- ՄԻԱՅՆ ՄՈՒՏՔ ԳՈՐԾԱԾ ՅՈՒԶԵՐԻ ՀԱՄԱՐ --- */
                            <>
                                <ThemeToggle />
                                <div className="flex items-center gap-4 border-l border-gray-200 dark:border-gray-700 pl-4">
                                    {/* ՊՐՈՖԻԼԻ ԿՈՃԱԿԸ (Նկարով, Անունով և Դերով) */}
                                    <NotificationsDropdown />
                                    <Link
                                        to="/profile"
                                        className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 p-1.5 pr-4 rounded-full transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700 group"
                                    >
                                        <img
                                            src={
                                                user?.avatar_url ||
                                                `https://ui-avatars.com/api/?name=${user?.name}&background=random`
                                            }
                                            alt="Profile"
                                            className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm group-hover:scale-105 transition-transform"
                                        />
                                        <div className="hidden sm:flex flex-col items-start">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                                                {user?.name}
                                            </span>
                                            <span className="text-[10px] font-bold tracking-widest text-blue-600 dark:text-blue-400 leading-tight uppercase">
                                                {user?.role}
                                            </span>
                                        </div>
                                    </Link>

                                    {/* ԴՈՒՐՍ ԳԱԼՈՒ (LOGOUT) ԻԿՈՆԿԱՆ */}
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-all active:scale-95"
                                        title="Sign Out"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* --- ՄԻԱՅՆ ՀՅՈՒՐԵՐԻ ՀԱՄԱՐ --- */
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/register"
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 transition-colors"
                                >
                                    Sign Up
                                </Link>
                                <Link
                                    to="/login"
                                    className="text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                                >
                                    Sign in
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};
