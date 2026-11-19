import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import type { Course } from '../types';

// Հաստատուն՝ Magic Number-ից խուսափելու համար։
// Հայտարարված է Hook-ից դուրս, որպեսզի ամեն render-ի ժամանակ չվերստեղծվի հիշողության մեջ։
const SEARCH_DEBOUNCE_MS = 500;

/**
 * Custom Hook՝ Dashboard էջի ամբողջ բիզնես տրամաբանությունը
 * (տվյալների բեռնում, Debounced Search, Enroll/Unenroll և դասընթացի ստեղծում)
 * UI կոմպոնենտից անջատելու համար (Separation of Concerns)։
 */

export const useDashboard = (userRole?: string) => {
    // 1. DATA STATES (Տվյալների վիճակներ)
    const [courses, setCourses] = useState<Course[]>([]);
    // Օգտագործում ենք Set (Hash Table) Array-ի փոխարեն՝ O(1) արագ որոնման և եզակիության համար
    const [enrolledIds, setEnrolledIds] = useState<Set<number>>(() => new Set());
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // 2. SEARCH STATES (Որոնման վիճակներ՝ Debounce մեխանիզմի համար)
    const [searchTerm, setSearchTerm] = useState<string>('');           // Ակնթարթային արժեքը input-ի համար
    const [debouncedSearch, setDebouncedSearch] = useState<string>(''); // Հապաղեցված արժեքը API հարցման համար

    // 3. ADMIN ACTION STATE (Դասընթաց ստեղծելու ընթացքի վիճակը)
    const [isCreating, setIsCreating] = useState<boolean>(false);

    /**
     * 4. FETCHING LOGIC — Parallel Fetching + AbortController
     * Փաթաթված է useCallback-ով՝ useEffect-ի dependency array-ում անվտանգ օգտագործելու համար։
     * - Ուսանողի դեպքում երկու անկախ GET հարցումները գնում են զուգահեռ (Promise.all)՝
     *   վերացնելով Request Waterfall-ը։
     * - Axios-ի params-ը ավտոմատ կոդավորում է հատուկ սիմվոլները (օր.՝ "C++", "&")։
     */
    const fetchData = useCallback(
        async (searchQuery: string = '', signal?: AbortSignal) => {
            try {
                setIsLoading(true);

                // Հիմնական հարցումը՝ բոլոր դասընթացները ըստ որոնման տեքստի
                const coursesRequest = api.get<Course[]>('/api/courses', {
                    params: { search: searchQuery },
                    signal,
                });

                if (userRole === 'student') {
                    // Զուգահեռ բեռնում ենք և՛ դասընթացները, և՛ ուսանողի գրանցումները
                    const [coursesRes, myCoursesRes] = await Promise.all([
                        coursesRequest,
                        api.get<Course[]>('/api/enrollments/my-courses', { signal }),
                    ]);

                    setCourses(coursesRes.data);
                    setEnrolledIds(new Set(myCoursesRes.data.map((c) => c.id)));
                } else {
                    const coursesRes = await coursesRequest;
                    setCourses(coursesRes.data);
                }
            } catch (error: any) {
                // Եթե հարցումը չեղարկվել է AbortController-ով (նոր որոնում սկսելու պատճառով), անտեսում ենք
                if (
                    error?.code === 'ERR_CANCELED' ||
                    error?.name === 'CanceledError' ||
                    error?.name === 'AbortError'
                ) {
                    return;
                }

                if (error.response?.status === 401) {
                    toast.error('Session expired. Please log in again.');
                } else {
                    toast.error('Failed to load courses.');
                }
            } finally {
                // Չեղարկված հին հարցումը չպետք է անջատի նոր սկսված հարցման loading վիճակը
                if (!signal?.aborted) {
                    setIsLoading(false);
                }
            }
        },
        [userRole]
    );

    /**
     * 5. DEBOUNCE LOGIC (Սերվերի ծանրաբեռնվածության նվազեցում)
     * Յուրաքանչյուր ստեղն սեղմելիս չեղարկում է նախորդ timer-ը (Cleanup ֆունկցիայով)։
     * API հարցումը կատարվում է միայն այն ժամանակ, երբ օգտատերը 500ms դադար է տալիս։
     */
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timerId);
    }, [searchTerm]);

    /**
     * 6. TRIGGER FETCH + RACE CONDITION PROTECTION
     * Երբ debouncedSearch-ը փոխվում է, սկսում է նոր հարցում և Cleanup-ով
     * չեղարկում է նախորդ դեռ չավարտված հարցումը (AbortController)։
     */
    useEffect(() => {
        const controller = new AbortController();
        fetchData(debouncedSearch, controller.signal);

        return () => {
            controller.abort();
        };
    }, [debouncedSearch, fetchData]);

    /**
     * 7. ACTIONS (Դասընթացների ստեղծում, գրանցում, դուրս գալ և ջնջում)
     */
    const createCourse = async (
        title: string,
        description: string,
        onSuccess: () => void
    ) => {
        // Guard Clause՝ դատարկ վերնագիրը և կրկնակի submit-ը կանխելու համար
        if (!title.trim() || isCreating) return;

        setIsCreating(true);
        try {
            await api.post('/api/courses', {
                title: title.trim(),
                description: description.trim(),
            });
            toast.success('Course created successfully!');
            onSuccess();
            // Թարմացնում ենք ցանկը՝ սերվերից ստանալու նոր ստեղծված դասընթացի ամբողջական տվյալները
            await fetchData(debouncedSearch);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create course.');
        } finally {
            setIsCreating(false);
        }
    };

    // Pessimistic UI Update՝ նախ սերվերի հաստատում, ապա տեղային Set-ի թարմացում (առանց ավելորդ refetch-ի)
    const unenroll = async (courseId: number) => {
        if (!window.confirm('Are you sure you want to drop this course?')) return;

        try {
            await api.delete(`/api/enrollments/${courseId}`);
            toast.success('Successfully dropped the course.');

            // Immutable Set update. ստեղծում ենք նոր Set, որպեսզի React-ը ֆիքսի reference-ի փոփոխությունը
            setEnrolledIds((prev) => {
                const next = new Set(prev);
                next.delete(courseId);
                return next;
            });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to unenroll.');
        }
    };

    const enroll = async (courseId: number) => {
        try {
            await api.post(`/api/enrollments/${courseId}`);
            toast.success('Successfully enrolled in the course!');

            // Առանց ավելորդ GET հարցման և Skeleton-ների թարթման՝ դասընթացն ակնթարթորեն տեղափոխվում է "My Enrolled Courses"
            setEnrolledIds((prev) => {
                const next = new Set(prev);
                next.add(courseId);
                return next;
            });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to enroll.');
        }
    };

    // Callback՝ CourseCard-ից դասընթացը ջնջելուց հետո տեղային state-երը սինխրոնիզացնելու համար
    const handleCourseDeleted = (deletedCourseId: number) => {
        setCourses((prev) => prev.filter((c) => c.id !== deletedCourseId));
        setEnrolledIds((prev) => {
            if (!prev.has(deletedCourseId)) return prev;
            const next = new Set(prev);
            next.delete(deletedCourseId);
            return next;
        });
    };

    /**
     * 8. DERIVED STATE — Single-pass Partitioning O(N)
     * Տվյալները չենք պահում առանձին useState-երում (Single Source of Truth), այլ հաշվում ենք
     * մեկ անցումով (for loop) և Set.has()-ի O(1) որոնմամբ։
     */
    const myEnrolledCourses: Course[] = [];
    const unEnrolledCourses: Course[] = [];

    for (const course of courses) {
        if (enrolledIds.has(course.id)) {
            myEnrolledCourses.push(course);
        } else {
            unEnrolledCourses.push(course);
        }
    }

    // Encapsulation. վերադարձնում ենք միայն UI կոմպոնենտին անհրաժեշտ ինտերֆեյսը
    return {
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
    };
};