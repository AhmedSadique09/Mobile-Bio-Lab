import express from 'express';
import {
  generateReport,
  getReports,
  getReportById,
  downloadReport,
  deleteReport
} from '../controllers/report.controller.js';
import { jwtGuard } from '../middlewares/jwt.middleware.js';
import Report from '../models/Report.js';
import { sequelize } from '../db/mysql.js';

const router = express.Router();

// Test endpoint to check if Reports table exists (for debugging)
router.get('/test', jwtGuard, async (req, res) => {
  try {
    // Try to query the Reports table
    const count = await Report.count();
    return res.status(200).json({
      statusCode: 200,
      message: 'Reports table exists',
      count
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: 'Reports table error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Generate a new report
router.post('/', jwtGuard, generateReport);

// Get all reports
router.get('/', jwtGuard, getReports);

// Get a specific report by ID
router.get('/:id', jwtGuard, getReportById);

// Download report PDF (optional auth - can use token in query for sharing)
router.get('/:id/download', (req, res, next) => {
  // If token is in query, skip jwtGuard and call downloadReport directly
  if (req.query.token) {
    return downloadReport(req, res);
  }
  // Otherwise use normal auth middleware
  jwtGuard(req, res, (err) => {
    if (err) return next(err);
    downloadReport(req, res);
  });
});

// Delete a report
router.delete('/:id', jwtGuard, deleteReport);

export default router;

