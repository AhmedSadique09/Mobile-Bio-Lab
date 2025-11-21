import * as ReportService from '../services/report.service.js';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { verifyToken } from '../helpers/auth.helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, targetUserId, sampleIds } = req.body;

    // Check if user is admin
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: 'User not found'
      });
    }
    const isAdmin = user.role === 'Admin';

    // Validation - targetUserId is required for admin
    if (isAdmin && (!targetUserId || targetUserId === '')) {
      return res.status(400).json({
        statusCode: 400,
        message: 'User selection is required'
      });
    }

    // Validation - sampleIds are required
    if (!sampleIds || !Array.isArray(sampleIds) || sampleIds.length === 0) {
      return res.status(400).json({
        statusCode: 400,
        message: 'At least one completed sample must be selected'
      });
    }

    // Determine target user ID
    let reportUserId = null;
    if (isAdmin) {
      // Admin must select a user
      reportUserId = parseInt(targetUserId);
      // Verify the target user exists and is not an admin
      const targetUser = await User.findByPk(reportUserId);
      if (!targetUser) {
        return res.status(400).json({
          statusCode: 400,
          message: 'Selected user not found'
        });
      }
      if (targetUser.role === 'Admin') {
        return res.status(400).json({
          statusCode: 400,
          message: 'Cannot generate report for admin user'
        });
      }
    } else {
      // Regular users can only generate reports for themselves
      reportUserId = userId;
    }

    const report = await ReportService.generateReport(reportUserId, userId, {
      title,
      sampleIds: sampleIds
    });

    return res.status(201).json({
      statusCode: 201,
      message: 'Report generated successfully',
      payload: report
    });
  } catch (err) {
    console.error('Generate report error:', err);
    console.error('Error stack:', err.stack);
    console.error('Request body:', req.body);
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Failed to generate report',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const getReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Check if user is admin
    const user = await User.findByPk(userId);
    const isAdmin = user.role === 'Admin';

    // Regular users can only see reports generated FOR them (userId field)
    // Admins can see all reports
    const result = await ReportService.getReports(userId, isAdmin, parseInt(page), parseInt(limit));

    return res.status(200).json({
      statusCode: 200,
      message: 'Reports retrieved successfully',
      payload: result
    });
  } catch (err) {
    console.error('Get reports error:', err);
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Failed to retrieve reports'
    });
  }
};

export const getReportById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if user is admin
    const user = await User.findByPk(userId);
    const isAdmin = user.role === 'Admin';

    // Regular users can only see reports generated FOR them (userId field)
    // Admins can see all reports
    const report = await ReportService.getReportById(parseInt(id), userId, isAdmin);

    if (!report) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Report not found'
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: 'Report retrieved successfully',
      payload: report
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Failed to retrieve report'
    });
  }
};

