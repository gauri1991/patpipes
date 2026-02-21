/**
 * SettingsPage Component
 * Role-specific settings and preferences management
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Clock, 
  Globe, 
  Key, 
  Database,
  Mail,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Eye,
  EyeOff,
  ArrowLeft,
  Save,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  Users,
  Building,
  DollarSign,
  Calendar,
  FileText,
  Lock
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/user.types';
import { authService } from '../services/auth.service';

interface SettingsData {
  // General preferences
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  
  // Notification preferences
  emailNotifications: {
    projectUpdates: boolean;
    taskDeadlines: boolean;
    systemAlerts: boolean;
    weeklyReports: boolean;
    marketingEmails: boolean;
  };
  
  pushNotifications: {
    enabled: boolean;
    projectUpdates: boolean;
    urgentTasks: boolean;
    mentions: boolean;
  };
  
  // Privacy settings
  profileVisibility: 'public' | 'organization' | 'private';
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
  
  // Work preferences
  workingHours: {
    start: string;
    end: string;
    timezone: string;
  };
  workingDays: string[];
  
  // Dashboard preferences
  dashboardLayout: 'default' | 'compact' | 'detailed';
  defaultProjectView: 'grid' | 'list' | 'kanban';
  itemsPerPage: number;
  
  // Role-specific settings
  roleSettings: any;
}

export function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    emailNotifications: {
      projectUpdates: true,
      taskDeadlines: true,
      systemAlerts: true,
      weeklyReports: false,
      marketingEmails: false,
    },
    pushNotifications: {
      enabled: true,
      projectUpdates: true,
      urgentTasks: true,
      mentions: true,
    },
    profileVisibility: 'organization',
    showOnlineStatus: true,
    allowDirectMessages: true,
    workingHours: {
      start: '09:00',
      end: '17:00',
      timezone: 'UTC',
    },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    dashboardLayout: 'default',
    defaultProjectView: 'grid',
    itemsPerPage: 20,
    roleSettings: {},
  });

  const userRole = user?.role as UserRole;

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const userSettings = await authService.getUserSettings();
        setSettings(prev => ({
          ...prev,
          ...userSettings
        }));
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadSettings();
    }
  }, [user]);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedSettings = await authService.updateUserSettings(settings);
      setSettings(updatedSettings);
      // TODO: Show success notification
    } catch (error) {
      console.error('Error saving settings:', error);
      // TODO: Show error notification
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    // Reset to default settings
    setSettings({
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      emailNotifications: {
        projectUpdates: true,
        taskDeadlines: true,
        systemAlerts: true,
        weeklyReports: false,
        marketingEmails: false,
      },
      pushNotifications: {
        enabled: true,
        projectUpdates: true,
        urgentTasks: true,
        mentions: true,
      },
      profileVisibility: 'organization',
      showOnlineStatus: true,
      allowDirectMessages: true,
      workingHours: {
        start: '09:00',
        end: '17:00',
        timezone: 'UTC',
      },
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      dashboardLayout: 'default',
      defaultProjectView: 'grid',
      itemsPerPage: 20,
      roleSettings: {},
    });
  };

  const renderRoleSpecificSettings = () => {
    switch (userRole) {
      case UserRole.ATTORNEY:
      case UserRole.LEAD_ATTORNEY:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="billingRate">Default Billing Rate ($/hour)</Label>
                <Input
                  id="billingRate"
                  type="number"
                  placeholder="250"
                  value={settings.roleSettings?.defaultBillingRate || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    roleSettings: { 
                      ...prev.roleSettings, 
                      defaultBillingRate: parseFloat(e.target.value) 
                    }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billableTarget">Monthly Billable Hours Target</Label>
                <Input
                  id="billableTarget"
                  type="number"
                  placeholder="160"
                  value={settings.roleSettings?.billableHoursTarget || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    roleSettings: { 
                      ...prev.roleSettings, 
                      billableHoursTarget: parseInt(e.target.value) 
                    }
                  }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatic Time Tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically track time spent on tasks and projects
                  </p>
                </div>
                <Switch
                  checked={settings.roleSettings?.autoTimeTracking || false}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    roleSettings: { ...prev.roleSettings, autoTimeTracking: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Task Completion Confirmation</Label>
                  <p className="text-sm text-muted-foreground">
                    Require confirmation before marking tasks as complete
                  </p>
                </div>
                <Switch
                  checked={settings.roleSettings?.requireTaskCompletion || false}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    roleSettings: { ...prev.roleSettings, requireTaskCompletion: checked }
                  }))}
                />
              </div>

              <div className="space-y-4">
                <Label>Client Communication Preferences</Label>
                <div className="space-y-3 pl-4 border-l-2 border-muted">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Auto-send project updates to clients</Label>
                    <Switch
                      checked={settings.roleSettings?.clientCommunication?.autoSendUpdates || false}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        roleSettings: { 
                          ...prev.roleSettings, 
                          clientCommunication: {
                            ...prev.roleSettings?.clientCommunication,
                            autoSendUpdates: checked
                          }
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Update Frequency</Label>
                    <Select
                      value={settings.roleSettings?.clientCommunication?.updateFrequency || 'weekly'}
                      onValueChange={(value) => setSettings(prev => ({
                        ...prev,
                        roleSettings: { 
                          ...prev.roleSettings, 
                          clientCommunication: {
                            ...prev.roleSettings?.clientCommunication,
                            updateFrequency: value
                          }
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="milestone">At Milestones</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case UserRole.ANALYST:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Default Search Databases</Label>
              <div className="flex flex-wrap gap-2">
                {['USPTO', 'EPO', 'WIPO', 'Google Patents', 'Derwent'].map(db => (
                  <Badge 
                    key={db} 
                    variant={settings.roleSettings?.defaultDatabases?.includes(db) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const current = settings.roleSettings?.defaultDatabases || [];
                      const updated = current.includes(db) 
                        ? current.filter((d: string) => d !== db)
                        : [...current, db];
                      setSettings(prev => ({
                        ...prev,
                        roleSettings: { ...prev.roleSettings, defaultDatabases: updated }
                      }));
                    }}
                  >
                    <Database className="w-3 h-3 mr-1" />
                    {db}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Search Results Per Page</Label>
                <Select
                  value={settings.roleSettings?.searchResultsPerPage?.toString() || '50'}
                  onValueChange={(value) => setSettings(prev => ({
                    ...prev,
                    roleSettings: { ...prev.roleSettings, searchResultsPerPage: parseInt(value) }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default Export Format</Label>
                <Select
                  value={settings.roleSettings?.exportFormat || 'pdf'}
                  onValueChange={(value) => setSettings(prev => ({
                    ...prev,
                    roleSettings: { ...prev.roleSettings, exportFormat: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="word">Word</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-save Search Strategies</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save successful search strategies for reuse
                  </p>
                </div>
                <Switch
                  checked={settings.roleSettings?.autoSaveSearches || false}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    roleSettings: { ...prev.roleSettings, autoSaveSearches: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Images in Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Include patent images and diagrams in generated reports
                  </p>
                </div>
                <Switch
                  checked={settings.roleSettings?.includeImages || true}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    roleSettings: { ...prev.roleSettings, includeImages: checked }
                  }))}
                />
              </div>
            </div>
          </div>
        );

      case UserRole.ADMIN:
      case UserRole.SUPERVISOR:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about system events and issues
                  </p>
                </div>
                <Switch
                  checked={settings.roleSettings?.systemAlerts || true}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    roleSettings: { ...prev.roleSettings, systemAlerts: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>User Management Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about user registrations and role changes
                  </p>
                </div>
                <Switch
                  checked={settings.roleSettings?.userManagementNotifications || true}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    roleSettings: { ...prev.roleSettings, userManagementNotifications: checked }
                  }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Audit Log Retention (days)</Label>
              <div className="space-y-2">
                <Slider
                  value={[settings.roleSettings?.auditLogRetention || 90]}
                  onValueChange={(value) => setSettings(prev => ({
                    ...prev,
                    roleSettings: { ...prev.roleSettings, auditLogRetention: value[0] }
                  }))}
                  max={365}
                  min={30}
                  step={30}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>30 days</span>
                  <span>{settings.roleSettings?.auditLogRetention || 90} days</span>
                  <span>365 days</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Auto-backup Settings</Label>
              <div className="space-y-3 pl-4 border-l-2 border-muted">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Enable automatic backups</Label>
                  <Switch
                    checked={settings.roleSettings?.autoBackup?.enabled || false}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      roleSettings: { 
                        ...prev.roleSettings, 
                        autoBackup: {
                          ...prev.roleSettings?.autoBackup,
                          enabled: checked
                        }
                      }
                    }))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Backup Frequency</Label>
                    <Select
                      value={settings.roleSettings?.autoBackup?.frequency || 'weekly'}
                      onValueChange={(value) => setSettings(prev => ({
                        ...prev,
                        roleSettings: { 
                          ...prev.roleSettings, 
                          autoBackup: {
                            ...prev.roleSettings?.autoBackup,
                            frequency: value
                          }
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Retention Period (days)</Label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={settings.roleSettings?.autoBackup?.retentionPeriod || ''}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        roleSettings: { 
                          ...prev.roleSettings, 
                          autoBackup: {
                            ...prev.roleSettings?.autoBackup,
                            retentionPeriod: parseInt(e.target.value)
                          }
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case UserRole.CLIENT:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Invoice Preferences</Label>
              <div className="space-y-3 pl-4 border-l-2 border-muted">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Invoice Format</Label>
                    <Select
                      value={settings.roleSettings?.invoicePreferences?.format || 'pdf'}
                      onValueChange={(value) => setSettings(prev => ({
                        ...prev,
                        roleSettings: { 
                          ...prev.roleSettings, 
                          invoicePreferences: {
                            ...prev.roleSettings?.invoicePreferences,
                            format: value
                          }
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Billing Frequency</Label>
                    <Select
                      value={settings.roleSettings?.invoicePreferences?.frequency || 'monthly'}
                      onValueChange={(value) => setSettings(prev => ({
                        ...prev,
                        roleSettings: { 
                          ...prev.roleSettings, 
                          invoicePreferences: {
                            ...prev.roleSettings?.invoicePreferences,
                            frequency: value
                          }
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Auto-approve invoices under $1,000</Label>
                  <Switch
                    checked={settings.roleSettings?.invoicePreferences?.autoApproval || false}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      roleSettings: { 
                        ...prev.roleSettings, 
                        invoicePreferences: {
                          ...prev.roleSettings?.invoicePreferences,
                          autoApproval: checked
                        }
                      }
                    }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Communication Preferences</Label>
              <div className="space-y-3 pl-4 border-l-2 border-muted">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Preferred Contact Method</Label>
                    <Select
                      value={settings.roleSettings?.communicationPrefs?.preferredContact || 'email'}
                      onValueChange={(value) => setSettings(prev => ({
                        ...prev,
                        roleSettings: { 
                          ...prev.roleSettings, 
                          communicationPrefs: {
                            ...prev.roleSettings?.communicationPrefs,
                            preferredContact: value
                          }
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="portal">Client Portal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Update Frequency</Label>
                    <Select
                      value={settings.roleSettings?.communicationPrefs?.updateFrequency || 'weekly'}
                      onValueChange={(value) => setSettings(prev => ({
                        ...prev,
                        roleSettings: { 
                          ...prev.roleSettings, 
                          communicationPrefs: {
                            ...prev.roleSettings?.communicationPrefs,
                            updateFrequency: value
                          }
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No role-specific settings available</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure your preferences and account settings</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleBackToDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset All Settings</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset all your settings to their default values. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetSettings}>
                  Reset Settings
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="work">Work</TabsTrigger>
              <TabsTrigger value="role">Role Settings</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Theme Preference</Label>
                  <Select 
                    value={settings.theme} 
                    onValueChange={(value: any) => setSettings(prev => ({ ...prev, theme: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="w-4 h-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select 
                    value={settings.language} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select 
                    value={settings.timezone} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Dashboard Preferences</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm">Dashboard Layout</Label>
                    <Select 
                      value={settings.dashboardLayout} 
                      onValueChange={(value: any) => setSettings(prev => ({ ...prev, dashboardLayout: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Default Project View</Label>
                    <Select 
                      value={settings.defaultProjectView} 
                      onValueChange={(value: any) => setSettings(prev => ({ ...prev, defaultProjectView: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                        <SelectItem value="kanban">Kanban</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Items per Page</Label>
                    <Select 
                      value={settings.itemsPerPage.toString()} 
                      onValueChange={(value) => setSettings(prev => ({ ...prev, itemsPerPage: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                    <Mail className="w-5 h-5" />
                    Email Notifications
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(settings.emailNotifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <Label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Label>
                          <p className="text-sm text-muted-foreground">
                            {key === 'projectUpdates' && 'Get notified about project status changes'}
                            {key === 'taskDeadlines' && 'Receive alerts about upcoming task deadlines'}
                            {key === 'systemAlerts' && 'Important system notifications and maintenance updates'}
                            {key === 'weeklyReports' && 'Weekly summary of your projects and activities'}
                            {key === 'marketingEmails' && 'Product updates and promotional content'}
                          </p>
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            emailNotifications: { ...prev.emailNotifications, [key]: checked }
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                    <Smartphone className="w-5 h-5" />
                    Push Notifications
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow browser notifications for real-time updates
                        </p>
                      </div>
                      <Switch
                        checked={settings.pushNotifications.enabled}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          pushNotifications: { ...prev.pushNotifications, enabled: checked }
                        }))}
                      />
                    </div>

                    {settings.pushNotifications.enabled && (
                      <div className="pl-4 space-y-4">
                        {Object.entries(settings.pushNotifications)
                          .filter(([key]) => key !== 'enabled')
                          .map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <Label className="text-sm">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Label>
                            <Switch
                              checked={value}
                              onCheckedChange={(checked) => setSettings(prev => ({
                                ...prev,
                                pushNotifications: { ...prev.pushNotifications, [key]: checked }
                              }))}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Control who can see your profile information
                    </p>
                    <Select 
                      value={settings.profileVisibility} 
                      onValueChange={(value: any) => setSettings(prev => ({ ...prev, profileVisibility: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Anyone can see</SelectItem>
                        <SelectItem value="organization">Organization - Only team members</SelectItem>
                        <SelectItem value="private">Private - Only you</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Online Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Let others see when you're online and active
                      </p>
                    </div>
                    <Switch
                      checked={settings.showOnlineStatus}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showOnlineStatus: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Direct Messages</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow team members to send you direct messages
                      </p>
                    </div>
                    <Switch
                      checked={settings.allowDirectMessages}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowDirectMessages: checked }))}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="work" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div>
                  <Label>Working Hours</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set your typical working hours for better collaboration
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Start Time</Label>
                      <Input
                        type="time"
                        value={settings.workingHours.start}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          workingHours: { ...prev.workingHours, start: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">End Time</Label>
                      <Input
                        type="time"
                        value={settings.workingHours.end}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          workingHours: { ...prev.workingHours, end: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Timezone</Label>
                      <Select 
                        value={settings.workingHours.timezone} 
                        onValueChange={(value) => setSettings(prev => ({
                          ...prev,
                          workingHours: { ...prev.workingHours, timezone: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Working Days</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select the days you typically work
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                      <Badge
                        key={day}
                        variant={settings.workingDays.includes(day) ? 'default' : 'outline'}
                        className="cursor-pointer capitalize"
                        onClick={() => {
                          const updated = settings.workingDays.includes(day)
                            ? settings.workingDays.filter(d => d !== day)
                            : [...settings.workingDays, day];
                          setSettings(prev => ({ ...prev, workingDays: updated }));
                        }}
                      >
                        {day.substring(0, 3)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="role" className="space-y-6 mt-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">
                  {userRole ? userRole.replace('_', ' ').toUpperCase() : 'ROLE'} Settings
                </h3>
                <p className="text-sm text-muted-foreground">
                  Configure settings specific to your role and responsibilities
                </p>
              </div>
              {renderRoleSpecificSettings()}
            </TabsContent>

            <TabsContent value="security" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                    <Lock className="w-5 h-5" />
                    Password & Authentication
                  </h3>
                  <div className="space-y-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Key className="w-4 h-4 mr-2" />
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Password</DialogTitle>
                          <DialogDescription>
                            Enter your current password and choose a new one
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              placeholder="Enter current password"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              placeholder="Enter new password"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              placeholder="Confirm new password"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Update Password</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Data Management</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>Export Account Data</Label>
                        <p className="text-sm text-muted-foreground">
                          Download a copy of all your account data
                        </p>
                      </div>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                      <div>
                        <Label className="text-red-600">Delete Account</Label>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all associated data
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                              Delete Account
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}