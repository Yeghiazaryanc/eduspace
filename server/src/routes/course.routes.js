const express = require('express');
const router = express.Router();

const { createCourse, getCourses, toggleLikeCourse, getCourseById, updateCourse, deleteCourse } = require('../controllers/course.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

// Ներմուծում ենք առանձնացված Միկրո-Մոդուլները
const commentRoutes = require('./comments.routes');
// Նույն տրամաբանությամբ պետք է ունենաս նաև lessons.routes.js ֆայլը
const lessonRoutes = require('./lessons.routes'); 

// --- NESTED ROUTERS (Ենթա-երթուղիներ) ---
// Երբ URL-ը հասնում է /:courseId/comments, կառավարումը հանձնվում է commentRoutes-ին
router.use('/:courseId/comments', commentRoutes);
router.use('/:courseId/lessons', lessonRoutes); 

// --- COURSE CORE ROUTES ---
router.post('/', verifyToken, requireAdmin, createCourse);

router.get('/', verifyToken, getCourses);

router.get('/:id', verifyToken, getCourseById);

router.post('/:id/like', verifyToken, toggleLikeCourse);

router.put('/:id', verifyToken, requireAdmin, updateCourse);

router.delete('/:id', verifyToken, requireAdmin, deleteCourse);

module.exports = router;