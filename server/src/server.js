// Կարդում ենք .env ֆայլը միայն server.js-ում (մեկ անգամ)

require('dotenv').config();

const app = require('./app');
const {pool,testConnection} = require('./config/db');

const PORT = process.env.PORT || 3001;

// Ֆունկցիա, որը միացնում է սերվերը

const startServer = async () => {
    try {
        // Ստուգում ենք կապը բազայի հետ նախքան սերվերը գործարկելը
        const res = await pool.query('SELECT NOW()');
        console.log('🚀 Database connected successfully at:', res.rows[0].now);

        // Միայն եթե բազան աշխատում է, բացում ենք HTTP պորտը
        app.listen(PORT,() => {
            console.log(`✅ Server is running on port ${PORT}`);
        });
    } catch (error){
        console.error('❌ Failed to start server due to Database error:', error.message);
        // Անմիջապես դադարեցնում ենք Node.js պրոցեսը (Fail-Fast)
        process.exit(1);
    }
};


// Գործարկում
startServer();