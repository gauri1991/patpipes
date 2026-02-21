/**
 * ProjectFilters Component
 * Advanced filtering interface for projects
 */

'use client';

import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

import { useProjectsStore } from '../store/projects.store';
import { ProjectStatus, ProjectPriority, ProjectTypeId } from '../types/project.types';

export function ProjectFilters() {
  const { filters, setFilters, clearFilters, fetchProjects } = useProjectsStore();
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApplyFilters = () => {
    setFilters(localFilters);
    fetchProjects({
      filters: localFilters,
    });
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    clearFilters();
    fetchProjects();
  };

  const updateFilter = (key: string, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleStatusChange = (status: ProjectStatus, checked: boolean) => {
    const currentStatuses = localFilters.status || [];
    if (checked) {
      updateFilter('status', [...currentStatuses, status]);
    } else {
      updateFilter('status', currentStatuses.filter(s => s !== status));
    }
  };

  const handleTypeChange = (type: string, checked: boolean) => {
    const currentTypes = localFilters.type || [];
    if (checked) {
      updateFilter('type', [...currentTypes, type]);
    } else {
      updateFilter('type', currentTypes.filter(t => t !== type));
    }
  };

  const handlePriorityChange = (priority: ProjectPriority, checked: boolean) => {
    const currentPriorities = localFilters.priority || [];
    if (checked) {
      updateFilter('priority', [...currentPriorities, priority]);
    } else {
      updateFilter('priority', currentPriorities.filter(p => p !== priority));
    }
  };

  const statusOptions = [
    { value: ProjectStatus.DRAFT, label: 'Draft' },
    { value: ProjectStatus.ACTIVE, label: 'Active' },
    { value: ProjectStatus.ON_HOLD, label: 'On Hold' },
    { value: ProjectStatus.UNDER_REVIEW, label: 'Under Review' },
    { value: ProjectStatus.FILED, label: 'Filed' },
    { value: ProjectStatus.APPROVED, label: 'Approved' },
    { value: ProjectStatus.REJECTED, label: 'Rejected' },
    { value: ProjectStatus.COMPLETED, label: 'Completed' },
    { value: ProjectStatus.ARCHIVED, label: 'Archived' },
  ];

  const typeOptions = [
    { value: ProjectTypeId.UTILITY_PATENT, label: 'Utility Patent' },
    { value: ProjectTypeId.DESIGN_PATENT, label: 'Design Patent' },
    { value: ProjectTypeId.PROVISIONAL_PATENT, label: 'Provisional Patent' },
    { value: ProjectTypeId.TRADEMARK, label: 'Trademark' },
    { value: ProjectTypeId.COPYRIGHT, label: 'Copyright' },
    { value: ProjectTypeId.TRADE_SECRET, label: 'Trade Secret' },
    { value: ProjectTypeId.LICENSING, label: 'Licensing' },
    { value: ProjectTypeId.IP_AUDIT, label: 'IP Audit' },
  ];

  const priorityOptions = [
    { value: ProjectPriority.LOW, label: 'Low' },
    { value: ProjectPriority.MEDIUM, label: 'Medium' },
    { value: ProjectPriority.HIGH, label: 'High' },
    { value: ProjectPriority.URGENT, label: 'Urgent' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Status</Label>
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${option.value}`}
                  checked={localFilters.status?.includes(option.value) || false}
                  onCheckedChange={(checked) => 
                    handleStatusChange(option.value, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={`status-${option.value}`}
                  className="text-sm font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Type Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Project Type</Label>
          <div className="space-y-2">
            {typeOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${option.value}`}
                  checked={localFilters.type?.includes(option.value) || false}
                  onCheckedChange={(checked) => 
                    handleTypeChange(option.value, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={`type-${option.value}`}
                  className="text-sm font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Priority</Label>
          <div className="space-y-2">
            {priorityOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`priority-${option.value}`}
                  checked={localFilters.priority?.includes(option.value) || false}
                  onCheckedChange={(checked) => 
                    handlePriorityChange(option.value, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={`priority-${option.value}`}
                  className="text-sm font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Filters */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="client-name">Client Name</Label>
          <Input
            id="client-name"
            placeholder="Enter client name"
            value={localFilters.clientName || ''}
            onChange={(e) => updateFilter('clientName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            placeholder="Enter tags (comma separated)"
            value={localFilters.tags?.join(', ') || ''}
            onChange={(e) => {
              const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
              updateFilter('tags', tags);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Assigned to Me</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="assigned-to-me"
              checked={localFilters.assignedToMe || false}
              onCheckedChange={(checked) => updateFilter('assignedToMe', checked)}
            />
            <Label htmlFor="assigned-to-me" className="text-sm font-normal">
              Show only my projects
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-range">Date Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              placeholder="Start date"
              value={localFilters.dateRange?.start?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                const startDate = e.target.value ? new Date(e.target.value) : undefined;
                updateFilter('dateRange', {
                  ...localFilters.dateRange,
                  start: startDate
                });
              }}
            />
            <Input
              type="date"
              placeholder="End date"
              value={localFilters.dateRange?.end?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                const endDate = e.target.value ? new Date(e.target.value) : undefined;
                updateFilter('dateRange', {
                  ...localFilters.dateRange,
                  end: endDate
                });
              }}
            />
          </div>
        </div>
      </div>

      {/* Filter Actions */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button onClick={handleApplyFilters} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Apply Filters
        </Button>
        <Button variant="outline" onClick={handleClearFilters} className="flex items-center gap-2">
          <X className="h-4 w-4" />
          Clear All
        </Button>
      </div>
    </div>
  );
}