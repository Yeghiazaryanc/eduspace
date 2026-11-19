const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');



// POST /api/login
// Մշակում է օգտատիրոջ մուտքի հարցումը

const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        //  Ստուգում ենք դաշտերի առկայությունը
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required.'
            });
        }

        const normalizedEmail = email.toLowerCase();

        // Գտնում ենք օգտատիրոջը բազայում ըստ էլ. հասցեի

        const findUserQuery = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(findUserQuery, [normalizedEmail]);

        if (result.rows.length === 0) {
            // Անվտանգություն: Երբեք մի հուշիր հարձակվողին, թե որն է սխալ՝ email-ը, թե password-ը:
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = result.rows[0];

        // Համեմատում ենք գաղտնաբառը Hashed տարբերակի հետ
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Գաղտնաբառը ճիշտ է, գեներացնում ենք Token
        // Իրական նախագծերում գաղտնի բանալին գալիս է process.env.JWT_SECRET-ից
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '1h' }
        );

        // Ջնջում ենք password_hash դաշտը օբյեկտից նախքան ուղարկելը
        delete user.password_hash;

        // 3. Ուղարկում ենք հաջողված պատասխանը
        res.status(200).json({
            message: 'Login successful.',
            user: user,
            token: token
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            message: 'Internal server error. Please try again later.'
        });
    }
};

// POST /api/register
// Մշակում է նոր օգտատիրոջ գրանցումը

const registerController = async (req, res) => {
    try {
        console.log("➡️ 1. Հարցումը հասավ Կոնտրոլեր:", req.body);
        const { name, email, password } = req.body;

        // Ստուգում ենք դաշտերի առկայությունը
        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'All fields are required.'
            });
        }

        // Գաղտնաբառի բարդության ստուգում
        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long.'
            });
        }

        const normalizedEmail = email.toLowerCase();

        console.log("➡️ 2. Սկսում ենք DB որոնումը...");

        // Ստուգում ենք, արդյոք նման էլ. հասցեով օգտատեր արդեն գոյություն ունի
        // (Parameterized Query ապահովելու համար SQL Injection-ից)

        const checkUserQuery = 'SELECT id FROM users WHERE email = $1';
        const checkUserResult = await pool.query(checkUserQuery, [normalizedEmail]);

        if (checkUserResult.rows.length > 0) {
            // 409 Conflict կարգավիճակը իդեալական է այս դեպքում
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        // Password Hashing (Անվտանգություն)
        const saltRound = 10;
        const hashedPassword = await bcrypt.hash(password, saltRound);

        // Գրանցում ենք նոր օգտատիրոջը
        // RETURNING id, name, email, role -ը թույլ է տալիս միանգամից ստանալ նոր ստեղծված տողը

        const insertUserQuery = `
                INSERT INTO users (name,email,password_hash)
                VALUES ($1,$2,$3)
                RETURNING id,name,email,role;
            `;

        // Մենք փոխանցում ենք 3 պարամետր, որոնք համապատասխանում են $1, $2, $3 -ին

        const newUserResult = await pool.query(insertUserQuery, [
            name,
            normalizedEmail,
            hashedPassword
        ]);


        const newUser = newUserResult.rows[0];

        // Ավտոմատ Login գրանցումից հետո

        const token = jwt.sign(
            { id: newUser.id, role: newUser.role },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '1h' }
        );

        // Հաջողված պատասխան (password_hash-ը ԵՐԲԵՔ չենք վերադարձնում)
        res.status(201).json({
            message: 'Registration successful.',
            user: newUser,
            token: token
        });
    } catch (error) {
        console.error('Registration Error: ', error);
        res.status(500).json({
            message: 'Internal server error during registration.'
        });
    }
};

// controllers/auth.controller.js-ի մեջ ավելացրու սա

const updateThemeController = async (req, res) => {
    try {
        const { theme } = req.body;
        // req.user-ը ստեղծվում է քո verifyToken middleware-ի կողմից
        const userId = req.user.id; 

        if (!['light', 'dark'].includes(theme)) {
            return res.status(400).json({ message: 'Invalid theme value. Must be light or dark.' });
        }

        const updateQuery = 'UPDATE users SET theme = $1 WHERE id = $2 RETURNING id, theme';
        // pool-ը այն է, ինչով դու կպնում ես բազային (օրինակ՝ require('../config/db'))
        const result = await pool.query(updateQuery, [theme, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({
            message: 'Theme updated successfully.',
            theme: result.rows[0].theme
        });
    } catch (error) {
        console.error('Update Theme Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// Մի մոռացիր արտահանել այն մյուսների հետ միասին.
module.exports = {
    loginController,
    registerController,
    updateThemeController // <--- ՆՈՐԸ
};


module.exports = {
    loginController,
    registerController,
    updateThemeController

};