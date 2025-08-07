import multer from 'multer';
import path from 'path';
import User from '../models/User.js';
import { errorHandler } from '../utils/error.js';

// ✅ Multer setup for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage }).single('profilePicture'); // 👈 name must match form-data field

// ✅ Admin update logic
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
