/**
 * Create Project Dialog Component
 * Modal for creating new prior art projects
 */

'use client';

import { useState } from 'react';
import {
  Shield,
  Lightbulb,
  Gavel,
  Map,
  BookOpen,
  Settings,
  Check,
  ArrowRight,
  FileText,
  Building
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { 
  PriorArtProject,
  PriorArtProjectType,
  CreatePriorArtProjectData,
  PROJECT_TYPE_CONFIG 
} from '@/types/prior-art.types';
import { priorArtApi } from '@/services/priorArtApi';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreate: (project: PriorArtProject) => void;
}

const PROJECT_TYPE_ICONS = {
  [PriorArtProjectType.FTO]: Shield,
  [PriorArtProjectType.NOVELTY]: Lightbulb,
  [PriorArtProjectType.INVALIDITY]: Gavel,
  [PriorArtProjectType.LANDSCAPE]: Map,
  [PriorArtProjectType.STATE_OF_ART]: BookOpen,
  [PriorArtProjectType.CUSTOM]: Settings,
};

export function CreateProjectDialog({
  open,
  onOpenChange,
  onProjectCreate
}: CreateProjectDialogProps) {
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreatePriorArtProjectData>({
    name: '',
    description: '',
    type: PriorArtProjectType.FTO,
  });

  const handleClose = () => {
    setStep(1);
    setFormData({
      name: '',
      description: '',
      type: PriorArtProjectType.FTO,
    });
    onOpenChange(false);
  };

  const handleTypeSelect = (type: PriorArtProjectType) => {
    setFormData(prev => ({ ...prev, type }));
    setStep(2);
  };

  const handleCreateProject = async () => {
    if (!formData.name.trim()) return;
    
    setIsCreating(true);
    try {
      const response = await priorArtApi.createProject(formData);
      if (response.success && response.data) {
        onProjectCreate(response.data);
        handleClose();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const selectedConfig = PROJECT_TYPE_CONFIG[formData.type];
  const SelectedIcon = PROJECT_TYPE_ICONS[formData.type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 1 ? (
              <>
                <Settings className="h-5 w-5" />
                Create New Prior Art Project
              </>
            ) : (
              <>
                <SelectedIcon className="h-5 w-5" />
                {selectedConfig.label} Project
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? 'Choose the type of prior art analysis you want to perform'
              : 'Provide details for your project'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {Object.entries(PROJECT_TYPE_CONFIG).map(([type, config]) => {
              const Icon = PROJECT_TYPE_ICONS[type as PriorArtProjectType];
              return (
                <Card
                  key={type}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/40 ${
                    formData.type === type ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleTypeSelect(type as PriorArtProjectType)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${config.color}-100 text-${config.color}-600`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{config.label}</CardTitle>
                        {formData.type === type && (
                          <Badge variant="default" className="text-xs mt-1">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm">
                      {config.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 py-4">
            {/* Selected Type Summary */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className={`p-2 rounded-lg bg-${selectedConfig.color}-100 text-${selectedConfig.color}-600`}>
                <SelectedIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{selectedConfig.label}</p>
                <p className="text-sm text-muted-foreground">{selectedConfig.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
              >
                Change
              </Button>
            </div>

            {/* Project Details Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., AI Patent FTO Analysis"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose and scope of this project..."
                  rows={3}
                />
              </div>

              {/* Target Patent Section (for Invalidity projects) */}
              {formData.type === PriorArtProjectType.INVALIDITY && (
                <div className="space-y-4 p-4 border rounded-lg bg-red-50/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-red-600" />
                    <Label className="text-sm font-medium">Target Patent Information</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="patent-number">Patent Number</Label>
                      <Input
                        id="patent-number"
                        value={formData.target_patent?.patent_number || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          target_patent: { 
                            ...prev.target_patent,
                            patent_number: e.target.value,
                            jurisdiction: 'US'
                          }
                        }))}
                        placeholder="e.g., US10,123,456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jurisdiction">Jurisdiction</Label>
                      <Input
                        id="jurisdiction"
                        value={formData.target_patent?.jurisdiction || 'US'}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          target_patent: { 
                            ...prev.target_patent,
                            patent_number: prev.target_patent?.patent_number || '',
                            jurisdiction: e.target.value
                          }
                        }))}
                        placeholder="US, EP, CN"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patent-title">Patent Title (Optional)</Label>
                    <Input
                      id="patent-title"
                      value={formData.target_patent?.title || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        target_patent: { 
                          ...prev.target_patent,
                          patent_number: prev.target_patent?.patent_number || '',
                          jurisdiction: prev.target_patent?.jurisdiction || 'US',
                          title: e.target.value
                        }
                      }))}
                      placeholder="Enter the patent title for reference"
                    />
                  </div>
                </div>
              )}

              {/* Project Type Specific Hints */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <div className="p-1 rounded bg-blue-100">
                    <Lightbulb className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Getting Started</p>
                    <p className="text-blue-700">
                      {formData.type === PriorArtProjectType.FTO && 
                        "After creating this project, you'll set up searches to find patents that might block commercialization of your product or technology."
                      }
                      {formData.type === PriorArtProjectType.NOVELTY && 
                        "You'll search for prior art to determine if your invention meets novelty and non-obviousness requirements."
                      }
                      {formData.type === PriorArtProjectType.INVALIDITY && 
                        "Search for prior art that predates and anticipates the claims of the target patent to challenge its validity."
                      }
                      {formData.type === PriorArtProjectType.LANDSCAPE && 
                        "Create comprehensive searches to map out the patent landscape in your technology area."
                      }
                      {formData.type === PriorArtProjectType.STATE_OF_ART && 
                        "Perform broad searches across patents and literature to understand the current state of technology."
                      }
                      {formData.type === PriorArtProjectType.CUSTOM && 
                        "Define your own search strategy and analysis approach based on your specific needs."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {step === 1 ? (
              <span>Step 1 of 2: Choose project type</span>
            ) : (
              <span>Step 2 of 2: Project details</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {step === 1 ? (
              <Button 
                onClick={() => setStep(2)}
                disabled={!formData.type}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleCreateProject}
                disabled={!formData.name.trim() || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Project'}
                <Check className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}