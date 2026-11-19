import React, { useState, useEffect } from 'react';

interface LessonFormData {
    title: string;
    video_url: string;
    content: string;
}

interface LessonModalProps {
    isOpen: boolean;
    lessonId: number | null; // Եթե null է, ուրեմն ստեղծում ենք ՆՈՐԸ: Եթե թիվ է՝ Edit ենք անում
    initialData: LessonFormData;
    isSubmitting: boolean;
    onSave: (data: LessonFormData) => void;
    onClose: () => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({ isOpen, lessonId, initialData, isSubmitting, onSave, onClose }) => {
    const [formData, setFormData] = useState<LessonFormData>({ title: '', video_url: '', content: '' });

    // Երբ մոդալը բացվում է, լցնում ենք դատարկ (կամ հին) տվյալներով
    useEffect(() => {
        if (isOpen) setFormData(initialData);
    }, [isOpen, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-3xl border border-gray-800 w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-up">
                
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
                    <h3 className="text-xl font-bold text-white">
                        {lessonId ? 'Edit Lesson' : 'Add New Lesson'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body / Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Lesson Title *</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-700 text-white focus:border-blue-500 outline-none transition-colors"
                            placeholder="e.g. Introduction to React"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">YouTube URL (optional)</label>
                        <input
                            type="url"
                            value={formData.video_url}
                            onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-700 text-white focus:border-blue-500 outline-none transition-colors"
                            placeholder="https://youtube.com/watch?v=..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Text Content (optional)</label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-700 text-white resize-none focus:border-blue-500 outline-none transition-colors"
                            placeholder="Add additional reading material..."
                        />
                    </div>
                    
                    {/* Modal Footer */}
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Lesson'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};