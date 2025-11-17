import { HttpService } from './base.service';

class SampleService extends HttpService {
  /**
   * Create a new sample
   * @param sampleData Sample data
   */
  createSample = async (sampleData: {
    sampleId: string;
    collectionDate: string;
    collectionTime: string;
    sampleType: 'water' | 'soil' | 'plant' | 'biological-fluids' | 'other';
    latitude: number;
    longitude: number;
    temperature?: number;
    pH?: number;
    salinity?: number;
    status?: 'pending' | 'processing' | 'completed';
  }) => {
    return this.post('sample', sampleData);
  };

  /**
   * Get samples (user's own or all for admin)
   * @param search Optional search term for sampleId
   * @param page Page number (default: 1)
   * @param limit Records per page (default: 10)
   * @param filterType Optional filter by sample type
   * @param filterStatus Optional filter by status
   */
  getSamples = async (search?: string, page: number = 1, limit: number = 10, filterType?: string, filterStatus?: string) => {
    const params: any = { page, limit };
    if (search) {
      params.search = search;
    }
    if (filterType && filterType !== 'all') {
      params.filterType = filterType;
    }
    if (filterStatus && filterStatus !== 'all') {
      params.filterStatus = filterStatus;
    }
    return this.get('sample', params);
  };

  /**
   * Get sample by ID
   * @param sampleId Sample ID
   */
  getSampleById = async (sampleId: number) => {
    return this.get(`sample/${sampleId}`);
  };

  /**
   * Get sample by sampleId (the actual sample identifier, not database ID)
   * @param sampleId The sample identifier from QR/barcode
   */
  getSampleBySampleId = async (sampleId: string) => {
    return this.get(`sample/by-sample-id/${encodeURIComponent(sampleId)}`);
  };

  /**
   * Update sample status
   * @param sampleId Sample ID
   * @param status New status (pending, processing, completed)
   */
  updateSampleStatus = async (sampleId: number, status: 'pending' | 'processing' | 'completed') => {
    return this.put(`sample/${sampleId}/status`, { status });
  };

  /**
   * Log a scan event
   * @param scanData Scan event data
   */
  logScanEvent = async (scanData: {
    scannedSampleId: string;
    deviceType?: 'mobile' | 'scanner' | 'browser';
    scanResult: 'found' | 'not_found';
    metadata?: any;
  }) => {
    return this.post('scan-event', scanData);
  };
}

export default new SampleService();

