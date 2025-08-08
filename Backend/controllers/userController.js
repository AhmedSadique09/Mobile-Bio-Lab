import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { errorHandler } from '../utils/error.js';
import User from '../models/User.js';
import { generateUserProfilePDF } from '../utils/pdfGenerator.js';
import fs from 'fs';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage }).single('profilePicture');

export const updateProfileByUser = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return next(errorHandler(500, 'Image upload failed'));

    try {
      const userId = req.user.id;

      const { firstName, lastName, mobile, email, city, oldPassword, newPassword } = req.body;

      const profilePicture = req.file ? req.file.filename : null;

      const user = await User.findByPk(userId);
      if (!user) return next(errorHandler(404, 'User not found'));

      if (newPassword) {
        if (!oldPassword) {
          return next(errorHandler(400, 'Old password is required'));
        }

        const isMatch = bcrypt.compareSync(oldPassword, user.password);
        if (!isMatch) {
          return next(errorHandler(400, 'Old password is incorrect'));
        }

        if (newPassword.length < 6) {
          return next(errorHandler(400, 'New password must be at least 6 characters'));
        }

        user.password = bcrypt.hashSync(newPassword, 10);
      }

      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.mobile = mobile || user.mobile;
      user.email = email || user.email;
      user.city = city || user.city;
      if (profilePicture) user.profilePicture = profilePicture;

      await user.save();

      const { password, ...updatedUser } = user.toJSON();
      res.status(200).json(updatedUser);

    } catch (error) {
      next(error);
    }
  });
};

export const deleteOwnAccount = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    if (req.user.id !== parseInt(userId)) {
      return next(errorHandler(403, 'You are not allowed to delete this account'));
    }

    const deleted = await User.destroy({ where: { id: userId } });

    if (deleted === 0) {
      return next(errorHandler(404, 'User not found'));
    }

    res.status(200).json('Your account has been deleted');
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return next(errorHandler(403, 'You are not allowed to see all users'));
  }

  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.sort === 'asc' ? 'ASC' : 'DESC';

    const users = await User.findAll({
      offset: startIndex,
      limit: limit,
      order: [['createdAt', sortDirection]],
      attributes: { exclude: ['password'] }
    });

    // ✅ Total user count
    const totalUsers = await User.count();

    // ✅ Last month count
    const now = new Date();
    const oneMonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );

    const lastMonthUsers = await User.count({
      where: {
        createdAt: {
          [Op.gte]: oneMonthAgo
        }
      }
    });

    res.status(200).json({
      users,
      totalUsers,
      lastMonthUsers
    });

  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const userId = req.params.userId
      ? parseInt(req.params.userId)
      : req.user.id;

    if (req.user.role !== 'Admin' && req.user.id !== userId) {
      return next(errorHandler(403, 'You are not allowed to access this user details'));
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const activateUser = async (req, res, next) => {
  try {
    const vuId = req.params.vuId;

    const user = await User.findOne({ where: { vuId } });
    if (!user) return next(errorHandler(404, 'User not found'));

    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    return res.status(200).json('Account successfully activated. You can now log in.');
  } catch (error) {
    next(error);
  }
};

export const exportOwnProfileToPDF = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!userId) return next(errorHandler(401, 'Unauthorized - Invalid user data'));

    const user = await User.findByPk(userId);
    if (!user) return next(errorHandler(404, 'User not found'));

    const filePath = path.join('uploads', `profile-${userId}-${Date.now()}.pdf`);
    generateUserProfilePDF(user, filePath);

    let responded = false;

    const waitForFile = setInterval(() => {
      if (fs.existsSync(filePath)) {
        clearInterval(waitForFile);
        responded = true;

        res.download(filePath, () => {
          fs.unlinkSync(filePath);
        });
      }
    }, 500);

    setTimeout(() => {
      clearInterval(waitForFile);
      if (!fs.existsSync(filePath) && !responded) {
        responded = true;
        return next(errorHandler(500, 'PDF generation failed'));
      }
    }, 10000);

  } catch (error) {
    next(error);
  }
};




