import cron from 'node-cron';
import * as ReportService from './report.service.js';
import User from '../models/User.js';
import { Op } from 'sequelize';

let scheduledJobs = [];

/**
 * Generate daily report for all users (admin report)
 */
const generateDailyReport = async () => {
  try {
    console.log('[Report Scheduler] Generating daily report...');

    // Get admin user
    const admin = await User.findOne({
      where: { role: 'Admin', deletedAt: null }
    });

    if (!admin) {
      console.warn('[Report Scheduler] No admin user found, skipping daily report');
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    await ReportService.generateReport(null, admin.id, {
      reportType: 'daily',
      title: `Daily Report - ${yesterdayStr}`,
      description: 'Automatically generated daily system report'
    });

    console.log('[Report Scheduler] Daily report generated successfully');
  } catch (error) {
    console.error('[Report Scheduler] Error generating daily report:', error);
  }
};

/**
 * Generate weekly report for all users (admin report)
 */
const generateWeeklyReport = async () => {
  try {
    console.log('[Report Scheduler] Generating weekly report...');

    // Get admin user
    const admin = await User.findOne({
      where: { role: 'Admin', deletedAt: null }
    });

    if (!admin) {
      console.warn('[Report Scheduler] No admin user found, skipping weekly report');
      return;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    await ReportService.generateReport(null, admin.id, {
      reportType: 'weekly',
      title: `Weekly Report - ${startDateStr} to ${endDateStr}`,
      description: 'Automatically generated weekly system report'
    });

    console.log('[Report Scheduler] Weekly report generated successfully');
  } catch (error) {
    console.error('[Report Scheduler] Error generating weekly report:', error);
  }
};

/**
 * Generate monthly report for all users (admin report)
 */
const generateMonthlyReport = async () => {
  try {
    console.log('[Report Scheduler] Generating monthly report...');

    // Get admin user
    const admin = await User.findOne({
      where: { role: 'Admin', deletedAt: null }
    });

    if (!admin) {
      console.warn('[Report Scheduler] No admin user found, skipping monthly report');
      return;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    await ReportService.generateReport(null, admin.id, {
      reportType: 'monthly',
      title: `Monthly Report - ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      description: 'Automatically generated monthly system report'
    });

    console.log('[Report Scheduler] Monthly report generated successfully');
  } catch (error) {
    console.error('[Report Scheduler] Error generating monthly report:', error);
  }
};

/**
 * Generate user-specific reports for all active users
 */
const generateUserReports = async () => {
  try {
    console.log('[Report Scheduler] Generating user reports...');

    // Get admin user
    const admin = await User.findOne({
      where: { role: 'Admin', deletedAt: null }
    });

    if (!admin) {
      console.warn('[Report Scheduler] No admin user found, skipping user reports');
      return;
    }

    // Get all active users (excluding admin)
    const users = await User.findAll({
      where: {
        role: { [Op.ne]: 'Admin' },
        deletedAt: null
      }
    });

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Generate reports for each user (in parallel, but limit concurrency)
    const batchSize = 5;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await Promise.all(
        batch.map(user =>
          ReportService.generateReport(user.id, admin.id, {
            reportType: 'user',
            title: `Weekly Report - ${user.firstName} ${user.lastName}`,
            description: `Automatically generated weekly report for ${user.firstName} ${user.lastName}`
          }).catch(err => {
            console.error(`[Report Scheduler] Error generating report for user ${user.id}:`, err);
          })
        )
      );
    }

    console.log(`[Report Scheduler] Generated reports for ${users.length} users`);
  } catch (error) {
    console.error('[Report Scheduler] Error generating user reports:', error);
  }
};

/**
 * Start all scheduled report generation jobs
 */
export const startScheduler = () => {
  // Clear any existing jobs
  scheduledJobs.forEach(job => job.stop());
  scheduledJobs = [];

  // Daily report at 1:00 AM
  const dailyJob = cron.schedule('0 1 * * *', generateDailyReport, {
    scheduled: true,
    timezone: 'UTC'
  });
  scheduledJobs.push(dailyJob);
  console.log('[Report Scheduler] Daily report scheduled (1:00 AM UTC)');

  // Weekly report every Monday at 2:00 AM
  const weeklyJob = cron.schedule('0 2 * * 1', generateWeeklyReport, {
    scheduled: true,
    timezone: 'UTC'
  });
  scheduledJobs.push(weeklyJob);
  console.log('[Report Scheduler] Weekly report scheduled (Monday 2:00 AM UTC)');

  // Monthly report on the 1st of each month at 3:00 AM
  const monthlyJob = cron.schedule('0 3 1 * *', generateMonthlyReport, {
    scheduled: true,
    timezone: 'UTC'
  });
  scheduledJobs.push(monthlyJob);
  console.log('[Report Scheduler] Monthly report scheduled (1st of month 3:00 AM UTC)');

  // User reports every Sunday at 4:00 AM
  const userReportsJob = cron.schedule('0 4 * * 0', generateUserReports, {
    scheduled: true,
    timezone: 'UTC'
  });
  scheduledJobs.push(userReportsJob);
  console.log('[Report Scheduler] User reports scheduled (Sunday 4:00 AM UTC)');

  console.log('[Report Scheduler] All report schedules started');
};

/**
 * Stop all scheduled jobs
 */
export const stopScheduler = () => {
  scheduledJobs.forEach(job => job.stop());
  scheduledJobs = [];
  console.log('[Report Scheduler] All report schedules stopped');
};

