import { HttpService } from './base.service';

class NotificationService extends HttpService {
  /**
   * Get all notifications for the authenticated user
   * @param page Page number
   * @param limit Items per page
   */
  getNotifications = async (page: number = 1, limit: number = 50) => {
    return this.get('notifications', { page, limit });
  };

  /**
   * Get unread notification count
   */
  getUnreadCount = async () => {
    return this.get('notifications/unread-count');
  };

  /**
   * Mark a notification as read
   * @param notificationId Notification ID
   */
  markAsRead = async (notificationId: number) => {
    return this.put(`notifications/${notificationId}/read`);
  };

  /**
   * Mark all notifications as read
   */
  markAllAsRead = async () => {
    return this.put('notifications/read-all');
  };

  /**
   * Delete a notification
   * @param notificationId Notification ID
   */
  deleteNotification = async (notificationId: number) => {
    return this.delete(`notifications/${notificationId}`);
  };
}

export default new NotificationService();

