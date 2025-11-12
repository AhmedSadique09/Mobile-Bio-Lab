import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Search, MapPin, Calendar, Loader2, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { type User, type Sample } from '../types';
import sampleService from '../services/sample.service';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Load samples from API
  const loadSamples = async (search?: string, page: number = 1, typeFilter?: string, statusFilter?: string) => {
    try {
      setLoading(true);
      setError('');
      const finalTypeFilter = typeFilter !== undefined ? typeFilter : (filterType !== 'all' ? filterType : undefined);
      const finalStatusFilter = statusFilter !== undefined ? statusFilter : (filterStatus !== 'all' ? filterStatus : undefined);
      
      const response = await sampleService.getSamples(
        search, 
        page, 
        10, 
        finalTypeFilter,
        finalStatusFilter
      );
      
      if (response.statusCode === 200 && response.payload) {
        // Map backend response to frontend Sample format
        const mappedSamples: Sample[] = response.payload.map((sample: any) => ({
          id: sample.id.toString(),
          sampleId: sample.sampleId,
          userId: sample.userId.toString(),
          collectionDate: sample.collectionDate,
          collectionTime: sample.collectionTime,
          sampleType: sample.sampleType,
          geolocation: {
            latitude: parseFloat(sample.latitude),
            longitude: parseFloat(sample.longitude)
          },
          fieldConditions: {
            ...(sample.temperature && { temperature: parseFloat(sample.temperature) }),
            ...(sample.pH && { pH: parseFloat(sample.pH) }),
            ...(sample.salinity && { salinity: parseFloat(sample.salinity) })
          },
          status: sample.status,
          createdAt: sample.createdAt,
          // Store user info for admin display
          userInfo: sample.User ? {
            firstName: sample.User.firstName,
            lastName: sample.User.lastName,
            email: sample.User.email
          } : null
        }));

        setSamples(mappedSamples);
        setFilteredSamples(mappedSamples);
        
        // Update pagination info
        if (response.pagination) {
          setPagination(response.pagination);
          setCurrentPage(response.pagination.page);
        }
      } else {
        setError(response.message || 'Failed to load samples');
      }
    } catch (err: any) {
      console.error('Error loading samples:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load samples');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSamples(undefined, 1);
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // For admin: search and filters on backend, for regular users: search locally
  useEffect(() => {
    if (user.role === 'admin') {
      // Debounce search for admin
      const timeoutId = setTimeout(() => {
        setCurrentPage(1); // Reset to first page on search/filter change
        loadSamples(searchTerm || undefined, 1, filterType, filterStatus);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterType, filterStatus, user.role]);

  // For regular users: apply filters on backend when filters change
  useEffect(() => {
    if (user.role !== 'admin') {
      setCurrentPage(1);
      loadSamples(undefined, 1, filterType, filterStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterStatus]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      const typeFilter = filterType !== 'all' ? filterType : undefined;
      const statusFilter = filterStatus !== 'all' ? filterStatus : undefined;
      loadSamples(
        user.role === 'admin' ? searchTerm || undefined : undefined, 
        newPage,
        typeFilter,
        statusFilter
      );
    }
  };

  // For regular users: local search only
  useEffect(() => {
    if (user.role !== 'admin') {
      let filtered = samples;
      if (searchTerm) {
        filtered = filtered.filter(s => 
          s.sampleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.sampleType.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      setFilteredSamples(filtered);
    } else {
      // For admin, filteredSamples = samples (already filtered by backend)
      setFilteredSamples(samples);
    }
  }, [searchTerm, samples, user.role]);

  // Handle status update
  const handleStatusUpdate = async (sampleId: string, newStatus: 'pending' | 'processing' | 'completed') => {
    try {
      const response = await sampleService.updateSampleStatus(parseInt(sampleId), newStatus);
      
      if (response.statusCode === 200 && response.payload) {
        // Update the sample in the local state
        setSamples(prevSamples => 
          prevSamples.map(s => 
            s.id === sampleId 
              ? {
                  ...s,
                  status: newStatus
                }
              : s
          )
        );
        setFilteredSamples(prevFiltered => 
          prevFiltered.map(s => 
            s.id === sampleId 
              ? {
                  ...s,
                  status: newStatus
                }
              : s
          )
        );
      }
    } catch (err: any) {
      console.error('Error updating sample status:', err);
      alert(err?.response?.data?.message || err?.message || 'Failed to update sample status');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Sample Management</h1>
          <p className="text-gray-600">View and manage biological samples</p>
        </div>
        {user.role !== 'admin' && (
          <Button onClick={() => onNavigate('add-sample')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Sample
          </Button>
        )}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Search Bar and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Search Bar */}
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={user.role === 'admin' ? "Search by Sample ID..." : "Search by Sample ID or type..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            style={{ border: '1px solid #d1d5db' }}
          />
        </div>

        {/* All Types Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 whitespace-nowrap">Type:</span>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]" style={{ border: '1px solid #d1d5db' }}>
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
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 whitespace-nowrap">Status:</span>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]" style={{ border: '1px solid #d1d5db' }}>
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
      </div>

      {/* Sample Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {pagination.total > 0 ? (
            <>Showing {filteredSamples.length} of {pagination.total} samples (Page {currentPage} of {pagination.totalPages})</>
          ) : (
            <>Showing {filteredSamples.length} samples</>
          )}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-500 mt-4">Loading samples...</p>
          </CardContent>
        </Card>
      )}

      {/* Samples Table */}
      {!loading && filteredSamples.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sample ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Collection Date</TableHead>
                  <TableHead>Collection Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Field Conditions</TableHead>
                  {user.role === 'admin' && <TableHead>Submit By</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Created On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSamples.map((sample) => (
                  <TableRow 
                    key={sample.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onNavigate('sample-detail', sample)}
                  >
                    <TableCell className="font-medium">{sample.sampleId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTypeColor(sample.sampleType)}>
                        {sample.sampleType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        {new Date(sample.collectionDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-500" />
                        {sample.collectionTime}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-gray-500" />
                        <span className="text-xs">
                          {sample.geolocation.latitude.toFixed(4)}, {sample.geolocation.longitude.toFixed(4)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {sample.fieldConditions?.temperature && (
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            T: {sample.fieldConditions.temperature}°C
                          </span>
                        )}
                        {sample.fieldConditions?.pH && (
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            pH: {sample.fieldConditions.pH}
                          </span>
                        )}
                        {sample.fieldConditions?.salinity && (
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            S: {sample.fieldConditions.salinity}
                          </span>
                        )}
                        {(!sample.fieldConditions || Object.keys(sample.fieldConditions).length === 0) && (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    {user.role === 'admin' && (
                      <TableCell>
                        {(sample as any).userInfo ? (
                          <div>
                            <p className="text-sm font-medium">
                              {(sample as any).userInfo.firstName} {(sample as any).userInfo.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{(sample as any).userInfo.email}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {user.role === 'admin' ? (
                        <Select 
                          value={sample.status} 
                          onValueChange={(value: 'pending' | 'processing' | 'completed') => 
                            handleStatusUpdate(sample.id, value)
                          }
                        >
                          <SelectTrigger className="w-[130px] h-7" style={{ border: '1px solid #d1d5db' }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={
                          sample.status === 'completed' ? 'bg-green-100 text-green-800' :
                          sample.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {sample.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(sample.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!loading && filteredSamples.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No samples found</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls - Only for admin or when pagination is available */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            style={{ border: '1px solid #d1d5db' }}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className={currentPage === pageNum ? "" : ""}
                  style={currentPage === pageNum ? {} : { border: '1px solid #d1d5db' }}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!pagination.hasNextPage}
            style={{ border: '1px solid #d1d5db' }}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
