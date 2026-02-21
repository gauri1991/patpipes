/**
 * Edit Project Page
 * Form for editing analytics project details with validation
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

import { useAnalyticsProject, useAnalyticsProjects } from '@/hooks/useAnalyticsData';
import { AnalyticsProject } from '@/services/analyticsApi';

// Validation schema
const projectEditSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters').max(200, 'Project name is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description is too long'),
  status: z.enum(['draft', 'active', 'scope_definition', 'data_collection', 'patent_analysis', 'visualization', 'report_generation', 'completed', 'on_hold', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
});

type ProjectEditFormData = z.infer<typeof projectEditSchema>;

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { project, loading: projectLoading, error: projectError } = useAnalyticsProject(projectId);
  const { updateProject } = useAnalyticsProjects();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProjectEditFormData>({
    resolver: zodResolver(projectEditSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'draft',
      priority: 'medium',
      start_date: '',
      due_date: '',
    },
  });

  // Pre-populate form with existing project data
  useEffect(() => {
    if (project) {
      setValue('name', project.name);
      setValue('description', project.description);
      setValue('status', project.status);
      setValue('priority', project.priority);

      // Format dates for input fields
      if (project.start_date) {
        const startDate = new Date(project.start_date);
        setValue('start_date', startDate.toISOString().split('T')[0]);
      }
      if (project.due_date) {
        const dueDate = new Date(project.due_date);
        setValue('due_date', dueDate.toISOString().split('T')[0]);
      }
    }
  }, [project, setValue]);

  const onSubmit = async (data: ProjectEditFormData) => {
    try {
      setIsSubmitting(true);

      // Prepare update data
      const updateData: Partial<AnalyticsProject> = {
        name: data.name,
        description: data.description,
        status: data.status,
        priority: data.priority,
      };

      // Add dates if provided
      if (data.start_date) {
        updateData.start_date = data.start_date;
      }
      if (data.due_date) {
        updateData.due_date = data.due_date;
      }

      await updateProject(projectId, updateData);

      toast.success('Project updated successfully');
      router.push(`/dashboard/analytics/projects/${projectId}`);
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push(`/dashboard/analytics/projects/${projectId}`);
      }
    } else {
      router.push(`/dashboard/analytics/projects/${projectId}`);
    }
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project data...</p>
        </div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {projectError || 'Project not found'}
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => router.push('/dashboard/analytics')}
          className="mt-4"
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'scope_definition', label: 'Scope Definition' },
    { value: 'data_collection', label: 'Data Collection' },
    { value: 'patent_analysis', label: 'Patent Analysis' },
    { value: 'visualization', label: 'Visualization' },
    { value: 'report_generation', label: 'Report Generation' },
    { value: 'completed', label: 'Completed' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-gray-600' },
    { value: 'medium', label: 'Medium', color: 'text-blue-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
  ];

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Project</h1>
            <p className="text-muted-foreground mt-1">
              Update project details and settings
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>
              Edit the basic information about your analytics project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter project name"
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your project objectives, scope, and goals"
                rows={6}
                {...register('description')}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Status and Priority - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={watch('status')}
                  onValueChange={(value: any) => setValue('status', value, { shouldDirty: true })}
                >
                  <SelectTrigger id="status" className={errors.status ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-500">{errors.status.message}</p>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">
                  Priority <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={watch('priority')}
                  onValueChange={(value: any) => setValue('priority', value, { shouldDirty: true })}
                >
                  <SelectTrigger id="priority" className={errors.priority ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className={option.color}>{option.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.priority && (
                  <p className="text-sm text-red-500">{errors.priority.message}</p>
                )}
              </div>
            </div>

            {/* Dates - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register('start_date')}
                  className={errors.start_date ? 'border-red-500' : ''}
                />
                {errors.start_date && (
                  <p className="text-sm text-red-500">{errors.start_date.message}</p>
                )}
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  {...register('due_date')}
                  className={errors.due_date ? 'border-red-500' : ''}
                />
                {errors.due_date && (
                  <p className="text-sm text-red-500">{errors.due_date.message}</p>
                )}
              </div>
            </div>

            {/* Project Metadata Info */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Created by:</span>{' '}
                  {project.created_by.firstName} {project.created_by.lastName}
                </div>
                {project.assigned_to && (
                  <div>
                    <span className="font-medium">Assigned to:</span>{' '}
                    {project.assigned_to.firstName} {project.assigned_to.lastName}
                  </div>
                )}
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(project.created_at).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Last updated:</span>{' '}
                  {new Date(project.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Unsaved changes indicator */}
        {isDirty && (
          <div className="mt-4 text-center">
            <p className="text-sm text-orange-600">
              You have unsaved changes
            </p>
          </div>
        )}
      </form>
    </div>
  );
}