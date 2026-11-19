const { pool } = require('../config/db');

// Ստանալ յուզերի վերջին 20 ծանուցումները
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Երբ յուզերը բացում է զանգակը, բոլոր նամակները դառնում են "Կարդացված" (is_read = true)
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
            [userId]
        );
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark Read Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Մաքրել յուզերի բոլոր ծանուցումները
const clearNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        await pool.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
        res.status(200).json({ message: 'All notifications cleared' });
    } catch (error) {
        console.error('Clear Notifications Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { getNotifications, markAsRead,clearNotifications };