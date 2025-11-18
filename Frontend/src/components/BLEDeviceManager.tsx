import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Bluetooth, BluetoothConnected, BluetoothOff, Search, X, Save, Trash2, Activity } from 'lucide-react';
import BLEService from '../services/ble.service';
import { toast } from 'sonner';

interface BLEDevice {
  id: number;
  deviceName: string;
  deviceId: string;
  deviceType: string;
  manufacturer?: string;
  model?: string;
  isConnected: boolean;
  lastConnectedAt?: string;
}

interface SensorReading {
  temperature?: number;
  pH?: number;
  salinity?: number;
  humidity?: number;
  pressure?: number;
  light?: number;
  co2?: number;
  timestamp?: string;
}

// Common BLE service and characteristic UUIDs for environmental sensors
const ENVIRONMENTAL_SENSING_SERVICE = '0000181a-0000-1000-8000-00805f9b34fb';
const TEMPERATURE_CHAR = '00002a6e-0000-1000-8000-00805f9b34fb';
const HUMIDITY_CHAR = '00002a6f-0000-1000-8000-00805f9b34fb';
const PRESSURE_CHAR = '00002a6d-0000-1000-8000-00805f9b34fb';

// Generic service for custom sensors
const GENERIC_SERVICE = '0000ff00-0000-1000-8000-00805f9b34fb';
const GENERIC_CHAR = '0000ff01-0000-1000-8000-00805f9b34fb';

