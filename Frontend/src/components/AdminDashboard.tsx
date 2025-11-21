import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Users, Beaker, FileText, Activity, Shield } from 'lucide-react';
import { type User } from '../types';
import adminService from '../services/admin.service';

interface AdminDashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    activeUsers: 0,
    totalSamples: 0,
    totalReports: 0,
    systemActivity: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboardStats();
      if (response.statusCode === 200 && response.payload) {
        setStats({
          activeUsers: response.payload.activeUsers || 0,
          totalSamples: response.payload.totalSamples || 0,
          totalReports: response.payload.totalReports || 0,
          systemActivity: response.payload.systemActivity || 0
        });
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">System overview and management</p>
      </div>

      {/* Stats Grid - 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Users Card */}
        <Card className="border-l-4 border-l-blue-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Active Users</p>
                <p className="text-3xl mt-2 font-bold text-gray-900">
                  {loading ? (
                    <span className="inline-block animate-pulse">...</span>
                  ) : (
                    stats.activeUsers
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Activated users
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sample Data Card */}
        <Card className="border-l-4 border-l-green-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Sample Data</p>
                <p className="text-3xl mt-2 font-bold text-gray-900">
                  {loading ? (
                    <span className="inline-block animate-pulse">...</span>
                  ) : (
                    stats.totalSamples
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Total samples
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <Beaker className="h-10 w-10 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Card */}
        <Card className="border-l-4 border-l-orange-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Reports</p>
                <p className="text-3xl mt-2 font-bold text-gray-900">
                  {loading ? (
                    <span className="inline-block animate-pulse">...</span>
                  ) : (
                    stats.totalReports
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Generated reports
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <FileText className="h-10 w-10 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Activity Card */}
        <Card className="border-l-4 border-l-purple-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">System Activity</p>
                <p className="text-3xl mt-2 font-bold text-gray-900">
                  {loading ? (
                    <span className="inline-block animate-pulse">...</span>
                  ) : (
                    stats.systemActivity
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Last 7 days
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <Activity className="h-10 w-10 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Features Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Management Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* User Management */}
          <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-300 hover:-translate-y-2 shadow-lg" style={{ background: 'linear-gradient(to bottom right, white, rgb(239 246 255 / 0.3))' }} onClick={() => onNavigate('admin-users')}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to bottom right, rgb(59 130 246), rgb(37 99 235))' }}>
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-gray-800 mb-1">User Management</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Manage users and permissions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue-500 text-white hover:bg-blue-600 font-semibold transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer" variant="default">
                Manage Users
              </Button>
            </CardContent>
          </Card>

          {/* System Log Review */}
          <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-purple-300 hover:-translate-y-2 shadow-lg" style={{ background: 'linear-gradient(to bottom right, white, rgb(250 245 255 / 0.3))' }} onClick={() => onNavigate('admin-logs')}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to bottom right, rgb(168 85 247), rgb(147 51 234))' }}>
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-gray-800 mb-1">System Logs</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Review system logs and events</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-purple-500 text-white hover:bg-purple-600 font-semibold transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer" variant="default">
                View Logs
              </Button>
            </CardContent>
          </Card>

          {/* Activity History */}
          <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-300 hover:-translate-y-2 shadow-lg" style={{ background: 'linear-gradient(to bottom right, white, rgb(240 253 244 / 0.3))' }} onClick={() => onNavigate('admin-logs')}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to bottom right, rgb(34 197 94), rgb(22 163 74))' }}>
                  <Activity className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-gray-800 mb-1">Activity History</CardTitle>
                  <CardDescription className="text-sm text-gray-600">View user activity history</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-green-500 text-white hover:bg-green-600 font-semibold transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer" variant="default">
                View History
              </Button>
            </CardContent>
          </Card>

          {/* Data Submission Moderation */}
          <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-orange-300 hover:-translate-y-2 shadow-lg" style={{ background: 'linear-gradient(to bottom right, white, rgb(255 247 237 / 0.3))' }} onClick={() => onNavigate('samples')}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to bottom right, rgb(249 115 22), rgb(234 88 12))' }}>
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-gray-800 mb-1">Sample Moderation</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Moderate and approve samples</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-orange-500 text-white hover:bg-orange-600 font-semibold transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer" variant="default">
                Moderate Samples
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
