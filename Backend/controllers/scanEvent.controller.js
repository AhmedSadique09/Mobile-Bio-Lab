import * as ScanEventService from '../services/scanEvent.service.js';

export const logScanEvent = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from JWT middleware
    const { scannedSampleId, deviceType, scanResult, metadata } = req.body;

    // Validate required fields
    if (!scannedSampleId || !scanResult) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Scanned sample ID and scan result are required'
      });
    }

    // Validate scanResult
    if (!['found', 'not_found'].includes(scanResult)) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Invalid scan result. Must be one of: found, not_found'
      });
    }

    // Validate deviceType if provided
    if (deviceType && !['mobile', 'scanner', 'browser'].includes(deviceType)) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Invalid device type. Must be one of: mobile, scanner, browser'
      });
    }

    const result = await ScanEventService.logScanEvent(userId, {
      scannedSampleId,
      deviceType: deviceType || 'mobile',
      scanResult,
      metadata: metadata || null
    });

    return res.status(201).json({
      statusCode: 201,
      message: 'Scan event logged successfully',
      payload: result
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const getScanEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page, limit } = req.query;

    // Admin can see all scan events, regular users can only see their own
    const targetUserId = userRole === 'Admin' ? null : userId;
    
    // Parse pagination params
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const result = await ScanEventService.getScanEvents(
      targetUserId,
      pageNum,
      limitNum
    );

    return res.status(200).json({
      statusCode: 200,
      message: 'Scan events retrieved successfully',
      payload: result.scanEvents,
      pagination: result.pagination
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

