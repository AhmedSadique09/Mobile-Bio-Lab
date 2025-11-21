import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Create a new notification
 * @param {number} userId - User ID to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (sample, report, booking, system)
 * @param {object} metadata - Optional metadata (sampleId, reportId, etc.)
 * @returns {Promise<Notification>}
 */
export const createNotification = async (userId, title, message, type = 'system', metadata = null) => {
  // Verify user exists
  const user = await User.findOne({
    where: {
      id: userId,
      deletedAt: null
    }
  });

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const notification = await Notification.create({
    userId,
    title,
    message,
    type,
    metadata: metadata || {}
  });

  return notification;
};

/**
 * Get all notifications for a user
 * @param {number} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<{notifications: Notification[], total: number, page: number, limit: number}>}
 */
export const getNotifications = async (userId, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;

  const { count, rows } = await Notification.findAndCountAll({
    where: {
      userId,
      deletedAt: null
    },
    include: [{
      model: User,
      as: 'User',
      attributes: ['id', 'firstName', 'lastName', 'email']
    }],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return {
    notifications: rows,
    total: count,
    page,
    limit
  };
};

/**
 * Get unread notification count for a user
 * @param {number} userId - User ID
 * @returns {Promise<number>}
 */
export const getUnreadCount = async (userId) => {
  const count = await Notification.count({
    where: {
      userId,
      read: false,
      deletedAt: null
    }
  });

  return count;
};

/**
 * Mark a notification as read
 * @param {number} notificationId - Notification ID
 * @param {number} userId - User ID (for security check)
 * @returns {Promise<Notification>}
 */
export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    where: {
      id: notificationId,
      userId, // Ensure user can only mark their own notifications as read
      deletedAt: null
    }
  });

  if (!notification) {
    const error = new Error('Notification not found');
    error.status = 404;
    throw error;
  }

  await notification.update({ read: true });

  return notification;
};

/**
 * Mark all notifications as read for a user
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of notifications marked as read
 */
export const markAllAsRead = async (userId) => {
  const [updatedCount] = await Notification.update(
    { read: true },
    {
      where: {
        userId,
        read: false,
        deletedAt: null
      }
    }
  );

  return updatedCount;
};

/**
 * Delete a notification (hard delete - permanently removes from database)
 * @param {number} notificationId - Notification ID
 * @param {number} userId - User ID (for security check)
 * @returns {Promise<void>}
 */
export const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    where: {
      id: notificationId,
      userId, // Ensure user can only delete their own notifications
      deletedAt: null
    }
  });

  if (!notification) {
    const error = new Error('Notification not found');
    error.status = 404;
    throw error;
  }

  // Hard delete - permanently remove from database
  await notification.destroy();
};

