/**
 * useTemplates Hook
 * React hook for managing all types of templates using the template service
 */

import { useState, useEffect, useCallback } from 'react';
import { templateService } from '@/services/templateService';
import {
  Template,
  TemplateType,
  TemplateScope,
  TemplateFilter,
  TemplateCreationData,
  TemplateUsageStats
} from '@/types/template.types';
import { toast } from 'sonner';

interface UseTemplatesOptions {
  type?: TemplateType;
  autoLoad?: boolean;
  filter?: TemplateFilter;
}

export function useTemplates(options: UseTemplatesOptions = {}) {
  const { type, autoLoad = true, filter: initialFilter } = options;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TemplateFilter>(initialFilter || {});
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Load templates
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const appliedFilter = {
        ...filter,
        ...(type ? { type: [type] } : {})
      };
      
      const data = await templateService.getTemplates(appliedFilter);
      setTemplates(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load templates';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filter, type]);

  // Load templates on mount and when filter changes
  useEffect(() => {
    if (autoLoad) {
      loadTemplates();
    }
  }, [loadTemplates, autoLoad]);

  // Get template by ID
  const getTemplateById = useCallback(async (id: string): Promise<Template | null> => {
    try {
      const template = await templateService.getTemplateById(id);
      if (template) {
        setSelectedTemplate(template);
      }
      return template;
    } catch (err) {
      toast.error('Failed to load template');
      return null;
    }
  }, []);

  // Get popular templates
  const getPopularTemplates = useCallback(async (limit: number = 5): Promise<Template[]> => {
    try {
      return await templateService.getPopularTemplates(limit, type);
    } catch (err) {
      toast.error('Failed to load popular templates');
      return [];
    }
  }, [type]);

  // Get recent templates
  const getRecentTemplates = useCallback(async (limit: number = 5): Promise<Template[]> => {
    try {
      return await templateService.getRecentTemplates(limit, type);
    } catch (err) {
      toast.error('Failed to load recent templates');
      return [];
    }
  }, [type]);

  // Create a new template
  const createTemplate = useCallback(async (data: TemplateCreationData): Promise<Template | null> => {
    try {
      const newTemplate = await templateService.createTemplate(data);
      
      // Reload templates to include the new one
      await loadTemplates();
      
      toast.success('Template created successfully');
      return newTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      toast.error(errorMessage);
      return null;
    }
  }, [loadTemplates]);

  // Update a template
  const updateTemplate = useCallback(async (id: string, updates: Partial<Template>): Promise<Template | null> => {
    try {
      const updatedTemplate = await templateService.updateTemplate(id, updates);
      
      if (updatedTemplate) {
        // Update local state
        setTemplates(prev => 
          prev.map(t => t.id === id ? updatedTemplate : t)
        );
        
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(updatedTemplate);
        }
        
        toast.success('Template updated successfully');
      }
      
      return updatedTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template';
      toast.error(errorMessage);
      return null;
    }
  }, [selectedTemplate]);

  // Delete a template
  const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await templateService.deleteTemplate(id);
      
      if (success) {
        // Update local state
        setTemplates(prev => prev.filter(t => t.id !== id));
        
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(null);
        }
        
        toast.success('Template deleted successfully');
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      toast.error(errorMessage);
      return false;
    }
  }, [selectedTemplate]);

  // Duplicate a template
  const duplicateTemplate = useCallback(async (id: string, newName: string): Promise<Template | null> => {
    try {
      const duplicated = await templateService.duplicateTemplate(id, newName);
      
      if (duplicated) {
        // Reload templates to include the duplicate
        await loadTemplates();
        toast.success('Template duplicated successfully');
      }
      
      return duplicated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate template';
      toast.error(errorMessage);
      return null;
    }
  }, [loadTemplates]);

  // Increment usage
  const incrementUsage = useCallback(async (id: string): Promise<void> => {
    try {
      await templateService.incrementUsage(id);
      
      // Update local state
      setTemplates(prev => 
        prev.map(t => 
          t.id === id 
            ? { ...t, usage_count: t.usage_count + 1 }
            : t
        )
      );
    } catch (err) {
      console.error('Failed to increment usage:', err);
    }
  }, []);

  // Get usage statistics
  const getUsageStats = useCallback(async (id: string): Promise<TemplateUsageStats | null> => {
    try {
      return await templateService.getUsageStats(id);
    } catch (err) {
      console.error('Failed to get usage stats:', err);
      return null;
    }
  }, []);

  // Search templates
  const searchTemplates = useCallback(async (query: string): Promise<Template[]> => {
    try {
      return await templateService.searchTemplates(query, type);
    } catch (err) {
      toast.error('Failed to search templates');
      return [];
    }
  }, [type]);

  // Get categories
  const getCategories = useCallback(async (): Promise<string[]> => {
    try {
      return await templateService.getCategories(type);
    } catch (err) {
      console.error('Failed to get categories:', err);
      return [];
    }
  }, [type]);

  // Get tags
  const getTags = useCallback(async (): Promise<string[]> => {
    try {
      return await templateService.getTags(type);
    } catch (err) {
      console.error('Failed to get tags:', err);
      return [];
    }
  }, [type]);

  // Get template count by type
  const getTemplateCountByType = useCallback(async (): Promise<Record<TemplateType, number>> => {
    try {
      return await templateService.getTemplateCountByType();
    } catch (err) {
      console.error('Failed to get template counts:', err);
      return {} as Record<TemplateType, number>;
    }
  }, []);

  // Update filter
  const updateFilter = useCallback((newFilter: Partial<TemplateFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  // Clear filter
  const clearFilter = useCallback(() => {
    setFilter({});
  }, []);

  // Get templates by type (filtered from loaded templates)
  const getTemplatesByType = useCallback((templateType: TemplateType): Template[] => {
    return templates.filter(t => t.template_type === templateType);
  }, [templates]);

  // Get templates by scope (filtered from loaded templates)
  const getTemplatesByScope = useCallback((scope: TemplateScope): Template[] => {
    return templates.filter(t => t.scope === scope);
  }, [templates]);

  return {
    // State
    templates,
    loading,
    error,
    filter,
    selectedTemplate,

    // Template operations
    loadTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    incrementUsage,

    // Query operations
    getPopularTemplates,
    getRecentTemplates,
    searchTemplates,
    getCategories,
    getTags,
    getTemplateCountByType,
    getTemplatesByType,
    getTemplatesByScope,

    // Filter operations
    updateFilter,
    clearFilter,
    setFilter,

    // Selection
    setSelectedTemplate,

    // Statistics
    getUsageStats
  };
}