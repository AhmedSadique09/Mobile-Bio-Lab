import multer from 'multer';
import path from 'path';
import User from '../models/User.js';
import { errorHandler } from '../utils/error.js';
import nodemailer from 'nodemailer';


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage }).single('profilePicture'); // 👈 name must match form-data field

export const updateUserByAdmin = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return next(errorHandler(500, 'Image upload failed'));

    try {
      if (req.user.role !== 'Admin') {
        return next(errorHandler(403, 'Only admin can perform this action'));
      }

      const userId = req.params.userId;
      const { email, city } = req.body;
      const profilePicture = req.file ? req.file.filename : null;

      const updates = {};
      if (email) updates.email = email;
      if (city) updates.city = city;
      if (profilePicture) updates.profilePicture = profilePicture;

      const [updated] = await User.update(updates, { where: { id: userId } });

      if (updated === 0) {
        return next(errorHandler(404, 'User not found or no update performed'));
      }

      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  });
};

export const deleteUserByAdmin = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    // ✅ Only admin can delete any user
    if (req.user.role !== 'Admin') {
      return next(errorHandler(403, 'Only admin can delete users'));
    }

    const deleted = await User.destroy({ where: { id: userId } });

    if (deleted === 0) {
      return next(errorHandler(404, 'User not found'));
    }

    res.status(200).json('User has been deleted by admin');
  } catch (error) {
    next(error);
  }
};

export const verifyUserByAdmin = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    if (req.user.role !== 'Admin') {
      return next(errorHandler(403, 'Only admin can verify users'));
    }

    const user = await User.findByPk(userId);
    if (!user) return next(errorHandler(404, 'User not found'));

    if (user.isVerified) {
      return next(errorHandler(400, 'User is already verified'));
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json('Your account has been verified by admin');
  } catch (error) {
    next(error);
  }
};


export const sendActivationEmail = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    // 🔐 Only Admin can send activation email
    if (req.user.role !== 'Admin') {
      return next(errorHandler(403, 'Only admin can send activation emails'));
    }

    // 🔍 Find user by ID
    const user = await User.findByPk(userId);
    if (!user) return next(errorHandler(404, 'User not found'));

    const activationLink = `http://localhost:3000/api/users/activate/${user.vuId}`;
    const activationText = `Activate Now ${user.vuId}`;

    // 📧 Email setup using Gmail and App Password
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    // 📩 Email content with clickable link
    const mailOptions = {
      from: `"Mobile Bio Lab Admin" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: 'Account Activation - Mobile Bio Lab',
      html: `
        <h3>Your account has been approved ✅</h3>
        <p>Click below to activate your account:</p>
        <a href="${activationLink}" style="font-size:16px; font-weight:bold;">
          ${activationText}
        </a>
      `
    };

    // 📤 Send email
    await transporter.sendMail(mailOptions);
    res.status(200).json('Activation email sent to user');

  } catch (error) {
    next(error);
  }
};



