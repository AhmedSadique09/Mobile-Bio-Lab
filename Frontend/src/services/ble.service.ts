import { HttpService } from './base.service';

class BLEService extends HttpService {
  /**
   * Register a new BLE device
   */
  registerDevice = async (deviceData: {
    deviceName: string;
    deviceId: string;
    deviceType: 'temperature' | 'pH' | 'salinity' | 'environmental' | 'multi-sensor' | 'other';
    manufacturer?: string;
    model?: string;
    metadata?: any;
  }) => {
    return this.post('ble/devices', deviceData);
  };

  /**
   * Get all devices
   */
  getDevices = async () => {
    return this.get('ble/devices');
  };

  /**
   * Get device by ID
   */
  getDeviceById = async (deviceId: number) => {
    return this.get(`ble/devices/${deviceId}`);
  };

  /**
   * Update device connection status
   */
  updateConnectionStatus = async (deviceId: string, isConnected: boolean) => {
    return this.put(`ble/devices/${deviceId}/connection`, { isConnected });
  };

  /**
   * Delete device
   */
  deleteDevice = async (deviceId: number) => {
    return this.delete(`ble/devices/${deviceId}`);
  };

  /**
   * Save a sensor reading
   */
  saveReading = async (readingData: {
    deviceId: string;
    temperature?: number;
    pH?: number;
    salinity?: number;
    humidity?: number;
    pressure?: number;
    light?: number;
    co2?: number;
    rawData?: any;
  }) => {
    return this.post('ble/readings', readingData);
  };

  /**
   * Get readings for a device
   */
  getReadings = async (deviceId: string, options?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    return this.get(`ble/devices/${deviceId}/readings`, options);
  };

  /**
   * Get latest reading for a device
   */
  getLatestReading = async (deviceId: string) => {
    return this.get(`ble/devices/${deviceId}/readings/latest`);
  };
}

export default new BLEService();

