import { useEffect, useRef, useState } from "react";
import { useNotifications } from "../hooks/useNotifications";


export const NotificationsDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Բիզնես լոգիկան մաքուր քաշում ենք Հուքից
    const {notifications,unreadCount,markAsRead,clearAll} = useNotifications();

    // Փակել Dropdown-ը դրսում սեղմելիս (Մնում է այստեղ, քանի որ սա UI լոգիկա է)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Ծանուցումները Կարդացված Նշելը (Optimistic Local State)

    const handleOpenToggle = async () => {
        if (!isOpen) {
            // Երբ բացում ենք, թարմացնում ենք և կարդացված նշում
            setIsOpen(true);
            markAsRead();// Կանչում ենք հուքի ֆունկցիան
        } else {
            setIsOpen(false);
        }
    };

   return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={handleOpenToggle}
                className="relative p-2 rounded-xl transition-all text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                title="Notifications"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/40">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Notifications</h3>
                        
                        {notifications.length > 0 && (
                            <button 
                                onClick={clearAll}
                                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-gray-800/50">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 dark:text-gray-500 text-sm">
                                No notifications yet.
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className={`p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug mb-1">{n.message}</p>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                        {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};