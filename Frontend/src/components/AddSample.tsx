import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { QrCode, Bluetooth, MapPin, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { type User } from '../types';
import { addNotification, addActivityLog } from '../lib/storage';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import sampleService from '../services/sample.service';

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
  const [bleDevices, setBleDevices] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleQRScan = () => {
    setShowQRScanner(true);
    // Simulate QR scan
    setTimeout(() => {
      const mockSampleId = `${formData.sampleType.toUpperCase().slice(0, 3)}-2025-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      setFormData({ ...formData, sampleId: mockSampleId });
      setShowQRScanner(false);
    }, 1500);
  };

  const handleBLEConnect = () => {
    setShowBLEDialog(true);
    // Simulate BLE device discovery
    setTimeout(() => {
      setBleDevices(['pH Meter Pro', 'Temperature Sensor T-200', 'Salinity Meter SM-50']);
    }, 1000);
  };

  const connectToDevice = (device: string) => {
    // Simulate getting data from BLE device
    if (device.includes('pH')) {
      setFormData({ ...formData, pH: (Math.random() * 4 + 5).toFixed(1) });
    } else if (device.includes('Temperature')) {
      setFormData({ ...formData, temperature: (Math.random() * 15 + 15).toFixed(1) });
    } else if (device.includes('Salinity')) {
      setFormData({ ...formData, salinity: (Math.random() * 2).toFixed(2) });
    }
    setShowBLEDialog(false);
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
          onClick={handleQRScan} 
          className="hover:bg-gray-50 transition-colors"
          style={{ border: '1px solid #d1d5db' }}
        >
          <QrCode className="h-4 w-4 mr-2" />
          Scan QR
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleBLEConnect} 
          className="hover:bg-gray-50 transition-colors"
          style={{ border: '1px solid #d1d5db' }}
        >
          <Bluetooth className="h-4 w-4 mr-2" />
          Connect BLE Device
        </Button>
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
                  <Label htmlFor="temperature" className="text-sm font-medium text-gray-700">Temperature (°C)</Label>
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
                    className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.temperature ? 'border-red-500' : ''}`}
                    style={{ border: errors.temperature ? '1px solid #ef4444' : '1px solid #d1d5db' }}
                  />
                  {errors.temperature && <p className="text-xs text-red-600">{errors.temperature}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pH" className="text-sm font-medium text-gray-700">pH Level</Label>
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
                    className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.pH ? 'border-red-500' : ''}`}
                    style={{ border: errors.pH ? '1px solid #ef4444' : '1px solid #d1d5db' }}
                  />
                  {errors.pH && <p className="text-xs text-red-600">{errors.pH}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salinity" className="text-sm font-medium text-gray-700">Salinity (ppt)</Label>
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
                    className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.salinity ? 'border-red-500' : ''}`}
                    style={{ border: errors.salinity ? '1px solid #ef4444' : '1px solid #d1d5db' }}
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

      {/* QR Scanner Dialog */}
      <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scanning QR Code...</DialogTitle>
            <DialogDescription>
              Point your camera at the QR code on the sample container
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-pulse">
              <QrCode className="h-24 w-24 text-blue-600" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* BLE Device Dialog */}
      <Dialog open={showBLEDialog} onOpenChange={setShowBLEDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Available BLE Devices</DialogTitle>
            <DialogDescription>
              Select a device to connect and retrieve sensor data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {bleDevices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Scanning for devices...
              </div>
            ) : (
              bleDevices.map((device) => (
                <Button
                  key={device}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => connectToDevice(device)}
                >
                  <Bluetooth className="h-4 w-4 mr-2" />
                  {device}
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
