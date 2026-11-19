import { useCallback, useState } from "react"
import type { Comment } from "../types"
import { api } from "../services/api";
import toast from "react-hot-toast";


// Հաստատուն՝ Magic Number-ներից խուսափելու համար (DRY սկզբունք)։
// Հայտարարված է Hook-ից դուրս, որպեսզի ամեն render-ի ժամանակ նորից չստեղծվի հիշողության մեջ։
const COMMENTS_LIMIT = 5;


// Custom Hook՝ կոնկրետ դասընթացի մեկնաբանությունների (Comments)
// բեռնման, Pagination-ի, ավելացման և ջնջման բիզնես տրամաբանությունը
// UI կոմպոնենտից անջատելու համար (Separation of Concerns)։

export const useComments = (courseId:number) => {
    // STATE MANAGEMENT (Վիճակների կառավարում)
    const [comments,setComments] = useState<Comment[]>([]); // Բեռնված մեկնաբանությունների զանգվածը
    const [offset,setOffset] = useState(0);// Offset Pagination-ի ցուցիչը (քանի հատ բաց թողնել DB-ից կարդալիս)
    const [hasMore,setHasMore] = useState(false);// Արդյոք սերվերում դեռ չբեռնված մեկնաբանություններ կան
    const [loading,setLoading] = useState(false);// Ցանկը բեռնելու ընթացքի վիճակը (Loader-ի և Race Condition-ի կանխման համար)
    const [isSubmitting,setIsSubmitting] = useState(false);// Նոր մեկնաբանություն ուղարկելու վիճակը (կրկնակի submit-ը կանխելու համար)

    // FETCH COMMENTS (Տվյալների բեռնում)
    // Փաթաթված է useCallback-ով՝ Referential Equality-ն պահպանելու համար։
    // Սա թույլ է տալիս ֆունկցիան անվտանգ դնել UI կոմպոնենտի useEffect-ի
    // Dependency Array-ում՝ առանց անվերջ ցիկլ (Infinite Loop) առաջացնելու։
    const fetchComments = useCallback(async (currentOffset:number,append = false) => {
        setLoading(true);
        try {
            // GET հարցում Offset-based Pagination-ով
            const res = await api.get(`/api/courses/${courseId}/comments?limit=5&offset=${currentOffset}`);
            if(append) {
                // "Load More"-ի դեպքում՝ Immutable կերպով հին ցանկին կցում ենք նոր տվյալները
                setComments(prev => [...prev,...res.data.comments]);
            } else {
                // Սկզբնական բեռնման կամ թարմացման դեպքում՝ փոխարինում ենք ամբողջ ցանկը
                setComments(res.data.comments);
            }
            // Սերվերից ստացված դրոշակով թարմացնում ենք՝ էլի տվյալներ կա՞ն, թե՞ ոչ
            setHasMore(res.data.hasMore);
        } catch (error) {
            toast.error('Failed to load comments');
        } finally {
            // Անկախ արդյունքից անջատում ենք loading վիճակը
            setLoading(false);
        }
    },[courseId]);

    // LOAD MORE (Հաջորդ էջի բեռնում)
    // Guard Clause-ը կանխում է Race Condition-ը և կրկնակի հարցումները,
    // եթե նախորդ հարցումը դեռ ընթացքի մեջ է կամ տվյալներն ավարտվել են։
    const loadMore = () => {
        if (loading || !hasMore) return;
        
        const nextOffset = offset + COMMENTS_LIMIT;
        setOffset(nextOffset);
        fetchComments(nextOffset,true);
    };

    // ADD COMMENT (Նոր մեկնաբանության ավելացում)
    // Guard Clause-ը մերժում է դատարկ/միայն space-երից բաղկացած տեքստը
    // և բլոկավորում է կրկնակի ուղարկումը (Double Submit)։
    const addComment = async (content:string,onSuccess:() => void) => {
        if(!content.trim()) return;
        setIsSubmitting(true);

        try {
            await api.post(`/api/courses/${courseId}/comments`, { content:content.trim() });
            toast.success('Comment added!');
            // Կանչում ենք UI-ից փոխանցված callback-ը (օր.՝ մաքրում ենք input-ը)
            onSuccess();
            // Վերադառնում ենք ամենասկիզբ և թարմացնում ցանկը, որ նոր մեկնաբանությունը երևա վերևում
            setOffset(0);
            fetchComments(0);// Թարմացնում ենք ցանկը վերևից
        } catch (error) {
            toast.error('Failed to post comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    // DELETE COMMENT (Մեկնաբանության ջնջում)
    // Կիրառում է Pessimistic UI Update՝ նախ ջնջում է սերվերից,
    // ապա հեռացնում local state-ից՝ խնայելով 1 ավելորդ GET հարցում։
    const deleteComment = async (commentId:number) => {
        if(!window.confirm('Delete this comment?')) return;

        try {
            await api.delete(`/api/courses/${courseId}/comments/${commentId}`);
            // filter()-ը ստեղծում է նոր զանգված (Immutable update)՝ առանց ջնջված էլեմենտի
            setComments(prev => prev.filter(c => c.id !== commentId));
            toast.success('Comment deleted.');
        } catch (error) {
            toast.error('Failed to delete comment.');
        }
    };

    // Encapsulation. վերադարձնում ենք միայն UI-ին անհրաժեշտ ինտերֆեյսը
    return {
        comments,
        loading,
        isSubmitting,
        hasMore,
        fetchComments,
        loadMore,
        addComment,
        deleteComment
    };
};