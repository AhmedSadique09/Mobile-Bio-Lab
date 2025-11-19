import * as AnalyticsService from '../services/analytics.service.js';

export const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, sampleType } = req.query;

    const analytics = await AnalyticsService.getUserAnalytics(userId, {
      startDate,
      endDate,
      sampleType
    });

    return res.status(200).json({
      statusCode: 200,
      message: 'User analytics retrieved successfully',
      payload: analytics
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const getAdminAnalytics = async (req, res) => {
  try {
    const userRole = req.user.role;
    
    if (userRole !== 'Admin') {
      return res.status(403).json({
        statusCode: 403,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { startDate, endDate, sampleType, userId } = req.query;

    const analytics = await AnalyticsService.getAdminAnalytics({
      startDate,
      endDate,
      sampleType,
      userId
    });

    return res.status(200).json({
      statusCode: 200,
      message: 'Admin analytics retrieved successfully',
      payload: analytics
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

