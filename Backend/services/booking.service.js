import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { Op } from 'sequelize';

export const createBooking = async (userId, bookingData) => {
  // Check if user exists and is not deleted
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

  // Check if the slot is already booked by another user
  const existingBooking = await Booking.findOne({
    where: {
      date: bookingData.date,
      timeSlot: bookingData.timeSlot,
      status: { [Op.in]: ['pending', 'approved'] }, // Only check pending and approved bookings
      deletedAt: null
    }
  });

  if (existingBooking) {
    const error = new Error('This slot is already booked by another user');
    error.status = 400;
    throw error;
  }

  // Create booking
  const booking = await Booking.create({
    userId: userId,
    date: bookingData.date,
    timeSlot: bookingData.timeSlot,
    purpose: bookingData.purpose,
    status: 'pending'
  });

  // Return booking with user details
  const bookingWithUser = await Booking.findByPk(booking.id, {
    include: [{
      model: User,
      as: 'User',
      attributes: ['id', 'firstName', 'lastName', 'email', 'mobile', 'city', 'role', 'profilePicture']
    }]
  });

  return bookingWithUser;
};

export const getBookings = async (userId = null) => {
  // If userId is provided, return only that user's bookings
  // Otherwise, return all bookings (for admin)
  const whereClause = {
    deletedAt: null
  };

  if (userId) {
    whereClause.userId = userId;
  }

  const bookings = await Booking.findAll({
    where: whereClause,
    include: [{
      model: User,
      as: 'User',
      attributes: ['id', 'firstName', 'lastName', 'email', 'mobile', 'city', 'role', 'profilePicture']
    }],
    order: [['createdAt', 'DESC']]
  });

  return bookings;
};

export const updateBookingStatus = async (bookingId, status) => {
  // Check if booking exists
  const booking = await Booking.findOne({
    where: {
      id: bookingId,
      deletedAt: null
    }
  });

  if (!booking) {
    const error = new Error('Booking not found');
    error.status = 404;
    throw error;
  }

  // Update status
  await booking.update({ status });

  // Return updated booking with user details
  const updatedBooking = await Booking.findByPk(bookingId, {
    include: [{
      model: User,
      as: 'User',
      attributes: ['id', 'firstName', 'lastName', 'email', 'mobile', 'city', 'role', 'profilePicture']
    }]
  });

  return updatedBooking;
};

export const updateBooking = async (userId, bookingId, updateData) => {
  // Check if booking exists and belongs to the user
  const booking = await Booking.findOne({
    where: {
      id: bookingId,
      userId: userId,
      deletedAt: null
    }
  });

  if (!booking) {
    const error = new Error('Booking not found or you do not have permission to update it');
    error.status = 404;
    throw error;
  }

  // Check if date or timeSlot is being updated
  const newDate = updateData.date || booking.date;
  const newTimeSlot = updateData.timeSlot || booking.timeSlot;

  // Check if the new slot is already booked by another user
  if (updateData.date || updateData.timeSlot) {
    const existingBooking = await Booking.findOne({
      where: {
        date: newDate,
        timeSlot: newTimeSlot,
        id: { [Op.ne]: bookingId }, // Exclude current booking
        status: { [Op.in]: ['pending', 'approved'] }, // Only check pending and approved bookings
        deletedAt: null
      }
    });

    if (existingBooking) {
      const error = new Error('This slot is already booked by another user');
      error.status = 400;
      throw error;
    }
  }

  // Update booking
  const fieldsToUpdate = {};
  if (updateData.date) fieldsToUpdate.date = updateData.date;
  if (updateData.timeSlot) fieldsToUpdate.timeSlot = updateData.timeSlot;
  if (updateData.purpose) fieldsToUpdate.purpose = updateData.purpose;

  await booking.update(fieldsToUpdate);

  // Return updated booking with user details
  const updatedBooking = await Booking.findByPk(bookingId, {
    include: [{
      model: User,
      as: 'User',
      attributes: ['id', 'firstName', 'lastName', 'email', 'mobile', 'city', 'role', 'profilePicture']
    }]
  });

  return updatedBooking;
};

