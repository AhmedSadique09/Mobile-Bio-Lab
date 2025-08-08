import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { errorHandler } from '../utils/error.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';

// ========== Multer Setup ==========
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage }).single('profile_picture');

// ========== Register ==========

export const register = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return next(errorHandler(500, 'Image upload failed'));

    try {
      const {
        first_name,
        last_name,
        vu_id,
        vu_email,
        mobile_number,
        role,
        city,
        password
      } = req.body;

      const profile_picture = req.file ? req.file.filename : null;

      if (
        !first_name || !last_name || !vu_id || !vu_email || !mobile_number ||
        !role || !city || !password
      ) {
        // 🧹 Delete image if it was uploaded
        if (profile_picture) {
          fs.unlinkSync(path.join('uploads', profile_picture));
        }
        return next(errorHandler(400, 'All fields are required'));
      }

      // ✅ Prevent multiple Admin accounts
      if (role === 'Admin') {
        const existingAdmin = await User.findOne({ where: { role: 'Admin' } });
        if (existingAdmin) {
          if (profile_picture) {
            fs.unlinkSync(path.join('uploads', profile_picture));
          }
          return next(errorHandler(400, 'An Admin already exists'));
        }
      }

      // ✅ Check if user with same email already exists
      const existingUser = await User.findOne({ where: { email: vu_email } });
      if (existingUser) {
        if (profile_picture) {
          fs.unlinkSync(path.join('uploads', profile_picture));
        }
        return next(errorHandler(400, 'User already exists'));
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const isAdmin = role === 'Admin';

      await User.create({
        firstName: first_name,
        lastName: last_name,
        vuId: vu_id,
        email: vu_email,
        mobile: mobile_number,
        role,
        city,
        profilePicture: profile_picture,
        password: hashedPassword,
        isVerified: isAdmin ? true : false
      });

      res.status(200).json('Register successful');

    } catch (error) {
      // 🔁 Cleanup in case of server error
      if (req.file && req.file.filename) {
        fs.unlinkSync(path.join('uploads', req.file.filename));
      }
      next(error);
    }
  });
};




// ========== LOGIN ==========
export const login = async (req, res, next) => {
  try {
    const { vu_email, password } = req.body;

    if (!vu_email || !password) {
      return next(errorHandler(400, 'All fields are required'));
    }

    // ✅ Find user by email
    const user = await User.findOne({ where: { email: vu_email } });
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return next(errorHandler(400, 'Invalid password'));
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const { password: pass, ...userData } = user.dataValues;

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    next(error);
  }
};



