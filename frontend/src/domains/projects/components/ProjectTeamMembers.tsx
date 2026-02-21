/**
 * ProjectTeamMembers Component
 * Manages team members, roles, and permissions for a project
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Mail, 
  Phone, 
  Calendar,
  MoreHorizontal,
  Edit,
  Trash,
  Shield,
  UserPlus,
  Crown,
  Settings
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  permissions: string[];
  joinedAt: string;
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  phone?: string;
  lastActive?: string;
}

interface ProjectTeamMembersProps {
  projectId: string;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    role: 'Project Manager',
    permissions: ['read', 'write', 'admin'],
    joinedAt: '2024-01-15',
    status: 'active',
    phone: '+1-555-0123',
    lastActive: '2025-08-07T10:30:00Z'
  },
  {
    id: '2', 
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@company.com',
    role: 'Patent Analyst',
    permissions: ['read', 'write'],
    joinedAt: '2024-02-01',
    status: 'active',
    lastActive: '2025-08-06T15:45:00Z'
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Chen',
    email: 'mike.chen@company.com', 
    role: 'Research Assistant',
    permissions: ['read'],
    joinedAt: '2024-03-10',
    status: 'active',
    lastActive: '2025-08-05T09:20:00Z'
  },
  {
    id: '4',
    firstName: 'Lisa',
    lastName: 'Johnson',
    email: 'lisa.johnson@external.com',
    role: 'External Consultant',
    permissions: ['read'],
    joinedAt: '2024-04-20',
    status: 'pending'
  }
];

const rolePermissions = {
  'Project Manager': ['read', 'write', 'admin', 'delete'],
  'Patent Analyst': ['read', 'write', 'analyze'],
  'Research Assistant': ['read', 'comment'],
  'External Consultant': ['read'],
  'Reviewer': ['read', 'review']
};

export function ProjectTeamMembers({ projectId }: ProjectTeamMembersProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = 
      member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const formatLastActive = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Project Manager': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'Patent Analyst': return <Shield className="h-4 w-4 text-blue-500" />;
      default: return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-400';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const handleAddMember = () => {
    if (!newMemberEmail || !newMemberRole) return;

    const newMember: TeamMember = {
      id: Date.now().toString(),
      firstName: newMemberEmail.split('@')[0].split('.')[0] || 'New',
      lastName: newMemberEmail.split('@')[0].split('.')[1] || 'User',
      email: newMemberEmail,
      role: newMemberRole,
      permissions: rolePermissions[newMemberRole as keyof typeof rolePermissions] || ['read'],
      joinedAt: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    setTeamMembers(prev => [...prev, newMember]);
    setNewMemberEmail('');
    setNewMemberRole('');
    setIsAddMemberOpen(false);
  };

  const handleRemoveMember = (memberId: string) => {
    setTeamMembers(prev => prev.filter(member => member.id !== memberId));
  };

  const activeMembers = teamMembers.filter(m => m.status === 'active').length;
  const pendingMembers = teamMembers.filter(m => m.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeMembers} active, {pendingMembers} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(rolePermissions).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Role types configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(m => m.lastActive && 
                new Date(m.lastActive) > new Date(Date.now() - 24 * 60 * 60 * 1000)
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active in last 24h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage project team members, roles, and permissions
              </CardDescription>
            </div>
            
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>
                    Invite a new member to join this project
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input
                      type="email"
                      placeholder="user@company.com"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(rolePermissions).map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddMemberOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddMember}>
                      Send Invitation
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.keys(rolePermissions).map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Members List */}
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <div 
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                        {member.firstName[0]}{member.lastName[0]}
                      </div>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {member.firstName} {member.lastName}
                      </p>
                      {getRoleIcon(member.role)}
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                      {member.status === 'pending' && (
                        <Badge variant="secondary" className="text-xs">
                          Pending
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </span>
                      {member.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </span>
                      )}
                      <span>Last active: {formatLastActive(member.lastActive)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-1">
                    {member.permissions.slice(0, 3).map((permission) => (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                    {member.permissions.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{member.permissions.length - 3}
                      </Badge>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Role
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Message
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No team members found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || selectedRole !== 'all' 
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by adding the first team member.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}