const express = require('express');
const router = express.Router();


const {enrollInCourse,getMyCourses,unenrollFromCourse} = require('../controllers/enrollment.controller');
const {verifyToken,isStudent} = require('../middlewares/auth.middleware');


// Ստանալ ուսանողի գրանցված դասընթացները

router.get('/my-courses',verifyToken,isStudent,getMyCourses);

// Ուսանողը պետք է լինի համակարգում (verifyToken), որպեսզի գրանցվի

router.post('/:courseId',verifyToken,isStudent,enrollInCourse);

router.delete('/:courseId',verifyToken,isStudent,unenrollFromCourse);

module.exports = router;