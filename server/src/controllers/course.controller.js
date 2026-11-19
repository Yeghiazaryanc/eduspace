const {pool} = require('../config/db');


const createCourse = async (req,res) => {
    try {
        const {title,description} = req.body;

        if(!title || !description){
            return res.status(400).json({message:'Title and description are required.'});
        }

        const insertQuery = `
            INSERT INTO courses (title,description)
            VALUES ($1,$2)
            RETURNING *;
        `;

        const result = await pool.query(insertQuery,[title,description]);

        res.status(201).json({
            message:'Course created successfully.',
            course:result.rows[0]
        });
    } catch (error) {
        console.error('Create Course Error:', error);
        res.status(500).json({message:'Internal server error while creating course.'});
    }
};

const getCourses = async (req, res) => {
   try {
        // Եթե ռոութը պաշտպանված է verifyToken-ով, մենք ունենք req.user.id
        // Եթե այն բաց է բոլորի համար (Public), req.user կարող է չլինել: 
        // Ապահովության համար դնում ենք 0 կամ null, եթե հյուր է:
        const userId = req.user ? req.user.id : null;

        // Վերցնում ենք search պարամետրը URL-ից (օր.՝ /api/courses?search=react)
        const searchQuery = req.query.search || '';

        // Օգտագործում ենք Subqueries՝ Cartesian Product-ից խուսափելու համար:
        const query = `
            SELECT 
                c.id, 
                c.title, 
                c.description, 
                c.created_at,
                (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolled_count,
                (SELECT COUNT(*) FROM course_likes cl WHERE cl.course_id = c.id) AS total_likes,
                (SELECT COUNT(*) FROM comments cm WHERE cm.course_id = c.id) AS comments_count,
                (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) AS lessons_count, -- ՆՈՐԸ: Հաշվում ենք դասերը
                EXISTS (
                    SELECT 1 
                    FROM course_likes cl 
                    WHERE cl.course_id = c.id AND cl.user_id = $1
                ) AS is_liked_by_user
            FROM courses c
            WHERE c.title ILIKE $2 OR c.description ILIKE $2
            ORDER BY c.created_at DESC;
        `;
        
        // $2-ի տեղում տեղադրում ենք որոնվող բառը՝ շրջապատված % նշաններով (որոնում ցանկացած տեղում)
        const result = await pool.query(query, [userId, `%${searchQuery}%`]);

        // PostgreSQL-ի COUNT-ը string է վերադարձնում, map-ով սարքում ենք ճիշտ տիպի (Integer)
        const formattedCourses = result.rows.map(course => ({
            ...course,
            enrolled_count: parseInt(course.enrolled_count, 10),
            total_likes: parseInt(course.total_likes, 10),
            comments_count: parseInt(course.comments_count, 10),
            lessons_count: parseInt(course.lessons_count, 10) // ՆՈՐԸ: Վերածում ենք թվի
        }));

        res.status(200).json(formattedCourses);
        
    } catch (error) {
        console.error('Fetch Courses Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const toggleLikeCourse = async (req, res) => {
    try {
        const courseId = req.params.id; // Վերցնում ենք դասընթացի ID-ն URL-ից
        const userId = req.user.id;     // Վերցնում ենք Յուզերի ID-ն JWT Token-ից (verifyToken middleware)

        // 1. Ստուգում ենք՝ այս ուսանողը արդեն հավանե՞լ է այս դասընթացը
        const checkQuery = 'SELECT * FROM course_likes WHERE user_id = $1 AND course_id = $2';
        const checkResult = await pool.query(checkQuery, [userId, courseId]);

        let isLiked = false;

        if (checkResult.rows.length > 0) {
            // 2. Տողը կա -> Ուրեմն հանում ենք Like-ը (Unlike)
            await pool.query('DELETE FROM course_likes WHERE user_id = $1 AND course_id = $2', [userId, courseId]);
            isLiked = false;
        } else {
            // 3. Տողը չկա -> Ավելացնում ենք նոր Like (Insert)
            await pool.query('INSERT INTO course_likes (user_id, course_id) VALUES ($1, $2)', [userId, courseId]);
            isLiked = true;
        }

        // 4. Հաշվում ենք այս դասընթացի ընդհանուր Like-ների նոր քանակը, որ ուղարկենք Ֆրոնտենդ
        const countQuery = 'SELECT COUNT(*) FROM course_likes WHERE course_id = $1';
        const countResult = await pool.query(countQuery, [courseId]);
        
        // COUNT()-ը PostgreSQL-ում վերադարձնում է String, ուստի այն դարձնում ենք Integer
        const totalLikes = parseInt(countResult.rows[0].count, 10); 

        // Ուղարկում ենք Ֆրոնտենդին թարմացված ինֆորմացիան
        res.status(200).json({ 
            message: isLiked ? 'Course liked' : 'Course unliked',
            isLiked: isLiked, 
            totalLikes: totalLikes 
        });

    } catch (error) {
        console.error('Toggle Like Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


// Ստանալ մեկ դասընթացի ամբողջական տվյալները (Միայն գրանցվածների կամ Ադմինի համար)
const getCourseById = async (req, res) => {
    try {
        const { id } = req.params; // Վերցնում ենք ID-ն URL-ից (օր. /api/courses/5)
        const userId = req.user.id;
        const userRole = req.user.role;

        // 1. Փնտրում ենք դասընթացը
        const courseQuery = 'SELECT * FROM courses WHERE id = $1';
        const courseResult = await pool.query(courseQuery, [id]);

        if (courseResult.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const course = courseResult.rows[0];

        // 2. ՔՈ ՆՇԱԾ ՏՐԱՄԱԲԱՆՈՒԹՅՈՒՆԸ (Authorization Check)
        // Եթե ուսանող է, ստուգում ենք նրա գրանցումը (Enrollment)
        if (userRole === 'student') {
            const enrollQuery = 'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2';
            const enrollResult = await pool.query(enrollQuery, [userId, id]);

            if (enrollResult.rows.length === 0) {
                // Եթե գրանցված չէ, վերադարձնում ենք 403 Forbidden
                return res.status(403).json({ 
                    message: 'Access Denied: You must enroll to view this course content.' 
                });
            }
        }

        // 3. Եթե հասանք այստեղ, ուրեմն կա՛մ Ադմին է, կա՛մ գրանցված Ուսանող
        res.status(200).json(course);

    } catch (error) {
        console.error('Get Single Course Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Խմբագրել դասընթացը (Միայն Ադմինների համար)
const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        // Backend Validation
        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required.' });
        }

        const query = `
            UPDATE courses 
            SET title = $1, description = $2 
            WHERE id = $3 
            RETURNING *;
        `;
        
        const result = await pool.query(query, [title, description, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        res.status(200).json({ 
            message: 'Course updated successfully', 
            course: result.rows[0] 
        });
    } catch (error) {
        console.error('Update Course Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Ջնջել դասընթացը (Միայն Ադմինների համար)
const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        // Քանի որ մենք SQL բազայում ունենք ON DELETE CASCADE, այս մեկ հրամանը
        // ավտոմատ կջնջի այս դասընթացի բոլոր Լայքերը, Մեկնաբանությունները և Ուսանողներին
        const query = 'DELETE FROM courses WHERE id = $1 RETURNING id;';
        
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Delete Course Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {createCourse,getCourses,toggleLikeCourse,getCourseById,updateCourse,deleteCourse};