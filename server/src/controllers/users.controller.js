const {pool} = require('../config/db');

const uploadAvatar = async (req, res) => {
    try {
        // req.file-ը ավտոմատ ստեղծվել է Multer-ի կողմից։ 
        // Այն արդեն պարունակում է ֆայլի ամբողջական ինֆորմացիան, քանի որ մինչև Controller հասնելը Multer-ը այն վերբեռնել է Cloudinary:
        if (!req.file) {
            return res.status(400).json({ message: 'No image provided or invalid file type.' });
        }

        const avatarUrl = req.file.path; // Սա Cloudinary-ի վերադարձրած վերջնական URL-ն է
        const userId = req.user.id; // Գալիս է verifyToken-ից

        // Թարմացնում ենք յուզերի նկարը բազայում և RETURNING-ով հետ ենք վերցնում նրա թարմացված տվյալները
        const query = `
            UPDATE users 
            SET avatar_url = $1 
            WHERE id = $2 
            RETURNING id, name, email, role, avatar_url;
        `;
        
        const result = await pool.query(query, [avatarUrl, userId]);

        res.status(200).json({ 
            message: 'Avatar updated successfully', 
            user: result.rows[0] 
        });

    } catch (error) {
        console.error('Upload Avatar Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/// Թարմացնել օգտատիրոջ անձնական տվյալները (ՄԻԱՅՆ ՏԵՔՍՏԱՅԻՆ՝ Անուն, Էլ.փոստ)
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id; 
        
        // ՈՒՇԱԴՐՈՒԹՅՈՒՆ: Մենք այլևս չենք ընդունում avatar_url այստեղից
        const { name, email } = req.body; 

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required.' });
        }

        // Ստուգում ենք՝ արդյոք նոր email-ը արդեն զբաղված չէ այլ յուզերի կողմից
        const existingEmail = await pool.query(
            'SELECT id FROM users WHERE email = $1 AND id != $2', 
            [email, userId]
        );
        
        if (existingEmail.rows.length > 0) {
            return res.status(409).json({ message: 'Email is already in use by another account.' });
        }

        // ՆՈՐ SQL ՀԱՐՑՈՒՄ: UPDATE ենք անում ՄԻԱՅՆ name և email դաշտերը
        const query = `
            UPDATE users 
            SET name = $1, email = $2
            WHERE id = $3
            RETURNING id, name, email, role, avatar_url, created_at;
        `;
        
        // Այլևս նկարը չենք փոխանցում
        const result = await pool.query(query, [name, email, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ 
            message: 'Profile text updated successfully.',
            user: result.rows[0] 
        });

    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { uploadAvatar,updateProfile };