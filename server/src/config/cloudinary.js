const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 1. Միանում ենք Cloudinary-ին
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Կարգավորում ենք Storage-ը (որտեղ և ինչպես են պահվելու նկարները)
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'lms_avatars', // Պանակի անունը Cloudinary-ում
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // ՄԻԱՅՆ նկարներ
        transformation: [{ width: 500, height: 500, crop: 'limit' }] // Ավտոմատ փոքրացնում ենք մեծ նկարները
    },
});

// 3. Ստեղծում ենք Multer միջնորդ ծրագիրը (Middleware)
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // Խիստ լիմիտ: 2 Մեգաբայթից մեծ ֆայլերը կմերժվեն
    }
});

module.exports = { cloudinary, upload };