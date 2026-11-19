const express = require('express');

// mergeParams: true-ն խիստ կարևոր է Nested Routing-ի համար
const router = express.Router({ mergeParams: true });

const { getCourseComments, addComment, deleteComment } = require('../controllers/comments.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

// GET /api/courses/:courseId/comments
router.get('/', verifyToken, getCourseComments);

// POST /api/courses/:courseId/comments
router.post('/', verifyToken, addComment);

// DELETE /api/courses/:courseId/comments/:commentId
router.delete('/:commentId', verifyToken, requireAdmin, deleteComment);

module.exports = router;