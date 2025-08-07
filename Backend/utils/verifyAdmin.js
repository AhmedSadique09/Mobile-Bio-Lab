import jwt from 'jsonwebtoken';
import { errorHandler } from './error.js';

export const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(errorHandler(401, 'Unauthorized - No token provided'));
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(errorHandler(401, 'Unauthorized - Invalid token'));

    if (user.role !== 'Admin') {
      return next(errorHandler(403, 'Access denied - Admins only'));
    }

    req.user = user;
    next();
  });
};
