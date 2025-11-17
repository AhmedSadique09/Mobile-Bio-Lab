import * as SampleService from '../services/sample.service.js';

export const createSample = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from JWT middleware
    const { sampleId, collectionDate, collectionTime, sampleType, latitude, longitude, temperature, pH, salinity, status } = req.body;

    // Validate required fields
    if (!sampleId || !collectionDate || !collectionTime || !sampleType || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Sample ID, collection date, collection time, sample type, latitude, and longitude are required'
      });
    }

    // Validate status if provided
    if (status && !['pending', 'processing', 'completed'].includes(status)) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Invalid status. Must be one of: pending, processing, completed'
      });
    }

    const result = await SampleService.createSample(userId, {
      sampleId,
      collectionDate,
      collectionTime,
      sampleType,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      temperature: temperature ? parseFloat(temperature) : null,
      pH: pH ? parseFloat(pH) : null,
      salinity: salinity ? parseFloat(salinity) : null,
      status: status || 'pending' // Use status from frontend or default to 'pending'
    });

    return res.status(201).json({
      statusCode: 201,
      message: 'Sample created successfully',
      payload: result
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const getSamples = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { search, page, limit, filterType, filterStatus } = req.query; // Get query params

    // Admin can see all samples, regular users can only see their own
    const targetUserId = userRole === 'Admin' ? null : userId;
    
    // Parse pagination params
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const result = await SampleService.getSamples(
      targetUserId, 
      search || null,
      pageNum,
      limitNum,
      filterType || null,
      filterStatus || null
    );

    return res.status(200).json({
      statusCode: 200,
      message: 'Samples retrieved successfully',
      payload: result.samples,
      pagination: result.pagination
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const getSampleById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin can see any sample, regular users can only see their own
    const targetUserId = userRole === 'Admin' ? null : userId;
    
    const sample = await SampleService.getSampleById(parseInt(id), targetUserId);

    return res.status(200).json({
      statusCode: 200,
      message: 'Sample retrieved successfully',
      payload: sample
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const getSampleBySampleId = async (req, res) => {
  try {
    // Decode the sampleId from URL parameter (handles URL encoding)
    const { sampleId } = req.params;
    const decodedSampleId = decodeURIComponent(sampleId);
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`[getSampleBySampleId] Searching for sampleId: "${decodedSampleId}", userId: ${userId}, role: ${userRole}`);

    // For scanning purposes, allow any authenticated user to access any sample
    // This is secure because they need physical access to the QR code to scan it
    // Admin can see any sample, regular users can also scan any sample (via QR code)
    const targetUserId = null; // Remove userId restriction for scanning
    
    const sample = await SampleService.getSampleBySampleId(decodedSampleId, targetUserId);

    console.log(`[getSampleBySampleId] Sample found:`, sample ? `ID: ${sample.id}, sampleId: ${sample.sampleId}, createdBy: ${sample.userId}` : 'Not found');

    return res.status(200).json({
      statusCode: 200,
      message: 'Sample retrieved successfully',
      payload: sample
    });
  } catch (err) {
    console.error(`[getSampleBySampleId] Error:`, err.message);
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const updateSampleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!status) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Status is required'
      });
    }

    const result = await SampleService.updateSampleStatus(
      parseInt(id),
      status,
      userId,
      userRole
    );

    return res.status(200).json({
      statusCode: 200,
      message: 'Sample status updated successfully',
      payload: result
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};



