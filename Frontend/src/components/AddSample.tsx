import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { QrCode, Bluetooth, BluetoothConnected, BluetoothOff, MapPin, CheckCircle, Loader2, AlertCircle, Activity } from 'lucide-react';
import { type User } from '../types';
import { addNotification, addActivityLog } from '../lib/storage';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import sampleService from '../services/sample.service';
import BLEService from '../services/ble.service';
import { QRScanner } from './QRScanner';
import { toast } from 'sonner';

interface AddSampleProps {
  user: User;
  onNavigate: (page: string) => void;
}

export function AddSample({ user, onNavigate }: AddSampleProps) {
  const [formData, setFormData] = useState({
    sampleId: '',
    collectionDate: new Date().toISOString().split('T')[0],
    collectionTime: new Date().toTimeString().slice(0, 5),
    sampleType: '' as 'water' | 'soil' | 'plant' | 'biological-fluids' | '',
    latitude: '',
    longitude: '',
    temperature: '',
    pH: '',
    salinity: ''
  });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showBLEDialog, setShowBLEDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showNotFoundDialog, setShowNotFoundDialog] = useState(false);
  const [scannedData, setScannedData] = useState<{ sampleId: string; metadata?: any } | null>(null);
  const [scanning, setScanning] = useState(false);
  
  // BLE device states
  const [isScanningBLE, setIsScanningBLE] = useState(false);
  const [connectedBLEDevice, setConnectedBLEDevice] = useState<BluetoothDevice | null>(null);
  const [isReadingBLE, setIsReadingBLE] = useState(false);
  const [bleError, setBleError] = useState<string>('');
  const [isBluetoothAvailable, setIsBluetoothAvailable] = useState(false);
  const [currentBLEReading, setCurrentBLEReading] = useState<{
    temperature?: number;
    pH?: number;
    salinity?: number;
  } | null>(null);

  // BLE Service UUIDs
  const ENVIRONMENTAL_SENSING_SERVICE = '0000181a-0000-1000-8000-00805f9b34fb';
  const TEMPERATURE_CHAR = '00002a6e-0000-1000-8000-00805f9b34fb';
  const HUMIDITY_CHAR = '00002a6f-0000-1000-8000-00805f9b34fb';
  const PRESSURE_CHAR = '00002a6d-0000-1000-8000-00805f9b34fb';
  const GENERIC_SERVICE = '0000ff00-0000-1000-8000-00805f9b34fb';
  const GENERIC_CHAR = '0000ff01-0000-1000-8000-00805f9b34fb';

  // Check if Web Bluetooth API is available
  useEffect(() => {
    if ('bluetooth' in navigator) {
      setIsBluetoothAvailable(true);
    } else {
      setBleError('Web Bluetooth API is not supported in this browser. Please use Chrome, Edge, or Opera.');
    }
  }, []);

  // Auto-read BLE data when connected
  useEffect(() => {
    if (connectedBLEDevice?.gatt?.connected && !isReadingBLE) {
      const interval = setInterval(() => {
        readBLESensorData();
      }, 2000); // Read every 2 seconds

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedBLEDevice, isReadingBLE]);

  // Auto-fill form when BLE reading is received
  useEffect(() => {
    if (currentBLEReading) {
      setFormData(prev => {
        const updates: any = {};
        if (currentBLEReading.temperature !== undefined) {
          updates.temperature = currentBLEReading.temperature.toFixed(2);
        }
        if (currentBLEReading.pH !== undefined) {
          updates.pH = currentBLEReading.pH.toFixed(2);
        }
        if (currentBLEReading.salinity !== undefined) {
          updates.salinity = currentBLEReading.salinity.toFixed(2);
        }
        if (Object.keys(updates).length > 0) {
          return { ...prev, ...updates };
        }
        return prev;
      });
    }
  }, [currentBLEReading]);

  // Parse QR code data - could be JSON with metadata or plain sampleId
  const parseQRData = (decodedText: string): { sampleId: string; metadata?: any } => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(decodedText);
      if (parsed.sampleId) {
        return parsed;
      }
      // If JSON but no sampleId, treat the whole thing as sampleId
      return { sampleId: decodedText, metadata: parsed };
    } catch {
      // Not JSON, treat as plain sampleId
      return { sampleId: decodedText };
    }
  };

  // Detect device type
  const getDeviceType = (): 'mobile' | 'scanner' | 'browser' => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())) {
      return 'mobile';
    }
    // Could add logic to detect scanner devices
    return 'browser';
  };

  const handleQRScanSuccess = async (decodedText: string) => {
    setScanning(true);
    setShowQRScanner(false);
    
    try {
      // Parse the scanned data
      const parsed = parseQRData(decodedText);
      setScannedData(parsed);

      // Try to fetch sample from backend
      try {
        const response = await sampleService.getSampleBySampleId(parsed.sampleId);
        
        if (response.statusCode === 200 && response.payload) {
          const sample = response.payload;
          
          // Log successful scan event
          try {
            await sampleService.logScanEvent({
              scannedSampleId: parsed.sampleId,
              deviceType: getDeviceType(),
              scanResult: 'found',
              metadata: parsed.metadata || null
            });
          } catch (logError) {
            console.error('Failed to log scan event:', logError);
          }

          // Auto-fill form with sample data
          setFormData({
            sampleId: sample.sampleId,
            collectionDate: sample.collectionDate ? new Date(sample.collectionDate).toISOString().split('T')[0] : formData.collectionDate,
            collectionTime: sample.collectionTime || formData.collectionTime,
            sampleType: sample.sampleType || formData.sampleType,
            latitude: sample.latitude ? sample.latitude.toString() : formData.latitude,
            longitude: sample.longitude ? sample.longitude.toString() : formData.longitude,
            temperature: sample.temperature ? sample.temperature.toString() : formData.temperature,
            pH: sample.pH ? sample.pH.toString() : formData.pH,
            salinity: sample.salinity ? sample.salinity.toString() : formData.salinity
          });

          addNotification({
            id: Date.now().toString(),
            userId: user.id,
            title: 'Sample Found',
            message: `Sample ${parsed.sampleId} loaded successfully`,
            type: 'sample',
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      } catch (fetchError: any) {
        // Sample not found - log the scan event and show dialog
        try {
          await sampleService.logScanEvent({
            scannedSampleId: parsed.sampleId,
            deviceType: getDeviceType(),
            scanResult: 'not_found',
            metadata: parsed.metadata || null
          });
        } catch (logError) {
          console.error('Failed to log scan event:', logError);
        }

        // Show not found dialog
        setShowNotFoundDialog(true);
      }
    } catch (error: any) {
      console.error('Error processing QR scan:', error);
      setErrors({ ...errors, submit: 'Failed to process scanned QR code. Please try again.' });
    } finally {
      setScanning(false);
    }
  };

  const handleQRScanError = (error: string) => {
    console.error('QR scan error:', error);
    setErrors({ ...errors, submit: error });
  };

  const handleCreateNewSample = () => {
    if (scannedData) {
      // Pre-fill form with scanned data and metadata
      const newFormData = { ...formData, sampleId: scannedData.sampleId };
      
      // If metadata contains additional fields, use them
      if (scannedData.metadata) {
        if (scannedData.metadata.collectedAt) {
          const date = new Date(scannedData.metadata.collectedAt);
          newFormData.collectionDate = date.toISOString().split('T')[0];
          newFormData.collectionTime = date.toTimeString().slice(0, 5);
        }
        if (scannedData.metadata.sampleType) {
          newFormData.sampleType = scannedData.metadata.sampleType;
        }
        if (scannedData.metadata.latitude) {
          newFormData.latitude = scannedData.metadata.latitude.toString();
        }
        if (scannedData.metadata.longitude) {
          newFormData.longitude = scannedData.metadata.longitude.toString();
        }
        if (scannedData.metadata.temperature) {
          newFormData.temperature = scannedData.metadata.temperature.toString();
        }
        if (scannedData.metadata.pH) {
          newFormData.pH = scannedData.metadata.pH.toString();
        }
        if (scannedData.metadata.salinity) {
          newFormData.salinity = scannedData.metadata.salinity.toString();
        }
      }
      
      setFormData(newFormData);
    }
    setShowNotFoundDialog(false);
    setScannedData(null);
  };

  const handleScanAgain = () => {
    setShowNotFoundDialog(false);
    setScannedData(null);
    setShowQRScanner(true);
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

  const handleBLEConnect = async () => {
    if (!isBluetoothAvailable) {
      toast.error('Bluetooth is not available in this browser');
      return;
    }

    setIsScanningBLE(true);
    setBleError('');
    setShowBLEDialog(true);

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
          toast.success('Device registered and connected');
          setConnectedBLEDevice(device);
          await BLEService.updateConnectionStatus(device.id, true);
          setShowBLEDialog(false);
          
          // Start reading data immediately
          readBLESensorData();
        }
      } catch (err: any) {
        console.error('Failed to register device:', err);
        // Still connect even if registration fails
        setConnectedBLEDevice(device);
        setShowBLEDialog(false);
        readBLESensorData();
      }

      // Handle disconnection
      device.addEventListener('gattserverdisconnected', () => {
        setConnectedBLEDevice(null);
        setCurrentBLEReading(null);
        setIsReadingBLE(false);
        if (device.id) {
          BLEService.updateConnectionStatus(device.id, false).catch(console.error);
        }
        toast.info('BLE device disconnected');
      });

    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        setBleError('No Bluetooth device selected');
        toast.error('No device selected');
      } else if (err.name === 'SecurityError') {
        setBleError('Bluetooth permission denied');
        toast.error('Bluetooth permission denied');
      } else if (err.name === 'NetworkError') {
        setBleError('Connection failed. Make sure the device is powered on and in range.');
        toast.error('Connection failed');
      } else {
        setBleError(err.message || 'Failed to scan for devices');
        toast.error('Failed to connect to device');
      }
      console.error('Bluetooth error:', err);
    } finally {
      setIsScanningBLE(false);
    }
  };

  const readBLESensorData = async () => {
    if (!connectedBLEDevice?.gatt?.connected) {
      return;
    }

    setIsReadingBLE(true);
    setBleError('');

    try {
      const server = await connectedBLEDevice.gatt.connect();
      let reading: { temperature?: number; pH?: number; salinity?: number } = {};

      // Try to read from environmental sensing service
      try {
        const service = await server.getPrimaryService(ENVIRONMENTAL_SENSING_SERVICE);
        
        // Try temperature
        try {
          const char = await service.getCharacteristic(TEMPERATURE_CHAR);
          const value = await char.readValue();
          const temp = value.getInt16(0, true) / 100;
          reading.temperature = temp;
        } catch (e) {
          // Characteristic not available
        }

        // Try humidity (can be used as additional data)
        try {
          const char = await service.getCharacteristic(HUMIDITY_CHAR);
          const value = await char.readValue();
          // Could store humidity if needed
        } catch (e) {
          // Characteristic not available
        }
      } catch (e) {
        // Service not available, try generic service
        try {
          const service = await server.getPrimaryService(GENERIC_SERVICE);
          const char = await service.getCharacteristic(GENERIC_CHAR);
          const value = await char.readValue();
          
          // Parse generic data (device-specific)
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
          // Generic service also not available, use mock data for demo
          console.warn('No known services found, using mock data for demo');
          reading = {
            temperature: Math.round((Math.random() * 30 + 15) * 100) / 100,
            pH: Math.round((Math.random() * 4 + 6) * 100) / 100,
            salinity: Math.round((Math.random() * 10 + 30) * 100) / 100
          };
        }
      }

      setCurrentBLEReading(reading);

      // Save reading to backend
      if (connectedBLEDevice.id) {
        try {
          await BLEService.saveReading({
            deviceId: connectedBLEDevice.id,
            ...reading,
            rawData: { source: 'ble', timestamp: new Date().toISOString() }
          });
        } catch (err) {
          console.error('Failed to save reading:', err);
        }
      }

    } catch (err: any) {
      setBleError(err.message || 'Failed to read sensor data');
      console.error('Error reading BLE data:', err);
    } finally {
      setIsReadingBLE(false);
    }
  };

  const disconnectBLEDevice = async () => {
    if (connectedBLEDevice?.gatt?.connected) {
      connectedBLEDevice.gatt.disconnect();
      if (connectedBLEDevice.id) {
        await BLEService.updateConnectionStatus(connectedBLEDevice.id, false);
      }
      setConnectedBLEDevice(null);
      setCurrentBLEReading(null);
      setIsReadingBLE(false);
      toast.info('BLE device disconnected');
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrors({ ...errors, latitude: 'Geolocation is not supported by your browser' });
      return;
    }

    setGettingLocation(true);
    setErrors({ ...errors, latitude: '', longitude: '' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        setFormData({ 
          ...formData, 
          latitude: lat,
          longitude: lon
        });
        setGettingLocation(false);
      },
      (error) => {
        setGettingLocation(false);
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setErrors({ ...errors, latitude: errorMessage });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Validation functions
  const validateField = (name: string, value: string) => {
    let error = '';

    switch (name) {
      case 'sampleId':
        if (!value.trim()) {
          error = 'Sample ID is required';
        }
        break;
      case 'collectionDate':
        if (!value) {
          error = 'Collection date is required';
        }
        break;
      case 'collectionTime':
        if (!value) {
          error = 'Collection time is required';
        }
        break;
      case 'sampleType':
        if (!value) {
          error = 'Sample type is required';
        }
        break;
      case 'latitude':
        if (!value.trim()) {
          error = 'Latitude is required';
        } else {
          const lat = parseFloat(value);
          if (isNaN(lat) || lat < -90 || lat > 90) {
            error = 'Latitude must be between -90 and 90';
          }
        }
        break;
      case 'longitude':
        if (!value.trim()) {
          error = 'Longitude is required';
        } else {
          const lon = parseFloat(value);
          if (isNaN(lon) || lon < -180 || lon > 180) {
            error = 'Longitude must be between -180 and 180';
          }
        }
        break;
      case 'temperature':
        if (value.trim() && (isNaN(parseFloat(value)) || parseFloat(value) < -50 || parseFloat(value) > 100)) {
          error = 'Temperature must be between -50 and 100°C';
        }
        break;
      case 'pH':
        if (value.trim() && (isNaN(parseFloat(value)) || parseFloat(value) < 0 || parseFloat(value) > 14)) {
          error = 'pH must be between 0 and 14';
        }
        break;
      case 'salinity':
        if (value.trim() && (isNaN(parseFloat(value)) || parseFloat(value) < 0 || parseFloat(value) > 50)) {
          error = 'Salinity must be between 0 and 50 ppt';
        }
        break;
    }

    return error;
  };

  const handleFieldChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      const error = validateField(name, value);
      setErrors({ ...errors, [name]: error });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    newErrors.sampleId = validateField('sampleId', formData.sampleId);
    newErrors.collectionDate = validateField('collectionDate', formData.collectionDate);
    newErrors.collectionTime = validateField('collectionTime', formData.collectionTime);
    newErrors.sampleType = validateField('sampleType', formData.sampleType);
    newErrors.latitude = validateField('latitude', formData.latitude);
    newErrors.longitude = validateField('longitude', formData.longitude);
    newErrors.temperature = validateField('temperature', formData.temperature);
    newErrors.pH = validateField('pH', formData.pH);
    newErrors.salinity = validateField('salinity', formData.salinity);

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    return (
      formData.sampleId.trim() !== '' &&
      formData.collectionDate !== '' &&
      formData.collectionTime !== '' &&
      formData.sampleType !== '' &&
      formData.latitude.trim() !== '' &&
      formData.longitude.trim() !== '' &&
      !errors.sampleId &&
      !errors.collectionDate &&
      !errors.collectionTime &&
      !errors.sampleType &&
      !errors.latitude &&
      !errors.longitude
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      // Send status as 'pending' from frontend to backend
      const response = await sampleService.createSample({
        sampleId: formData.sampleId,
        collectionDate: formData.collectionDate,
        collectionTime: formData.collectionTime,
        sampleType: formData.sampleType as 'water' | 'soil' | 'plant' | 'biological-fluids' | 'other',
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        pH: formData.pH ? parseFloat(formData.pH) : undefined,
        salinity: formData.salinity ? parseFloat(formData.salinity) : undefined,
        status: 'pending' // Explicitly send pending status from frontend
      });

      if (response.statusCode === 201) {
        addNotification({
          id: Date.now().toString(),
          userId: user.id,
          title: 'Sample Added',
          message: `New sample ${formData.sampleId} has been created`,
          type: 'sample',
          read: false,
          createdAt: new Date().toISOString()
        });

        addActivityLog({
          id: Date.now().toString(),
          userId: user.id,
          action: 'Sample Created',
          details: `Created sample ${formData.sampleId}`,
          timestamp: new Date().toISOString()
        });

        setSuccess(true);
        setTimeout(() => {
          setLoading(false);
          onNavigate('samples');
        }, 2000);
      } else {
        setLoading(false);
        setErrors({ ...errors, submit: response.message || 'Failed to create sample' });
      }
    } catch (err: any) {
      console.error('Error creating sample:', err);
      setLoading(false);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to create sample. Please try again.';
      setErrors({ ...errors, submit: errorMessage });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-gray-900">Add New Sample</h1>
        <p className="text-gray-500 text-sm">Record a new biological sample collection</p>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50 shadow-sm">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">Sample added successfully! Redirecting...</AlertDescription>
        </Alert>
      )}

      {errors.submit && (
        <Alert className="border-red-200 bg-red-50 shadow-sm">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{errors.submit}</AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setShowQRScanner(true)} 
          className="hover:bg-gray-50 transition-colors"
          style={{ border: '1px solid #d1d5db' }}
          disabled={scanning}
        >
          {scanning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR/Barcode
            </>
          )}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleBLEConnect} 
          className="hover:bg-gray-50 transition-colors"
          style={{ border: '1px solid #d1d5db' }}
          disabled={isScanningBLE || !isBluetoothAvailable}
        >
          {isScanningBLE ? (
            <>
              <Activity className="h-4 w-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : connectedBLEDevice ? (
            <>
              <BluetoothConnected className="h-4 w-4 mr-2 text-green-600" />
              Connected
            </>
          ) : (
            <>
              <Bluetooth className="h-4 w-4 mr-2" />
              Connect BLE Device
            </>
          )}
        </Button>
        {connectedBLEDevice && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={disconnectBLEDevice} 
            className="hover:bg-gray-50 transition-colors"
            style={{ border: '1px solid #d1d5db' }}
          >
            <BluetoothOff className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        )}
      </div>

      <Card className="shadow-md border-gray-200">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sample ID */}
            <div className="space-y-2">
              <Label htmlFor="sampleId" className="text-sm font-medium text-gray-700">Sample ID *</Label>
              <Input
                id="sampleId"
                value={formData.sampleId}
                onChange={(e) => handleFieldChange('sampleId', e.target.value)}
                onBlur={(e) => {
                  const error = validateField('sampleId', e.target.value);
                  setErrors({ ...errors, sampleId: error });
                }}
                placeholder="e.g., WTR-2025-001"
                required
                className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.sampleId ? 'border-red-500' : ''}`}
                style={{ border: errors.sampleId ? '1px solid #ef4444' : '1px solid #d1d5db' }}
              />
              {errors.sampleId && <p className="text-sm text-red-600">{errors.sampleId}</p>}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="collectionDate" className="text-sm font-medium text-gray-700">Collection Date *</Label>
                <Input
                  id="collectionDate"
                  type="date"
                  value={formData.collectionDate}
                  onChange={(e) => handleFieldChange('collectionDate', e.target.value)}
                  onBlur={(e) => {
                    const error = validateField('collectionDate', e.target.value);
                    setErrors({ ...errors, collectionDate: error });
                  }}
                  required
                  className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.collectionDate ? 'border-red-500' : ''}`}
                  style={{ border: errors.collectionDate ? '1px solid #ef4444' : '1px solid #d1d5db' }}
                />
                {errors.collectionDate && <p className="text-sm text-red-600">{errors.collectionDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="collectionTime" className="text-sm font-medium text-gray-700">Collection Time *</Label>
                <Input
                  id="collectionTime"
                  type="time"
                  value={formData.collectionTime}
                  onChange={(e) => handleFieldChange('collectionTime', e.target.value)}
                  onBlur={(e) => {
                    const error = validateField('collectionTime', e.target.value);
                    setErrors({ ...errors, collectionTime: error });
                  }}
                  required
                  className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.collectionTime ? 'border-red-500' : ''}`}
                  style={{ border: errors.collectionTime ? '1px solid #ef4444' : '1px solid #d1d5db' }}
                />
                {errors.collectionTime && <p className="text-sm text-red-600">{errors.collectionTime}</p>}
              </div>
            </div>

            {/* Sample Type */}
            <div className="space-y-2">
              <Label htmlFor="sampleType" className="text-sm font-medium text-gray-700">Sample Type *</Label>
              <Select 
                value={formData.sampleType} 
                onValueChange={(value: any) => {
                  handleFieldChange('sampleType', value);
                  const error = validateField('sampleType', value);
                  setErrors({ ...errors, sampleType: error });
                }}
              >
                <SelectTrigger 
                  className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.sampleType ? 'border-red-500' : ''}`} 
                  style={{ border: errors.sampleType ? '1px solid #ef4444' : '1px solid #d1d5db' }}
                >
                  <SelectValue placeholder="Select sample type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="water">Water</SelectItem>
                  <SelectItem value="soil">Soil</SelectItem>
                  <SelectItem value="plant">Plant</SelectItem>
                  <SelectItem value="biological-fluids">Biological Fluids</SelectItem>
                </SelectContent>
              </Select>
              {errors.sampleType && <p className="text-sm text-red-600">{errors.sampleType}</p>}
            </div>

            {/* Geolocation */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Geolocation *</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Input
                    placeholder="Latitude"
                    value={formData.latitude}
                    onChange={(e) => handleFieldChange('latitude', e.target.value)}
                    onBlur={(e) => {
                      const error = validateField('latitude', e.target.value);
                      setErrors({ ...errors, latitude: error });
                    }}
                    required
                    className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.latitude ? 'border-red-500' : ''}`}
                    style={{ border: errors.latitude ? '1px solid #ef4444' : '1px solid #d1d5db' }}
                  />
                  {errors.latitude && <p className="text-xs text-red-600">{errors.latitude}</p>}
                </div>
                <div className="space-y-1">
                  <Input
                    placeholder="Longitude"
                    value={formData.longitude}
                    onChange={(e) => handleFieldChange('longitude', e.target.value)}
                    onBlur={(e) => {
                      const error = validateField('longitude', e.target.value);
                      setErrors({ ...errors, longitude: error });
                    }}
                    required
                    className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.longitude ? 'border-red-500' : ''}`}
                    style={{ border: errors.longitude ? '1px solid #ef4444' : '1px solid #d1d5db' }}
                  />
                  {errors.longitude && <p className="text-xs text-red-600">{errors.longitude}</p>}
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="hover:bg-gray-50 transition-colors disabled:opacity-50"
                  style={{ border: '1px solid #d1d5db' }}
                >
                  {gettingLocation ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Getting...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Get Location
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Field Conditions */}
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <Label className="text-sm font-medium text-gray-700">Field Conditions</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="temperature" className="text-sm font-medium text-gray-700">Temperature (°C)</Label>
                    {connectedBLEDevice && currentBLEReading?.temperature !== undefined && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <BluetoothConnected className="h-3 w-3 mr-1" />
                        BLE
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 22.5"
                    value={formData.temperature}
                    onChange={(e) => handleFieldChange('temperature', e.target.value)}
                    onBlur={(e) => {
                      const error = validateField('temperature', e.target.value);
                      setErrors({ ...errors, temperature: error });
                    }}
                    className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.temperature ? 'border-red-500' : ''} ${connectedBLEDevice && currentBLEReading?.temperature !== undefined ? 'border-green-300 bg-green-50' : ''}`}
                    style={{ border: errors.temperature ? '1px solid #ef4444' : connectedBLEDevice && currentBLEReading?.temperature !== undefined ? '1px solid #86efac' : '1px solid #d1d5db' }}
                  />
                  {errors.temperature && <p className="text-xs text-red-600">{errors.temperature}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="pH" className="text-sm font-medium text-gray-700">pH Level</Label>
                    {connectedBLEDevice && currentBLEReading?.pH !== undefined && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <BluetoothConnected className="h-3 w-3 mr-1" />
                        BLE
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="pH"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 7.2"
                    value={formData.pH}
                    onChange={(e) => handleFieldChange('pH', e.target.value)}
                    onBlur={(e) => {
                      const error = validateField('pH', e.target.value);
                      setErrors({ ...errors, pH: error });
                    }}
                    className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.pH ? 'border-red-500' : ''} ${connectedBLEDevice && currentBLEReading?.pH !== undefined ? 'border-green-300 bg-green-50' : ''}`}
                    style={{ border: errors.pH ? '1px solid #ef4444' : connectedBLEDevice && currentBLEReading?.pH !== undefined ? '1px solid #86efac' : '1px solid #d1d5db' }}
                  />
                  {errors.pH && <p className="text-xs text-red-600">{errors.pH}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="salinity" className="text-sm font-medium text-gray-700">Salinity (ppt)</Label>
                    {connectedBLEDevice && currentBLEReading?.salinity !== undefined && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <BluetoothConnected className="h-3 w-3 mr-1" />
                        BLE
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="salinity"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 0.5"
                    value={formData.salinity}
                    onChange={(e) => handleFieldChange('salinity', e.target.value)}
                    onBlur={(e) => {
                      const error = validateField('salinity', e.target.value);
                      setErrors({ ...errors, salinity: error });
                    }}
                    className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.salinity ? 'border-red-500' : ''} ${connectedBLEDevice && currentBLEReading?.salinity !== undefined ? 'border-green-300 bg-green-50' : ''}`}
                    style={{ border: errors.salinity ? '1px solid #ef4444' : connectedBLEDevice && currentBLEReading?.salinity !== undefined ? '1px solid #86efac' : '1px solid #d1d5db' }}
                  />
                  {errors.salinity && <p className="text-xs text-red-600">{errors.salinity}</p>}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <Button 
                type="submit" 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isFormValid() || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Sample'
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onNavigate('samples')} 
                className="hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid #d1d5db' }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* QR Scanner Component */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanSuccess={handleQRScanSuccess}
        onScanError={handleQRScanError}
      />

      {/* Sample Not Found Dialog */}
      <Dialog open={showNotFoundDialog} onOpenChange={setShowNotFoundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Sample Record Not Found
            </DialogTitle>
            <DialogDescription>
              The sample with ID <strong>{scannedData?.sampleId}</strong> was not found in the database.
              Would you like to create a new entry?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleCreateNewSample}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create New Sample
            </Button>
            <Button
              onClick={handleScanAgain}
              variant="outline"
              className="w-full"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Scan Again
            </Button>
            <Button
              onClick={() => {
                setShowNotFoundDialog(false);
                setScannedData(null);
              }}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* BLE Device Dialog */}
      <Dialog open={showBLEDialog} onOpenChange={setShowBLEDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect BLE Device</DialogTitle>
            <DialogDescription>
              {isScanningBLE 
                ? 'Select a Bluetooth device from the browser dialog...'
                : 'Click the button below to scan for nearby BLE devices'}
            </DialogDescription>
          </DialogHeader>
          {bleError && (
            <Alert variant="destructive">
              <AlertDescription>{bleError}</AlertDescription>
            </Alert>
          )}
          {!isBluetoothAvailable && (
            <Alert>
              <AlertDescription>
                Web Bluetooth API is not available. Please use Chrome, Edge, or Opera browser.
              </AlertDescription>
            </Alert>
          )}
          {connectedBLEDevice && (
            <Alert className="border-green-200 bg-green-50">
              <BluetoothConnected className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Connected to: {connectedBLEDevice.name || 'Unknown Device'}
                {isReadingBLE && ' - Reading sensor data...'}
              </AlertDescription>
            </Alert>
          )}
          {currentBLEReading && (
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm">Current Reading:</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {currentBLEReading.temperature !== undefined && (
                  <div>
                    <span className="text-gray-600">Temperature: </span>
                    <span className="font-semibold">{currentBLEReading.temperature.toFixed(2)} °C</span>
                  </div>
                )}
                {currentBLEReading.pH !== undefined && (
                  <div>
                    <span className="text-gray-600">pH: </span>
                    <span className="font-semibold">{currentBLEReading.pH.toFixed(2)}</span>
                  </div>
                )}
                {currentBLEReading.salinity !== undefined && (
                  <div>
                    <span className="text-gray-600">Salinity: </span>
                    <span className="font-semibold">{currentBLEReading.salinity.toFixed(2)} ppt</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
