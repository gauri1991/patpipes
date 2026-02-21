/**
 * ProfilePage Component
 * Comprehensive user profile management with role-specific attributes
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Award, 
  Calendar, 
  Edit3, 
  Save, 
  X,
  Camera,
  ArrowLeft,
  Shield,
  Clock,
  Globe,
  Building
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useAuth } from '../hooks/useAuth';
import { UserRole, ROLE_INFO } from '../types/user.types';
import { authService } from '../services/auth.service';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  title: string;
  department: string;
  timezone: string;
  language: string;
  // Role-specific fields
  barNumber?: string;
  licenseStates?: string[];
  specializations?: string[];
  yearsExperience?: number;
  certifications?: string[];
  companyName?: string;
  industry?: string;
  preferredDatabases?: string[];
  defaultSearchStrategy?: string;
}

export function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: '',
    title: '',
    department: '',
    timezone: 'UTC',
    language: 'en',
    specializations: [],
    certifications: [],
    preferredDatabases: [],
  });

  const userRole = user?.role as UserRole;
  const roleInfo = userRole ? ROLE_INFO[userRole] : null;

  // Load profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await authService.getExtendedProfile();
        setProfileData(prev => ({
          ...prev,
          ...profile
        }));
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user]);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedProfile = await authService.updateExtendedProfile(profileData);
      setProfileData(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      // TODO: Show error toast or notification
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    setProfileData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: '',
      title: '',
      department: '',
      timezone: 'UTC',
      language: 'en',
      specializations: [],
      certifications: [],
      preferredDatabases: [],
    });
    setIsEditing(false);
  };

  const addSpecialization = (specialization: string) => {
    if (specialization && !profileData.specializations?.includes(specialization)) {
      setProfileData(prev => ({
        ...prev,
        specializations: [...(prev.specializations || []), specialization]
      }));
    }
  };

  const removeSpecialization = (specialization: string) => {
    setProfileData(prev => ({
      ...prev,
      specializations: prev.specializations?.filter(s => s !== specialization) || []
    }));
  };

  const renderRoleSpecificFields = () => {
    switch (userRole) {
      case UserRole.ATTORNEY:
      case UserRole.LEAD_ATTORNEY:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="barNumber">Bar Number</Label>
                <Input
                  id="barNumber"
                  value={profileData.barNumber || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, barNumber: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Enter bar number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Years of Experience</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  value={profileData.yearsExperience || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, yearsExperience: parseInt(e.target.value) }))}
                  disabled={!isEditing}
                  placeholder="Years of experience"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>License States</Label>
              <div className="flex flex-wrap gap-2">
                {profileData.licenseStates?.map(state => (
                  <Badge key={state} variant="secondary">
                    {state}
                    {isEditing && (
                      <button 
                        onClick={() => setProfileData(prev => ({
                          ...prev,
                          licenseStates: prev.licenseStates?.filter(s => s !== state) || []
                        }))}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    )}
                  </Badge>
                ))}
                {isEditing && (
                  <Select onValueChange={(value) => {
                    if (!profileData.licenseStates?.includes(value)) {
                      setProfileData(prev => ({
                        ...prev,
                        licenseStates: [...(prev.licenseStates || []), value]
                      }));
                    }
                  }}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Add state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA">California</SelectItem>
                      <SelectItem value="NY">New York</SelectItem>
                      <SelectItem value="TX">Texas</SelectItem>
                      <SelectItem value="FL">Florida</SelectItem>
                      <SelectItem value="IL">Illinois</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        );

      case UserRole.ANALYST:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Years of Experience</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  value={profileData.yearsExperience || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, yearsExperience: parseInt(e.target.value) }))}
                  disabled={!isEditing}
                  placeholder="Years of experience"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultSearchStrategy">Default Search Strategy</Label>
                <Select
                  value={profileData.defaultSearchStrategy || ''}
                  onValueChange={(value) => setProfileData(prev => ({ ...prev, defaultSearchStrategy: value }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                    <SelectItem value="targeted">Targeted</SelectItem>
                    <SelectItem value="rapid">Rapid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preferred Databases</Label>
              <div className="flex flex-wrap gap-2">
                {profileData.preferredDatabases?.map(db => (
                  <Badge key={db} variant="secondary">
                    {db}
                    {isEditing && (
                      <button 
                        onClick={() => setProfileData(prev => ({
                          ...prev,
                          preferredDatabases: prev.preferredDatabases?.filter(d => d !== db) || []
                        }))}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    )}
                  </Badge>
                ))}
                {isEditing && (
                  <Select onValueChange={(value) => {
                    if (!profileData.preferredDatabases?.includes(value)) {
                      setProfileData(prev => ({
                        ...prev,
                        preferredDatabases: [...(prev.preferredDatabases || []), value]
                      }));
                    }
                  }}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Add database" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USPTO">USPTO</SelectItem>
                      <SelectItem value="EPO">EPO</SelectItem>
                      <SelectItem value="WIPO">WIPO</SelectItem>
                      <SelectItem value="Google Patents">Google Patents</SelectItem>
                      <SelectItem value="Derwent">Derwent</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        );

      case UserRole.CLIENT:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={profileData.companyName || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, companyName: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={profileData.industry || ''}
                  onValueChange={(value) => setProfileData(prev => ({ ...prev, industry: value }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="automotive">Automotive</SelectItem>
                    <SelectItem value="energy">Energy</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="yearsExperience">Years of Experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                value={profileData.yearsExperience || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, yearsExperience: parseInt(e.target.value) }))}
                disabled={!isEditing}
                placeholder="Years of experience"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your account information and preferences</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleBackToDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile Overview */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user?.avatar} alt={user?.firstName} />
                  <AvatarFallback className="text-2xl">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Profile Picture</DialogTitle>
                        <DialogDescription>
                          Upload a new profile picture. Recommended size: 400x400px
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="avatar">Picture</Label>
                        <Input id="avatar" type="file" accept="image/*" />
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              <div>
                <h3 className="text-xl font-semibold">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-muted-foreground">{user?.email}</p>
                {roleInfo && (
                  <Badge className={`mt-2 ${roleInfo.color}`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {roleInfo.label}
                  </Badge>
                )}
              </div>

              <div className="w-full text-left space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span>Organization</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Joined {new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Last active today</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information and role-specific details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="professional">Professional</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact administrator if needed.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={profileData.phoneNumber}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      value={profileData.title}
                      onChange={(e) => setProfileData(prev => ({ ...prev, title: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Senior Patent Attorney"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={profileData.department}
                      onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Intellectual Property"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="professional" className="space-y-6">
                {renderRoleSpecificFields()}
                
                <Separator />
                
                <div className="space-y-4">
                  <Label>Specializations</Label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.specializations?.map(spec => (
                      <Badge key={spec} variant="outline">
                        {spec}
                        {isEditing && (
                          <button 
                            onClick={() => removeSpecialization(spec)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        )}
                      </Badge>
                    ))}
                    {isEditing && (
                      <Select onValueChange={addSpecialization}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Add specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Biotechnology">Biotechnology</SelectItem>
                          <SelectItem value="Software">Software</SelectItem>
                          <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                          <SelectItem value="Electronics">Electronics</SelectItem>
                          <SelectItem value="Medical Devices">Medical Devices</SelectItem>
                          <SelectItem value="Pharmaceuticals">Pharmaceuticals</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Certifications</Label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.certifications?.map(cert => (
                      <Badge key={cert} variant="outline">
                        <Award className="w-3 h-3 mr-1" />
                        {cert}
                        {isEditing && (
                          <button 
                            onClick={() => setProfileData(prev => ({
                              ...prev,
                              certifications: prev.certifications?.filter(c => c !== cert) || []
                            }))}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={profileData.timezone}
                      onValueChange={(value) => setProfileData(prev => ({ ...prev, timezone: value }))}
                      disabled={!isEditing}
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
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={profileData.language}
                      onValueChange={(value) => setProfileData(prev => ({ ...prev, language: value }))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}