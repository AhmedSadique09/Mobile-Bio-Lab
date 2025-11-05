import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { QrCode, Bluetooth, MapPin, CheckCircle } from 'lucide-react';
import { type User, type Sample } from '../types';
import { addSample, addNotification, addActivityLog } from '../lib/storage';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

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
    salinity: '',
    humidity: '',
    notes: ''
  });
  const [success, setSuccess] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showBLEDialog, setShowBLEDialog] = useState(false);
  const [bleDevices, setBleDevices] = useState<string[]>([]);

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
    // Simulate getting geolocation
    const mockLat = (Math.random() * 0.1 + 42.3).toFixed(4);
    const mockLon = (Math.random() * 0.1 - 71.1).toFixed(4);
    setFormData({ 
      ...formData, 
      latitude: mockLat,
      longitude: mockLon
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newSample: Sample = {
      id: `S${Date.now()}`,
      sampleId: formData.sampleId,
      userId: user.id,
      collectionDate: formData.collectionDate,
      collectionTime: formData.collectionTime,
      sampleType: formData.sampleType as any,
      geolocation: {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      },
      fieldConditions: {
        ...(formData.temperature && { temperature: parseFloat(formData.temperature) }),
        ...(formData.pH && { pH: parseFloat(formData.pH) }),
        ...(formData.salinity && { salinity: parseFloat(formData.salinity) }),
        ...(formData.humidity && { humidity: parseFloat(formData.humidity) })
      },
      notes: formData.notes || undefined,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    addSample(newSample);

    addNotification({
      id: Date.now().toString(),
      userId: user.id,
      title: 'Sample Added',
      message: `New sample ${newSample.sampleId} has been created`,
      type: 'sample',
      read: false,
      createdAt: new Date().toISOString()
    });

    addActivityLog({
      id: Date.now().toString(),
      userId: user.id,
      action: 'Sample Created',
      details: `Created sample ${newSample.sampleId}`,
      timestamp: new Date().toISOString()
    });

    setSuccess(true);
    setTimeout(() => {
      onNavigate('samples');
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Add New Sample</h1>
        <p className="text-gray-600">Record a new biological sample collection</p>
      </div>

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Sample added successfully! Redirecting...</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sample ID and QR Scanner */}
            <div className="space-y-2">
              <Label htmlFor="sampleId">Sample ID *</Label>
              <div className="flex gap-2">
                <Input
                  id="sampleId"
                  value={formData.sampleId}
                  onChange={(e) => setFormData({ ...formData, sampleId: e.target.value })}
                  placeholder="e.g., WTR-2025-001"
                  required
                />
                <Button type="button" variant="outline" onClick={handleQRScan}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan QR
                </Button>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="collectionDate">Collection Date *</Label>
                <Input
                  id="collectionDate"
                  type="date"
                  value={formData.collectionDate}
                  onChange={(e) => setFormData({ ...formData, collectionDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collectionTime">Collection Time *</Label>
                <Input
                  id="collectionTime"
                  type="time"
                  value={formData.collectionTime}
                  onChange={(e) => setFormData({ ...formData, collectionTime: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Sample Type */}
            <div className="space-y-2">
              <Label htmlFor="sampleType">Sample Type *</Label>
              <Select value={formData.sampleType} onValueChange={(value: any) => setFormData({ ...formData, sampleType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sample type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="water">Water</SelectItem>
                  <SelectItem value="soil">Soil</SelectItem>
                  <SelectItem value="plant">Plant</SelectItem>
                  <SelectItem value="biological-fluids">Biological Fluids</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Geolocation */}
            <div className="space-y-2">
              <Label>Geolocation *</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  placeholder="Latitude"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  required
                />
                <Input
                  placeholder="Longitude"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  required
                />
                <Button type="button" variant="outline" onClick={getCurrentLocation}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Get Location
                </Button>
              </div>
            </div>

            {/* Field Conditions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Field Conditions</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleBLEConnect}>
                  <Bluetooth className="h-4 w-4 mr-2" />
                  Connect BLE Device
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 22.5"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pH">pH Level</Label>
                  <Input
                    id="pH"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 7.2"
                    value={formData.pH}
                    onChange={(e) => setFormData({ ...formData, pH: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salinity">Salinity (ppt)</Label>
                  <Input
                    id="salinity"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 0.5"
                    value={formData.salinity}
                    onChange={(e) => setFormData({ ...formData, salinity: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="humidity">Humidity (%)</Label>
                  <Input
                    id="humidity"
                    type="number"
                    step="1"
                    placeholder="e.g., 65"
                    value={formData.humidity}
                    onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional observations or notes about the sample..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                Add Sample
              </Button>
              <Button type="button" variant="outline" onClick={() => onNavigate('samples')}>
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
