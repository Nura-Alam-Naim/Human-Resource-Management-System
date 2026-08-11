import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    // We are expecting the token to be sent in an HttpOnly cookie named "token"
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Contains id, email, role, etc.
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};

export const verifyManagerOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'manager' || req.user.role === 'admin')) {
        next();
    } else {
        return res.status(403).json({ message: "Access Denied. Manager or Admin privileges required." });
    }
};

export const verifyAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: "Access Denied. Admin privileges required." });
    }
};
