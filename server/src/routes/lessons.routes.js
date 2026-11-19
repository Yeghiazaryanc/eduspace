const express = require('express');

// ՃԱՐՏԱՐԱՊԵՏԱԿԱՆ ՆՇՈՒՄ: mergeParams: true-ն պարտադիր է:
// Առանց սրա, այս ֆայլը չի տեսնի :courseId պարամետրը, որը գալիս է course.routes.js-ից:
const router = express.Router({ mergeParams: true });

// Ներմուծում ենք քո արդեն գրված կոնտրոլերները
const { getLessons, createLesson, deleteLesson, updateLesson } = require('../controllers/lessons.controllers');

// Ներմուծում ենք Անվտանգության միջնորդ ծրագրերը
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');


// ---------------------------------------------------------
// Բոլոր ռոութերը այստեղ ավտոմատ սկսվում են /api/courses/:courseId/lessons -ով
// ---------------------------------------------------------

// Ստանալ տվյալ դասընթացի բոլոր դասերը (պահանջում է մուտք)
// Իրական URL: GET /api/courses/:courseId/lessons
router.get('/', verifyToken, getLessons);

// Ավելացնել նոր դաս տվյալ դասընթացում (Միայն Ադմինը)
// Իրական URL: POST /api/courses/:courseId/lessons
router.post('/', verifyToken, requireAdmin, createLesson);

// Խմբագրել կոնկրետ դասը (Միայն Ադմինը)
// Իրական URL: PUT /api/courses/:courseId/lessons/:lessonId
router.put('/:lessonId', verifyToken, requireAdmin, updateLesson);

// Ջնջել կոնկրետ դասը (Միայն Ադմինը)
// Իրական URL: DELETE /api/courses/:courseId/lessons/:lessonId
router.delete('/:lessonId', verifyToken, requireAdmin, deleteLesson);

module.exports = router;