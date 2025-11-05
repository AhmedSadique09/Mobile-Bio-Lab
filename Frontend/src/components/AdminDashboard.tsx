import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Beaker, FileText, Activity, AlertCircle } from 'lucide-react';
import { getUsers, getSamples, getBookings, getActivityLogs } from '../lib/storage';
import { type User } from '../types';

interface AdminDashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSamples: 0,
    pendingBookings: 0,
    activeUsers: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [userRoleData, setUserRoleData] = useState<any[]>([]);

  useEffect(() => {
    const users = getUsers();
    const samples = getSamples();
    const bookings = getBookings();
    const logs = getActivityLogs();

    setStats({
      totalUsers: users.length,
      totalSamples: samples.length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      activeUsers: users.filter(u => u.role !== 'admin').length
    });

    setRecentActivity(logs.slice(0, 5));

    const roleCount = {
      student: users.filter(u => u.role === 'student').length,
      researcher: users.filter(u => u.role === 'researcher').length,
      technician: users.filter(u => u.role === 'technician').length,
      admin: users.filter(u => u.role === 'admin').length
    };

    setUserRoleData([
      { name: 'Students', count: roleCount.student },
      { name: 'Researchers', count: roleCount.researcher },
      { name: 'Technicians', count: roleCount.technician },
      { name: 'Admins', count: roleCount.admin }
    ]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">System overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl mt-1">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.activeUsers} active</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Samples</p>
                <p className="text-2xl mt-1">{stats.totalSamples}</p>
              </div>
              <Beaker className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Bookings</p>
                <p className="text-2xl mt-1">{stats.pendingBookings}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Activity</p>
                <p className="text-2xl mt-1">{recentActivity.length}</p>
                <p className="text-xs text-gray-500 mt-1">Recent logs</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Distribution by Role</CardTitle>
            <CardDescription>Breakdown of users by their roles</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={userRoleData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                  <div className="p-2 bg-blue-100 rounded-lg mt-0.5">
                    <Activity className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{log.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{log.details}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View and manage users</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => onNavigate('admin-users')} className="w-full">
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Protocol Management</CardTitle>
            <CardDescription>Add and manage protocols</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => onNavigate('admin-protocols')} className="w-full">
              Manage Protocols
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Logs</CardTitle>
            <CardDescription>View system activity logs</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => onNavigate('admin-logs')} className="w-full">
              View Logs
            </Button>
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
            <Button onClick={() => onNavigate('admin-users')} variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Users className="h-5 w-5" />
              <span>View Users</span>
            </Button>
            <Button onClick={() => onNavigate('samples')} variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Beaker className="h-5 w-5" />
              <span>All Samples</span>
            </Button>
            <Button onClick={() => onNavigate('admin-protocols')} variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <FileText className="h-5 w-5" />
              <span>Add Protocol</span>
            </Button>
            <Button onClick={() => onNavigate('admin-logs')} variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Activity className="h-5 w-5" />
              <span>Activity Logs</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
