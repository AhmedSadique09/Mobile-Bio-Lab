import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Beaker, FileText, Clock, TrendingUp, Droplet, Mountain, Leaf } from 'lucide-react';
import { getSamples, getBookings, getProtocols } from '../lib/storage';
import { type User, type Sample, type Booking } from '../types';

interface DashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

export function Dashboard({ user, onNavigate }: DashboardProps) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [protocols, setProtocols] = useState([]);

  useEffect(() => {
    const allSamples = getSamples();
    const userSamples = allSamples.filter(s => s.userId === user.id);
    setSamples(userSamples);

    const allBookings = getBookings();
    const userBookings = allBookings.filter(b => b.userId === user.id);
    setBookings(userBookings);

    setProtocols(getProtocols() as any);
  }, [user.id]);

  const sampleTypeData = [
    { name: 'Water', value: samples.filter(s => s.sampleType === 'water').length, color: '#3b82f6' },
    { name: 'Soil', value: samples.filter(s => s.sampleType === 'soil').length, color: '#f59e0b' },
    { name: 'Plant', value: samples.filter(s => s.sampleType === 'plant').length, color: '#10b981' },
    { name: 'Bio Fluids', value: samples.filter(s => s.sampleType === 'biological-fluids').length, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const sampleTrendData = samples.slice(-7).map(s => ({
    date: new Date(s.collectionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    samples: 1
  }));

  const recentSamples = samples.slice(-3).reverse();
  const upcomingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'approved');

  const getSampleIcon = (type: string) => {
    switch (type) {
      case 'water': return <Droplet className="h-4 w-4" />;
      case 'soil': return <Mountain className="h-4 w-4" />;
      case 'plant': return <Leaf className="h-4 w-4" />;
      default: return <Beaker className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl mb-2">Welcome back, {user.firstName}!</h1>
        <p className="text-gray-600">Here's an overview of your laboratory activities</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Samples</p>
                <p className="text-2xl mt-1">{samples.length}</p>
              </div>
              <Beaker className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Bookings</p>
                <p className="text-2xl mt-1">{upcomingBookings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Protocols</p>
                <p className="text-2xl mt-1">{protocols.length}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl mt-1">{samples.filter(s => s.status === 'completed').length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sample Distribution</CardTitle>
            <CardDescription>Breakdown by sample type</CardDescription>
          </CardHeader>
          <CardContent>
            {sampleTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sampleTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sampleTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No sample data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sample Activity</CardTitle>
            <CardDescription>Recent sample collection trends</CardDescription>
          </CardHeader>
          <CardContent>
            {sampleTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={sampleTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="samples" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Samples and Upcoming Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Samples</CardTitle>
            <CardDescription>Your latest sample collections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSamples.length > 0 ? (
                recentSamples.map(sample => (
                  <div key={sample.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getSampleIcon(sample.sampleType)}
                      </div>
                      <div>
                        <p className="text-sm">{sample.sampleId}</p>
                        <p className="text-xs text-gray-500">{sample.sampleType}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(sample.status)}>
                      {sample.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No samples yet</p>
              )}
              <Button variant="outline" className="w-full" onClick={() => onNavigate('samples')}>
                View All Samples
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
            <CardDescription>Your scheduled lab access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingBookings.length > 0 ? (
                upcomingBookings.slice(0, 3).map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm">{new Date(booking.date).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">{booking.timeSlot}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No upcoming bookings</p>
              )}
              <Button variant="outline" className="w-full" onClick={() => onNavigate('bookings')}>
                Book a Slot
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button onClick={() => onNavigate('add-sample')} className="h-auto py-4 flex flex-col gap-2">
              <Beaker className="h-5 w-5" />
              <span>Add Sample</span>
            </Button>
            <Button onClick={() => onNavigate('bookings')} variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Calendar className="h-5 w-5" />
              <span>Book Slot</span>
            </Button>
            <Button onClick={() => onNavigate('protocols')} variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <FileText className="h-5 w-5" />
              <span>View Protocols</span>
            </Button>
            <Button onClick={() => onNavigate('reports')} variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <TrendingUp className="h-5 w-5" />
              <span>Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
