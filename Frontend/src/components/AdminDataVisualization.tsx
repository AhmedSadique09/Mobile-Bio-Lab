import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Calendar, TrendingUp, BarChart3, PieChart as PieChartIcon, Download, Users } from 'lucide-react';
import { type User } from '../types';
import sampleService from '../services/sample.service';
import adminService from '../services/admin.service';
import { toast } from 'sonner';

interface AdminDataVisualizationProps {
  user: User;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export function AdminDataVisualization({ user }: AdminDataVisualizationProps) {
  const [samples, setSamples] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all system data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch all samples (admin sees all)
      const samplesResponse = await sampleService.getSamples('', 1, 1000);
      if (samplesResponse.statusCode === 200) {
        setSamples(samplesResponse.payload || []);
      }

      // Fetch all users
      const usersResponse = await adminService.getUsers(1, '');
      if (usersResponse.statusCode === 200) {
        setAllUsers(usersResponse.payload?.users || []);
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load data for visualization');
    } finally {
      setLoading(false);
    }
  };

  // System-wide Sample Trends
  const sampleTrendData = useMemo(() => {
    const grouped = samples.reduce((acc: any, sample) => {
      const date = new Date(sample.collectionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!acc[date]) {
        acc[date] = { date, count: 0 };
      }
      acc[date].count++;
      return acc;
    }, {});
    
    return Object.values(grouped).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [samples]);

  // User Activity (Samples per User)
  const userActivityData = useMemo(() => {
    const grouped = samples.reduce((acc: any, sample) => {
      const userId = sample.userId;
      if (!acc[userId]) {
        const user = allUsers.find(u => u.id === userId) || { firstName: 'Unknown', lastName: 'User' };
        acc[userId] = { 
          userId, 
          name: `${user.firstName} ${user.lastName}`,
          count: 0 
        };
      }
      acc[userId].count++;
      return acc;
    }, {});
    
    return Object.values(grouped)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10); // Top 10 users
  }, [samples, allUsers]);

  // Sample Type Distribution
  const sampleTypeData = useMemo(() => {
    const grouped = samples.reduce((acc: any, sample) => {
      const type = sample.sampleType || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([name, value]: [string, any]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '),
      value
    }));
  }, [samples]);

