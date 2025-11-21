import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Search, Plus, FileText, CheckCircle, ChevronRight, Loader2, Trash2, Eye, EyeOff, Edit } from 'lucide-react';
import { type User } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import protocolService from '../services/protocol.service';
import { toast } from 'sonner';

interface ProtocolsProps {
  user: User;
}

export function Protocols({ user }: ProtocolsProps) {
  const [protocols, setProtocols] = useState<any[]>([]);
  const [filteredProtocols, setFilteredProtocols] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    steps: ['']
  });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingProtocol, setEditingProtocol] = useState<any | null>(null);

  useEffect(() => {
    loadProtocols();
  }, []);

  const loadProtocols = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await protocolService.getProtocols({}, 1, 100);

      if (response.statusCode === 200 && response.payload) {
        setProtocols(response.payload);
        setFilteredProtocols(response.payload);
      } else {
        setError(response.message || 'Failed to load protocols');
      }
    } catch (err: any) {
      console.error('Error loading protocols:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load protocols');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = protocols;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.experimentType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    setFilteredProtocols(filtered);
  }, [searchTerm, selectedCategory, protocols]);

  const categories = ['all', ...Array.from(new Set(protocols.map(p => p.category)))];

  const addStep = () => {
    setFormData({ ...formData, steps: [...formData.steps, ''] });
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const protocolData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty,
        steps: formData.steps.filter(s => s.trim() !== ''),
      };

      let response;
      if (editingProtocol) {
        response = await protocolService.updateProtocol(editingProtocol.id, protocolData);
      } else {
        response = await protocolService.createProtocol(protocolData);
      }

      if (response.statusCode === 201 || response.statusCode === 200) {
        toast.success(editingProtocol ? 'Protocol updated successfully!' : 'Protocol added successfully!');
        setSuccess(true);
        setFormData({
          title: '',
          description: '',
          category: '',
          difficulty: 'beginner',
          steps: ['']
        });
        setEditingProtocol(null);
        loadProtocols();

        // If we were editing the selected protocol, update it
        if (selectedProtocol && editingProtocol && selectedProtocol.id === editingProtocol.id) {
          setSelectedProtocol(response.payload);
        }

        setTimeout(() => {
          setSuccess(false);
          setShowAddDialog(false);
        }, 1500);
      } else {
        toast.error(response.message || (editingProtocol ? 'Failed to update protocol' : 'Failed to add protocol'));
      }
    } catch (err: any) {
      console.error('Error saving protocol:', err);
      toast.error(err?.response?.data?.message || err?.message || (editingProtocol ? 'Failed to update protocol' : 'Failed to add protocol'));
    }
  };

  const handleEdit = (protocol: any) => {
    setEditingProtocol(protocol);
    setFormData({
      title: protocol.title,
      description: protocol.description || '',
      category: protocol.category,
      difficulty: protocol.difficulty || 'beginner',
      steps: getProtocolSteps(protocol).length > 0 ? getProtocolSteps(protocol) : ['']
    });
    setShowAddDialog(true);
    // Close detail dialog if open
    if (selectedProtocol) {
      setSelectedProtocol(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this protocol?')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await protocolService.deleteProtocol(id);

      if (response.statusCode === 200) {
        toast.success('Protocol deleted successfully!');
        loadProtocols();
        if (selectedProtocol?.id === id) {
          setSelectedProtocol(null);
        }
      } else {
        toast.error(response.message || 'Failed to delete protocol');
      }
    } catch (err: any) {
      console.error('Error deleting protocol:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete protocol');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (id: number) => {
    try {
      const response = await protocolService.togglePublishStatus(id);

      if (response.statusCode === 200) {
        toast.success(response.message);
        loadProtocols();
        // Update selected protocol if it's the one being toggled
        if (selectedProtocol?.id === id) {
          setSelectedProtocol(response.payload);
        }
      } else {
        toast.error(response.message || 'Failed to toggle publish status');
      }
    } catch (err: any) {
      console.error('Error toggling publish status:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to toggle publish status');
    }
  };

  const getProtocolSteps = (protocol: any) => {
    if (!protocol?.steps) return [];
    if (Array.isArray(protocol.steps)) return protocol.steps;
    if (typeof protocol.steps === 'string') {
      try {
        // Try parsing as JSON first
        const parsed = JSON.parse(protocol.steps);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // If not JSON, maybe it's a newline separated string (fallback)
        return protocol.steps.split('\n').filter((s: string) => s.trim());
      }
    }
    return [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Protocol Library</h1>
          <p className="text-gray-600">Browse and search laboratory protocols</p>
        </div>
        {user.role === 'admin' && (
          <Button onClick={() => {
            setEditingProtocol(null);
            setFormData({
              title: '',
              description: '',
              category: '',
              difficulty: 'beginner',
              steps: ['']
            });
            setShowAddDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Protocol
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Loading protocols...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-500">{error}</p>
            <Button onClick={loadProtocols} className="mt-4" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search protocols by title, category, or experiment type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto">
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="whitespace-nowrap"
                    >
                      {category === 'all' ? 'All' : category}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Protocols Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProtocols.map((protocol) => (
              <Card
                key={protocol.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedProtocol(protocol)}
              >
                <CardHeader>
                  <div className="flex items-start gap-2">
                    <FileText className="h-5 w-5 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <CardTitle className="text-lg">{protocol.title}</CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {protocol.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{protocol.category}</Badge>
                    {protocol.difficulty && <Badge variant="secondary">{protocol.difficulty}</Badge>}
                    {user.role === 'admin' && (
                      <Badge variant={protocol.isPublished ? "default" : "destructive"}>
                        {protocol.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    )}
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      {getProtocolSteps(protocol).length} steps • Added {new Date(protocol.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); setSelectedProtocol(protocol); }}>
                      View Protocol <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                    {user.role === 'admin' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleEdit(protocol); }}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleTogglePublish(protocol.id); }}
                          title={protocol.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {protocol.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleDelete(protocol.id); }}
                          disabled={deletingId === protocol.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          {deletingId === protocol.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProtocols.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No protocols found</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Protocol Detail Dialog */}
      <Dialog open={!!selectedProtocol} onOpenChange={() => setSelectedProtocol(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedProtocol && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProtocol.title}</DialogTitle>
                <DialogDescription>{selectedProtocol.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge>{selectedProtocol.category}</Badge>
                  {selectedProtocol.difficulty && <Badge variant="outline">{selectedProtocol.difficulty}</Badge>}
                  {user.role === 'admin' && (
                    <Badge variant={selectedProtocol.isPublished ? "default" : "destructive"}>
                      {selectedProtocol.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  )}
                </div>

                <div>
                  <h4 className="text-sm mb-3">Procedure Steps:</h4>
                  <ol className="space-y-3">
                    {getProtocolSteps(selectedProtocol).map((step: string, index: number) => (
                      <li key={index} className="flex gap-3">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                          {index + 1}
                        </span>
                        <p className="text-sm flex-1">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="pt-4 border-t text-xs text-gray-500">
                  Created on {new Date(selectedProtocol.createdAt).toLocaleDateString()}
                </div>

                {user.role === 'admin' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(selectedProtocol)}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button
                      variant={selectedProtocol.isPublished ? "outline" : "default"}
                      onClick={() => handleTogglePublish(selectedProtocol.id)}
                      className="flex-1"
                    >
                      {selectedProtocol.isPublished ? (
                        <><EyeOff className="h-4 w-4 mr-2" /> Unpublish</>
                      ) : (
                        <><Eye className="h-4 w-4 mr-2" /> Publish</>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(selectedProtocol.id)}
                      disabled={deletingId === selectedProtocol.id}
                    >
                      {deletingId === selectedProtocol.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <><Trash2 className="h-4 w-4 mr-2" /> Delete</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Protocol Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProtocol ? 'Edit Protocol' : 'Add New Protocol'}</DialogTitle>
            <DialogDescription>
              {editingProtocol ? 'Update existing laboratory protocol' : 'Create a new laboratory protocol for reference'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Protocol added successfully!</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Protocol Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Select category</option>
                  <option value="water-analysis">Water Analysis</option>
                  <option value="soil-analysis">Soil Analysis</option>
                  <option value="plant-analysis">Plant Analysis</option>
                  <option value="biological-fluids">Biological Fluids</option>
                  <option value="general">General</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty *</Label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Procedure Steps *</Label>
                <Button type="button" size="sm" variant="outline" onClick={addStep}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Step
                </Button>
              </div>

              <div className="space-y-2">
                {formData.steps.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mt-2">
                      {index + 1}
                    </span>
                    <Input
                      value={step}
                      onChange={(e) => updateStep(index, e.target.value)}
                      placeholder="Describe this step..."
                      required
                    />
                    {formData.steps.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingProtocol ? 'Update Protocol' : 'Add Protocol'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
