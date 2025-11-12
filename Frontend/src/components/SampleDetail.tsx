import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, MapPin, Calendar, Thermometer, Droplets, Activity } from 'lucide-react';
import { type Sample } from '../types';

interface SampleDetailProps {
  sample: Sample;
  onNavigate: (page: string) => void;
}

export function SampleDetail({ sample, onNavigate }: SampleDetailProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'water': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'soil': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'plant': return 'bg-green-50 text-green-700 border-green-200';
      case 'biological-fluids': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('samples')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Samples
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl">{sample.sampleId}</h1>
            <Badge variant="outline" className={getTypeColor(sample.sampleType)}>
              {sample.sampleType}
            </Badge>
            <Badge className={getStatusColor(sample.status)}>
              {sample.status}
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">Detailed sample analysis and visualization</p>
        </div>
      </div>

      {/* Sample Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sample Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Collection Date & Time</p>
                <p>{new Date(sample.collectionDate).toLocaleDateString()} at {sample.collectionTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Geolocation</p>
                <p>{sample.geolocation.latitude.toFixed(6)}, {sample.geolocation.longitude.toFixed(6)}</p>
              </div>
            </div>

            {sample.notes && (
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600 mb-1">Notes</p>
                <p className="text-sm">{sample.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Field Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {sample.fieldConditions.temperature && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-gray-600">Temperature</p>
                  </div>
                  <p className="text-xl">{sample.fieldConditions.temperature}°C</p>
                </div>
              )}

              {sample.fieldConditions.pH && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="h-4 w-4 text-purple-600" />
                    <p className="text-sm text-gray-600">pH Level</p>
                  </div>
                  <p className="text-xl">{sample.fieldConditions.pH}</p>
                </div>
              )}

              {sample.fieldConditions.salinity && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-orange-600" />
                    <p className="text-sm text-gray-600">Salinity</p>
                  </div>
                  <p className="text-xl">{sample.fieldConditions.salinity} ppt</p>
                </div>
              )}

              {sample.fieldConditions.humidity && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-gray-600">Humidity</p>
                  </div>
                  <p className="text-xl">{sample.fieldConditions.humidity}%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
