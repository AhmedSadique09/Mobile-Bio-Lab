import { Op } from 'sequelize';
// import bcrypt from 'bcryptjs';
import { errorHandler } from '../utils/error.js';
import User from '../models/User.js';


export const getUsers = async (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return next(errorHandler(403, 'You are not allowed to see all users'));
  }

  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.sort === 'asc' ? 'ASC' : 'DESC';

    // ✅ All users (paginated)
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
    if (req.user.role !== 'Admin') {
      return next(errorHandler(403, 'Only admin can access user details'));
    }
  
    try {
      const user = await User.findByPk(req.params.userId, {
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
  
  
