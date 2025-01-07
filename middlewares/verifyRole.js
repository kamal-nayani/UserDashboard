const verifyRole = (requiredRole) => (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
        return res.status(403).json({ message: 'Insufficient permissions!' });
    }
    next();
};

module.exports = verifyRole;
