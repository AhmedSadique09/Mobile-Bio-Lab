import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Calendar, Clock, CheckCircle, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { type User } from '../types';
import bookingService from '../services/booking.service';

interface BookingResponse {
  id: number;
  userId: number;
  date: string;
  timeSlot: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt: string;
  User?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    city: string;
    role: string;
    profilePicture: string | null;
  };
}

interface BookingsProps {
  user: User;
}

export function Bookings({ user }: BookingsProps) {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    timeSlot: '',
    purpose: ''
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Generate 30-minute time slots for 24 hours (12 AM to 11:30 PM)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startHour = hour;
        const startMinute = minute;
        const endMinute = minute + 30;
        const endHour = endMinute >= 60 ? hour + 1 : hour;
        const finalEndMinute = endMinute >= 60 ? endMinute - 60 : endMinute;

        const formatTime = (h: number, m: number) => {
          const period = h >= 12 ? 'PM' : 'AM';
          const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
          return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
        };

        const startTime = formatTime(startHour, startMinute);
        const endTime = formatTime(endHour >= 24 ? endHour - 24 : endHour, finalEndMinute);
        slots.push(`${startTime} - ${endTime}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await bookingService.getBookings();
      if (response.statusCode === 200 && response.payload) {
        setBookings(response.payload);
      } else {
        setError(response.message || 'Failed to load bookings');
      }
    } catch (err: any) {
      console.error('Error loading bookings:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (booking: BookingResponse) => {
    if (user.role === 'admin') return; // Admin cannot edit bookings
    
    setEditingBookingId(booking.id);
    setFormData({
      date: booking.date,
      timeSlot: booking.timeSlot,
      purpose: booking.purpose
    });
    setShowForm(true);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingBookingId(null);
    setFormData({ date: '', timeSlot: '', purpose: '' });
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      let response;
      if (editingBookingId) {
        // Update existing booking
        response = await bookingService.updateBooking(editingBookingId, {
          date: formData.date,
          timeSlot: formData.timeSlot,
          purpose: formData.purpose
        });

        if (response.statusCode === 200) {
          setSuccess(true);
          setFormData({ date: '', timeSlot: '', purpose: '' });
          setEditingBookingId(null);
          loadBookings();
          setTimeout(() => {
            setSuccess(false);
            setShowForm(false);
          }, 2000);
        } else {
          setError(response.message || 'Failed to update booking');
        }
      } else {
        // Create new booking
        response = await bookingService.createBooking({
          date: formData.date,
          timeSlot: formData.timeSlot,
          purpose: formData.purpose
        });

        if (response.statusCode === 201) {
          setSuccess(true);
          setFormData({ date: '', timeSlot: '', purpose: '' });
          loadBookings();
          setTimeout(() => {
            setSuccess(false);
            setShowForm(false);
          }, 2000);
        } else {
          setError(response.message || 'Failed to submit booking request');
        }
      }
    } catch (err: any) {
      console.error('Error saving booking:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 
        (editingBookingId ? 'Failed to update booking' : 'Failed to submit booking request');
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (bookingId: number, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await bookingService.updateBookingStatus(bookingId, newStatus);
      if (response.statusCode === 200) {
        loadBookings();
      } else {
        setError(response.message || 'Failed to update booking status');
      }
    } catch (err: any) {
      console.error('Error updating booking status:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to update booking status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserName = (booking: BookingResponse) => {
    if (booking.User) {
      return `${booking.User.firstName} ${booking.User.lastName}`;
    }
    return 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Lab Bookings</h1>
          <p className="text-gray-600">
            {user.role === 'admin' 
              ? 'View and manage all booking requests' 
              : 'Reserve time slots for mobile bio lab access'}
          </p>
        </div>
        {user.role !== 'admin' && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Book a Slot
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Booking Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingBookingId ? 'Edit Booking' : 'New Booking Request'}</CardTitle>
            <CardDescription>
              {editingBookingId 
                ? 'Update your booking details. Note: If the new slot is already booked, you will receive an error.' 
                : 'Fill in the details to reserve a lab slot'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {editingBookingId ? 'Booking updated successfully!' : 'Booking request submitted successfully!'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeSlot">Time Slot *</Label>
                  <Select value={formData.timeSlot} onValueChange={(value) => setFormData({ ...formData, timeSlot: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(slot => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose *</Label>
                <Textarea
                  id="purpose"
                  placeholder="Describe the purpose of your lab visit..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingBookingId ? 'Updating...' : 'Submitting...'}
                    </>
                  ) : (
                    editingBookingId ? 'Update Booking' : 'Submit Request'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={submitting}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bookings List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500">Loading bookings...</p>
          </CardContent>
        </Card>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">
              {user.role === 'admin' ? 'No bookings found' : 'No bookings yet'}
            </p>
            {user.role !== 'admin' && !showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Book Your First Slot
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time Slot</TableHead>
                  <TableHead>Purpose</TableHead>
                  {user.role === 'admin' && <TableHead>Requested By</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Requested On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {new Date(booking.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-500" />
                        {booking.timeSlot}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate" title={booking.purpose}>
                        {booking.purpose}
                      </p>
                    </TableCell>
                    {user.role === 'admin' && (
                      <TableCell>
                        <div>
                          <p className="font-medium">{getUserName(booking)}</p>
                          {booking.User?.email && (
                            <p className="text-xs text-gray-500">{booking.User.email}</p>
                          )}
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Button - Only for non-admin users and their own bookings */}
                        {user.role !== 'admin' && booking.userId === parseInt(user.id) && booking.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(booking)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}
                        {/* Admin Actions */}
                        {user.role === 'admin' && booking.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(booking.id, 'approved')}
                              className="bg-green-50 hover:bg-green-100"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                              className="bg-red-50 hover:bg-red-100"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
