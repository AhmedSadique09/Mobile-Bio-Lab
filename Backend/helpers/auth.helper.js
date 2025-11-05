import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT || 10);

export const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error('Invalid token');
  }
};

export const hashPassword = (password) => {
  const salt = bcrypt.genSaltSync(SALT_ROUNDS);
  return bcrypt.hashSync(password, salt);
};

export const comparePassword = (plain, hash) => {
  return bcrypt.compareSync(plain, hash);
};

export const generateOTP = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

export const generateExpiryTime = (minutes = Number(process.env.REGISTER_OTP_EXPIRATION || 10)) => {
  const now = Date.now();
  return now + minutes * 60 * 1000;
};
