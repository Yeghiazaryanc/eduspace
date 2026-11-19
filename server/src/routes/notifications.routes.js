const express = require('express');
const router = express.Router();
const {getNotifications,markAsRead,clearNotifications} = require('../controllers/notifications.controller');
const {verifyToken} = require('../middlewares/auth.middleware');


router.get('/',verifyToken,getNotifications);
router.put('/read',verifyToken,markAsRead);
router.delete('/', verifyToken, clearNotifications);

module.exports = router;