import * as NotificationService from '../services/notification.service.js';

/**
 * Get all notifications for the authenticated user
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const result = await NotificationService.getNotifications(userId, page, limit);

    return res.status(200).json({
      statusCode: 200,
      message: 'Notifications retrieved successfully',
      payload: result
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await NotificationService.getUnreadCount(userId);

    return res.status(200).json({
      statusCode: 200,
      message: 'Unread count retrieved successfully',
      payload: { count }
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Notification ID is required'
      });
    }

    const notification = await NotificationService.markAsRead(parseInt(notificationId), userId);

    return res.status(200).json({
      statusCode: 200,
      message: 'Notification marked as read',
      payload: notification
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await NotificationService.markAllAsRead(userId);

    return res.status(200).json({
      statusCode: 200,
      message: 'All notifications marked as read',
      payload: { count }
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Notification ID is required'
      });
    }

    await NotificationService.deleteNotification(parseInt(notificationId), userId);

    return res.status(200).json({
      statusCode: 200,
      message: 'Notification deleted successfully'
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

