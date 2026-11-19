const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const enrollmentRoutes = require('./routes/enrollment.routes');
const userRoutes = require('./routes/users.routes');
const notificationRoutes = require('./routes/notifications.routes'); 

const app = express();

// 1. GLOBAL MIDDLEWARES (Նախապատրաստում)
app.use(cors());
app.use(express.json());

// 2. API ROUTES (Բոլոր ռոութերը ԽԻՍՏ վերևում)
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// 3. HEALTH CHECK
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'API is running linearly and safely.' });
});

// 4. CATCH-ALL 404 (Եթե յուզերը կամ ֆրոնտենդը գրի գոյություն չունեցող URL)
app.use((req, res, next) => {
    res.status(404).json({ message: 'API endpoint not found.' });
});

// 5. GLOBAL ERROR HANDLER (ՄԻՇՏ ԱՄԵՆԱՎԵՐՋՈՒՄ)
// Այս ֆունկցիան բռնում է ցանկացած throw Error քո կոնտրոլերներից՝ կանխելով սերվերի քրաշը
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({ message: 'Something broke unexpectedly!' });
});

module.exports = app;