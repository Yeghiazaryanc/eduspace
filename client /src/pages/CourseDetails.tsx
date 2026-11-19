import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCourseDetails } from '../hooks/useCourseDetails';
import { getYouTubeEmbedUrl } from '../utils/helpers';
import { EditCourseForm } from '../components/EditCourseForm';
import { LessonModal } from '../components/LessonModal';
import { LessonPlaylist } from '../components/LessonPlaylist';
import type { LessonData } from '../types';

// Տիպավորում ենք React Router-ի location.state-ը՝ "any"-ից խուսափելու համար
interface CourseLocationState {
    openEdit?: boolean;
}

// Տիպ՝ դասի ավելացման/խմբագրման մոդալի ֆորմայի տվյալների համար
interface LessonFormData {
    title: string;
    video_url: string;
    content: string;
}

// Հաստատուն՝ դատարկ ֆորմայի համար (հայտարարված է կոմպոնենտից դուրս՝
// ամեն render-ին ավելորդ Memory Allocation-ից խուսափելու համար)
const EMPTY_LESSON_FORM: LessonFormData = {
    title: '',
    video_url: '',
    content: '',
};

/**
 * CourseDetails Page (Container / Presentation Layer)
 * Ամբողջ ցանցային և CRUD տրամաբանությունը պատվիրակված է useCourseDetails hook-ին
 * (Separation of Concerns), իսկ այս կոմպոնենտը պատասխանատու է միայն UI վիճակների,
 * դասավորության (Layout) և մոդալի կառավարման համար։
 */
