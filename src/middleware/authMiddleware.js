const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware to protect routes that require authentication
const protect = async (req, res, next) => {
    let token;

    try {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            return next();
        }

        return res.status(401).json({ message: 'Not authorized, token missing' });

    } catch (error) {
        console.error('JWT Auth Error:', error.message);
        return res.status(401).json({ message: 'Not authorized, token invalid' });
    }
};

module.exports = { protect };
