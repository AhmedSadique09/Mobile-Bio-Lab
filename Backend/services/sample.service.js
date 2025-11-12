import Sample from '../models/Sample.js';
import User from '../models/User.js';
import { Op } from 'sequelize';

export const createSample = async (userId, sampleData) => {
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

  // Create sample with status from frontend (defaults to 'pending' if not provided)
  const sample = await Sample.create({
    sampleId: sampleData.sampleId,
    userId: userId,
    collectionDate: sampleData.collectionDate,
    collectionTime: sampleData.collectionTime,
    sampleType: sampleData.sampleType,
    latitude: sampleData.latitude,
    longitude: sampleData.longitude,
    temperature: sampleData.temperature || null,
    pH: sampleData.pH || null,
    salinity: sampleData.salinity || null,
    status: sampleData.status || 'pending' // Use status from frontend or default to 'pending'
  });

  // Return sample with user details
  const sampleWithUser = await Sample.findByPk(sample.id, {
    include: [{
      model: User,
      as: 'User',
      attributes: ['id', 'firstName', 'lastName', 'email', 'mobile', 'city', 'role', 'profilePicture']
    }]
  });

  return sampleWithUser;
};

export const getSamples = async (userId = null, searchTerm = null, page = 1, limit = 10, filterType = null, filterStatus = null) => {
  const whereClause = {
    deletedAt: null
  };

  // If userId is provided, filter by user
  if (userId) {
    whereClause.userId = userId;
  }

  // If searchTerm is provided, search by sampleId
  if (searchTerm) {
    whereClause.sampleId = {
      [Op.like]: `%${searchTerm}%`
    };
  }

  // Filter by sample type
  if (filterType && filterType !== 'all') {
    whereClause.sampleType = filterType;
  }

  // Filter by status
  if (filterStatus && filterStatus !== 'all') {
    whereClause.status = filterStatus;
  }

  // Calculate offset
  const offset = (page - 1) * limit;

  // Get total count
  const total = await Sample.count({
    where: whereClause
  });

  // Get paginated samples
  const samples = await Sample.findAll({
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
    samples,
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

export const getSampleById = async (sampleId, userId = null) => {
  const whereClause = {
    id: sampleId,
    deletedAt: null
  };

  // If userId is provided, ensure user can only access their own samples
  if (userId) {
    whereClause.userId = userId;
  }

  const sample = await Sample.findOne({
    where: whereClause,
    include: [{
      model: User,
      as: 'User',
      attributes: ['id', 'firstName', 'lastName', 'email', 'mobile', 'city', 'role', 'profilePicture']
    }]
  });

  if (!sample) {
    const error = new Error('Sample not found');
    error.status = 404;
    throw error;
  }

  return sample;
};

export const updateSampleStatus = async (sampleId, newStatus, userId = null, userRole = null) => {
  const whereClause = {
    id: sampleId,
    deletedAt: null
  };

  // If user is not admin, they can only update their own samples
  if (userRole !== 'Admin' && userId) {
    whereClause.userId = userId;
  }

  const sample = await Sample.findOne({
    where: whereClause
  });

  if (!sample) {
    const error = new Error('Sample not found');
    error.status = 404;
    throw error;
  }

  // Validate status
  const validStatuses = ['pending', 'processing', 'completed'];
  if (!validStatuses.includes(newStatus)) {
    const error = new Error('Invalid status. Must be one of: pending, processing, completed');
    error.status = 400;
    throw error;
  }

  // Update status
  await sample.update({ status: newStatus });

  // Return updated sample with user details
  const updatedSample = await Sample.findByPk(sample.id, {
    include: [{
      model: User,
      as: 'User',
      attributes: ['id', 'firstName', 'lastName', 'email', 'mobile', 'city', 'role', 'profilePicture']
    }]
  });

  return updatedSample;
};



