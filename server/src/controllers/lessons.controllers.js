
const {pool} = require('../config/db');


// 1. Ստանալ Կուրսի պլեյլիստը (Միայն պարտադիր դաշտերը՝ առանց ծանր content-ի)
const getLessons = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Security Check
        if (userRole === 'student') {
            const enrollCheck = await pool.query(
                'SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2',
                [userId, courseId]
            );
            if (enrollCheck.rows.length === 0) {
                return res.status(403).json({ message: 'Access Denied: You are not enrolled in this course.' });
            }
        }

        // OPTIMIZATION: Քաշում ենք միայն պլեյլիստի համար անհրաժեշտ դաշտերը
        // Եթե content դաշտը HTML էջ է, մենք այն չենք բեռնում այստեղ՝ խնայելով Bandwidth-ը:
        const result = await pool.query(
            `SELECT id, course_id, title, video_url, order_index, created_at 
             FROM lessons 
             WHERE course_id = $1 
             ORDER BY order_index ASC, id ASC`,
            [courseId]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Get Lessons Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const createLesson = async (req, res) => {
    // ՏՐԱՆԶԱԿՑԻԱ: Վերցնում ենք հատուկ 1 client մեր Pool-ից,
    // որպեսզի մի քանի քայլերը կատարվեն նույն խողովակով
    const client = await pool.connect(); 

    try {
        const { courseId } = req.params;
        const { title, video_url, content, order_index } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Lesson title is required.' });
        }

        // 1. ՍԿՍՈՒՄ ԵՆՔ ՏՐԱՆԶԱԿՑԻԱՆ
        await client.query('BEGIN');

        // 2. Ստեղծում ենք դասը
        const lessonQuery = `
            INSERT INTO lessons (course_id, title, video_url, content, order_index)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const result = await client.query(lessonQuery, [courseId, title, video_url || null, content || null, order_index || 0]);
        const newLesson = result.rows[0];

        // 3. Վերցնում ենք դասընթացի անունը ծանուցման համար
        const courseInfo = await client.query('SELECT title FROM courses WHERE id = $1', [courseId]);
        const courseTitle = courseInfo.rows[0]?.title || 'Course';

        // 4. ԾԱՆՈՒՑՈՒՄՆԵՐԻ ԳԵՆԵՐԱՑՈՒՄ (FAN-OUT) - BULK INSERT
        const enrolledUsers = await client.query(
            'SELECT user_id FROM enrollments WHERE course_id = $1', 
            [courseId]
        );

        if (enrolledUsers.rows.length > 0) {
            const message = `A new lesson has been added to the "${courseTitle}" course.`;
            
            // Պատրաստում ենք մեկ ընդհանուր վեկտորային հարցում (unnest)
            // Փոխանակ 1000 հատ հարցում անելու, մենք Պոստգրեսին տալիս ենք 2 զանգված.
            // Մեկում բոլոր User ID-ներն են, մյուսում՝ ծանուցման տեքստը:
            const userIds = enrolledUsers.rows.map(row => row.user_id);
            
            const bulkInsertQuery = `
                INSERT INTO notifications (user_id, course_id, message)
                SELECT unnest($1::int[]), $2, $3;
            `;
            
            // Կատարում ենք 1 ՄԻԱՍՆԱԿԱՆ ՀԱՐՑՈՒՄ
            await client.query(bulkInsertQuery, [userIds, courseId, message]);
        }

        // 5. ԵԹԵ ԱՄԵՆ ԻՆՉ ԲԱՐԵՀԱՋՈՂ Է, ՀԱՍՏԱՏՈՒՄ ԵՆՔ ՓՈՓՈԽՈՒԹՅՈՒՆՆԵՐԸ ԲԱԶԱՅՈՒՄ
        await client.query('COMMIT');

        res.status(201).json({
            message: 'Lesson created successfully',
            lesson: newLesson
        });

    } catch (error) {
        // ԵԹԵ ԽԱՓԱՆՈՒՄ ԵՂԱՎ, ՀԵՏ ԵՆՔ ՇՐՋՈՒՄ ԱՄԵՆ ԻՆՉ (ROLLBACK)
        await client.query('ROLLBACK');
        console.error('Create Lesson Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        // ՎԵՐԱԴԱՐՁՆՈՒՄ ԵՆՔ ԿԱՊԸ ԱՎԱԶԱՆԻՆ (Pool), որպեսզի հիշողության արտահոսք չլինի
        client.release();
    }
};

// 2. Ջնջել դասը (Ապահովագրված Architecture)
const deleteLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const userRole = req.user.role;

        // DEFENSE IN DEPTH: Կրկնակի ստուգում հենց controller-ում
        if (userRole !== 'admin') {
             return res.status(403).json({ message: 'Forbidden: Only administrators can delete lessons.' });
        }

        // 'RETURNING id' ապահովում է նաև Ատոմային գործողություն (առանց նախապես ստուգելու գոյությունը)
        const result = await pool.query('DELETE FROM lessons WHERE id = $1 RETURNING id;', [lessonId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Lesson not found.' });
        }

        res.status(200).json({ message: 'Lesson deleted successfully.' });
    } catch (error) {
        console.error('Delete Lesson Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// 3. Խմբագրել դասը (Data Sanitization & Defense)
const updateLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { title, video_url, content, order_index } = req.body;
        const userRole = req.user.role;

        // DEFENSE IN DEPTH
        if (userRole !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Only administrators can update lessons.' });
        }

        if (!title || title.trim() === '') {
            return res.status(400).json({ message: 'Lesson title is required and cannot be empty.' });
        }

        // COALESCE/FALLBACK: Եթե order_index-ը չեն փոխանցել կամ undefined է, 
        // մենք փորձում ենք պահպանել հին արժեքը (որը լուծվում է COALESCE-ով SQL-ում) կամ զրոյացնում ենք:
        // Այստեղ պարզության համար ես թարմացնում եմ նաև կարգը:
        const query = `
            UPDATE lessons 
            SET 
                title = $1, 
                video_url = NULLIF($2, ''), -- Եթե դատարկ string է ուղարկել, սարքում ենք NULL
                content = NULLIF($3, ''), 
                order_index = COALESCE($4, order_index) -- Եթե $4-ը NULL է, պահում է հին order_index-ը
            WHERE id = $5
            RETURNING *;
        `;
        
        // trim() ենք անում տվյալները մաքրելու համար (Data Sanitization)
        const result = await pool.query(query, [
            title.trim(), 
            video_url?.trim() || null, 
            content?.trim() || null, 
            order_index, 
            lessonId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Lesson not found.' });
        }

        res.status(200).json({ 
            message: 'Lesson updated successfully.',
            lesson: result.rows[0]
        });
    } catch (error) {
        console.error('Update Lesson Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports = { getLessons, createLesson,deleteLesson,updateLesson };