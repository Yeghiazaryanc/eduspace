
const jwt = require('jsonwebtoken');

// Ստուգում ենք, արդյոք օգտատերը համակարգում է (Authentication)

const verifyToken = (req,res,next) => {
    const authHeader = req.headers.authorization;

    // Token-ը սովորաբար գալիս է "Bearer eyJhbG..." ֆորմատով
    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({message:'Unauthorized.No token provided.'});
    }

    const token = authHeader.split(' ')[1];

    try {
        // Եթե token-ը կեղծված է կամ ժամկետանց, verify-ն error կգցի
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        
        // Կցում ենք վերծանված տվյալները (id, role) req օբյեկտին
        req.user = decoded;
        next();// Անցնում ենք հաջորդ քայլին
    } catch (err) {
        return res.status(401).json({message:'Invalid or expired token.'});
    };
};

//  Ստուգում ենք, արդյոք օգտատերը Admin է (Authorization)
const requireAdmin = (req,res,next) => {
    // Այս middleware-ը միշտ պետք է աշխատի verifyToken-ից հետո
    if(req.user.role !== 'admin'){
        return res.status(403).json({message:'Forbidden. Admins only.'});
    }
    next();// Յուզերը Admin է, թույլ ենք տալիս շարունակել
};

// 2. Ստուգում է, արդյոք յուզերը ՈՒՍԱՆՈՂ է
const isStudent = (req, res, next) => {
    if(req.user.role !== 'student'){
        return res.status(403).json({message:'Forbidden. Students only.'});
    }
    next();
};
module.exports = { verifyToken, requireAdmin,isStudent };