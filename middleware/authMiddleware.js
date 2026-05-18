import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // 1. Check if the token exists in the Headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (it looks like "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify the token using your secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Find the user in the database and attach them to the request
      // We exclude the password for safety
      req.user = await User.findById(decoded.id).select('-password');

      return next(); // Explicit return ensures clean execution flow transition
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Guard specifically for Owners
export const ownerOnly = (req, res, next) => {
  // FIX: Changed 'owner' to 'Owner' to perfectly match your database Schema Enum values
  if (req.user && req.user.role === 'Owner') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Owners only.' });
  }
};