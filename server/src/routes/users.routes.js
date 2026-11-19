
const express = require('express');
const router = express.Router();
const { uploadAvatar,updateProfile } = require('../controllers/users.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Ներմուծում ենք Multer-ը մեր գրած կոնֆիգից
const { upload } = require('../config/cloudinary');

// Ռոութի շղթան. 1. Ստուգում է Token-ը -> 2. Վերբեռնում է նկարը ('avatar' դաշտով) -> 3. Կանչում է Controller-ը
router.post('/avatar', verifyToken, upload.single('avatar'), uploadAvatar);

router.put('/profile', verifyToken, updateProfile);

module.exports = router;