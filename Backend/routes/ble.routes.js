import express from 'express';
import {
  registerDevice,
  updateConnectionStatus,
  getDevices,
  getDeviceById,
  saveReading,
  getReadings,
  getLatestReading,
  deleteDevice
} from '../controllers/ble.controller.js';
import { jwtGuard } from '../middlewares/jwt.middleware.js';

const router = express.Router();

// Register a new BLE device
router.post('/devices', jwtGuard, registerDevice);

// Get all devices (user's own or all for admin)
router.get('/devices', jwtGuard, getDevices);

// Get device by ID
router.get('/devices/:id', jwtGuard, getDeviceById);

// Update device connection status
router.put('/devices/:deviceId/connection', jwtGuard, updateConnectionStatus);

// Delete device
router.delete('/devices/:id', jwtGuard, deleteDevice);

// Save a sensor reading
router.post('/readings', jwtGuard, saveReading);

// Get readings for a device (by deviceId - the BLE identifier)
router.get('/devices/:deviceId/readings', jwtGuard, getReadings);

// Get latest reading for a device
router.get('/devices/:deviceId/readings/latest', jwtGuard, getLatestReading);

export default router;