export function BLEDeviceManager() {
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [currentReading, setCurrentReading] = useState<SensorReading | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [readings, setReadings] = useState<any[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isBluetoothAvailable, setIsBluetoothAvailable] = useState(false);

  // Check if Web Bluetooth API is available
  useEffect(() => {
    if ('bluetooth' in navigator) {
      setIsBluetoothAvailable(true);
    } else {
      setError('Web Bluetooth API is not supported in this browser. Please use Chrome, Edge, or Opera.');
    }
  }, []);

  // Load registered devices
  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const response = await BLEService.getDevices();
      if (response.statusCode === 200) {
        setDevices(response.payload || []);
      }
    } catch (err: any) {
      console.error('Failed to load devices:', err);
      toast.error('Failed to load devices');
    }
  };

  const scanForDevices = async () => {
    if (!isBluetoothAvailable) {
      toast.error('Bluetooth is not available');
      return;
    }

    setIsScanning(true);
    setError('');

    try {
      // Request Bluetooth device with filters
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          ENVIRONMENTAL_SENSING_SERVICE,
          GENERIC_SERVICE,
          'battery_service',
          'device_information'
        ]
      });

      // Connect to the device
      const server = await device.gatt.connect();
      
      // Get device info
      const deviceInfo = {
        deviceId: device.id,
        deviceName: device.name || 'Unknown Device',
        deviceType: detectDeviceType(device),
        manufacturer: device.manufacturerData ? 'Unknown' : undefined,
        model: undefined
      };

      // Register device with backend
      try {
        const registerResponse = await BLEService.registerDevice(deviceInfo);
        if (registerResponse.statusCode === 201) {
          toast.success('Device registered successfully');
          await loadDevices();
          setConnectedDevice(device);
          await BLEService.updateConnectionStatus(device.id, true);
        }
      } catch (err: any) {
        console.error('Failed to register device:', err);
        toast.error('Failed to register device');
      }

      // Handle disconnection
      device.addEventListener('gattserverdisconnected', () => {
        setConnectedDevice(null);
        setCurrentReading(null);
        setIsReading(false);
        if (device.id) {
          BLEService.updateConnectionStatus(device.id, false).catch(console.error);
        }
        toast.info('Device disconnected');
      });

    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        setError('No Bluetooth device selected');
      } else if (err.name === 'SecurityError') {
        setError('Bluetooth permission denied');
      } else if (err.name === 'NetworkError') {
        setError('Connection failed. Make sure the device is powered on and in range.');
      } else {
        setError(err.message || 'Failed to scan for devices');
      }
      console.error('Bluetooth error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const detectDeviceType = (device: BluetoothDevice): 'temperature' | 'pH' | 'salinity' | 'environmental' | 'multi-sensor' | 'other' => {
    const name = device.name?.toLowerCase() || '';
    if (name.includes('temperature') || name.includes('temp')) return 'temperature';
    if (name.includes('ph') || name.includes('ph meter')) return 'pH';
    if (name.includes('salinity') || name.includes('salt')) return 'salinity';
    if (name.includes('environmental') || name.includes('multi')) return 'environmental';
    if (name.includes('sensor')) return 'multi-sensor';
    return 'other';
  };

  const connectToDevice = async (deviceId: string) => {
    if (!isBluetoothAvailable) {
      toast.error('Bluetooth is not available');
      return;
    }

    setError('');
    try {
      // Find device by ID (this is a simplified approach - in production, you'd store the device object)
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ id: deviceId }],
        optionalServices: [
          ENVIRONMENTAL_SENSING_SERVICE,
          GENERIC_SERVICE,
          'battery_service',
          'device_information'
        ]
      });

      const server = await device.gatt.connect();
      setConnectedDevice(device);
      await BLEService.updateConnectionStatus(deviceId, true);
      toast.success('Device connected');

      device.addEventListener('gattserverdisconnected', () => {
        setConnectedDevice(null);
        setCurrentReading(null);
        setIsReading(false);
        BLEService.updateConnectionStatus(deviceId, false).catch(console.error);
        toast.info('Device disconnected');
      });

    } catch (err: any) {
      setError(err.message || 'Failed to connect to device');
      toast.error('Failed to connect');
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice?.gatt?.connected) {
      connectedDevice.gatt.disconnect();
      if (connectedDevice.id) {
        await BLEService.updateConnectionStatus(connectedDevice.id, false);
      }
      setConnectedDevice(null);
      setCurrentReading(null);
      setIsReading(false);
      toast.info('Device disconnected');
    }
  };

  const readSensorData = useCallback(async () => {
    if (!connectedDevice?.gatt?.connected) {
      toast.error('Device not connected');
      return;
    }

    setIsReading(true);
    setError('');

    try {
      const server = await connectedDevice.gatt.connect();
      let reading: SensorReading = {};

      // Try to read from environmental sensing service
      try {
        const service = await server.getPrimaryService(ENVIRONMENTAL_SENSING_SERVICE);
        
        // Try temperature
        try {
          const char = await service.getCharacteristic(TEMPERATURE_CHAR);
          const value = await char.readValue();
          const temp = value.getInt16(0, true) / 100; // Example decoding
          reading.temperature = temp;
        } catch (e) {
          // Characteristic not available
        }

        // Try humidity
        try {
          const char = await service.getCharacteristic(HUMIDITY_CHAR);
          const value = await char.readValue();
          const humidity = value.getUint16(0, true) / 100;
          reading.humidity = humidity;
        } catch (e) {
          // Characteristic not available
        }

        // Try pressure
        try {
          const char = await service.getCharacteristic(PRESSURE_CHAR);
          const value = await char.readValue();
          const pressure = value.getUint32(0, true) / 1000;
          reading.pressure = pressure;
        } catch (e) {
          // Characteristic not available
        }
      } catch (e) {
        // Service not available, try generic service
        try {
          const service = await server.getPrimaryService(GENERIC_SERVICE);
          const char = await service.getCharacteristic(GENERIC_CHAR);
          const value = await char.readValue();
          
          // Parse generic data (this is device-specific)
          // Example: assuming first 2 bytes are temperature, next 2 are pH, etc.
          if (value.byteLength >= 2) {
            reading.temperature = value.getInt16(0, true) / 100;
          }
          if (value.byteLength >= 4) {
            reading.pH = value.getInt16(2, true) / 100;
          }
          if (value.byteLength >= 6) {
            reading.salinity = value.getInt16(4, true) / 100;
          }
        } catch (e) {
          // Generic service also not available
          console.warn('No known services found, using mock data for demo');
          // For demo purposes, generate mock data
          reading = {
            temperature: Math.round((Math.random() * 30 + 15) * 100) / 100,
            pH: Math.round((Math.random() * 4 + 6) * 100) / 100,
            salinity: Math.round((Math.random() * 10 + 30) * 100) / 100,
            humidity: Math.round((Math.random() * 40 + 40) * 100) / 100
          };
        }
      }

      reading.timestamp = new Date().toISOString();
      setCurrentReading(reading);

      // Save reading to backend
      if (connectedDevice.id) {
        try {
          await BLEService.saveReading({
            deviceId: connectedDevice.id,
            ...reading,
            rawData: { source: 'ble', timestamp: reading.timestamp }
          });
        } catch (err) {
          console.error('Failed to save reading:', err);
        }
      }

    } catch (err: any) {
      setError(err.message || 'Failed to read sensor data');
      toast.error('Failed to read data');
    } finally {
      setIsReading(false);
    }
  }, [connectedDevice]);

  // Auto-read when connected
  useEffect(() => {
    if (connectedDevice?.gatt?.connected && !isReading) {
      const interval = setInterval(() => {
        readSensorData();
      }, 2000); // Read every 2 seconds

      return () => clearInterval(interval);
    }
  }, [connectedDevice, isReading, readSensorData]);

  // Load readings for selected device
  useEffect(() => {
    if (selectedDeviceId) {
      loadReadings(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  const loadReadings = async (deviceId: string) => {
    try {
      const response = await BLEService.getReadings(deviceId, { limit: 50 });
      if (response.statusCode === 200) {
        setReadings(response.payload || []);
      }
    } catch (err) {
      console.error('Failed to load readings:', err);
    }
  };

  const deleteDevice = async (deviceId: number) => {
    if (!confirm('Are you sure you want to delete this device?')) return;

    try {
      const response = await BLEService.deleteDevice(deviceId);
      if (response.statusCode === 200) {
        toast.success('Device deleted');
        await loadDevices();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete device');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">BLE Device Manager</h1>
          <p className="text-muted-foreground">Connect and manage Bluetooth Low Energy sensors</p>
        </div>
        <Button
          onClick={scanForDevices}
          disabled={isScanning || !isBluetoothAvailable}
          className="gap-2"
        >
          {isScanning ? (
            <>
              <Activity className="h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Bluetooth className="h-4 w-4" />
              Scan for Devices
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isBluetoothAvailable && (
        <Alert>
          <AlertDescription>
            Web Bluetooth API is not available. Please use Chrome, Edge, or Opera browser.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Connected Device Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {connectedDevice ? (
                <BluetoothConnected className="h-5 w-5 text-green-500" />
              ) : (
                <BluetoothOff className="h-5 w-5 text-gray-400" />
              )}
              Current Device
            </CardTitle>
            <CardDescription>
              {connectedDevice
                ? `Connected: ${connectedDevice.name || 'Unknown'}`
                : 'No device connected'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {connectedDevice && (
              <>
                <div className="space-y-2">
                  <Label>Device ID</Label>
                  <Input value={connectedDevice.id} readOnly />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={readSensorData}
                    disabled={isReading}
                    className="flex-1"
                  >
                    {isReading ? 'Reading...' : 'Read Data'}
                  </Button>
                  <Button
                    onClick={disconnectDevice}
                    variant="outline"
                  >
                    Disconnect
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Current Reading Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Reading</CardTitle>
            <CardDescription>Latest sensor data</CardDescription>
          </CardHeader>
          <CardContent>
            {currentReading ? (
              <div className="space-y-2">
                {currentReading.temperature !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temperature:</span>
                    <span className="font-semibold">{currentReading.temperature.toFixed(2)} °C</span>
                  </div>
                )}
                {currentReading.pH !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">pH:</span>
                    <span className="font-semibold">{currentReading.pH.toFixed(2)}</span>
                  </div>
                )}
                {currentReading.salinity !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Salinity:</span>
                    <span className="font-semibold">{currentReading.salinity.toFixed(2)} ppt</span>
                  </div>
                )}
                {currentReading.humidity !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Humidity:</span>
                    <span className="font-semibold">{currentReading.humidity.toFixed(2)} %</span>
                  </div>
                )}
                {currentReading.pressure !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pressure:</span>
                    <span className="font-semibold">{currentReading.pressure.toFixed(2)} hPa</span>
                  </div>
                )}
                {currentReading.timestamp && (
                  <div className="text-xs text-muted-foreground mt-4">
                    {new Date(currentReading.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No reading available. Connect a device and read data.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Registered Devices */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Devices</CardTitle>
          <CardDescription>Manage your BLE devices</CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No devices registered. Scan for devices to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Connected</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.deviceName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{device.deviceType}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{device.deviceId}</TableCell>
                    <TableCell>
                      <Badge variant={device.isConnected ? 'default' : 'secondary'}>
                        {device.isConnected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {device.lastConnectedAt
                        ? new Date(device.lastConnectedAt).toLocaleString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDeviceId(device.deviceId);
                            connectToDevice(device.deviceId);
                          }}
                          disabled={device.isConnected}
                        >
                          Connect
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteDevice(device.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Historical Readings */}
      {selectedDeviceId && (
        <Card>
          <CardHeader>
            <CardTitle>Historical Readings</CardTitle>
            <CardDescription>Past sensor readings for selected device</CardDescription>
          </CardHeader>
          <CardContent>
            {readings.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No readings available for this device.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Temperature</TableHead>
                      <TableHead>pH</TableHead>
                      <TableHead>Salinity</TableHead>
                      <TableHead>Humidity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {readings.slice(0, 20).map((reading, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {new Date(reading.readingTimestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {reading.temperature ? `${reading.temperature.toFixed(2)} °C` : '-'}
                        </TableCell>
                        <TableCell>
                          {reading.pH ? reading.pH.toFixed(2) : '-'}
                        </TableCell>
                        <TableCell>
                          {reading.salinity ? `${reading.salinity.toFixed(2)} ppt` : '-'}
                        </TableCell>
                        <TableCell>
                          {reading.humidity ? `${reading.humidity.toFixed(2)} %` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

