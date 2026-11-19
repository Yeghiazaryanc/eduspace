import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { CourseCard } from '../components/CourseCard';
import { useDashboard } from '../hooks/useDashboard';
import { CourseCardSkeleton } from '../components/CourseCardSkeleton';

// Հաստատուններ Skeleton քարտերի քանակի համար։
// Հայտարարված են կոմպոնենտից դուրս՝ ամեն Re-render-ի ժամանակ V8 Heap-ում
// նոր զանգվածների ավելորդ Memory Allocation-ից խուսափելու համար։
const ENROLLED_SKELETONS = [1, 2, 3];
const AVAILABLE_SKELETONS = [1, 2, 3, 4];

/**
 * Dashboard Page (Presentation / Container Layer)
 * Ամբողջ տվյալների բեռնման, Debounced Search-ի և Enroll/Create լոգիկան
 * պատվիրակված է useDashboard Custom Hook-ին (Separation of Concerns)։
 * Այս կոմպոնենտը պատասխանատու է միայն UI դասավորության, Role-Based Rendering-ի
 * և ադմինի ֆորմայի տեղային վիճակի (Controlled Inputs) համար։
 */

export const Dashboard: React.FC = () => {
    // 1. GLOBAL STATE (Zustand Selector)
    // Վերցնում ենք միայն user-ը, որպեսզի store-ի այլ դաշտերի փոփոխությունները ավելորդ re-render չանեն
    const user = useAuthStore((state) => state.user);

    // Ընթեռնելի boolean դրոշակներ՝ կրկնվող user?.role ստուգումներից խուսափելու համար (DRY)
    const isAdmin = user?.role === 'admin';
    const isStudent = user?.role === 'student';

    // 2. LOCAL FORM STATE (Controlled Inputs՝ միայն Admin-ի "Create Course" ֆորմայի համար)
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // 3. BUSINESS LOGIC HOOK (Տվյալներ, որոնում և բոլոր գործողությունները)
    const {
        isLoading,
        searchTerm,
        setSearchTerm,
        myEnrolledCourses,
        unEnrolledCourses,
        isCreating,
        createCourse,
        enroll,
        unenroll,
        handleCourseDeleted,
    } = useDashboard(user?.role);

    /**
     * 4. FORM SUBMIT HANDLER
     * Կանխում է բրաուզերի ստանդարտ reload-ը, ստուգում է, որ դաշտերը միայն բացատներ չեն,
     * և փոխանցում է onSuccess Callback՝ ֆորման մաքրելու համար միայն հաջող պահպանումից հետո։
     */
    const handleCreateCourse = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;

        createCourse(title, description, () => {
            setTitle('');
            setDescription('');
        });
    };

    // Ադմինի դեպքում ձախ կողմում կա ֆորմա (2 սյուն քարտ), ուսանողի դեպքում՝ ամբողջ լայնությամբ (3 սյուն)
    const availableCoursesGridClass = isAdmin
        ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
        : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';

    return (
        <div className="space-y-8">
            {/* Վերևի Դեկորատիվ Բաններ (Header Banner) */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-200">
                <div className="p-10 bg-gradient-to-r from-blue-600 to-indigo-700 flex justify-between items-center" />
            </div>

            {/* --- ՈՒՍԱՆՈՂԻ ԳՐԱՆՑՎԱԾ ԴԱՍԸՆԹԱՑՆԵՐԸ (Role-Based UI: միայն Student) --- */}
            {isStudent && (
                <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-blue-200 dark:border-blue-900/50 p-6 transition-colors duration-200">
                    <h2 className="text-xl font-bold text-blue-900 dark:text-blue-400 mb-4 flex items-center">
                        <span className="mr-2" aria-hidden="true">
                            📚
                        </span>
                        My Enrolled Courses ({isLoading ? '...' : myEnrolledCourses.length})
                    </h2>

                    {/* 3 վիճակների մշակում՝ Loading (Skeletons) -> Empty State -> Data Grid */}
                    {isLoading ? (
                        // Skeleton Loading-ը կանխում է Cumulative Layout Shift (CLS) երևույթը
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ENROLLED_SKELETONS.map((n) => (
                                <CourseCardSkeleton key={n} />
                            ))}
                        </div>
                    ) : myEnrolledCourses.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            You are not enrolled in any courses yet. Choose from the list below!
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myEnrolledCourses.map((course) => (
                                // key={course.id}-ը երաշխավորում է React-ի ճիշտ Reconciliation-ը
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    isEnrolled={true}
                                    onUnenroll={unenroll}
                                    userRole={user?.role}
                                    onDeleteSuccess={handleCourseDeleted}
                                />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* --- ԳԼԽԱՎՈՐ GRID (Ադմինի պանել + Հասանելի դասընթացների ցանկ) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- ԱԴՄԻՆ ՊԱՆԵԼ (Role-Based UI: միայն Admin, Sticky դիրքավորումով) --- */}
                {isAdmin && (
                    <aside className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-purple-200 dark:border-purple-900/50 overflow-hidden sticky top-24 transition-colors duration-200">
                            <div className="bg-purple-50 dark:bg-purple-900/30 px-6 py-4 border-b border-purple-100 dark:border-purple-800/50">
                                <h2 className="text-lg font-bold text-purple-900 dark:text-purple-300 flex items-center">
                                    <span className="mr-2" aria-hidden="true">
                                        🛡️
                                    </span>
                                    Create Course
                                </h2>
                            </div>
                            <div className="p-6">
                                <form onSubmit={handleCreateCourse} className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="course-title"
                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                        >
                                            Course Title
                                        </label>
                                        <input
                                            id="course-title"
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="course-description"
                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                        >
                                            Description
                                        </label>
                                        <textarea
                                            id="course-description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                            rows={4}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 outline-none resize-none transition-colors"
                                        />
                                    </div>
                                    {/* Double Submit պաշտպանություն՝ disabled={isCreating} */}
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className={`w-full py-2 rounded-lg text-white font-bold transition-all shadow-sm ${
                                            isCreating
                                                ? 'bg-purple-400 cursor-wait'
                                                : 'bg-purple-600 hover:bg-purple-700'
                                        }`}
                                    >
                                        {isCreating ? 'Creating...' : 'Create Course'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </aside>
                )}

                {/* --- ԲՈԼՈՐ ՀԱՍԱՆԵԼԻ ԴԱՍԸՆԹԱՑՆԵՐԸ --- */}
                <section
                    className={`space-y-6 ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}
                >
                    {/* Վերնագիր և Որոնման Դաշտ (կապված է useDashboard-ի Debounce մեխանիզմին) */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                            All Available Courses
                        </h2>

                        <div className="relative w-full sm:w-72">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search courses..."
                                aria-label="Search courses"
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                            />
                            <svg
                                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* 3 վիճակների մշակում՝ Loading -> Contextual Empty State -> Courses Grid */}
                    {isLoading ? (
                        <div className={availableCoursesGridClass}>
                            {AVAILABLE_SKELETONS.map((n) => (
                                <CourseCardSkeleton key={n} />
                            ))}
                        </div>
                    ) : unEnrolledCourses.length === 0 ? (
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-10 rounded-xl shadow-sm text-center transition-colors duration-200">
                            <p className="text-gray-500 dark:text-gray-400">
                                {searchTerm.trim()
                                    ? 'No courses found matching your search.'
                                    : isAdmin
                                      ? 'No courses have been created yet. Use the form on the left to add one.'
                                      : 'You are enrolled in all available courses.'}
                            </p>
                        </div>
                    ) : (
                        <div className={availableCoursesGridClass}>
                            {unEnrolledCourses.map((course) => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    isEnrolled={false}
                                    onEnroll={enroll}
                                    userRole={user?.role}
                                    onDeleteSuccess={handleCourseDeleted}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};