import PDFDocument from 'pdfkit';
import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Sample from '../models/Sample.js';
import User from '../models/User.js';
import BLEReading from '../models/BLEReading.js';
import BLEDevice from '../models/BLEDevice.js';
import ScanEvent from '../models/ScanEvent.js';
import Report from '../models/Report.js';
import { Op } from 'sequelize';
import * as AnalyticsService from './analytics.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

/**
 * Generate a chart image using canvas
 */
const generateChartImage = (data, type = 'bar', width = 800, height = 400) => {
  try {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Chart area
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const chartX = padding;
    const chartY = padding;

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = chartY + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(chartX, y);
      ctx.lineTo(chartX + chartWidth, y);
      ctx.stroke();
    }

    if (type === 'bar' && data.length > 0) {
      const barWidth = chartWidth / data.length * 0.7;
      const maxValue = Math.max(...data.map(d => d.value));
      const barSpacing = chartWidth / data.length;

      data.forEach((item, index) => {
        const barHeight = (item.value / maxValue) * chartHeight;
        const x = chartX + index * barSpacing + (barSpacing - barWidth) / 2;
        const y = chartY + chartHeight - barHeight;

        // Bar color
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(x, y, barWidth, barHeight);

        // Label
        ctx.fillStyle = '#374151';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.name.substring(0, 10), x + barWidth / 2, chartY + chartHeight + 15);
      });

      // Y-axis labels
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      for (let i = 0; i <= 5; i++) {
        const value = (maxValue / 5) * (5 - i);
        const y = chartY + (chartHeight / 5) * i;
        ctx.fillText(value.toFixed(0), chartX - 10, y + 4);
      }
    } else if (type === 'line' && data.length > 0) {
      const maxValue = Math.max(...data.map(d => d.value));
      const pointSpacing = chartWidth / (data.length - 1 || 1);

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();

      data.forEach((item, index) => {
        const x = chartX + index * pointSpacing;
        const y = chartY + chartHeight - (item.value / maxValue) * chartHeight;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Points
      data.forEach((item, index) => {
        const x = chartX + index * pointSpacing;
        const y = chartY + chartHeight - (item.value / maxValue) * chartHeight;
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Labels
      ctx.fillStyle = '#374151';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      data.forEach((item, index) => {
        const x = chartX + index * pointSpacing;
        ctx.fillText(item.name.substring(0, 8), x, chartY + chartHeight + 15);
      });
    }

    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Error generating chart image:', error);
    // Return a simple placeholder image
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Chart unavailable', width / 2, height / 2);
    return canvas.toBuffer('image/png');
  }
};

/**
 * Generate a map image showing sample locations
 */
const generateMapImage = (samples, width = 800, height = 400) => {
  try {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);

    if (samples.length === 0) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No location data available', width / 2, height / 2);
      return canvas.toBuffer('image/png');
    }

    // Calculate bounds
    const lats = samples.map(s => parseFloat(s.latitude)).filter(l => !isNaN(l));
    const lngs = samples.map(s => parseFloat(s.longitude)).filter(l => !isNaN(l));

    if (lats.length === 0 || lngs.length === 0) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No valid location data', width / 2, height / 2);
      return canvas.toBuffer('image/png');
    }

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.01;
    const lngRange = maxLng - minLng || 0.01;

    const padding = 40;
    const mapWidth = width - padding * 2;
    const mapHeight = height - padding * 2;

    // Draw grid
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const x = padding + (mapWidth / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + mapHeight);
      ctx.stroke();
    }
    for (let i = 0; i <= 4; i++) {
      const y = padding + (mapHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + mapWidth, y);
      ctx.stroke();
    }

    // Draw sample points
    const colors = {
      'water': '#3b82f6',
      'soil': '#10b981',
      'plant': '#f59e0b',
      'biological-fluids': '#ef4444',
      'other': '#8b5cf6'
    };

    samples.forEach(sample => {
      const lat = parseFloat(sample.latitude);
      const lng = parseFloat(sample.longitude);

      if (isNaN(lat) || isNaN(lng)) return;

      const x = padding + ((lng - minLng) / lngRange) * mapWidth;
      const y = padding + mapHeight - ((lat - minLat) / latRange) * mapHeight;

      const color = colors[sample.sampleType] || colors.other;

      // Draw point
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Outer ring
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Legend
    const legendY = height - 30;
    let legendX = padding;
    Object.entries(colors).forEach(([type, color]) => {
      if (samples.some(s => s.sampleType === type)) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(legendX, legendY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#374151';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '), legendX + 10, legendY + 4);
        legendX += 100;
      }
    });

    // Coordinates info
    ctx.fillStyle = '#6b7280';
    ctx.font = '9px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Bounds: ${minLat.toFixed(4)}, ${minLng.toFixed(4)} to ${maxLat.toFixed(4)}, ${maxLng.toFixed(4)}`, padding, 20);

    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Error generating map image:', error);
    // Return a simple placeholder image
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Map unavailable', width / 2, height / 2);
    return canvas.toBuffer('image/png');
  }
};

