import BLEDevice from '../models/BLEDevice.js';
import BLEReading from '../models/BLEReading.js';
import User from '../models/User.js';
import { Op } from 'sequelize';

export const registerDevice = async (userId, deviceData) => {
  const { deviceName, deviceId, deviceType, manufacturer, model, metadata } = deviceData;

  // Check if device already exists
  const existingDevice = await BLEDevice.findOne({
    where: { deviceId, deletedAt: null }
  });

  if (existingDevice) {
    // Update existing device
    existingDevice.deviceName = deviceName;
    existingDevice.deviceType = deviceType;
    existingDevice.manufacturer = manufacturer || existingDevice.manufacturer;
    existingDevice.model = model || existingDevice.model;
    existingDevice.metadata = metadata || existingDevice.metadata;
    existingDevice.isConnected = true;
    existingDevice.lastConnectedAt = new Date();
    await existingDevice.save();
    return existingDevice;
  }

  // Create new device
  const device = await BLEDevice.create({
    userId,
    deviceName,
    deviceId,
    deviceType,
    manufacturer,
    model,
    isConnected: true,
    lastConnectedAt: new Date(),
    metadata
  });

  return device;
};

export const updateDeviceConnectionStatus = async (deviceId, isConnected) => {
  const device = await BLEDevice.findOne({
    where: { deviceId, deletedAt: null }
  });

  if (!device) {
    throw { status: 404, message: 'Device not found' };
  }

  device.isConnected = isConnected;
  if (isConnected) {
    device.lastConnectedAt = new Date();
  }
  await device.save();

  return device;
};

export const getDevices = async (userId, userRole) => {
  const whereClause = userRole === 'Admin' 
    ? { deletedAt: null }
    : { userId, deletedAt: null };

  const devices = await BLEDevice.findAll({
    where: whereClause,
    include: [{
      model: User,
      as: 'User',
      attributes: ['id', 'firstName', 'lastName', 'email']
    }],
    order: [['lastConnectedAt', 'DESC']]
  });

  return devices;
};

export const getDeviceById = async (deviceId, userId, userRole) => {
  const whereClause = userRole === 'Admin'
    ? { id: deviceId, deletedAt: null }
    : { id: deviceId, userId, deletedAt: null };

  const device = await BLEDevice.findOne({
    where: whereClause,
    include: [{
      model: User,
      as: 'User',
      attributes: ['id', 'firstName', 'lastName', 'email']
    }]
  });

  if (!device) {
    throw { status: 404, message: 'Device not found' };
  }

  return device;
};

export const saveReading = async (userId, readingData) => {
  const { deviceId, temperature, pH, salinity, humidity, pressure, light, co2, rawData } = readingData;

  // Find device by deviceId (the BLE device identifier, not database ID)
  const device = await BLEDevice.findOne({
    where: { deviceId, deletedAt: null }
  });

  if (!device) {
    throw { status: 404, message: 'Device not found. Please register the device first.' };
  }

  const reading = await BLEReading.create({
    deviceId: device.id, // Use database ID
    userId,
    temperature,
    pH,
    salinity,
    humidity,
    pressure,
    light,
    co2,
    rawData,
    readingTimestamp: new Date()
  });

  return reading;
};

export const getReadings = async (deviceId, userId, userRole, options = {}) => {
  const { limit = 100, startDate, endDate } = options;

  // Find device
  const device = await BLEDevice.findOne({
    where: { deviceId, deletedAt: null }
  });

  if (!device) {
    throw { status: 404, message: 'Device not found' };
  }

  // Check permissions
  if (userRole !== 'Admin' && device.userId !== userId) {
    throw { status: 403, message: 'Access denied' };
  }

  const whereClause = {
    deviceId: device.id, // Use database ID
    deletedAt: null
  };

  if (startDate || endDate) {
    whereClause.readingTimestamp = {};
    if (startDate) {
      whereClause.readingTimestamp[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      whereClause.readingTimestamp[Op.lte] = new Date(endDate);
    }
  }

  const readings = await BLEReading.findAll({
    where: whereClause,
    include: [{
      model: BLEDevice,
      as: 'Device',
      attributes: ['id', 'deviceName', 'deviceType']
    }],
    order: [['readingTimestamp', 'DESC']],
    limit: parseInt(limit)
  });

  return readings;
};

export const getLatestReading = async (deviceId, userId, userRole) => {
  const device = await BLEDevice.findOne({
    where: { deviceId, deletedAt: null }
  });

  if (!device) {
    throw { status: 404, message: 'Device not found' };
  }

  if (userRole !== 'Admin' && device.userId !== userId) {
    throw { status: 403, message: 'Access denied' };
  }

  const reading = await BLEReading.findOne({
    where: {
      deviceId: device.id,
      deletedAt: null
    },
    include: [{
      model: BLEDevice,
      as: 'Device',
      attributes: ['id', 'deviceName', 'deviceType']
    }],
    order: [['readingTimestamp', 'DESC']]
  });

  return reading;
};

export const deleteDevice = async (deviceId, userId, userRole) => {
  const whereClause = userRole === 'Admin'
    ? { id: deviceId, deletedAt: null }
    : { id: deviceId, userId, deletedAt: null };

  const device = await BLEDevice.findOne({ where: whereClause });

  if (!device) {
    throw { status: 404, message: 'Device not found' };
  }

  device.deletedAt = Date.now();
  await device.save();

  return { message: 'Device deleted successfully' };
};

