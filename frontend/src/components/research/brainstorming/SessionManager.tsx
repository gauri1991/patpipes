/**
 * SessionManager Component
 * Manages brainstorming sessions - create, select, and manage active sessions
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Settings,
  Users,
  Clock,
  ChevronDown,
  Brain,
  Play,
  Pause,
  Archive
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useBrainstorming } from '@/hooks/useBrainstorming';
import { toast } from 'sonner';

interface SessionManagerProps {
  projectId: string;
  onSessionChange?: (sessionId: string | null) => void;
}

export function SessionManager({ projectId, onSessionChange }: SessionManagerProps) {
  const {
    sessions,
    currentSession,
    createSession,
    setActiveSession,
    fetchSessions,
    loading,
    error
  } = useBrainstorming(projectId);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSession, setNewSession] = useState({
    name: '',
    description: '',
    research_objective: '',
    target_domain: '',
    research_scope: {
      geographic: [],
      temporal: { from_year: new Date().getFullYear() - 10, to_year: new Date().getFullYear() },
      technical: []
    }
  });

  useEffect(() => {
    if (projectId) {
      fetchSessions();
    }
  }, [projectId, fetchSessions]);

  useEffect(() => {
    if (currentSession) {
      onSessionChange?.(currentSession.id);
    }
  }, [currentSession, onSessionChange]);

  const handleCreateSession = async () => {
    if (!newSession.name.trim() || !newSession.research_objective.trim()) {
      toast.error('Please fill in session name and research objective');
      return;
    }

    const session = await createSession(newSession);
    if (session) {
      setShowCreateDialog(false);
      setNewSession({
        name: '',
        description: '',
        research_objective: '',
        target_domain: '',
        research_scope: {
          geographic: [],
          temporal: { from_year: new Date().getFullYear() - 10, to_year: new Date().getFullYear() },
          technical: []
        }
      });
      toast.success('New brainstorming session created!');
    }
  };

  const handleSessionSelect = async (sessionId: string) => {
    await setActiveSession(sessionId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-3 w-3" />;
      case 'paused': return <Pause className="h-3 w-3" />;
      case 'completed': return <Archive className="h-3 w-3" />;
      case 'archived': return <Archive className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800 text-sm">Failed to load sessions: {error}</p>
          <Button variant="outline" size="sm" onClick={fetchSessions} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Brainstorming Sessions</CardTitle>
              <CardDescription>
                {currentSession 
                  ? `Active: ${currentSession.name}`
                  : 'Select or create a brainstorming session'
                }
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sessions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {currentSession ? 'Switch Session' : 'Select Session'}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Available Sessions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {sessions.map((session, index) => (
                    <DropdownMenuItem
                      key={`session-${session.id}-${index}`}
                      onClick={() => handleSessionSelect(session.id)}
                      className="flex items-start justify-between p-3 cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{session.name}</span>
                          <Badge className={`text-xs ${getStatusColor(session.status)}`}>
                            {getStatusIcon(session.status)}
                            <span className="ml-1">{session.status}</span>
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {session.research_objective}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {session.total_ideas} ideas
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {session.total_keywords} keywords
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {session.participants?.length || 0} participants
                          </span>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Session
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Session</DialogTitle>
                  <DialogDescription>
                    Start a new brainstorming session for this project
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Session Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., AI Patent Landscape Analysis"
                      value={newSession.name}
                      onChange={(e) => setNewSession(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="objective">Research Objective</Label>
                    <Textarea
                      id="objective"
                      placeholder="Describe the main research goal for this session..."
                      value={newSession.research_objective}
                      onChange={(e) => setNewSession(prev => ({ ...prev, research_objective: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="domain">Target Domain (Optional)</Label>
                    <Input
                      id="domain"
                      placeholder="e.g., Machine Learning, Biotechnology"
                      value={newSession.target_domain}
                      onChange={(e) => setNewSession(prev => ({ ...prev, target_domain: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Additional session details..."
                      value={newSession.description}
                      onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSession} disabled={loading}>
                    Create Session
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      {currentSession && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="text-lg font-semibold text-yellow-700">{currentSession.total_ideas}</div>
              <div className="text-xs text-yellow-600">Ideas</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="text-lg font-semibold text-green-700">{currentSession.total_keywords}</div>
              <div className="text-xs text-green-600">Keywords</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-lg font-semibold text-blue-700">{currentSession.total_strategies}</div>
              <div className="text-xs text-blue-600">Strategies</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <div className="text-lg font-semibold text-purple-700">{currentSession.completion_percentage}%</div>
              <div className="text-xs text-purple-600">Progress</div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}