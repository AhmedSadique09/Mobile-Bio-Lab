import { verifyToken } from '../helpers/auth.helper.js';
import User from '../models/User.js';

export const jwtGuard = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ statusCode: 401, message: 'Authorization header is missing' });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ statusCode: 401, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ statusCode: 401, message: 'Invalid token' });
  }
};
