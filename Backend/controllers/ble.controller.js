import * as BLEService from '../services/ble.service.js';

export const registerDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceName, deviceId, deviceType, manufacturer, model, metadata } = req.body;

    if (!deviceName || !deviceId || !deviceType) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Device name, device ID, and device type are required'
      });
    }

    const device = await BLEService.registerDevice(userId, {
      deviceName,
      deviceId,
      deviceType,
      manufacturer,
      model,
      metadata
    });

    return res.status(201).json({
      statusCode: 201,
      message: 'Device registered successfully',
      payload: device
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const updateConnectionStatus = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { isConnected } = req.body;

    if (typeof isConnected !== 'boolean') {
      return res.status(400).json({
        statusCode: 400,
        message: 'isConnected must be a boolean value'
      });
    }

    const device = await BLEService.updateDeviceConnectionStatus(deviceId, isConnected);

    return res.status(200).json({
      statusCode: 200,
      message: 'Connection status updated successfully',
      payload: device
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const getDevices = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const devices = await BLEService.getDevices(userId, userRole);

    return res.status(200).json({
      statusCode: 200,
      message: 'Devices retrieved successfully',
      payload: devices
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const getDeviceById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const device = await BLEService.getDeviceById(parseInt(id), userId, userRole);

    return res.status(200).json({
      statusCode: 200,
      message: 'Device retrieved successfully',
      payload: device
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const saveReading = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId, temperature, pH, salinity, humidity, pressure, light, co2, rawData } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Device ID is required'
      });
    }

    const reading = await BLEService.saveReading(userId, {
      deviceId,
      temperature,
      pH,
      salinity,
      humidity,
      pressure,
      light,
      co2,
      rawData
    });

    return res.status(201).json({
      statusCode: 201,
      message: 'Reading saved successfully',
      payload: reading
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const getReadings = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { limit, startDate, endDate } = req.query;

    const readings = await BLEService.getReadings(deviceId, userId, userRole, {
      limit,
      startDate,
      endDate
    });

    return res.status(200).json({
      statusCode: 200,
      message: 'Readings retrieved successfully',
      payload: readings
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const getLatestReading = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const reading = await BLEService.getLatestReading(deviceId, userId, userRole);

    return res.status(200).json({
      statusCode: 200,
      message: 'Latest reading retrieved successfully',
      payload: reading
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await BLEService.deleteDevice(parseInt(id), userId, userRole);

    return res.status(200).json({
      statusCode: 200,
      message: result.message,
      payload: result
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

