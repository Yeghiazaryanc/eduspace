const { pool } = require('../config/db');

// 1. Ստանալ կուրսի մեկնաբանությունները (Մաս-մաս)
const getCourseComments = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        // SECURITY OPTIMIZATION: Կանխում ենք DoS հարձակումները (երբ լիմիտը 1000000 են դնում)
        // Ապահովում ենք radix (10) և դնում ենք կոշտ վերին շեմ՝ 50:
        const limit = Math.min(parseInt(req.query.limit, 10) || 5, 50); 
        const offset = parseInt(req.query.offset, 10) || 0;

        const query = `
           SELECT 
                c.id, 
                c.content, 
                c.created_at, 
                c.user_id AS author_id, 
                u.name AS author_name, 
                u.avatar_url 
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.course_id = $1
            ORDER BY c.created_at DESC
            LIMIT $2 OFFSET $3;
        `;
        
        const countQuery = 'SELECT COUNT(*) FROM comments WHERE course_id = $1';

        // PERFORMANCE FIX: Զուգահեռացնում ենք I/O գործողությունները (No Waterfall)
        const [result, countResult] = await Promise.all([
            pool.query(query, [courseId, limit, offset]),
            pool.query(countQuery, [courseId])
        ]);

        const totalComments = parseInt(countResult.rows[0].count, 10);

        res.status(200).json({
            comments: result.rows,
            total: totalComments,
            hasMore: offset + result.rows.length < totalComments
        });
    } catch (error) {
        console.error('Fetch Comments Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// 2. Ավելացնել նոր մեկնաբանություն
const addComment = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { content } = req.body;
        const userId = req.user.id; 

        if (!content || content.trim() === '') {
            return res.status(400).json({ message: 'Comment content is required.' });
        }

        // ARCHITECTURE FIX: Common Table Expression (CTE)
        // Նախկին RETURNING *-ը չէր տալիս յուզերի անունը և նկարը: 
        // Այժմ մենք INSERT ենք անում և ԱՆՄԻՋԱՊԵՍ JOIN ենք անում նույն հարցման մեջ:
        // Սա երաշխավորում է, որ Ֆրոնտենդը կստանա ճիշտ այն կառուցվածքը, ինչ getCourseComments-ում:
        const query = `
            WITH inserted_comment AS (
                INSERT INTO comments (course_id, user_id, content) 
                VALUES ($1, $2, $3) 
                RETURNING *
            )
            SELECT 
                ic.id, 
                ic.content, 
                ic.created_at, 
                ic.user_id AS author_id, 
                u.name AS author_name, 
                u.avatar_url 
            FROM inserted_comment ic
            JOIN users u ON ic.user_id = u.id;
        `;
        
        const result = await pool.query(query, [courseId, userId, content.trim()]);
        
        res.status(201).json({ 
            message: 'Comment added successfully', 
            comment: result.rows[0] 
        });
    } catch (error) {
        console.error('Add Comment Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// 3. Ջնջել մեկնաբանությունը
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // SECURITY FIX: Չենք վստահում միայն Ռոութի Middleware-ին:
        // Եթե ադմին է, ջնջում ենք ցանկացածը: Եթե ուսանող է, ջնջում ենք ՄԻԱՅՆ իր գրածը:
        let query;
        let params;

        if (userRole === 'admin') {
            query = 'DELETE FROM comments WHERE id = $1 RETURNING id;';
            params = [commentId];
        } else {
            query = 'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id;';
            params = [commentId, userId];
        }

        const result = await pool.query(query, params);

        // Եթե 0 տող է ջնջվել, նշանակում է կա՛մ կոմենտը չկա, կա՛մ ուրիշինն է փորձել ջնջել:
        if (result.rows.length === 0) {
            return res.status(403).json({ message: 'Comment not found or you do not have permission to delete it.' });
        }

        res.status(200).json({ message: 'Comment deleted successfully.' });
    } catch (error) {
        console.error('Delete Comment Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    getCourseComments,
    addComment,
    deleteComment
};