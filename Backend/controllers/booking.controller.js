import * as BookingService from '../services/booking.service.js';

export const createBooking = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from JWT middleware
    const { date, timeSlot, purpose } = req.body;

    // Validate required fields
    if (!date || !timeSlot || !purpose) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Date, timeSlot, and purpose are required'
      });
    }

    const result = await BookingService.createBooking(userId, {
      date,
      timeSlot,
      purpose
    });

    return res.status(201).json({
      statusCode: 201,
      message: 'Booking request submitted successfully',
      payload: result
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const getBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin can see all bookings, regular users can only see their own
    const targetUserId = userRole === 'Admin' ? null : userId;
    
    const bookings = await BookingService.getBookings(targetUserId);

    return res.status(200).json({
      statusCode: 200,
      message: 'Bookings retrieved successfully',
      payload: bookings
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Get user ID from JWT middleware
    const { date, timeSlot, purpose } = req.body;

    // Validate that at least one field is being updated
    if (!date && !timeSlot && !purpose) {
      return res.status(400).json({
        statusCode: 400,
        message: 'At least one field (date, timeSlot, or purpose) must be provided for update'
      });
    }

    const result = await BookingService.updateBooking(userId, id, {
      date,
      timeSlot,
      purpose
    });

    return res.status(200).json({
      statusCode: 200,
      message: 'Booking updated successfully',
      payload: result
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;

    // Only admin can update booking status
    if (userRole !== 'Admin') {
      return res.status(403).json({
        statusCode: 403,
        message: 'Only admin can update booking status'
      });
    }

    // Validate status
    if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Invalid status. Must be one of: pending, approved, rejected, completed'
      });
    }

    const result = await BookingService.updateBookingStatus(id, status);

    return res.status(200).json({
      statusCode: 200,
      message: 'Booking status updated successfully',
      payload: result
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error'
    });
  }
};

