import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import type { Notification } from '../types';

// Հաստատուն՝ Magic Number-ից խուսափելու համար (30 վայրկյան)։
// Հայտարարված է Hook-ից դուրս, որպեսզի ամեն render-ին նորից չստեղծվի հիշողության մեջ։
const POLLING_INTERVAL_MS = 30_000;

// Օգնող ֆունկցիա՝ տարբերելու համար միտումնավոր չեղարկված հարցումը իրական ցանցային սխալից
const isCanceledError = (error: any): boolean =>
    error?.code === 'ERR_CANCELED' ||
    error?.name === 'CanceledError' ||
    error?.name === 'AbortError';

/**
 * Custom Hook՝ օգտատիրոջ ծանուցումների (Notifications) իրական ժամանակին մոտ
 * թարմացման (Short Polling), կարդացված նշելու և մաքրելու տրամաբանության համար։
 */
export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // useRef-ը պահում է ընթացիկ GET հարցման AbortController-ը՝ առանց re-render առաջացնելու։
    // Օգտագործվում է Unmount-ի ժամանակ և Race Condition-ը (Zombie State) կանխելու համար։
    const fetchControllerRef = useRef<AbortController | null>(null);

    /**
     * 1. FETCH NOTIFICATIONS (Short Polling ֆունկցիա)
     * Յուրաքանչյուր նոր հարցումից առաջ չեղարկում է նախորդ չավարտված հարցումը,
     * որպեսզի դանդաղ ցանցի դեպքում հին պատասխանը չգրի նորի վրայից։
     */
    const fetchNotifications = useCallback(async () => {
        fetchControllerRef.current?.abort();
        const controller = new AbortController();
        fetchControllerRef.current = controller;

        try {
            const res = await api.get<Notification[]>('/api/notifications', {
                signal: controller.signal,
            });
            setNotifications(res.data);
        } catch (error) {
            if (isCanceledError(error)) return;

            // Silent Fail. ֆոնային հարցման ձախողման դեպքում օգտատիրոջը չենք սպամում toast-երով
            console.error('Failed to fetch notifications', error);
        }
    }, []);

    /**
     * 2. POLLING LIFECYCLE + PAGE VISIBILITY OPTIMIZATION
     * - Mount-ի ժամանակ միանգամից բեռնում է ծանուցումները։
     * - Յուրաքանչյուր 30 վայրկյանը մեկ թարմացնում է ՄԻԱՅՆ եթե բրաուզերի ներդիրը ակտիվ է
     *   (խնայում է սերվերի CPU-ն, DB Connection Pool-ը և օգտատիրոջ մարտկոցը)։
     * - Cleanup-ով մաքրում է timer-ը և չեղարկում ընթացիկ հարցումը՝ Memory Leak-ից խուսափելու համար։
     */
    useEffect(() => {
        fetchNotifications();

        // Ժամանակավոր Short Polling լուծում՝ մինչև Server-Sent Events (SSE) կամ WebSockets-ին անցնելը
        const intervalId = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchNotifications();
            }
        }, POLLING_INTERVAL_MS);

        return () => {
            clearInterval(intervalId);
            fetchControllerRef.current?.abort();
        };
    }, [fetchNotifications]);

    /**
     * 3. DERIVED STATE — Zero Allocation Count (O(n) Time, O(1) Space)
     * filter().length-ի փոխարեն օգտագործում ենք reduce, որպեսզի ամեն render-ի ժամանակ
     * V8 Heap-ում ավելորդ ժամանակավոր զանգված չստեղծվի։
     */
    const unreadCount = notifications.reduce(
        (count, n) => (n.is_read ? count : count + 1),
        0
    );

    /**
     * 4. MARK AS READ (Բոլորը կարդացված նշել)
     */
    const markAsRead = async () => {
        // Guard Clause. եթե չկարդացված ծանուցում չկա, ավելորդ PUT հարցում չենք ուղարկում բազա
        if (unreadCount === 0) return;

        // Չեղարկում ենք ընթացքի մեջ գտնվող polling-ը, որպեսզի հին տվյալները չվերադառնան
        fetchControllerRef.current?.abort();

        try {
            await api.put('/api/notifications/read');

            // Immutable update՝ առանց ավելորդ օբյեկտներ ստեղծելու արդեն կարդացվածների համար
            setNotifications((prev) =>
                prev.map((n) => (n.is_read ? n : { ...n, is_read: true }))
            );
        } catch (error) {
            toast.error('Failed to mark notifications as read.');
        }
    };

    /**
     * 5. CLEAR ALL (Բոլոր ծանուցումների ջնջում)
     */
    const clearAll = async () => {
        // Guard Clause. դատարկ ցանկի դեպքում ավելորդ DELETE հարցում չենք անում
        if (notifications.length === 0) return;

        // Կանխում ենք Zombie State-ը (ուշացած polling պատասխանը չի վերադարձնի ջնջվածները)
        fetchControllerRef.current?.abort();

        try {
            await api.delete('/api/notifications');
            setNotifications([]);
        } catch (error) {
            toast.error('Failed to clear notifications.');
        }
    };

    // Encapsulation. վերադարձնում ենք նույն մաքուր ինտերֆեյսը UI-ի համար
    return {
        notifications,
        unreadCount,
        markAsRead,
        clearAll,
    };
};