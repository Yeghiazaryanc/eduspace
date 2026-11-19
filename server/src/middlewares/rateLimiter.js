
const rateLimit = require('express-rate-limit');


// Ստեղծում ենք հատուկ սահմանափակում Auth Route-երի համար
const authLimiter = rateLimit({
    windowMs:15 * 60 * 1000,// 15 րոպե
    max:5,// Առավելագույնը 5 հարցում այս 15 րոպեի ընթացքում
    message:{
        message:''
    },
    standardHeaders:true,// Վերադարձնում է RateLimit-* header-ները
    legacyHeaders:false,// Անջատում է հին X-RateLimit-* header-ները
});

module.exports = {authLimiter};