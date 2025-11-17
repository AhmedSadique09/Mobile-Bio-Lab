import ScanEvent from '../models/ScanEvent.js';
import User from '../models/User.js';

export const logScanEvent = async (userId, scanData) => {
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

  // Create scan event
  const scanEvent = await ScanEvent.create({
    scannedSampleId: scanData.scannedSampleId,
    userId: userId,
    deviceType: scanData.deviceType || 'mobile',
    scanResult: scanData.scanResult,
    metadata: scanData.metadata || null
  });

  // Return scan event with user details
  const scanEventWithUser = await ScanEvent.findByPk(scanEvent.id, {
    include: [{
      model: User,
      as: 'User',
      attributes: ['id', 'firstName', 'lastName', 'email', 'mobile', 'city', 'role', 'profilePicture']
    }]
  });

  return scanEventWithUser;
};

export const getScanEvents = async (userId = null, page = 1, limit = 10) => {
  const whereClause = {
    deletedAt: null
  };

  // If userId is provided, filter by user
  if (userId) {
    whereClause.userId = userId;
  }

  // Calculate offset
  const offset = (page - 1) * limit;

  // Get total count
  const total = await ScanEvent.count({
    where: whereClause
  });

  // Get paginated scan events
  const scanEvents = await ScanEvent.findAll({
    where: whereClause,
    include: [{
      model: User,
      as: 'User',
      attributes: ['id', 'firstName', 'lastName', 'email', 'mobile', 'city', 'role', 'profilePicture']
    }],
    order: [['createdAt', 'DESC']],
    limit: limit,
    offset: offset
  });

  return {
    scanEvents,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    }
  };
};