export const downloadReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    let userId = null;
    let isAdmin = false;

    // If token is provided in query (for sharing), verify it
    if (token) {
      try {
        const decoded = verifyToken(token);
        userId = decoded.id;
        const user = await User.findByPk(userId);
        if (user) {
          isAdmin = user.role === 'Admin';
        }
      } catch (tokenError) {
        console.error('Token verification error:', tokenError);
        return res.status(401).json({
          statusCode: 401,
          message: 'Invalid or expired token'
        });
      }
    } else if (req.user) {
      // Use normal auth from middleware
      userId = req.user.id;
      const user = await User.findByPk(userId);
      if (user) {
        isAdmin = user.role === 'Admin';
      }
    } else {
      return res.status(401).json({
        statusCode: 401,
        message: 'Authentication required'
      });
    }

    // Regular users can only download reports generated FOR them (userId field)
    // Admins can download all reports
    const report = await ReportService.getReportById(parseInt(id), userId, isAdmin);

    if (!report) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Report not found'
      });
    }

    if (report.status !== 'completed') {
      return res.status(400).json({
        statusCode: 400,
        message: 'Report is not ready for download'
      });
    }

    // Get the reports directory (same as in report.service.js)
    const reportsDir = path.join(__dirname, '..', 'reports');

    // Get the actual file path
    let filePath;
    if (report.filePath) {
      // Remove leading slash if present
      const cleanPath = report.filePath.startsWith('/') ? report.filePath.substring(1) : report.filePath;

      // If path already includes 'reports/', use it directly
      if (cleanPath.startsWith('reports/')) {
        filePath = path.join(__dirname, '..', cleanPath);
      } else {
        // Otherwise assume it's just the filename
        filePath = path.join(reportsDir, cleanPath);
      }
    } else {
      // Fallback: try to find file by report ID pattern
      if (fs.existsSync(reportsDir)) {
        try {
          const files = fs.readdirSync(reportsDir).filter(f => f.startsWith(`report-${report.id}-`) && f.endsWith('.pdf'));
          if (files.length > 0) {
            filePath = path.join(reportsDir, files[0]);
          } else {
            filePath = path.join(reportsDir, `report-${report.id}.pdf`);
          }
        } catch (readError) {
          console.error('Error reading reports directory:', readError);
          filePath = path.join(reportsDir, `report-${report.id}.pdf`);
        }
      } else {
        filePath = path.join(reportsDir, `report-${report.id}.pdf`);
      }
    }

    // If file doesn't exist, try alternative paths
    if (!fs.existsSync(filePath)) {
      console.log('File not found at primary path:', filePath);

      // Try with just the filename
      const fileName = path.basename(report.filePath || `report-${report.id}.pdf`);
      const altPath = path.join(reportsDir, fileName);

      if (fs.existsSync(altPath)) {
        filePath = altPath;
        console.log('Found file at alternative path:', filePath);
      } else {
        // List all files in reports directory for debugging
        let allFiles = [];
        try {
          if (fs.existsSync(reportsDir)) {
            allFiles = fs.readdirSync(reportsDir);
          }
        } catch (readError) {
          console.error('Error reading reports directory:', readError);
        }

        console.error('Report file not found. Searched paths:');
        console.error('  Primary:', filePath);
        console.error('  Alternative:', altPath);
        console.error('  Reports directory:', reportsDir);
        console.error('  Reports directory exists:', fs.existsSync(reportsDir));
        console.error('  Files in reports directory:', allFiles);
        console.error('  Report filePath from DB:', report.filePath);
        console.error('  Report ID:', report.id);

        return res.status(404).json({
          statusCode: 404,
          message: 'Report file not found. Please contact administrator.',
          debug: process.env.NODE_ENV === 'development' ? {
            filePath: report.filePath,
            searchedPaths: [filePath, altPath],
            reportsDir: reportsDir,
            reportsDirExists: fs.existsSync(reportsDir),
            filesInDir: allFiles,
            reportId: report.id
          } : undefined
        });
      }
    }

    // Set CORS headers explicitly for file download
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');

    res.setHeader('Content-Type', 'application/pdf');
    const safeFileName = report.title.replace(/[^a-z0-9]/gi, '_') + '.pdf';
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);

    console.log('Sending file:', filePath);
    console.log('File exists:', fs.existsSync(filePath));
    if (fs.existsSync(filePath)) {
      console.log('File size:', fs.statSync(filePath).size, 'bytes');
    }

    return res.sendFile(path.resolve(filePath), (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          return res.status(500).json({
            statusCode: 500,
            message: 'Failed to send report file',
            error: err.message
          });
        }
      } else {
        console.log('File sent successfully');
      }
    });
  } catch (err) {
    console.error('Download report error:', err);
    console.error('Error stack:', err.stack);
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Failed to download report',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if user is admin
    const user = await User.findByPk(userId);
    const isAdmin = user.role === 'Admin';

    // Regular users can only delete reports generated FOR them (userId field)
    // Admins can delete all reports
    await ReportService.deleteReport(parseInt(id), userId, isAdmin);

    return res.status(200).json({
      statusCode: 200,
      message: 'Report deleted successfully'
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Failed to delete report'
    });
  }
};

