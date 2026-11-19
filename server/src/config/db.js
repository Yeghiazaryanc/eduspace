const {Pool} = require('pg');

// Ստեղծում ենք Connection Pool-ը տրված պարամետրերով

const pool = new Pool({
    user:process.env.DB_USER,
    host:process.env.DB_HOST,
    database:process.env.DB_NAME,
    password:process.env.DB_PASSWORD,
    port:process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    max:20,// Առավելագույն կապերի քանակը
    idleTimeoutMillis:30000,// Անգործուն կապի փակման ժամանակը (30 վայրկյան)
    connectionTimeoutMillis:2000,// Կապ հաստատելու առավելագույն սպասման ժամանակը (2 վայրկյան)
});

// Ֆունկցիա՝ բազայի հետ կապը թեստավորելու համար

const testConnection = async () => {
    try {
        // Կատարում ենք պարզ SELECT NOW() հարցում
        const res = await pool.query('SELECT NOW()');
        console.log('🚀 Database connected successfully at:', res.rows[0].now);
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        process.exit(1); // Դադարեցնում ենք պրոցեսը, եթե բազան անհասանելի է
    }
};


module.exports = {
    pool,
    testConnection
};