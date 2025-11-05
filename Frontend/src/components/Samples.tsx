import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Search, Download, Share2, MapPin, Calendar } from 'lucide-react';
import { type User, type Sample } from '../types';
import { getSamples } from '../lib/storage';

interface SamplesProps {
  user: User;
  onNavigate: (page: string, data?: any) => void;
}

export function Samples({ user, onNavigate }: SamplesProps) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<Sample[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const allSamples = getSamples();
    const userSamples = user.role === 'admin' 
      ? allSamples 
      : allSamples.filter(s => s.userId === user.id);
    setSamples(userSamples);
    setFilteredSamples(userSamples);
  }, [user]);

  useEffect(() => {
    let filtered = samples;

    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.sampleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.sampleType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(s => s.sampleType === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }

    setFilteredSamples(filtered);
  }, [searchTerm, filterType, filterStatus, samples]);

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

  const exportData = () => {
    // Simulate PDF export
    alert('Exporting sample data to PDF...');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Sample Management</h1>
          <p className="text-gray-600">View and manage biological samples</p>
        </div>
        <Button onClick={() => onNavigate('add-sample')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Sample
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by Sample ID or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="soil">Soil</SelectItem>
                <SelectItem value="plant">Plant</SelectItem>
                <SelectItem value="biological-fluids">Biological Fluids</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sample Count and Export */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredSamples.length} of {samples.length} samples
        </p>
        <Button variant="outline" size="sm" onClick={exportData}>
          <Download className="h-4 w-4 mr-2" />
          Export to PDF
        </Button>
      </div>

      {/* Samples Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSamples.map((sample) => (
          <Card 
            key={sample.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate('sample-detail', sample)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{sample.sampleId}</CardTitle>
                  <CardDescription className="mt-1">
                    <Badge variant="outline" className={getTypeColor(sample.sampleType)}>
                      {sample.sampleType}
                    </Badge>
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(sample.status)}>
                  {sample.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(sample.collectionDate).toLocaleDateString()} at {sample.collectionTime}
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                {sample.geolocation.latitude.toFixed(4)}, {sample.geolocation.longitude.toFixed(4)}
              </div>

              {sample.fieldConditions && Object.keys(sample.fieldConditions).length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-2">Field Conditions:</p>
                  <div className="flex flex-wrap gap-2">
                    {sample.fieldConditions.temperature && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        Temp: {sample.fieldConditions.temperature}°C
                      </span>
                    )}
                    {sample.fieldConditions.pH && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        pH: {sample.fieldConditions.pH}
                      </span>
                    )}
                    {sample.fieldConditions.salinity && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        Salinity: {sample.fieldConditions.salinity}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`Sharing sample ${sample.sampleId} via email...`);
                  }}
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSamples.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No samples found</p>
            <Button onClick={() => onNavigate('add-sample')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Sample
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