  // Status Distribution
  const statusData = useMemo(() => {
    const grouped = samples.reduce((acc: any, sample) => {
      const status = sample.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([name, value]: [string, any]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  }, [samples]);

  // Samples by User Role
  const samplesByRole = useMemo(() => {
    const roleMap: any = {};
    samples.forEach(sample => {
      const user = allUsers.find(u => u.id === sample.userId);
      const role = user?.role || 'Unknown';
      if (!roleMap[role]) {
        roleMap[role] = 0;
      }
      roleMap[role]++;
    });
    
    return Object.entries(roleMap).map(([name, value]: [string, any]) => ({
      name,
      value
    }));
  }, [samples, allUsers]);

  // Monthly Sample Collection
  const monthlyData = useMemo(() => {
    const grouped = samples.reduce((acc: any, sample) => {
      const date = new Date(sample.collectionDate);
      const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month]++;
      return acc;
    }, {});
    
    return Object.entries(grouped)
      .map(([name, value]: [string, any]) => ({ name, value }))
      .sort((a: any, b: any) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [samples]);

  // Average Sensor Values by Type
  const averageValuesByType = useMemo(() => {
    const grouped = samples.reduce((acc: any, sample) => {
      const type = sample.sampleType || 'other';
      if (!acc[type]) {
        acc[type] = { type, temperature: [], pH: [], salinity: [] };
      }
      if (sample.temperature) acc[type].temperature.push(parseFloat(sample.temperature));
      if (sample.pH) acc[type].pH.push(parseFloat(sample.pH));
      if (sample.salinity) acc[type].salinity.push(parseFloat(sample.salinity));
      return acc;
    }, {});
    
    return Object.values(grouped).map((item: any) => {
      const avg = (arr: number[]) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : 0;
      return {
        name: item.type.charAt(0).toUpperCase() + item.type.slice(1).replace('-', ' '),
        Temperature: parseFloat(avg(item.temperature)),
        pH: parseFloat(avg(item.pH)),
        Salinity: parseFloat(avg(item.salinity))
      };
    });
  }, [samples]);

  // Sample Status by Type
  const sampleStatusByType = useMemo(() => {
    const grouped = samples.reduce((acc: any, sample) => {
      const type = sample.sampleType || 'other';
      if (!acc[type]) {
        acc[type] = { type, pending: 0, processing: 0, completed: 0 };
      }
      const status = sample.status || 'pending';
      acc[type][status] = (acc[type][status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.values(grouped).map((item: any) => ({
      name: item.type.charAt(0).toUpperCase() + item.type.slice(1).replace('-', ' '),
      Pending: item.pending,
      Processing: item.processing,
      Completed: item.completed
    }));
  }, [samples]);

  // Daily Submission Rate
  const dailySubmissionData = useMemo(() => {
    const grouped = samples.reduce((acc: any, sample) => {
      const date = new Date(sample.collectionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!acc[date]) {
        acc[date] = { date, count: 0 };
      }
      acc[date].count++;
      return acc;
    }, {});
    
    return Object.values(grouped)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
  }, [samples]);

  const handleExport = () => {
    const csv = [
      ['Date', 'Sample ID', 'User', 'Type', 'Temperature', 'pH', 'Salinity', 'Status'].join(','),
      ...samples.map(s => {
        const user = allUsers.find(u => u.id === s.userId) || { firstName: 'Unknown', lastName: 'User' };
        return [
          s.collectionDate,
          s.sampleId,
          `${user.firstName} ${user.lastName}`,
          s.sampleType,
          s.temperature || '',
          s.pH || '',
          s.salinity || '',
          s.status
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Analytics</h1>
          <p className="text-muted-foreground">Monitor overall system activity and biological data trends</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Samples</p>
                <p className="text-2xl mt-1 font-bold">{samples.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl mt-1 font-bold">{samples.filter(s => s.status === 'completed').length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl mt-1 font-bold">{samples.filter(s => s.status === 'pending').length}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            User Activity
          </TabsTrigger>
          <TabsTrigger value="comparison" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Comparison
          </TabsTrigger>
          <TabsTrigger value="distribution" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            Distribution
          </TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Sample Collection Trends</CardTitle>
                <CardDescription>Total samples collected over time</CardDescription>
              </CardHeader>
              <CardContent>
                {sampleTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={sampleTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Collection</CardTitle>
                <CardDescription>Total samples per month</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Submission Rate</CardTitle>
              <CardDescription>Sample submissions over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {dailySubmissionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={dailySubmissionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Activity Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Users by Sample Count</CardTitle>
              <CardDescription>Most active users in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {userActivityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={userActivityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  No user activity data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Samples by User Role</CardTitle>
              <CardDescription>Distribution of samples across user roles</CardDescription>
            </CardHeader>
            <CardContent>
              {samplesByRole.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={samplesByRole}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sample Status by Type</CardTitle>
                <CardDescription>Status distribution across sample types</CardDescription>
              </CardHeader>
              <CardContent>
                {sampleStatusByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sampleStatusByType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Pending" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="Processing" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="Completed" stackId="a" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Sensor Values by Type</CardTitle>
                <CardDescription>Mean temperature, pH, and salinity per sample type</CardDescription>
              </CardHeader>
              <CardContent>
                {averageValuesByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={averageValuesByType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Temperature" fill="#ef4444" />
                      <Bar dataKey="pH" fill="#3b82f6" />
                      <Bar dataKey="Salinity" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sample Type Distribution</CardTitle>
                <CardDescription>System-wide breakdown by sample type</CardDescription>
              </CardHeader>
              <CardContent>
                {sampleTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sampleTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sampleTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Overall status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

