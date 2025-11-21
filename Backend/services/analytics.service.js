import Sample from '../models/Sample.js';
import User from '../models/User.js';
import BLEDevice from '../models/BLEDevice.js';
import BLEReading from '../models/BLEReading.js';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize';

// User Analytics - Get user's own data statistics
export const getUserAnalytics = async (userId, filters = {}) => {
  const { startDate, endDate, sampleType } = filters;

  const whereClause = {
    userId,
    deletedAt: null
  };

  if (startDate) {
    whereClause.collectionDate = { ...whereClause.collectionDate, [Op.gte]: new Date(startDate) };
  }
  if (endDate) {
    whereClause.collectionDate = { ...whereClause.collectionDate, [Op.lte]: new Date(endDate) };
  }
  if (sampleType && sampleType !== 'all') {
    whereClause.sampleType = sampleType;
  }

  // Get all user samples
  const samples = await Sample.findAll({
    where: whereClause,
    order: [['collectionDate', 'ASC']]
  });

  // Sample trends over time
  const trendData = samples.reduce((acc, sample) => {
    const date = new Date(sample.collectionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!acc[date]) {
      acc[date] = { date, count: 0 };
    }
    acc[date].count++;
    return acc;
  }, {});

  // Monthly data
  const monthlyData = samples.reduce((acc, sample) => {
    const date = new Date(sample.collectionDate);
    const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month]++;
    return acc;
  }, {});

  // Sensor trends
  const sensorTrendData = samples.reduce((acc, sample) => {
    const date = new Date(sample.collectionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!acc[date]) {
      acc[date] = { date, temperature: [], pH: [], salinity: [] };
    }
    if (sample.temperature) acc[date].temperature.push(parseFloat(sample.temperature));
    if (sample.pH) acc[date].pH.push(parseFloat(sample.pH));
    if (sample.salinity) acc[date].salinity.push(parseFloat(sample.salinity));
    return acc;
  }, {});

  // Process sensor trends
  const processedSensorTrends = Object.values(sensorTrendData).map((item) => ({
    date: item.date,
    temperature: item.temperature.length > 0 ? (item.temperature.reduce((a, b) => a + b, 0) / item.temperature.length).toFixed(2) : 0,
    pH: item.pH.length > 0 ? (item.pH.reduce((a, b) => a + b, 0) / item.pH.length).toFixed(2) : 0,
    salinity: item.salinity.length > 0 ? (item.salinity.reduce((a, b) => a + b, 0) / item.salinity.length).toFixed(2) : 0
  }));

  // Sample type distribution
  const typeDistribution = samples.reduce((acc, sample) => {
    const type = sample.sampleType || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Status distribution
  const statusDistribution = samples.reduce((acc, sample) => {
    const status = sample.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Average values by type
  const avgByType = samples.reduce((acc, sample) => {
    const type = sample.sampleType || 'other';
    if (!acc[type]) {
      acc[type] = { temperature: [], pH: [], salinity: [] };
    }
    if (sample.temperature) acc[type].temperature.push(parseFloat(sample.temperature));
    if (sample.pH) acc[type].pH.push(parseFloat(sample.pH));
    if (sample.salinity) acc[type].salinity.push(parseFloat(sample.salinity));
    return acc;
  }, {});

  const processedAvgByType = Object.entries(avgByType).map(([type, data]) => {
    const avg = (arr) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : 0;
    return {
      name: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
      Temperature: parseFloat(avg(data.temperature)),
      pH: parseFloat(avg(data.pH)),
      Salinity: parseFloat(avg(data.salinity))
    };
  });

  // Get user's BLE devices and readings
  const userDevices = await BLEDevice.findAll({
    where: { userId, deletedAt: null }
  });

  const deviceIds = userDevices.map(d => d.id);
  const bleReadings = deviceIds.length > 0 ? await BLEReading.findAll({
    where: {
      deviceId: { [Op.in]: deviceIds },
      deletedAt: null
    },
    order: [['readingTimestamp', 'DESC']],
    limit: 500
  }) : [];

  // BLE trends
  const bleTrendData = bleReadings.reduce((acc, reading) => {
    const date = new Date(reading.readingTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (!acc[date]) {
      acc[date] = { date, temperature: [], pH: [], salinity: [] };
    }
    if (reading.temperature) acc[date].temperature.push(parseFloat(reading.temperature));
    if (reading.pH) acc[date].pH.push(parseFloat(reading.pH));
    if (reading.salinity) acc[date].salinity.push(parseFloat(reading.salinity));
    return acc;
  }, {});

  const processedBleTrends = Object.values(bleTrendData).map((item) => ({
    date: item.date,
    temperature: item.temperature.length > 0 ? (item.temperature.reduce((a, b) => a + b, 0) / item.temperature.length).toFixed(2) : 0,
    pH: item.pH.length > 0 ? (item.pH.reduce((a, b) => a + b, 0) / item.pH.length).toFixed(2) : 0,
    salinity: item.salinity.length > 0 ? (item.salinity.reduce((a, b) => a + b, 0) / item.salinity.length).toFixed(2) : 0
  })).slice(-50);

  return {
    summary: {
      totalSamples: samples.length,
      completed: samples.filter(s => s.status === 'completed').length,
      pending: samples.filter(s => s.status === 'pending').length,
      processing: samples.filter(s => s.status === 'processing').length
    },
    trends: {
      daily: Object.values(trendData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      monthly: Object.entries(monthlyData).map(([name, value]) => ({ name, value })).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()),
      sensorTrends: processedSensorTrends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      bleTrends: processedBleTrends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    },
    distribution: {
      byType: Object.entries(typeDistribution).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '),
        value
      })),
      byStatus: Object.entries(statusDistribution).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }))
    },
    averages: {
      byType: processedAvgByType
    },
    samples: samples.map(s => ({
      id: s.id,
      sampleId: s.sampleId,
      collectionDate: s.collectionDate,
      sampleType: s.sampleType,
      temperature: s.temperature,
      pH: s.pH,
      salinity: s.salinity,
      status: s.status
    }))
  };
};

