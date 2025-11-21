import User from '../models/User.js';
import Sample from '../models/Sample.js';
import Report from '../models/Report.js';
import ScanEvent from '../models/ScanEvent.js';
import Notification from '../models/Notification.js';
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

export const updateUser = async (userId, updateData, currentUserId) => {
  // Check if user exists and is not deleted
  const user = await User.findOne({
    where: {
      id: userId,
      deletedAt: null
    }
  });

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  // If user is admin, only allow them to update their own profile
  // Prevent editing other admin users
  if (user.role === 'Admin' && parseInt(userId) !== parseInt(currentUserId)) {
    const error = new Error('Cannot edit other admin users');
    error.status = 403;
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

/**
 * Get dashboard statistics for admin
 * Returns: active users, total samples, total reports, and system activity
 */
export const getDashboardStats = async () => {
  try {
    // Get active users count (excluding admins and deleted users)
    const activeUsersCount = await User.count({
      where: {
        deletedAt: null,
        role: { [Op.ne]: 'Admin' },
        isActivated: true
      }
    });

    // Get total users count (excluding admins and deleted users)
    const totalUsersCount = await User.count({
      where: {
        deletedAt: null,
        role: { [Op.ne]: 'Admin' }
      }
    });

    // Get total samples count (excluding deleted)
    const totalSamplesCount = await Sample.count({
      where: {
        deletedAt: null
      }
    });

    // Get total reports count (excluding deleted)
    let totalReportsCount = 0;
    try {
      totalReportsCount = await Report.count({
        where: {
          deletedAt: null
        }
      });
    } catch (error) {
      // If Reports table doesn't exist, count will be 0
      console.warn('Reports table might not exist:', error.message);
    }

    // Get system activity (recent samples in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivityCount = await Sample.count({
      where: {
        deletedAt: null,
        createdAt: {
          [Op.gte]: sevenDaysAgo
        }
      }
    });

    return {
      activeUsers: activeUsersCount,
      totalUsers: totalUsersCount,
      totalSamples: totalSamplesCount,
      totalReports: totalReportsCount,
      systemActivity: recentActivityCount
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
};

/**
 * Get system logs and activity history
 * Combines data from Samples, Reports, ScanEvents, and Notifications
 */
export const getSystemLogs = async (page = 1, limit = 50, filters = {}) => {
  try {
    const offset = (page - 1) * limit;
    const { startDate, endDate, actionType } = filters;

    const logs = [];

    // Get sample activities
    const sampleWhere = { deletedAt: null };
    if (startDate) {
      sampleWhere.createdAt = { ...sampleWhere.createdAt, [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      sampleWhere.createdAt = { ...sampleWhere.createdAt, [Op.lte]: new Date(endDate) };
    }

    const samples = await Sample.findAll({
      where: sampleWhere,
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: 100 // Get more samples to process
    });

    samples.forEach(sample => {
      logs.push({
        id: `sample-${sample.id}`,
        type: 'sample',
        action: 'Sample Created',
        details: `Sample ${sample.sampleId} (${sample.sampleType}) was created`,
        userId: sample.userId,
        user: sample.User,
        timestamp: sample.createdAt,
        metadata: {
          sampleId: sample.id,
          sampleIdString: sample.sampleId,
          status: sample.status
        }
      });

      // Add status change if updated
      if (sample.updatedAt && sample.updatedAt.getTime() !== sample.createdAt.getTime()) {
        logs.push({
          id: `sample-update-${sample.id}`,
          type: 'sample',
          action: 'Sample Updated',
          details: `Sample ${sample.sampleId} status: ${sample.status}`,
          userId: sample.userId,
          user: sample.User,
          timestamp: sample.updatedAt,
          metadata: {
            sampleId: sample.id,
            sampleIdString: sample.sampleId,
            status: sample.status
          }
        });
      }
    });

    // Get report activities
    try {
      const reportWhere = { deletedAt: null };
      if (startDate) {
        reportWhere.createdAt = { ...reportWhere.createdAt, [Op.gte]: new Date(startDate) };
      }
      if (endDate) {
        reportWhere.createdAt = { ...reportWhere.createdAt, [Op.lte]: new Date(endDate) };
      }

      const reports = await Report.findAll({
        where: reportWhere,
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'GeneratedBy',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 100
      });

      reports.forEach(report => {
        logs.push({
          id: `report-${report.id}`,
          type: 'report',
          action: `Report ${report.status === 'completed' ? 'Generated' : report.status}`,
          details: `Report "${report.title}" - ${report.status}`,
          userId: report.userId,
          user: report.User,
          timestamp: report.createdAt,
          metadata: {
            reportId: report.id,
            generatedBy: report.GeneratedBy,
            status: report.status
          }
        });
      });
    } catch (error) {
      console.warn('Error fetching reports for logs:', error.message);
    }

    // Get scan events
    const scanWhere = { deletedAt: null };
    if (startDate) {
      scanWhere.createdAt = { ...scanWhere.createdAt, [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      scanWhere.createdAt = { ...scanWhere.createdAt, [Op.lte]: new Date(endDate) };
    }

    const scanEvents = await ScanEvent.findAll({
      where: scanWhere,
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    scanEvents.forEach(event => {
      logs.push({
        id: `scan-${event.id}`,
        type: 'scan',
        action: 'QR Code Scanned',
        details: `Sample ${event.scannedSampleId} - ${event.scanResult === 'found' ? 'Found' : 'Not Found'}`,
        userId: event.userId,
        user: event.User,
        timestamp: event.createdAt,
        metadata: {
          scanEventId: event.id,
          scannedSampleId: event.scannedSampleId,
          scanResult: event.scanResult,
          deviceType: event.deviceType
        }
      });
    });

    // Filter by action type if provided
    let filteredLogs = logs;
    if (actionType && actionType !== 'all') {
      filteredLogs = logs.filter(log => log.type === actionType);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Paginate
    const total = filteredLogs.length;
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    return {
      logs: paginatedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error getting system logs:', error);
    throw error;
  }
};
