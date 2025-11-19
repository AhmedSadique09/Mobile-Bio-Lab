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
import { Calendar, TrendingUp, BarChart3, PieChart as PieChartIcon, Download } from 'lucide-react';
import { type User } from '../types';
import sampleService from '../services/sample.service';
import BLEService from '../services/ble.service';
import { toast } from 'sonner';

interface UserDataVisualizationProps {
  user: User;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export function UserDataVisualization({ user }: UserDataVisualizationProps) {
  const [samples, setSamples] = useState<any[]>([]);
  const [bleDevices, setBleDevices] = useState<any[]>([]);
  const [bleReadings, setBleReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's samples
      const samplesResponse = await sampleService.getSamples('', 1, 1000);
      if (samplesResponse.statusCode === 200) {
        // Filter to only user's samples
        const userSamples = (samplesResponse.payload || []).filter((s: any) => s.userId === parseInt(user.id));
        setSamples(userSamples);
      }

      // Fetch user's BLE devices
      const devicesResponse = await BLEService.getDevices();
      if (devicesResponse.statusCode === 200) {
        const devices = (devicesResponse.payload || []).filter((d: any) => d.userId === parseInt(user.id));
        setBleDevices(devices);
        
        // Fetch readings for user's devices
        const allReadings: any[] = [];
        for (const device of devices) {
          try {
            const readingsResponse = await BLEService.getReadings(device.deviceId, { limit: 500 });
            if (readingsResponse.statusCode === 200 && readingsResponse.payload) {
              allReadings.push(...readingsResponse.payload);
            }
          } catch (err) {
            console.error(`Failed to load readings for device ${device.deviceId}:`, err);
          }
        }
        setBleReadings(allReadings);
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load data for visualization');
    } finally {
      setLoading(false);
    }
  };

  // Sample Trends Over Time
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

  // Temperature, pH, Salinity Trends
  const sensorTrendData = useMemo(() => {
    const grouped = samples.reduce((acc: any, sample) => {
      const date = new Date(sample.collectionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!acc[date]) {
        acc[date] = { date, temperature: 0, pH: 0, salinity: 0, count: 0 };
      }
      if (sample.temperature) {
        acc[date].temperature += parseFloat(sample.temperature);
        acc[date].count++;
      }
      if (sample.pH) {
        acc[date].pH += parseFloat(sample.pH);
      }
      if (sample.salinity) {
        acc[date].salinity += parseFloat(sample.salinity);
      }
      return acc;
    }, {});
    
    return Object.values(grouped).map((item: any) => ({
      date: item.date,
      temperature: item.count > 0 ? parseFloat((item.temperature / item.count).toFixed(2)) : 0,
      pH: item.count > 0 ? parseFloat((item.pH / item.count).toFixed(2)) : 0,
      salinity: item.count > 0 ? parseFloat((item.salinity / item.count).toFixed(2)) : 0
    })).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [samples]);

  // BLE Sensor Readings Over Time
  const bleTrendData = useMemo(() => {
    const grouped = bleReadings.reduce((acc: any, reading) => {
      const date = new Date(reading.readingTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      if (!acc[date]) {
        acc[date] = { date, temperature: 0, pH: 0, salinity: 0, count: 0 };
      }
      if (reading.temperature) {
        acc[date].temperature += parseFloat(reading.temperature);
        acc[date].count++;
      }
      if (reading.pH) {
        acc[date].pH += parseFloat(reading.pH);
      }
      if (reading.salinity) {
        acc[date].salinity += parseFloat(reading.salinity);
      }
      return acc;
    }, {});
    
    return Object.values(grouped).map((item: any) => ({
      date: item.date,
      temperature: item.count > 0 ? parseFloat((item.temperature / item.count).toFixed(2)) : 0,
      pH: item.count > 0 ? parseFloat((item.pH / item.count).toFixed(2)) : 0,
      salinity: item.count > 0 ? parseFloat((item.salinity / item.count).toFixed(2)) : 0
    })).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ).slice(-50);
  }, [bleReadings]);

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

  // Sample Status Distribution
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

  // Average Values by Sample Type
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

  const handleExport = () => {
    const csv = [
      ['Date', 'Sample ID', 'Type', 'Temperature', 'pH', 'Salinity', 'Status'].join(','),
      ...samples.map(s => [
        s.collectionDate,
        s.sampleId,
        s.sampleType,
        s.temperature || '',
        s.pH || '',
        s.salinity || '',
        s.status
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-sample-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Data Visualization</h1>
          <p className="text-muted-foreground">Track trends and patterns in your biological samples</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
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
                <CardTitle>My Sample Collection Trends</CardTitle>
                <CardDescription>Your samples collected over time</CardDescription>
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
                    No sample data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Collection</CardTitle>
                <CardDescription>Your samples per month</CardDescription>
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
              <CardTitle>Field Conditions Trends</CardTitle>
              <CardDescription>Temperature, pH, and Salinity in your samples</CardDescription>
            </CardHeader>
            <CardContent>
              {sensorTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={sensorTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} name="Temperature (°C)" />
                    <Line yAxisId="left" type="monotone" dataKey="pH" stroke="#3b82f6" strokeWidth={2} name="pH" />
                    <Line yAxisId="right" type="monotone" dataKey="salinity" stroke="#10b981" strokeWidth={2} name="Salinity (ppt)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  No sensor data available
                </div>
              )}
            </CardContent>
          </Card>

          {bleTrendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>BLE Sensor Readings</CardTitle>
                <CardDescription>Real-time data from your BLE devices</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={bleTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} name="Temperature (°C)" />
                    <Line yAxisId="left" type="monotone" dataKey="pH" stroke="#3b82f6" strokeWidth={2} name="pH" />
                    <Line yAxisId="right" type="monotone" dataKey="salinity" stroke="#10b981" strokeWidth={2} name="Salinity (ppt)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
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
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sample Type Distribution</CardTitle>
                <CardDescription>Your samples by type</CardDescription>
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
                <CardDescription>Your samples by status</CardDescription>
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

