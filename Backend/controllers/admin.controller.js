import * as AdminService from '../services/admin.service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const getUsers = async (req, res) => {
  try {
    const result = await AdminService.getUsers(req.query);
    return res.status(200).json({
      statusCode: 200,
      message: 'Users retrieved successfully',
      payload: result
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id; // Get current user ID from JWT token
    
    // Prepare payload with image path if uploaded
    const payload = {
      ...req.body,
      profilePicture: req.file ? `/uploads/${req.file.filename}` : undefined
    };

    const result = await AdminService.updateUser(id, payload, currentUserId);
    
    return res.status(200).json({
      statusCode: 200,
      message: 'User updated successfully',
      payload: result
    });
  } catch (err) {
    // Delete uploaded file if update fails
    if (req.file) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
      try {
        fs.unlinkSync(filePath);
      } catch (deleteErr) {
        console.error('Error deleting file:', deleteErr);
      }
    }
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AdminService.deleteUser(id);
    
    // Delete profile picture file if exists
    if (result.profilePicturePath) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const filePath = path.join(__dirname, '..', result.profilePicturePath);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (deleteErr) {
        console.error('Error deleting profile picture file:', deleteErr);
        // Continue even if file deletion fails
      }
    }
    
    return res.status(200).json({
      statusCode: 200,
      message: result.message || 'User deleted successfully',
      payload: { message: result.message }
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const stats = await AdminService.getDashboardStats();
    return res.status(200).json({
      statusCode: 200,
      message: 'Dashboard stats retrieved successfully',
      payload: stats
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const getSystemLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const { startDate, endDate, actionType } = req.query;

    const result = await AdminService.getSystemLogs(page, limit, {
      startDate,
      endDate,
      actionType
    });

    return res.status(200).json({
      statusCode: 200,
      message: 'System logs retrieved successfully',
      payload: result
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

