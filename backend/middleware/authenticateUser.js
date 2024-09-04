// middleware/authenticate.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    // console.log(token);
    if (!token) return res.status(401).json({ message: 'Access denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Assuming user info is included in token
        // console.log(decoded);
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authenticate;
