import { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import type { CourseDetailsData, LessonData } from '../types';
import { useNavigate } from 'react-router-dom';


// Custom Hook՝ CourseDetails էջի ամբողջ բիզնես տրամաբանությունը
// (տվյալների զուգահեռ բեռնում, դասընթացի և դասերի CRUD գործողություններ,
// սխալների մշակում և նավիգացիա) UI կոմպոնենտից անջատելու համար (Separation of Concerns)։

 
export const useCourseDetails = (
    courseId: string | undefined, // URL-ից ստացված դասընթացի ID-ն (useParams-ից)
    userRole?: string,// Օգտատիրոջ դերը ('admin' | 'student')՝ խմբագրման ռեժիմը կառավարելու համար
    fromDashboardEdit?: boolean // Դրոշակ (location.state-ից), երբ ադմինը եկել է Dashboard-ի "Edit" կոճակով
) => {
    const navigate = useNavigate();

    // 1. DATA & UI STATES (Տվյալների և ինտերֆեյսի վիճակներ)
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [course, setCourse] = useState<CourseDetailsData | null>(null);
    const [lessons, setLessons] = useState<LessonData[]>([]);
    const [activeLesson, setActiveLesson] = useState<LessonData | null>(null);

    // 2. MUTATION STATES (Խմբագրման և սերվեր ուղարկման վիճակներ)
    const [isEditingCourse, setIsEditingCourse] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    /**
     * 3. INITIAL LOAD — Parallel Fetching + AbortController (Race Condition-ի կանխում)
     * - Promise.all-ով զուգահեռ բեռնում է դասընթացն ու դասերը՝ վերացնելով Request Waterfall-ը։
     * - AbortController-ը չեղարկում է հին HTTP հարցումը, եթե courseId-ն արագ փոխվի կամ
     *   կոմպոնենտը Unmount լինի՝ կանխելով Race Condition-ը և Memory Leak-ը։
     */
    useEffect(() => {
        // Guard Clause՝ Infinite Loading Spinner-ից խուսափելու համար, եթե URL-ում ID չկա
        if (!courseId) {
            setError('Invalid course ID.');
            setIsLoading(false);
            return;
        }

        const controller = new AbortController();

        const fetchData = async () => {
            setIsLoading(true);
            setError(null); // Մաքրում ենք նախորդ կուրսի հնարավոր սխալը (Stale State-ի կանխում)

            try {
                const [courseRes, lessonsRes] = await Promise.all([
                    api.get(`/api/courses/${courseId}`, { signal: controller.signal }),
                    api.get(`/api/courses/${courseId}/lessons`, { signal: controller.signal }),
                ]);

                const fetchedLessons: LessonData[] = lessonsRes.data;

                setCourse(courseRes.data);
                setLessons(fetchedLessons);

                // Միշտ հստակ թարմացնում ենք activeLesson-ը (եթե նոր կուրսը դատարկ է -> null)
                setActiveLesson(fetchedLessons.length > 0 ? fetchedLessons[0] : null);

                // Հստակ սինխրոնիզացնում ենք խմբագրման ռեժիմը ըստ դերի և նավիգացիայի աղբյուրի
                setIsEditingCourse(Boolean(fromDashboardEdit && userRole === 'admin'));
            } catch (err: any) {
                // Եթե հարցումը միտումնավոր չեղարկվել է AbortController-ով, դա իրական սխալ չէ
                if (
                    err?.code === 'ERR_CANCELED' ||
                    err?.name === 'CanceledError' ||
                    err?.name === 'AbortError'
                ) {
                    return;
                }

                // Granular Error Handling՝ ըստ HTTP Status Code-երի
                if (err.response?.status === 403) {
                    setError('Access Denied: You must be enrolled to view this course.');
                } else if (err.response?.status === 404) {
                    setError('Course not found.');
                } else {
                    setError('An unexpected error occurred.');
                    toast.error('Failed to load details.');
                }
            } finally {
                // Չեղարկված հարցումը չպետք է անջատի նոր սկսված հարցման loading վիճակը
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        // Cleanup ֆունկցիա. Unmount-ի կամ courseId-ի փոփոխության ժամանակ չեղարկում է ընթացիկ հարցումները
        return () => {
            controller.abort();
        };
    }, [courseId, fromDashboardEdit, userRole]);

    
    // 4. COURSE ACTIONS (Դասընթացի ջնջում և թարմացում — Pessimistic UI Updates)
    const deleteCourse = async () => {
        if (!courseId || isSubmitting) return;
        if (!window.confirm('Delete this course? All lessons will be lost.')) return;

        setIsSubmitting(true);
        try {
            await api.delete(`/api/courses/${courseId}`);
            toast.success('Course deleted successfully.');
            // Դասընթացը ջնջված է, ուղղորդում ենք հետ՝ Dashboard
            navigate('/dashboard', { replace: true });
        } catch (err) {
            toast.error('Failed to delete course.');
            setIsSubmitting(false);
        }
    };

     /**
     * Խմբագրման ռեժիմից դուրս գալու միասնական ֆունկցիա (Single Source of Truth):
     * Եթե ադմինը եկել է Dashboard-ի "Edit" կոճակով, վերադարձնում է Dashboard,
     * այլապես պարզապես փակում է ֆորման՝ մնալով CourseDetails էջում։
     */
    const exitEditMode = () => {
        if (fromDashboardEdit) {
            navigate('/dashboard');
        } else {
            setIsEditingCourse(false);
        }
    };

    const updateCourse = async (editTitle: string, editDescription: string) => {
        // Guard Clause՝ դատարկ վերնագիրը և կրկնակի submit-ը կանխելու համար
        if (!courseId || isSubmitting || !editTitle.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await api.put(`/api/courses/${courseId}`, {
                title: editTitle.trim(),
                description: editDescription.trim(),
            });

            // Թարմացնում ենք local state-ը սերվերի վերադարձրած օբյեկտով (Single Source of Truth)
            setCourse(res.data.course);
            toast.success('Course updated.');

            exitEditMode();
        } catch (err) {
            toast.error('Failed to update course.');
        } finally {
            setIsSubmitting(false);
        }
    };

    
    // 5. LESSON ACTIONS (Դասերի CRUD գործողություններ)
    
    const deleteLesson = async (lessonId: number) => {
        if (!courseId || isSubmitting) return;
        if (!window.confirm('Are you sure you want to delete this lesson?')) return;

        try {
            await api.delete(`/api/courses/${courseId}/lessons/${lessonId}`);

            // Immutable կերպով հեռացնում ենք ջնջված դասը՝ առանց ավելորդ GET հարցման
            const updatedLessons = lessons.filter((l) => l.id !== lessonId);
            setLessons(updatedLessons);

            // Եթե ջնջվածը հենց ներկայումս բացված դասն էր, անցնում ենք առաջին հասանելի դասին կամ null-ի
            if (activeLesson?.id === lessonId) {
                setActiveLesson(updatedLessons.length > 0 ? updatedLessons[0] : null);
            }
            toast.success('Lesson deleted.');
        } catch (err) {
            toast.error('Failed to delete lesson.');
        }
    };

    /**
     * Միասնական Save ֆունկցիա (Create / Update).
     * Վերադարձնում է Promise<boolean>, որպեսզի UI մոդալը իմանա՝ փակվի՞, թե՞ մնա բաց սխալի դեպքում։
     */
    const saveLesson = async (
        lessonId: number | null,
        formData: { title: string; video_url: string; content: string }
    ): Promise<boolean> => {
        if (!courseId || !formData.title.trim() || isSubmitting) return false;

        // Data Sanitization՝ սերվեր ենք ուղարկում մաքրված տեքստային դաշտեր
        const sanitizedPayload = {
            title: formData.title.trim(),
            video_url: formData.video_url.trim(),
            content: formData.content.trim(),
        };

        setIsSubmitting(true);
        try {
            if (lessonId) {
                // UPDATE ճյուղ (PUT)
                const res = await api.put(
                    `/api/courses/${courseId}/lessons/${lessonId}`,
                    sanitizedPayload
                );
                const updatedLesson: LessonData = res.data.lesson;

                // Functional State Update՝ Stale Closure-ից խուսափելու համար
                setLessons((prev) => prev.map((l) => (l.id === lessonId ? updatedLesson : l)));

                // Սինխրոնիզացնում ենք ակտիվ վիդեոփլեյերի տվյալները, եթե խմբագրվել է հենց ակտիվ դասը
                if (activeLesson?.id === lessonId) setActiveLesson(updatedLesson);
                toast.success('Lesson updated successfully.');
            } else {
                // CREATE ճյուղ (POST)
                // Անվտանգ կերպով գտնում ենք առավելագույն order_index-ը՝ անկախ զանգվածի սորտավորումից։
                // (Architectural Note. բազմաօգտատեր ադմին-համակարգում սա պետք է հաշվվի PostgreSQL-ում՝ Race Condition-ից խուսափելու համար)
                const maxOrder = lessons.reduce((max, l) => Math.max(max, l.order_index), 0);
                const nextOrder = maxOrder + 1;

                const res = await api.post(`/api/courses/${courseId}/lessons`, {
                    ...sanitizedPayload,
                    order_index: nextOrder,
                });
                const addedLesson: LessonData = res.data.lesson;

                // Functional State Update՝ անվտանգ կցում ենք նոր դասը ցանկի վերջում
                setLessons((prev) => [...prev, addedLesson]);

                // Եթե սա կուրսի առաջին դասն է, միանգամից դարձնում ենք ակտիվ
                if (!activeLesson) setActiveLesson(addedLesson);
                toast.success('Lesson added successfully.');
            }
            return true;
        } catch (err) {
            toast.error(lessonId ? 'Failed to update lesson.' : 'Failed to add lesson.');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };


    // Encapsulation. վերադարձնում ենք միայն UI շերտին անհրաժեշտ վիճակներն ու մեթոդները
    return {
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
    };
};