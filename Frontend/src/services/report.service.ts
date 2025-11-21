import { HttpService } from './base.service';

class ReportService extends HttpService {
  /**
   * Generate a new report
   * @param options Report generation options
   */
  generateReport = async (options: {
    title?: string;
    targetUserId: number;
    sampleIds: number[];
  }) => {
    return this.post('reports', options);
  };

  /**
   * Get all reports
   * @param page Page number
   * @param limit Items per page
   */
  getReports = async (page: number = 1, limit: number = 10) => {
    return this.get('reports', { page, limit });
  };

  /**
   * Get a specific report by ID
   * @param id Report ID
   */
  getReportById = async (id: number) => {
    return this.get(`reports/${id}`);
  };

  /**
   * Download a report PDF - Simple direct download approach
   * @param id Report ID
   */
  downloadReport = async (id: number) => {
    const Config = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    const token = HttpService.getToken();

    // Use token in URL to bypass CORS issues with headers
    const downloadUrl = `${Config}/reports/${id}/download?token=${encodeURIComponent(token || '')}`;

    // Open in new tab - browser will handle download automatically
    window.open(downloadUrl, '_blank');

    // Return success immediately
    return { success: true };
  };

  /**
   * Delete a report
   * @param id Report ID
   */
  deleteReport = async (id: number) => {
    return this.delete(`reports/${id}`);
  };
}

export default new ReportService();
