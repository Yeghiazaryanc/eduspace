
const express = require('express');
const router = express.Router();

const {loginController,registerController,updateThemeController} = require('../controllers/auth.controller');
const {authLimiter} = require('../middlewares/rateLimiter');

const {verifyToken} = require('../middlewares/auth.middleware');

router.post('/login',authLimiter,loginController);
router.post('/register',authLimiter,registerController);

router.put('/theme',verifyToken,updateThemeController);


module.exports = router;