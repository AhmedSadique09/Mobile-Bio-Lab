import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Search, Activity, User, Beaker, FileText, Calendar } from 'lucide-react';
import { type ActivityLog } from '../types';
import { getActivityLogs, getUsers } from '../lib/storage';

export function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const allLogs = getActivityLogs();
    setLogs(allLogs);
    setFilteredLogs(allLogs);
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = logs.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLogs(filtered);
    } else {
      setFilteredLogs(logs);
    }
  }, [searchTerm, logs]);

  const getUserName = (userId: string) => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('Sample')) return <Beaker className="h-4 w-4" />;
    if (action.includes('User')) return <User className="h-4 w-4" />;
    if (action.includes('Protocol')) return <FileText className="h-4 w-4" />;
    if (action.includes('Booking')) return <Calendar className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('Created') || action.includes('Added')) return 'text-green-600 bg-green-100';
    if (action.includes('Updated')) return 'text-blue-600 bg-blue-100';
    if (action.includes('Deleted')) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Activity Logs</h1>
        <p className="text-gray-600">View all system activities and user actions</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search activity logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Activities</p>
            <p className="text-2xl mt-1">{logs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">User Actions</p>
            <p className="text-2xl mt-1">{logs.filter(l => l.action.includes('User')).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Sample Actions</p>
            <p className="text-2xl mt-1">{logs.filter(l => l.action.includes('Sample')).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Today</p>
            <p className="text-2xl mt-1">
              {logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}
            </p>
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
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                <div className={`p-3 rounded-lg h-fit ${getActionColor(log.action)}`}>
                  {getActionIcon(log.action)}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-xs text-gray-500">
                          by {getUserName(log.userId)}
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <div className="py-12 text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No activity logs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
