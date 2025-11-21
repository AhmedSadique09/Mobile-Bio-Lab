import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notification.controller.js';
import { jwtGuard } from '../middlewares/jwt.middleware.js';

const router = express.Router();

// Get all notifications for the authenticated user
router.get('/', jwtGuard, getNotifications);

// Get unread notification count
router.get('/unread-count', jwtGuard, getUnreadCount);

// Mark a notification as read
router.put('/:notificationId/read', jwtGuard, markAsRead);

// Mark all notifications as read
router.put('/read-all', jwtGuard, markAllAsRead);

// Delete a notification
router.delete('/:notificationId', jwtGuard, deleteNotification);

export default router;

