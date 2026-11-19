import { useEffect, useState } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Custom Hook՝ դասընթացի վրա կատարվող գործողությունների (Like և Delete)
 * բիզնես տրամաբանությունը UI կոմպոնենտից անջատելու համար (Separation of Concerns)։
 *
 * @param courseId - Կոնկրետ դասընթացի եզակի ID-ն
 * @param initialIsLiked - Սկզբնական վիճակը (արդյոք օգտատերն արդեն լայքել է)
 * @param initialLikesCount - Լայքերի սկզբնական քանակը
 * @param onDeleteSuccess - Callback ֆունկցիա՝ ծնող կոմպոնենտին տեղեկացնելու համար,
 *                          որ դասընթացը ջնջվել է (Inversion of Control)
 */
export const useCourseActions = (
  courseId: number,
  initialIsLiked: boolean,
  initialLikesCount: number,
  onDeleteSuccess?: (id: number) => void
) => {
  // 1. STATE MANAGEMENT (Վիճակների կառավարում)
  const [isLiked, setIsLiked] = useState<boolean>(initialIsLiked);
  const [likesCount, setLikesCount] = useState<number>(initialLikesCount);
  const [isLikeLoading, setIsLikeLoading] = useState<boolean>(false); // Կանխում է spam click-երը (Race Condition)
  const [isDeleting, setIsDeleting] = useState<boolean>(false);       // Ջնջման ընթացքում կոճակը բլոկավորելու համար

  /**
   * 2. PROPS SYNCHRONIZATION (Stale State-ի կանխում)
   * Քանի որ useState-ը սկզբնական արժեքները վերցնում է միայն առաջին Mount-ի ժամանակ,
   * այս useEffect-ը երաշխավորում է, որ եթե ծնող կոմպոնենտից նոր props գան
   * (օրինակ՝ դասընթացի տվյալները թարմանան առանց Unmount լինելու), local state-ը նույնպես կթարմանա։
   */
  useEffect(() => {
    setIsLiked(initialIsLiked);
    setLikesCount(initialLikesCount);
  }, [initialIsLiked, initialLikesCount]);

  /**
   * 3. TOGGLE LIKE — Optimistic UI Update Pattern
   * Օգտատիրոջը տալիս ենք ակնթարթային (0ms Perceived Latency) արձագանք՝
   * չսպասելով սերվերի պատասխանին։ Ցանցային սխալի դեպքում կատարում ենք Rollback։
   */
  const toggleLike = async (userRole?: string) => {
    // Guard Clause. արգելում է կրկնակի հարցումը ընթացքի մեջ կամ չգրանցված օգտատիրոջ գործողությունը
    if (isLikeLoading || !userRole) return;

    // Քայլ 1 (Snapshot). Պահում ենք ընթացիկ արժեքները Closure-ում՝ սխալի դեպքում վերականգնելու համար
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;

    // Քայլ 2 (Optimistic Update). Անմիջապես փոխում ենք UI-ը մինչև HTTP հարցման ավարտը։
    // Math.max(0, ...) պաշտպանությունը երաշխավորում է, որ լայքերի քանակը երբեք բացասական (-1) չի դառնա։
    setIsLiked(!previousIsLiked);
    setLikesCount(
      previousIsLiked ? Math.max(0, previousLikesCount - 1) : previousLikesCount + 1
    );
    setIsLikeLoading(true);

    try {
      // Քայլ 3 (Network Sync). Ուղարկում ենք իրական POST հարցումը՝ բազան թարմացնելու համար
      await api.post(`/api/courses/${courseId}/like`);
    } catch (error) {
      // Քայլ 4 (Rollback). Սերվերի կամ ցանցի սխալի դեպքում վերադարձնում ենք Snapshot վիճակը
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      toast.error('Failed to update like status.');
    } finally {
      // Անկախ արդյունքից՝ ապաբլոկավորում ենք լայքի կոճակը
      setIsLikeLoading(false);
    }
  };

  /**
   * 4. DELETE COURSE — Pessimistic UI Update Pattern
   * Ջնջումը կործանարար (Destructive) գործողություն է, ուստի նախ սպասում ենք
   * սերվերի հաստատմանը, հետո նոր փոխում ենք UI-ը։
   */
  const deleteCourse = async () => {
    // Guard Clause. կանխում է կրկնակի DELETE հարցումը, եթե ջնջումն արդեն ընթացքի մեջ է
    if (isDeleting) return;

    // Հաստատման պատուհան՝ պատահական ջնջումից խուսափելու համար
    if (!window.confirm('Are you sure you want to delete this course? All related data will be lost.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete(`/api/courses/${courseId}`);
      toast.success('Course deleted successfully.');

      // Տեղեկացնում ենք ծնող կոմպոնենտին (օր.՝ Dashboard-ից քարտը հեռացնել կամ redirect անել)
      if (onDeleteSuccess) {
        onDeleteSuccess(courseId);
      } else {
        // Եթե ծնողը callback չի փոխանցել և կոմպոնենտը չի Unmount լինելու, ապաբլոկավորում ենք կոճակը
        setIsDeleting(false);
      }
    } catch (error) {
      toast.error('Failed to delete course.');
      setIsDeleting(false);
    }
  };

  // Encapsulation. վերադարձնում ենք միայն UI կոմպոնենտին անհրաժեշտ վիճակներն ու մեթոդները
  return {
    isLiked,
    likesCount,
    isLikeLoading,
    isDeleting,
    toggleLike,
    deleteCourse,
  };
};