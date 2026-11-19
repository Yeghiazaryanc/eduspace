// src/controllers/enrollment.controller.js
const { pool } = require('../config/db');

const enrollInCourse = async (req, res) => {
  try {
    // user_id-ն գալիս է մեր auth.middleware-ից (token-ից)
    const userId = req.user.id; 
    // course_id-ն ստանում ենք URL-ից (օր. /api/enrollments/5)
    const courseId = req.params.courseId; 

    // 1. Ստուգում ենք՝ արդյոք դասընթացը գոյություն ունի
    const courseCheck = await pool.query('SELECT id FROM courses WHERE id = $1', [courseId]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // 2. Գրանցում ենք (INSERT)
    const insertQuery = `
      INSERT INTO enrollments (user_id, course_id)
      VALUES ($1, $2)
      RETURNING *;
    `;

    const result = await pool.query(insertQuery, [userId, courseId]);

    res.status(201).json({
      message: 'Successfully enrolled in the course.',
      enrollment: result.rows[0]
    });

  } catch (error) {
    // Եթե խախտվել է մեր սահմանած PRIMARY KEY կանոնը (UNIQUE_VIOLATION error code-ը Պոստգրեսում 23505 է)
    if (error.code === '23505') {
      return res.status(409).json({ message: 'You are already enrolled in this course.' });
    }
    console.error('Enrollment Error:', error);
    res.status(500).json({ message: 'Internal server error during enrollment.' });
  }
};

const getMyCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    // SQL JOIN հարցում
    // Մենք միացնում ենք courses աղյուսակը enrollments-ին ըստ course_id-ի,
    // և ֆիլտրում ենք ՄԻԱՅՆ տվյալ user_id-ի համար
    const query = `
      SELECT c.id, c.title, c.description, c.created_at, e.enrolled_at
      FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.user_id = $1
      ORDER BY e.enrolled_at DESC;
    `;

    const result = await pool.query(query, [userId]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get My Courses Error:', error);
    res.status(500).json({ message: 'Internal server error while fetching enrolled courses.' });
  }
};


const unenrollFromCourse = async (req, res) => {
    try {
        const userId = req.user.id; 
        const courseId = req.params.courseId; 

        // ARCHITECTURE FIX: Atomicity & Anti-Race Condition
        // Փոխանակ սկզբում SELECT անենք, հետո DELETE, մենք անում ենք դա ՄԵԿ քայլով:
        // 'RETURNING id'-ն ստիպում է բազային վերադարձնել ջնջված տողի ID-ն:
        // Եթե այն ոչինչ չջնջի (օրինակ՝ մարդը գրանցված չէր), կվերադարձնի դատարկ զանգված:
        const deleteQuery = `
            DELETE FROM enrollments 
            WHERE user_id = $1 AND course_id = $2 
            RETURNING id;
        `;
        
        const result = await pool.query(deleteQuery, [userId, courseId]);

        // Ստուգում ենք՝ արդյոք իրականում որևէ տող ջնջվեց բազայից
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'You are not enrolled in this course.' });
        }

        // Եթե հասանք այստեղ, ուրեմն հաջողությամբ ջնջվել է
        res.status(200).json({ message: 'Successfully unenrolled from the course.' });

    } catch (error) {
        console.error('Unenroll Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

module.exports = { enrollInCourse,getMyCourses,unenrollFromCourse };