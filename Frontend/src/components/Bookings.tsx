import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Calendar, Clock, CheckCircle, X, Check } from 'lucide-react';
import { type User, type Booking } from '../types';
import { getBookings, addBooking, updateBooking, addNotification, addActivityLog, getUsers } from '../lib/storage';

interface BookingsProps {
  user: User;
}

export function Bookings({ user }: BookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    timeSlot: '',
    purpose: ''
  });
  const [success, setSuccess] = useState(false);

  const timeSlots = [
    '09:00 - 11:00',
    '11:00 - 13:00',
    '13:00 - 15:00',
    '15:00 - 17:00',
    '17:00 - 19:00'
  ];

  useEffect(() => {
    loadBookings();
  }, [user]);

  const loadBookings = () => {
    const allBookings = getBookings();
    const userBookings = user.role === 'admin' 
      ? allBookings 
      : allBookings.filter(b => b.userId === user.id);
    setBookings(userBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newBooking: Booking = {
      id: `B${Date.now()}`,
      userId: user.id,
      date: formData.date,
      timeSlot: formData.timeSlot,
      purpose: formData.purpose,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    addBooking(newBooking);

    addNotification({
      id: Date.now().toString(),
      userId: user.id,
      title: 'Booking Request Submitted',
      message: `Your booking request for ${formData.date} has been submitted for approval`,
      type: 'booking',
      read: false,
      createdAt: new Date().toISOString()
    });

    addActivityLog({
      id: Date.now().toString(),
      userId: user.id,
      action: 'Booking Created',
      details: `Created booking for ${formData.date}, ${formData.timeSlot}`,
      timestamp: new Date().toISOString()
    });

    setSuccess(true);
    setFormData({ date: '', timeSlot: '', purpose: '' });
    loadBookings();
    
    setTimeout(() => {
      setSuccess(false);
      setShowForm(false);
    }, 2000);
  };

  const handleStatusUpdate = (bookingId: string, newStatus: 'approved' | 'rejected') => {
    updateBooking(bookingId, { status: newStatus });
    
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      addNotification({
        id: Date.now().toString(),
        userId: booking.userId,
        title: `Booking ${newStatus}`,
        message: `Your booking for ${booking.date} has been ${newStatus}`,
        type: 'booking',
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    loadBookings();
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

  const getUserName = (userId: string) => {
    const users = getUsers();
    const bookingUser = users.find(u => u.id === userId);
    return bookingUser ? `${bookingUser.firstName} ${bookingUser.lastName}` : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Lab Bookings</h1>
          <p className="text-gray-600">Reserve time slots for mobile bio lab access</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Book a Slot
          </Button>
        )}
      </div>

      {/* Booking Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Booking Request</CardTitle>
            <CardDescription>Fill in the details to reserve a lab slot</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>Booking request submitted successfully!</AlertDescription>
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
                <Button type="submit" className="flex-1">
                  Submit Request
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bookings List */}
      <div className="grid grid-cols-1 gap-4">
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No bookings yet</p>
              {!showForm && (
                <Button onClick={() => setShowForm(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Your First Slot
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{new Date(booking.date).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <p className="text-sm text-gray-600">{booking.timeSlot}</p>
                        </div>
                      </div>
                    </div>

                    {user.role === 'admin' && (
                      <p className="text-sm text-gray-600 mb-2">
                        Requested by: <span className="font-medium">{getUserName(booking.userId)}</span>
                      </p>
                    )}

                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">Purpose:</p>
                      <p className="text-sm">{booking.purpose}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Requested on {new Date(booking.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {user.role === 'admin' && booking.status === 'pending' && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(booking.id, 'approved')}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
