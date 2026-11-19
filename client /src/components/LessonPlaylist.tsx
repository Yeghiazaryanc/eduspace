import React from 'react';
import type { LessonData } from '../types';

interface LessonPlaylistProps {
    lessons: LessonData[];
    activeLesson: LessonData | null;
    userRole?: string;
    onLessonSelect: (lesson: LessonData) => void;
    onAddClick: () => void;
    onEditClick: (lesson: LessonData) => void;
    onDeleteClick: (e: React.MouseEvent, lessonId: number) => void;
}

export const LessonPlaylist: React.FC<LessonPlaylistProps> = ({
    lessons,
    activeLesson,
    userRole,
    onLessonSelect,
    onAddClick,
    onEditClick,
    onDeleteClick
}) => {
    return (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden lg:sticky lg:top-6 shadow-xl flex flex-col max-h-[85vh] h-full">
            {/* Վերնագիր և "Ավելացնել" (Add) կոճակ */}
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/95 backdrop-blur-sm z-10">
                <h3 className="font-bold text-white text-lg">
                    Course Content{' '}
                    <span className="text-gray-500 text-sm font-normal ml-1">
                        ({lessons.length})
                    </span>
                </h3>
                {userRole === 'admin' && (
                    <button
                        onClick={onAddClick}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-900/20"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                    </button>
                )}
            </div>

            {/* Դասերի ցանկ */}
            <div className="overflow-y-auto custom-scrollbar flex-1 p-2">
                {lessons.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        Playlist is empty.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {lessons.map((lesson, index) => (
                            <div
                                key={lesson.id}
                                onClick={() => onLessonSelect(lesson)}
                                className={`group w-full text-left p-3.5 rounded-xl transition-all flex items-start justify-between cursor-pointer border ${
                                    activeLesson?.id === lesson.id
                                        ? 'bg-blue-900/20 border-blue-800/50'
                                        : 'bg-transparent border-transparent hover:bg-gray-800/50'
                                }`}
                            >
                                <div className="flex gap-3 items-start pr-2">
                                    <div className={`mt-0.5 ${activeLesson?.id === lesson.id ? 'text-blue-500' : 'text-gray-600'}`}>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className={`text-sm font-medium leading-tight ${activeLesson?.id === lesson.id ? 'text-white' : 'text-gray-300'}`}>
                                        {index + 1}. {lesson.title}
                                    </div>
                                </div>
                                
                                {/* Ադմինի խմբագրման և ջնջման կոճակները յուրաքանչյուր դասի համար */}
                                {userRole === 'admin' && (
                                    <div className="flex opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditClick(lesson);
                                            }}
                                            className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all mr-1"
                                            title="Edit Lesson"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => onDeleteClick(e, lesson.id)}
                                            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                            title="Delete Lesson"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};