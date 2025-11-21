import User from '../models/User.js';
import { Op } from 'sequelize';

export const getUsers = async (queryParams) => {
  const page = parseInt(queryParams.page) || 1;
  const limit = 10; // Fixed 10 users per page
  const offset = (page - 1) * limit;
  const search = queryParams.search || '';

  // Build search conditions
  const searchConditions = search
    ? {
      [Op.or]: [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } }
      ]
    }
    : {};

  // Build where clause - exclude deleted users and admin users
  const where = {
    deletedAt: null,
    role: { [Op.ne]: 'Admin' }, // Exclude Admin role users
    ...searchConditions
  };

  // Get users with pagination
  const { count, rows } = await User.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    attributes: {
      exclude: ['password', 'otp', 'otpExpireAt']
    }
  });

  const totalPages = Math.ceil(count / limit);

  return {
    users: rows,
    pagination: {
      currentPage: page,
      totalPages,
      totalUsers: count,
      limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

export const updateUser = async (userId, updateData) => {
  // Check if user exists and is not deleted
  const user = await User.findOne({
    where: {
      id: userId,
      deletedAt: null,
      role: { [Op.ne]: 'Admin' } // Prevent editing admin users
    }
  });

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  // Check if email is being updated and if it's already taken
  if (updateData.email && updateData.email !== user.email) {
    const existingUser = await User.findOne({
      where: {
        email: updateData.email,
        id: { [Op.ne]: userId },
        deletedAt: null
      }
    });

    if (existingUser) {
      const error = new Error('Email already exists');
      error.status = 400;
      throw error;
    }
  }

  // Update allowed fields - only firstName, lastName, email, mobile, city, and profilePicture
  const allowedFields = ['firstName', 'lastName', 'email', 'mobile', 'city', 'profilePicture'];
  const fieldsToUpdate = {};

  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      fieldsToUpdate[field] = updateData[field];
    }
  });

  await user.update(fieldsToUpdate);

  // Return updated user without sensitive data
  const updatedUser = await User.findByPk(userId, {
    attributes: {
      exclude: ['password', 'otp', 'otpExpireAt']
    }
  });

  return updatedUser;
};

export const deleteUser = async (userId) => {
  // Check if user exists and is not deleted
  const user = await User.findOne({
    where: {
      id: userId,
      role: { [Op.ne]: 'Admin' } // Prevent deleting admin users
    }
  });

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  // Store profile picture path before deletion (if exists)
  const profilePicturePath = user.profilePicture;

  // Permanently delete user from database
  await user.destroy();

  // Return profile picture path so controller can delete the file
  return {
    message: 'User deleted successfully',
    profilePicturePath: profilePicturePath
  };
};

