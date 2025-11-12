import { HttpService } from './base.service';

class BookingService extends HttpService {
  /**
   * Create a new booking request
   * @param bookingData Booking data (date, timeSlot, purpose)
   */
  createBooking = async (bookingData: {
    date: string;
    timeSlot: string;
    purpose: string;
  }) => {
    return this.post('booking', bookingData);
  };

  /**
   * Get bookings (user's own or all for admin)
   */
  getBookings = async () => {
    return this.get('booking');
  };

  /**
   * Update booking (user's own booking only)
   * @param bookingId Booking ID
   * @param bookingData Updated booking data
   */
  updateBooking = async (bookingId: number, bookingData: {
    date?: string;
    timeSlot?: string;
    purpose?: string;
  }) => {
    return this.put(`booking/${bookingId}`, bookingData);
  };

  /**
   * Update booking status (admin only)
   * @param bookingId Booking ID
   * @param status New status
   */
  updateBookingStatus = async (bookingId: number, status: 'pending' | 'approved' | 'rejected' | 'completed') => {
    return this.put(`booking/${bookingId}/status`, { status });
  };
}

export default new BookingService();

