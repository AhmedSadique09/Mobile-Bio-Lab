import { HttpService } from './base.service';

class AnalyticsService extends HttpService {
  /**
   * Get user analytics (for regular users)
   * @param filters Optional filters (startDate, endDate, sampleType)
   */
  getUserAnalytics = async (filters?: {
    startDate?: string;
    endDate?: string;
    sampleType?: string;
  }) => {
    return this.get('analytics/user', filters);
  };

  /**
   * Get admin analytics (for admins only)
   * @param filters Optional filters (startDate, endDate, sampleType, userId)
   */
  getAdminAnalytics = async (filters?: {
    startDate?: string;
    endDate?: string;
    sampleType?: string;
    userId?: string;
  }) => {
    return this.get('analytics/admin', filters);
  };
}

export default new AnalyticsService();

