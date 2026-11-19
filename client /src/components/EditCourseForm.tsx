import React, { useState, useEffect } from 'react';
import type { CourseDetailsData } from '../types';

interface EditCourseFormProps {
    course: CourseDetailsData | null;
    isSubmitting: boolean;
    onUpdate: (title: string, description: string) => void;
    onCancel: () => void;
}

export const EditCourseForm: React.FC<EditCourseFormProps> = ({ course, isSubmitting, onUpdate, onCancel }) => {
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');

    // Երբ course-ը բեռնվում է, լցնում ենք input-ները հին տվյալներով
    useEffect(() => {
        if (course) {
            setEditTitle(course.title);
            setEditDescription(course.description);
        }
    }, [course]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(editTitle, editDescription);
    };

    return (
        <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Course Details</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Course Title</label>
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-blue-500 outline-none transition-colors"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                    <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white resize-none focus:border-blue-500 outline-none transition-colors"
                        required
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2.5 rounded-xl font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};