// Admin Analytics - Get system-wide statistics
export const getAdminAnalytics = async (filters = {}) => {
  const { startDate, endDate, sampleType, userId } = filters;

  const whereClause = {
    deletedAt: null
  };

  if (startDate) {
    whereClause.collectionDate = { ...whereClause.collectionDate, [Op.gte]: new Date(startDate) };
  }
  if (endDate) {
    whereClause.collectionDate = { ...whereClause.collectionDate, [Op.lte]: new Date(endDate) };
  }
  if (sampleType && sampleType !== 'all') {
    whereClause.sampleType = sampleType;
  }
  if (userId && userId !== 'all') {
    whereClause.userId = parseInt(userId);
  }

  // Get all samples
  const samples = await Sample.findAll({
    where: whereClause,
    include: [{
      model: User,
      as: 'User',
      attributes: ['id', 'firstName', 'lastName', 'email', 'role']
    }],
    order: [['collectionDate', 'ASC']]
  });

  // Get all users
  const users = await User.findAll({
    where: { deletedAt: null, role: { [Op.ne]: 'Admin' } },
    attributes: ['id', 'firstName', 'lastName', 'email', 'role']
  });

  // System trends
  const trendData = samples.reduce((acc, sample) => {
    const date = new Date(sample.collectionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!acc[date]) {
      acc[date] = { date, count: 0 };
    }
    acc[date].count++;
    return acc;
  }, {});

  // Monthly data
  const monthlyData = samples.reduce((acc, sample) => {
    const date = new Date(sample.collectionDate);
    const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month]++;
    return acc;
  }, {});

  // Daily submission rate (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dailyData = samples
    .filter(s => new Date(s.collectionDate) >= thirtyDaysAgo)
    .reduce((acc, sample) => {
      const date = new Date(sample.collectionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!acc[date]) {
        acc[date] = { date, count: 0 };
      }
      acc[date].count++;
      return acc;
    }, {});

  // User activity
  const userActivity = samples.reduce((acc, sample) => {
    const userId = sample.userId;
    if (!acc[userId]) {
      const user = users.find(u => u.id === userId);
      acc[userId] = {
        userId,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        count: 0
      };
    }
    acc[userId].count++;
    return acc;
  }, {});

  // Samples by role
  const samplesByRole = samples.reduce((acc, sample) => {
    const role = sample.User?.role || 'Unknown';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  // Sample type distribution
  const typeDistribution = samples.reduce((acc, sample) => {
    const type = sample.sampleType || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Status distribution
  const statusDistribution = samples.reduce((acc, sample) => {
    const status = sample.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Status by type
  const statusByType = samples.reduce((acc, sample) => {
    const type = sample.sampleType || 'other';
    if (!acc[type]) {
      acc[type] = { type, pending: 0, processing: 0, completed: 0 };
    }
    const status = sample.status || 'pending';
    acc[type][status] = (acc[type][status] || 0) + 1;
    return acc;
  }, {});

  // Average values by type
  const avgByType = samples.reduce((acc, sample) => {
    const type = sample.sampleType || 'other';
    if (!acc[type]) {
      acc[type] = { temperature: [], pH: [], salinity: [] };
    }
    if (sample.temperature) acc[type].temperature.push(parseFloat(sample.temperature));
    if (sample.pH) acc[type].pH.push(parseFloat(sample.pH));
    if (sample.salinity) acc[type].salinity.push(parseFloat(sample.salinity));
    return acc;
  }, {});

  const processedAvgByType = Object.entries(avgByType).map(([type, data]) => {
    const avg = (arr) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : 0;
    return {
      name: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
      Temperature: parseFloat(avg(data.temperature)),
      pH: parseFloat(avg(data.pH)),
      Salinity: parseFloat(avg(data.salinity))
    };
  });

  const processedStatusByType = Object.values(statusByType).map((item) => ({
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1).replace('-', ' '),
    Pending: item.pending,
    Processing: item.processing,
    Completed: item.completed
  }));

  return {
    summary: {
      totalSamples: samples.length,
      totalUsers: users.length,
      completed: samples.filter(s => s.status === 'completed').length,
      pending: samples.filter(s => s.status === 'pending').length,
      processing: samples.filter(s => s.status === 'processing').length
    },
    trends: {
      daily: Object.values(trendData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      monthly: Object.entries(monthlyData).map(([name, value]) => ({ name, value })).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()),
      dailySubmission: Object.values(dailyData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    },
    userActivity: {
      topUsers: Object.values(userActivity).sort((a, b) => b.count - a.count).slice(0, 10),
      byRole: Object.entries(samplesByRole).map(([name, value]) => ({ name, value }))
    },
    distribution: {
      byType: Object.entries(typeDistribution).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '),
        value
      })),
      byStatus: Object.entries(statusDistribution).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }))
    },
    comparison: {
      statusByType: processedStatusByType,
      avgByType: processedAvgByType
    },
    users: users.map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role
    }))
  };
};