/**
 * Calculate statistical analysis
 */
const calculateAnalysis = (samples) => {
  const analysis = {
    totalSamples: samples.length,
    byType: {},
    byStatus: {},
    averageValues: {
      temperature: [],
      pH: [],
      salinity: []
    },
    locationStats: {
      uniqueLocations: new Set(),
      coverage: {}
    }
  };

  samples.forEach(sample => {
    // Type distribution
    const type = sample.sampleType || 'other';
    analysis.byType[type] = (analysis.byType[type] || 0) + 1;

    // Status distribution
    const status = sample.status || 'pending';
    analysis.byStatus[status] = (analysis.byStatus[status] || 0) + 1;

    // Average values
    if (sample.temperature) analysis.averageValues.temperature.push(parseFloat(sample.temperature));
    if (sample.pH) analysis.averageValues.pH.push(parseFloat(sample.pH));
    if (sample.salinity) analysis.averageValues.salinity.push(parseFloat(sample.salinity));

    // Location stats
    if (sample.latitude && sample.longitude) {
      const lat = parseFloat(sample.latitude) || 0;
      const lng = parseFloat(sample.longitude) || 0;
      const locKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      analysis.locationStats.uniqueLocations.add(locKey);
    }
  });

  // Calculate averages
  const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const stdDev = (arr, mean) => {
    if (arr.length === 0) return 0;
    const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  };

  const tempAvg = avg(analysis.averageValues.temperature);
  const phAvg = avg(analysis.averageValues.pH);
  const salAvg = avg(analysis.averageValues.salinity);

  analysis.statistics = {
    temperature: {
      average: tempAvg.toFixed(2),
      min: analysis.averageValues.temperature.length > 0 ? Math.min(...analysis.averageValues.temperature).toFixed(2) : 'N/A',
      max: analysis.averageValues.temperature.length > 0 ? Math.max(...analysis.averageValues.temperature).toFixed(2) : 'N/A',
      stdDev: stdDev(analysis.averageValues.temperature, tempAvg).toFixed(2)
    },
    pH: {
      average: phAvg.toFixed(2),
      min: analysis.averageValues.pH.length > 0 ? Math.min(...analysis.averageValues.pH).toFixed(2) : 'N/A',
      max: analysis.averageValues.pH.length > 0 ? Math.max(...analysis.averageValues.pH).toFixed(2) : 'N/A',
      stdDev: stdDev(analysis.averageValues.pH, phAvg).toFixed(2)
    },
    salinity: {
      average: salAvg.toFixed(2),
      min: analysis.averageValues.salinity.length > 0 ? Math.min(...analysis.averageValues.salinity).toFixed(2) : 'N/A',
      max: analysis.averageValues.salinity.length > 0 ? Math.max(...analysis.averageValues.salinity).toFixed(2) : 'N/A',
      stdDev: stdDev(analysis.averageValues.salinity, salAvg).toFixed(2)
    }
  };

  analysis.locationStats.uniqueLocationCount = analysis.locationStats.uniqueLocations.size;

  return analysis;
};

/**
 * Generate PDF report
 */
