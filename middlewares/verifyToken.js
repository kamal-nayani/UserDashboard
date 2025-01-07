const jwt = require('jsonwebtoken');
const redisClient = require('../config/redisClient'); // Redis client instance

const verifyToken = async (req, res, next) => {


    console.log('verifytoken......', verifyToken);



    const authHeader = req.headers['authorization'];


    console.log('authheader****', authHeader);

    if (!authHeader) {
        return res.status(401).json({ message: 'Access token is missing!' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    console.log('token.......', token);

    try {
        // Verify JWT signature
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if token is revoked
        const isRevoked = await redisClient.get(`blacklist:${token}`);
        if (isRevoked) {
            return res.status(403).json({ message: 'Token is revoked!' });
        }

        // Attach user info to request
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token!' });
    }
};

module.exports = verifyToken;