export const CourseDetails: React.FC = () => {
    // 1. ROUTING & GLOBAL STATE (URL պարամետրեր, նավիգացիա և ընթացիկ օգտատեր)
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as CourseLocationState | null;

    // Selector-ով վերցնում ենք միայն user-ը, որպեսզի Zustand-ի այլ փոփոխությունները չառաջացնեն re-render
    const user = useAuthStore((state) => state.user);

    // 2. BUSINESS LOGIC HOOK (Տվյալների բեռնում և բոլոր CRUD գործողությունները)
    const {
        isLoading,
        error,
        course,
        lessons,
        activeLesson,
        isEditingCourse,
        isSubmitting,
        setIsEditingCourse,
        setActiveLesson,
        deleteCourse,
        updateCourse,
        deleteLesson,
        saveLesson,
        exitEditMode
    } = useCourseDetails(id, user?.role, locationState?.openEdit);

    // 3. LOCAL UI STATE (Միայն դասի ավելացման/խմբագրման մոդալի համար)
    // Մեկ մոդալը սպասարկում է և՛ Create (editingLessonId === null), և՛ Edit ռեժիմները (DRY սկզբունք)
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
    const [lessonFormData, setLessonFormData] = useState<LessonFormData>(EMPTY_LESSON_FORM);

    // 4. DERIVED VALUE (Հաշվարկված արժեք՝ JSX-ում ավելորդ IIFE ֆունկցիայից խուսափելու համար)
    // getYouTubeEmbedUrl-ը Pure Function է, որը ստուգում և վավերացնում է հղումը (Security against unsafe iframe src)
    const embedUrl = activeLesson ? getYouTubeEmbedUrl(activeLesson.video_url) : null;

    // 5. UI EVENT HANDLERS (Մաքուր handler-ներ՝ JSX-ը չծանրաբեռնելու համար)
    const handleOpenAddLesson = () => {
        setEditingLessonId(null);
        setLessonFormData(EMPTY_LESSON_FORM);
        setIsLessonModalOpen(true);
    };

    const handleOpenEditLesson = (lesson: LessonData) => {
        setEditingLessonId(lesson.id);
        setLessonFormData({
            title: lesson.title,
            video_url: lesson.video_url || '',
            content: lesson.content || '',
        });
        setIsLessonModalOpen(true);
    };

    const handleDeleteLessonClick = (e: React.MouseEvent, lessonId: number) => {
        // Կանխում է Event Bubbling-ը, որպեսզի ջնջելու կոճակը սեղմելիս դասը միաժամանակ չընտրվի որպես active
        e.stopPropagation();
        deleteLesson(lessonId);
    };

    const handleSaveLesson = async (data: LessonFormData) => {
        const success = await saveLesson(editingLessonId, data);
        // Մոդալը փակում ենք միայն սերվերում հաջող պահպանումից հետո, որպեսզի սխալի դեպքում օգտատիրոջ գրածը չկորչի
        if (success) setIsLessonModalOpen(false);
    };

    // 6. EARLY RETURNS (Loading և Error վիճակների մշակում նախքան հիմնական UI-ը)
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto mt-16 p-8 text-center">
                <span className="text-5xl mb-6 block">🔒</span>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">
                    {error}
                </h2>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold transition-colors"
                >
                    &larr; Dashboard
                </button>
            </div>
        );
    }

    // 7. MAIN RENDER (Հիմնական երկսյուն դասավորություն՝ Վիդեոփլեյեր + Պլեյլիստ)
    return (
        <div className="max-w-[1400px] mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {/* Վերևի Վահանակ (Top Bar՝ հետ վերադառնալու և Admin գործողությունների կոճակներ) */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    <svg
                        className="w-5 h-5 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                    Back to Dashboard
                </button>

                {/* Role-Based UI Rendering. կառավարման կոճակները երևում են միայն admin-ին */}
                {user?.role === 'admin' && !isEditingCourse && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsEditingCourse(true)}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-yellow-100 text-yellow-700 border border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-500 dark:border-yellow-800 dark:hover:bg-yellow-900/40 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                        >
                            Edit Course
                        </button>
                        <button
                            onClick={deleteCourse}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-500 dark:border-red-800 dark:hover:bg-red-900/40 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                        >
                            Delete Course
                        </button>
                    </div>
                )}
            </div>

            {/* Մեջտեղի Մաս. Խմբագրման ֆորմա կամ Դասընթացի դիտման ռեժիմ */}
            {isEditingCourse ? (
                <EditCourseForm
                    course={course}
                    isSubmitting={isSubmitting}
                    onUpdate={updateCourse}
                    onCancel={exitEditMode}
                />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
                    {/* ՁԱԽ ԿՈՂՄ (Ակտիվ դասի վիդեոփլեյեր, նկարագրություն և կուրսի տվյալներ) */}
                    <div className="flex flex-col gap-4">
                        {activeLesson ? (
                            <>
                                {/* 16:9 հարաբերակցությամբ (aspect-video) վիդեո կոնտեյներ */}
                                <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-xl">
                                    {embedUrl ? (
                                        <iframe
                                            src={embedUrl}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            referrerPolicy="strict-origin-when-cross-origin"
                                            allowFullScreen
                                            title={activeLesson.title}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900">
                                            No video provided
                                        </div>
                                    )}
                                </div>

                                {/* Ակտիվ դասի վերնագիր */}
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-5 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {activeLesson.title}
                                    </h2>
                                </div>

                                {/* Ակտիվ դասի տեքստային նյութ (whitespace-pre-line-ը պահպանում է տողադարձերը) */}
                                {activeLesson.content && (
                                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mt-2 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
                                        {activeLesson.content}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="aspect-video bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl flex items-center justify-center text-gray-500">
                                No lessons available.
                            </div>
                        )}

                        {/* Դասընթացի ընդհանուր վերնագիր և նկարագրություն */}
                        <div className="mt-4 pt-6 border-t border-gray-200 dark:border-gray-800/50">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                {course?.title}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {course?.description}
                            </p>
                        </div>
                    </div>

                    {/* ԱՋ ԿՈՂՄ (Sticky Պլեյլիստ՝ էջը scroll անելիս մնում է տեսադաշտում) */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden lg:sticky lg:top-6 shadow-xl flex flex-col max-h-[85vh]">
                        <LessonPlaylist
                            lessons={lessons}
                            activeLesson={activeLesson}
                            userRole={user?.role}
                            onLessonSelect={setActiveLesson}
                            onAddClick={handleOpenAddLesson}
                            onEditClick={handleOpenEditLesson}
                            onDeleteClick={handleDeleteLessonClick}
                        />
                    </div>
                </div>
            )}

            {/* Conditional Mounting. մոդալը մոնտաժվում է միայն բաց լինելիս՝ փակվելիս մաքրելով ներքին state-ը */}
            {isLessonModalOpen && (
                <LessonModal
                    isOpen={isLessonModalOpen}
                    lessonId={editingLessonId}
                    initialData={lessonFormData}
                    isSubmitting={isSubmitting}
                    onSave={handleSaveLesson}
                    onClose={() => setIsLessonModalOpen(false)}
                />
            )}
        </div>
    );
};