export const generateReport = async (userId, generatedBy, options = {}) => {
  const {
    title = null,
    sampleIds = null
  } = options;

  let report;
  try {
    // Get user info if generating for a specific user
    let userInfo = null;
    if (userId) {
      userInfo = await User.findByPk(userId, {
        attributes: ['id', 'firstName', 'lastName', 'email']
      });
    }

    // Generate title
    let reportTitle = title;
    if (!reportTitle) {
      const userPart = userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : 'User';
      reportTitle = `Report - ${userPart} - ${new Date().toLocaleDateString()}`;
    }

    // Generate description
    const reportDescription = userInfo
      ? `Report for ${userInfo.firstName} ${userInfo.lastName} - Completed samples only`
      : 'User report - Completed samples only';

    // Create report record
    report = await Report.create({
      reportType: 'user', // Always user report type
      userId,
      generatedBy,
      title: reportTitle,
      description: reportDescription,
      filePath: 'pending', // Temporary value, will be updated after PDF generation
      status: 'generating',
      metadata: {}
    });

    // Build query filters - only completed samples
    const whereClause = {
      deletedAt: null,
      status: 'completed' // Only completed samples
    };

    if (!userId) {
      throw new Error('User ID is required for report generation');
    }

    whereClause.userId = userId;

    // If specific sample IDs are provided, filter by them and verify they belong to the user
    if (sampleIds && Array.isArray(sampleIds) && sampleIds.length > 0) {
      whereClause.id = { [Op.in]: sampleIds };
    }

    // Fetch samples
    const samples = await Sample.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        required: false
      }],
      order: [['collectionDate', 'DESC']]
    });

    // Validate that we have samples
    if (!samples || samples.length === 0) {
      throw new Error('No completed samples found for the selected user');
    }

    // Verify all samples belong to the user (security check)
    const invalidSamples = samples.filter(s => s.userId !== userId);
    if (invalidSamples.length > 0) {
      throw new Error('Some selected samples do not belong to the selected user');
    }

    // Get analytics data - filter by the selected samples only
    // We'll calculate analytics from the fetched samples directly instead of calling the service
    // This ensures we only get analytics for the selected completed samples
    const analytics = {
      summary: {
        totalSamples: samples.length,
        completed: samples.length,
        pending: 0,
        processing: 0
      },
      trends: {
        daily: [],
        monthly: [],
        sensorTrends: []
      },
      distribution: {
        byType: {},
        byStatus: { completed: samples.length, pending: 0, processing: 0 }
      },
      averages: {
        byType: []
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

    // Calculate distribution by type
    const typeDistribution = samples.reduce((acc, sample) => {
      const type = sample.sampleType || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    analytics.distribution.byType = Object.entries(typeDistribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '),
      value
    }));

    // Calculate analysis
    const analysis = calculateAnalysis(samples);

    // Ensure reports directory exists
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
      console.log('Created reports directory:', reportsDir);
    }

    // Generate file path
    const fileName = `report-${report.id}-${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);
    console.log('Generating report PDF at:', filePath);
    console.log('Reports directory:', reportsDir);

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(24).text(report.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);
    if (userId && userInfo) {
      doc.text(`User: ${userInfo.firstName} ${userInfo.lastName} (${userInfo.email})`, { align: 'center' });
    }
    doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Summary Section
    doc.fontSize(18).text('Executive Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(11);
    doc.text(`Total Samples: ${analysis.totalSamples}`);
    doc.text(`Unique Locations: ${analysis.locationStats.uniqueLocationCount}`);
    doc.text(`Completed: ${analysis.byStatus.completed || 0}`);
    doc.text(`Processing: ${analysis.byStatus.processing || 0}`);
    doc.text(`Pending: ${analysis.byStatus.pending || 0}`);
    doc.moveDown();

    // Statistics
    if (analysis.statistics.temperature.average !== 'N/A') {
      doc.text(`Average Temperature: ${analysis.statistics.temperature.average}°C`);
      doc.text(`Average pH: ${analysis.statistics.pH.average}`);
      doc.text(`Average Salinity: ${analysis.statistics.salinity.average}`);
    }
    doc.moveDown(2);

    // Sample Type Distribution Chart
    try {
      if (analytics.distribution?.byType && analytics.distribution.byType.length > 0) {
        doc.fontSize(16).text('Sample Type Distribution', { underline: true });
        doc.moveDown();
        const typeChart = generateChartImage(analytics.distribution.byType, 'bar');
        doc.image(typeChart, { width: 500, align: 'center' });
        doc.moveDown(2);
      }
    } catch (chartError) {
      console.error('Error generating type chart:', chartError);
      doc.fontSize(14).text('Sample Type Distribution: Chart generation failed', { align: 'center' });
      doc.moveDown(2);
    }

    // Status Distribution Chart
    try {
      if (analytics.distribution?.byStatus && analytics.distribution.byStatus.length > 0) {
        doc.fontSize(16).text('Status Distribution', { underline: true });
        doc.moveDown();
        const statusChart = generateChartImage(analytics.distribution.byStatus, 'bar');
        doc.image(statusChart, { width: 500, align: 'center' });
        doc.moveDown(2);
      }
    } catch (chartError) {
      console.error('Error generating status chart:', chartError);
      // Skip status chart if it fails
    }

    // Map Visualization
    try {
      if (samples.length > 0 && samples.some(s => s.latitude && s.longitude)) {
        doc.fontSize(16).text('Sample Location Map', { underline: true });
        doc.moveDown();
        const mapImage = generateMapImage(samples);
        doc.image(mapImage, { width: 500, align: 'center' });
        doc.moveDown(2);
      }
    } catch (mapError) {
      console.error('Error generating map:', mapError);
      doc.fontSize(14).text('Sample Location Map: Map generation failed', { align: 'center' });
      doc.moveDown(2);
    }

    // Detailed Analysis
    doc.addPage();
    doc.fontSize(18).text('Detailed Analysis', { underline: true });
    doc.moveDown();

    // Statistical Analysis
    doc.fontSize(14).text('Statistical Analysis', { underline: true });
    doc.moveDown();
    doc.fontSize(11);
    if (analysis.statistics.temperature.average !== 'N/A') {
      doc.text('Temperature Statistics:');
      doc.text(`  Average: ${analysis.statistics.temperature.average}°C`);
      doc.text(`  Min: ${analysis.statistics.temperature.min}°C`);
      doc.text(`  Max: ${analysis.statistics.temperature.max}°C`);
      doc.text(`  Std Dev: ${analysis.statistics.temperature.stdDev}`);
      doc.moveDown();
    }

    if (analysis.statistics.pH.average !== 'N/A') {
      doc.text('pH Statistics:');
      doc.text(`  Average: ${analysis.statistics.pH.average}`);
      doc.text(`  Min: ${analysis.statistics.pH.min}`);
      doc.text(`  Max: ${analysis.statistics.pH.max}`);
      doc.text(`  Std Dev: ${analysis.statistics.pH.stdDev}`);
      doc.moveDown();
    }

    if (analysis.statistics.salinity.average !== 'N/A') {
      doc.text('Salinity Statistics:');
      doc.text(`  Average: ${analysis.statistics.salinity.average}`);
      doc.text(`  Min: ${analysis.statistics.salinity.min}`);
      doc.text(`  Max: ${analysis.statistics.salinity.max}`);
      doc.text(`  Std Dev: ${analysis.statistics.salinity.stdDev}`);
      doc.moveDown();
    }

    // Sample Type Breakdown
    doc.fontSize(14).text('Sample Type Breakdown', { underline: true });
    doc.moveDown();
    doc.fontSize(11);
    Object.entries(analysis.byType).forEach(([type, count]) => {
      const percentage = ((count / analysis.totalSamples) * 100).toFixed(1);
      doc.text(`${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}: ${count} (${percentage}%)`);
    });
    doc.moveDown(2);

    // Sample list (for user reports)
    if (samples.length > 0) {
      doc.fontSize(14).text('Sample Details', { underline: true });
      doc.moveDown();
      doc.fontSize(11);
      samples.slice(0, 20).forEach((sample, index) => {
        doc.text(`${index + 1}. ${sample.sampleId} - ${sample.sampleType} (${sample.status})`);
      });
      if (samples.length > 20) {
        doc.text(`... and ${samples.length - 20} more samples`);
      }
      doc.moveDown(2);
    }

    // Footer
    doc.fontSize(8).text(`Report ID: ${report.id} | Generated by Mobile Bio Lab System`, { align: 'center' });

    // Finalize PDF
    doc.end();

    // Wait for PDF to be written
    await new Promise((resolve, reject) => {
      stream.on('finish', () => {
        console.log('PDF file written successfully');
        resolve();
      });
      stream.on('error', (err) => {
        console.error('PDF stream error:', err);
        reject(err);
      });
    });

    // Verify file was created
    if (!fs.existsSync(filePath)) {
      throw new Error('PDF file was not created');
    }

    // Get file size
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    console.log('Report PDF generated successfully, size:', fileSize, 'bytes');

    // Update report record with relative path
    const relativeFilePath = `reports/${fileName}`;
    await report.update({
      filePath: relativeFilePath,
      fileSize,
      status: 'completed',
      metadata: {
        sampleCount: samples.length,
        completedSamplesOnly: true,
        analysis
      }
    });
    console.log('Report file path saved:', relativeFilePath);

    // Reload the report to get the latest data
    await report.reload({
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        },
        {
          model: User,
          as: 'GeneratedBy',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ]
    });

    return report;
  } catch (error) {
    console.error('Report generation error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      userId,
      generatedBy,
      options
    });

    // Update report with error if it was created
    if (report && report.id) {
      try {
        await report.update({
          status: 'failed',
          errorMessage: error.message || 'Unknown error occurred'
        });
      } catch (updateError) {
        console.error('Failed to update report status:', updateError);
      }
    }

    // Create a more user-friendly error
    const friendlyError = new Error(error.message || 'Failed to generate report');
    friendlyError.status = error.status || 500;
    throw friendlyError;
  }
};

/**
 * Get all reports for a user
 * Regular users can only see reports generated FOR them (where userId matches)
 * Admins can see all reports
 */
export const getReports = async (userId = null, isAdmin = false, page = 1, limit = 10) => {
  try {
    const whereClause = { deletedAt: null };
    if (!isAdmin && userId) {
      // Regular users can only see reports generated FOR them (userId field matches)
      whereClause.userId = userId;
    }
    // Admins see all reports (no userId filter)

    const offset = (page - 1) * limit;

    // Check if Reports table exists by trying a simple query
    try {
      await Report.findOne({ limit: 1 });
    } catch (tableError) {
      console.error('Reports table might not exist:', tableError.message);
      // Return empty result if table doesn't exist
      return {
        reports: [],
        total: 0,
        page,
        totalPages: 0
      };
    }

    const { count, rows } = await Report.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        },
        {
          model: User,
          as: 'GeneratedBy',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      reports: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  } catch (error) {
    console.error('Error in getReports:', error);
    console.error('Error stack:', error.stack);
    // Return empty result on error instead of throwing
    return {
      reports: [],
      total: 0,
      page,
      totalPages: 0
    };
  }
};

/**
 * Get a single report by ID
 * Regular users can only see reports generated FOR them (where userId matches)
 * Admins can see all reports
 */
export const getReportById = async (reportId, userId = null, isAdmin = false) => {
  const whereClause = { id: reportId, deletedAt: null };

  if (!isAdmin && userId) {
    // Regular users can only see reports generated FOR them (userId field matches)
    whereClause.userId = userId;
  }
  // Admins can see all reports (no userId filter)

  const report = await Report.findOne({
    where: whereClause,
    include: [
      { model: User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'GeneratedBy', attributes: ['id', 'firstName', 'lastName', 'email'] }
    ]
  });

  return report;
};

/**
 * Delete a report
 * Regular users can only delete reports generated FOR them (where userId matches)
 * Admins can delete all reports
 */
export const deleteReport = async (reportId, userId = null, isAdmin = false) => {
  const whereClause = { id: reportId, deletedAt: null };

  if (!isAdmin && userId) {
    // Regular users can only delete reports generated FOR them (userId field matches)
    whereClause.userId = userId;
  }
  // Admins can delete all reports (no userId filter)

  const report = await Report.findOne({ where: whereClause });

  if (!report) {
    const error = new Error('Report not found');
    error.status = 404;
    throw error;
  }

  // Delete file
  if (report.filePath) {
    // Handle both /reports/... and reports/... paths
    const filePath = report.filePath.startsWith('/')
      ? path.join(__dirname, '..', report.filePath)
      : path.join(reportsDir, path.basename(report.filePath));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Hard delete
  await report.destroy();

  return report;
};

