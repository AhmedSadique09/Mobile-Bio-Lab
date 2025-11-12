import express from 'express';
import { createBooking, getBookings, updateBooking, updateBookingStatus } from '../controllers/booking.controller.js';
import { jwtGuard } from '../middlewares/jwt.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/booking:
 *   post:
 *     summary: Create a new booking request
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - timeSlot
 *               - purpose
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               timeSlot:
 *                 type: string
 *               purpose:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', jwtGuard, createBooking);

/**
 * @swagger
 * /api/booking:
 *   get:
 *     summary: Get bookings (user's own or all for admin)
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', jwtGuard, getBookings);

/**
 * @swagger
 * /api/booking/:id:
 *   put:
 *     summary: Update booking (user's own booking only)
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               timeSlot:
 *                 type: string
 *               purpose:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       400:
 *         description: Slot already booked or validation error
 *       404:
 *         description: Booking not found
 */
router.put('/:id', jwtGuard, updateBooking);

/**
 * @swagger
 * /api/booking/:id/status:
 *   put:
 *     summary: Update booking status (admin only)
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected, completed]
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *       403:
 *         description: Forbidden - Only admin can update status
 *       404:
 *         description: Booking not found
 */
router.put('/:id/status', jwtGuard, updateBookingStatus);

export default router;

