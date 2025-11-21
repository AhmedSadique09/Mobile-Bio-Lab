import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Loader2, FileText, Download, Trash2, Plus, AlertCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import reportService from '../services/report.service';
import adminService from '../services/admin.service';
import sampleService from '../services/sample.service';
import { type User } from '../types';
import { Checkbox } from './ui/checkbox';
import { HttpService } from '../services/base.service';

interface Report {
  id: number;
  reportType: string;
  title: string;
  description: string;
  filePath: string;
  fileSize: number;
  status: 'generating' | 'completed' | 'failed';
  errorMessage: string | null;
  createdAt: string;
  User?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  GeneratedBy?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ReportsProps {
  user: User;
}

export function Reports({ user }: ReportsProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);

  // Report generation form state
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSamples, setUserSamples] = useState<any[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [selectedSampleIds, setSelectedSampleIds] = useState<number[]>([]);

  const isAdmin = user.role?.toLowerCase() === 'admin';

  useEffect(() => {
    loadReports();
    if (isAdmin) {
      loadUsers();
    }
  }, [page, isAdmin]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await reportService.getReports(page, 10);
      if (response.statusCode === 200) {
        setReports(response.payload.reports || []);
        setTotalPages(response.payload.totalPages || 1);
      }
    } catch (error: any) {
      console.error('Failed to load reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await adminService.getUsers(1, '');
      if (response.statusCode === 200) {
        setUsers(response.payload.users || []);
      }
    } catch (error: any) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadUserSamples = async (userId: string) => {
    if (!userId || userId === 'system') {
      setUserSamples([]);
      setSelectedSampleIds([]);
      return;
    }

    try {
      setLoadingSamples(true);
      const response = await sampleService.getSamples('', 1, 1000);
      if (response.statusCode === 200) {
        // Filter samples for selected user - only completed samples
        const filtered = (response.payload || []).filter((s: any) =>
          s.userId === parseInt(userId) && s.status === 'completed'
        );
        setUserSamples(filtered);
        // Auto-select all completed samples by default
        setSelectedSampleIds(filtered.map((s: any) => s.id));
      }
    } catch (error: any) {
      console.error('Failed to load user samples:', error);
      toast.error('Failed to load user samples');
    } finally {
      setLoadingSamples(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      loadUserSamples(selectedUserId);
    } else {
      setUserSamples([]);
      setSelectedSampleIds([]);
    }
  }, [selectedUserId]);

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);

      // Validation - User must be selected
      if (!selectedUserId || selectedUserId === 'system') {
        toast.error('Please select a user to generate the report');
        return;
      }

      // Validation - At least one completed sample must be selected
      if (selectedSampleIds.length === 0) {
        toast.error('Please select at least one completed sample to generate the report');
        return;
      }

      // Get selected user info for title
      const selectedUser = users.find((u: any) => u.id.toString() === selectedUserId);
      const userName = selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'User';
      const reportTitle = `Report - ${userName} - ${new Date().toLocaleDateString()}`;

      const response = await reportService.generateReport({
        targetUserId: parseInt(selectedUserId),
        sampleIds: selectedSampleIds,
        title: reportTitle
      });

      if (response.statusCode === 201) {
        toast.success('Report generated successfully!');
        setOpenDialog(false);
        // Reset form
        setSelectedUserId('');
        setSelectedSampleIds([]);
        setUserSamples([]);
        // Reload reports immediately
        await loadReports();
      }
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (reportId: number) => {
    try {
      await reportService.downloadReport(reportId);
      toast.success('Report downloaded successfully');
    } catch (error: any) {
      console.error('Failed to download report:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to download report';
      toast.error(errorMessage);
    }
  };

  const handleShare = async (reportId: number) => {
    try {
      const Config = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      // Get token from HttpService (from cookies)
      const token = HttpService.getToken();

      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }

      const shareUrl = `${Config}/reports/${reportId}/download?token=${encodeURIComponent(token)}`;

      // Try to use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: 'Report Download',
          text: 'Check out this report',
          url: shareUrl
        });
        toast.success('Report shared successfully');
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Report link copied to clipboard! You can share this link with others.');
      }
    } catch (error: any) {
      // If user cancels share, don't show error
      if (error.name !== 'AbortError') {
        console.error('Failed to share report:', error);
        toast.error('Failed to share report: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const handleDelete = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const response = await reportService.deleteReport(reportId);
      if (response.statusCode === 200) {
        toast.success('Report deleted successfully');
        loadReports();
      }
    } catch (error: any) {
      console.error('Failed to delete report:', error);
      toast.error('Failed to delete report');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'generating':
        return <Badge className="bg-yellow-500">Generating</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-gray-600 mt-1">View and manage generated reports</p>
        </div>
        {isAdmin && (
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Generate New Report</DialogTitle>
                <DialogDescription>
                  Create a comprehensive report with graphs, maps, and analysis
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {isAdmin && (
                  <div className="space-y-2">
                    <Label htmlFor="targetUser">Select User <span className="text-red-500">*</span></Label>
                    {loadingUsers ? (
                      <div className="flex items-center space-x-2 py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-600">Loading users...</span>
                      </div>
                    ) : (
                      <Select
                        value={selectedUserId || ''}
                        onValueChange={setSelectedUserId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.length === 0 ? (
                            <SelectItem value="none" disabled>No users found</SelectItem>
                          ) : (
                            users.map((u) => (
                              <SelectItem key={u.id} value={u.id.toString()}>
                                {u.firstName} {u.lastName} ({u.email})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    <p className="text-xs text-gray-500">
                      Select a user to view their completed samples and generate report
                    </p>
                  </div>
                )}

                {isAdmin && selectedUserId && (
                  <div className="space-y-2 border rounded-lg p-4 bg-gray-50">
                    <Label>User Samples ({userSamples.length} total)</Label>
                    {loadingSamples ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <span className="ml-2 text-sm text-gray-600">Loading samples...</span>
                      </div>
                    ) : userSamples.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">No completed samples found for this user.</p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        <div className="flex items-center space-x-2 pb-2 border-b">
                          <Checkbox
                            id="select-all"
                            checked={selectedSampleIds.length === userSamples.length && userSamples.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSampleIds(userSamples.map((s: any) => s.id));
                              } else {
                                setSelectedSampleIds([]);
                              }
                            }}
                          />
                          <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                            Select All ({selectedSampleIds.length}/{userSamples.length})
                          </Label>
                        </div>
                        {userSamples.map((sample: any) => (
                          <div key={sample.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                            <Checkbox
                              id={`sample-${sample.id}`}
                              checked={selectedSampleIds.includes(sample.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSampleIds([...selectedSampleIds, sample.id]);
                                } else {
                                  setSelectedSampleIds(selectedSampleIds.filter(id => id !== sample.id));
                                }
                              }}
                            />
                            <Label htmlFor={`sample-${sample.id}`} className="flex-1 cursor-pointer text-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{sample.sampleId}</span>
                                <span className="text-gray-500 capitalize">{sample.sampleType}</span>
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(sample.collectionDate).toLocaleDateString()} - {sample.status}
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                    {userSamples.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        {selectedSampleIds.length} sample(s) selected for report generation
                      </p>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateReport} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Report'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>




      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
            <p className="text-gray-600 text-center mb-4">
              {isAdmin
                ? 'Generate your first report to see it here'
                : 'No reports have been generated for you yet. Contact admin to request a report.'}
            </p>
            {isAdmin && (
              <Button onClick={() => setOpenDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {report.title}
                        {getStatusBadge(report.status)}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {report.description || 'No description'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {report.status === 'completed' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(report.id)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShare(report.id)}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        </>
                      )}
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(report.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="font-medium capitalize">{report.reportType}</p>
                    </div>
                    {isAdmin && report.User && (
                      <div>
                        <p className="text-gray-500">User</p>
                        <p className="font-medium">
                          {report.User.firstName} {report.User.lastName}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500">File Size</p>
                      <p className="font-medium">
                        {report.fileSize ? formatFileSize(report.fileSize) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Generated</p>
                      <p className="font-medium">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {report.status === 'failed' && report.errorMessage && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Generation Failed</p>
                        <p className="text-sm text-red-600">{report.errorMessage}</p>
                      </div>
                    </div>
                  )}
                  {report.status === 'generating' && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2">
                      <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
                      <p className="text-sm text-yellow-800">Report is being generated...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

