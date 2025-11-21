import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Activity, User, Beaker, FileText, Calendar } from 'lucide-react';
import adminService from '../services/admin.service';

interface SystemLog {
  id: string;
  type: 'sample' | 'report' | 'scan' | 'notification';
  action: string;
  details: string;
  userId: number;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  timestamp: string;
  metadata?: any;
}

export function ActivityLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SystemLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionType, setActionType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    loadLogs();
  }, [currentPage, actionType]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = logs.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.user && `${log.user.firstName} ${log.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredLogs(filtered);
    } else {
      setFilteredLogs(logs);
    }
  }, [searchTerm, logs]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSystemLogs(currentPage, 50, {
        actionType: actionType !== 'all' ? actionType : undefined
      });
      if (response.statusCode === 200 && response.payload) {
        setLogs(response.payload.logs || []);
        setFilteredLogs(response.payload.logs || []);
        setPagination(response.payload.pagination || null);
      }
    } catch (error) {
      console.error('Error loading system logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (log: SystemLog) => {
    if (log.user) {
      return `${log.user.firstName} ${log.user.lastName}`;
    }
    return 'Unknown User';
  };

  const getActionIcon = (log: SystemLog) => {
    if (log.type === 'sample') return <Beaker className="h-4 w-4" />;
    if (log.type === 'report') return <FileText className="h-4 w-4" />;
    if (log.type === 'scan') return <Calendar className="h-4 w-4" />;
    if (log.action.includes('User')) return <User className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionColor = (log: SystemLog) => {
    if (log.action.includes('Created') || log.action.includes('Added') || log.action.includes('Generated')) return 'text-green-600 bg-green-100';
    if (log.action.includes('Updated')) return 'text-blue-600 bg-blue-100';
    if (log.action.includes('Deleted') || log.action.includes('Failed')) return 'text-red-600 bg-red-100';
    if (log.type === 'scan') return 'text-purple-600 bg-purple-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Activity Logs</h1>
        <p className="text-gray-600">View all system activities and user actions</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search activity logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="sample">Samples</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
                <SelectItem value="scan">Scans</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Activities</p>
            <p className="text-2xl mt-1">{pagination?.total || logs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Sample Actions</p>
            <p className="text-2xl mt-1">{logs.filter(l => l.type === 'sample').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Report Actions</p>
            <p className="text-2xl mt-1">{logs.filter(l => l.type === 'report').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Scan Events</p>
            <p className="text-2xl mt-1">{logs.filter(l => l.type === 'scan').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>Chronological list of all system activities</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3 animate-pulse" />
              <p className="text-gray-500">Loading activity logs...</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                    <div className={`p-3 rounded-lg h-fit ${getActionColor(log)}`}>
                      {getActionIcon(log)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-xs text-gray-500">
                              by {getUserName(log)}
                            </p>
                            <span className="text-xs text-gray-400">•</span>
                            <p className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {log.type && (
                              <>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                                  {log.type}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredLogs.length === 0 && !loading && (
                <div className="py-12 text-center">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No activity logs found</p>
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={!pagination.hasPreviousPage}
                      className="px-4 py-2 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={!pagination.hasNextPage}
                      className="px-4 py-2 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
