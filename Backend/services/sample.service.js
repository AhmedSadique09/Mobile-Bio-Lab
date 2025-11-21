import Sample from '../models/Sample.js';
import User from '../models/User.js';
import { Op } from 'sequelize';
import * as ReportService from './report.service.js';
import * as NotificationService from './notification.service.js';

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

  // Create notification for sample creation
  try {
    await NotificationService.createNotification(
      userId,
      'New Sample Added',
      `Sample ${sampleData.sampleId} has been successfully added to the database.`,
      'sample',
      { sampleId: sample.id, sampleIdString: sampleData.sampleId }
    );
  } catch (notificationError) {
    // Log error but don't fail sample creation
    console.error('Error creating notification for sample creation:', notificationError);
  }

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

export const getSampleBySampleId = async (sampleId, userId = null) => {
  // Trim and normalize the sampleId to handle any whitespace or encoding issues
  const normalizedSampleId = sampleId.trim();

  console.log(`[getSampleBySampleId Service] Searching for: "${normalizedSampleId}", userId filter: ${userId || 'none'}`);

  const whereClause = {
    sampleId: normalizedSampleId,
    deletedAt: null
  };

  // If userId is provided, ensure user can only access their own samples
  if (userId) {
    whereClause.userId = userId;
  }

  // Try exact match first
  let sample = await Sample.findOne({
    where: whereClause,
    include: [{
      model: User,
      as: 'User',
      attributes: ['id', 'firstName', 'lastName', 'email', 'mobile', 'city', 'role', 'profilePicture']
    }]
  });


  if (!sample) {
    // Log all samples with similar IDs for debugging
    const similarSamples = await Sample.findAll({
      where: {
        sampleId: {
          [Op.like]: `%${normalizedSampleId}%`
        },
        deletedAt: null
      },
      limit: 5,
      attributes: ['id', 'sampleId', 'userId']
    });
    console.log(`[getSampleBySampleId Service] Similar samples found:`, similarSamples.map(s => ({ id: s.id, sampleId: s.sampleId, userId: s.userId })));

    const error = new Error(`Sample not found with ID: ${normalizedSampleId}`);
    error.status = 404;
    throw error;
  }

  console.log(`[getSampleBySampleId Service] Sample found successfully: ID=${sample.id}, sampleId=${sample.sampleId}, userId=${sample.userId}`);
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

  // Store old status to check if it changed
  const oldStatus = sample.status;

  // Update status
  await sample.update({ status: newStatus });

  // Create notification for status change
  if (oldStatus !== newStatus) {
    try {
      const statusMessages = {
        'pending': 'is pending',
        'processing': 'is now in progress',
        'completed': 'has been completed'
      };

      await NotificationService.createNotification(
        sample.userId,
        'Sample Status Updated',
        `Sample ${sample.sampleId} status changed from ${oldStatus} to ${newStatus}. ${statusMessages[newStatus] || 'status updated'}.`,
        'sample',
        { sampleId: sample.id, sampleIdString: sample.sampleId, oldStatus, newStatus }
      );
    } catch (notificationError) {
      // Log error but don't fail status update
      console.error('Error creating notification for status change:', notificationError);
    }
  }

  // If admin changed status to completed, automatically generate report for the user
  if (userRole === 'Admin' && newStatus === 'completed' && oldStatus !== 'completed') {
    try {
      // Get the sample owner's information
      const sampleOwner = await User.findByPk(sample.userId);

      if (sampleOwner) {
        // Generate report asynchronously (don't wait for it to complete)
        // This prevents blocking the status update response
        ReportService.generateReport(
          sample.userId, // userId - the user who owns the sample
          userId, // generatedBy - the admin who triggered this
          {
            title: `Report - ${sampleOwner.firstName} ${sampleOwner.lastName} - ${new Date().toLocaleDateString()}`,
            sampleIds: null // null means include all completed samples for this user
          }
        ).then(() => {
          console.log(`✅ Auto-generated report for user ${sample.userId} after sample ${sample.sampleId} was marked as completed`);
        }).catch(err => {
          console.error(`❌ Failed to auto-generate report for user ${sample.userId}:`, err.message);
        });
      }
    } catch (reportError) {
      // Log error but don't fail the status update
      console.error('Error triggering automatic report generation:', reportError);
    }
  }

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



