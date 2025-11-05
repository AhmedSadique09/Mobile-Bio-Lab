import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Search, Plus, FileText, CheckCircle, ChevronRight } from 'lucide-react';
import { type User, type Protocol } from '../types';
import { getProtocols, addProtocol, addActivityLog } from '../lib/storage';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface ProtocolsProps {
  user: User;
}

export function Protocols({ user }: ProtocolsProps) {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [filteredProtocols, setFilteredProtocols] = useState<Protocol[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    experimentType: '',
    steps: ['']
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadProtocols();
  }, []);

  const loadProtocols = () => {
    const allProtocols = getProtocols();
    setProtocols(allProtocols);
    setFilteredProtocols(allProtocols);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newProtocol: Protocol = {
      id: `P${Date.now()}`,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      experimentType: formData.experimentType,
      steps: formData.steps.filter(s => s.trim() !== ''),
      createdBy: user.id,
      createdAt: new Date().toISOString()
    };

    addProtocol(newProtocol);

    addActivityLog({
      id: Date.now().toString(),
      userId: user.id,
      action: 'Protocol Added',
      details: `Added protocol "${newProtocol.title}"`,
      timestamp: new Date().toISOString()
    });

    setSuccess(true);
    setFormData({
      title: '',
      description: '',
      category: '',
      experimentType: '',
      steps: ['']
    });
    loadProtocols();

    setTimeout(() => {
      setSuccess(false);
      setShowAddDialog(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Protocol Library</h1>
          <p className="text-gray-600">Browse and search laboratory protocols</p>
        </div>
        {user.role === 'admin' && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Protocol
          </Button>
        )}
      </div>

      {/* Search and Filter */}
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
                <Badge variant="secondary">{protocol.experimentType}</Badge>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500">
                  {protocol.steps.length} steps • Added {new Date(protocol.createdAt).toLocaleDateString()}
                </p>
              </div>

              <Button variant="outline" size="sm" className="w-full">
                View Protocol <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
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
                  <Badge variant="outline">{selectedProtocol.experimentType}</Badge>
                </div>

                <div>
                  <h4 className="text-sm mb-3">Procedure Steps:</h4>
                  <ol className="space-y-3">
                    {selectedProtocol.steps.map((step, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Protocol Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Protocol</DialogTitle>
            <DialogDescription>
              Create a new laboratory protocol for reference
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
                <Input
                  id="category"
                  placeholder="e.g., Environmental, Microbiology"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experimentType">Experiment Type *</Label>
                <Input
                  id="experimentType"
                  placeholder="e.g., Water Analysis"
                  value={formData.experimentType}
                  onChange={(e) => setFormData({ ...formData, experimentType: e.target.value })}
                  required
                />
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
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mt-2">
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
                Add Protocol
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
