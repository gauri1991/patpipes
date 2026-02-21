/**
 * Attorney Connections Page
 * Manage connection requests with attorneys
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MessageSquare,
  Check,
  X,
  Clock,
  Calendar,
  User,
  Mail,
  FileText,
  Filter,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Briefcase
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import { useAttorneyConnections } from '@/hooks/useAttorneyData';
import { attorneyApi, AttorneyConnection } from '@/services/attorneyApi';

export default function AttorneyConnectionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');

  // Response dialog state
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<AttorneyConnection | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [respondingAction, setRespondingAction] = useState<'accept' | 'decline' | null>(null);
  const [isResponding, setIsResponding] = useState(false);

  // Fetch connections
  const { connections, loading, refresh, acceptConnection, declineConnection } = useAttorneyConnections();

  const handleOpenResponse = (connection: AttorneyConnection, action: 'accept' | 'decline') => {
    setSelectedConnection(connection);
    setRespondingAction(action);
    setResponseMessage('');
    setResponseDialogOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedConnection || !respondingAction) return;

    setIsResponding(true);
    try {
      if (respondingAction === 'accept') {
        await acceptConnection(selectedConnection.id, responseMessage);
      } else {
        await declineConnection(selectedConnection.id, responseMessage);
      }

      setResponseDialogOpen(false);
      setSelectedConnection(null);
      setResponseMessage('');
      setRespondingAction(null);
      refresh();
    } catch (error) {
      console.error('Error responding to connection:', error);
    } finally {
      setIsResponding(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'declined':
        return <XCircle className="h-4 w-4" />;
      case 'active':
        return <MessageSquare className="h-4 w-4" />;
      case 'completed':
        return <Check className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter connections based on tab
  const filteredConnections = connections.filter(conn => {
    if (activeTab === 'pending') return conn.status === 'pending';
    if (activeTab === 'accepted') return conn.status === 'accepted';
    if (activeTab === 'active') return conn.status === 'active';
    if (activeTab === 'completed') return conn.status === 'completed';
    return true; // 'all' tab
  }).filter(conn => {
    if (statusFilter) return conn.status === statusFilter;
    return true;
  });

  const pendingCount = connections.filter(c => c.status === 'pending').length;
  const activeCount = connections.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/attorney')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Attorney Network
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Connection Requests</h1>
          <p className="text-muted-foreground">
            Manage your attorney connections and requests
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connections.length}</div>
            <p className="text-xs text-muted-foreground">All connection requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Active engagements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Check className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {connections.filter(c => c.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">Finished engagements</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All ({connections.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingCount})
              {pendingCount > 0 && (
                <Badge className="ml-2 px-1.5 py-0 h-5 rounded-full bg-yellow-600">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading connections...</p>
              </CardContent>
            </Card>
          ) : filteredConnections.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Connections Found</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === 'all'
                    ? 'You have no connection requests yet.'
                    : `No ${activeTab} connections at this time.`}
                </p>
                <Button onClick={() => router.push('/dashboard/attorney')}>
                  Browse Attorneys
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredConnections.map((connection) => (
                <Card key={connection.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Attorney Avatar */}
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={connection.attorney.profile_photo}
                          alt={connection.attorney.full_name}
                        />
                        <AvatarFallback>
                          {getInitials(connection.attorney.first_name, connection.attorney.last_name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Connection Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">
                              {connection.attorney.full_name}
                            </h3>
                            {connection.attorney.title && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {connection.attorney.title}
                                {connection.attorney.law_firm_name && ` at ${connection.attorney.law_firm_name}`}
                              </p>
                            )}
                          </div>
                          <Badge className={getStatusColor(connection.status)}>
                            {getStatusIcon(connection.status)}
                            <span className="ml-1 capitalize">{connection.status}</span>
                          </Badge>
                        </div>

                        {/* Connection Type */}
                        <div className="flex items-center gap-4 text-sm mb-3">
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span className="capitalize">{connection.connection_type.replace('_', ' ')}</span>
                          </div>
                          <Separator orientation="vertical" className="h-4" />
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Requested {formatDate(connection.requested_date)}
                            </span>
                          </div>
                        </div>

                        {/* Message */}
                        {connection.message && (
                          <div className="bg-muted p-3 rounded-md mb-3">
                            <p className="text-sm font-medium mb-1">Your Message:</p>
                            <p className="text-sm text-muted-foreground">{connection.message}</p>
                          </div>
                        )}

                        {/* Response */}
                        {connection.response && (
                          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md mb-3">
                            <p className="text-sm font-medium mb-1">Attorney Response:</p>
                            <p className="text-sm text-blue-900">{connection.response}</p>
                            {connection.responded_date && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Responded on {formatDate(connection.responded_date)}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Engagement Dates */}
                        {connection.engagement_start_date && (
                          <div className="text-sm text-muted-foreground mb-3">
                            <span className="font-medium">Engagement Period:</span>{' '}
                            {formatDate(connection.engagement_start_date)}
                            {connection.engagement_end_date && ` - ${formatDate(connection.engagement_end_date)}`}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-4">
                          {connection.status === 'pending' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleOpenResponse(connection, 'accept')}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenResponse(connection, 'decline')}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Decline
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/attorney/${connection.attorney.id}`)}
                          >
                            <User className="h-4 w-4 mr-2" />
                            View Profile
                          </Button>
                          {connection.attorney.email && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.location.href = `mailto:${connection.attorney.email}`}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Email
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {respondingAction === 'accept' ? 'Accept Connection' : 'Decline Connection'}
            </DialogTitle>
            <DialogDescription>
              {respondingAction === 'accept'
                ? `Send a response to ${selectedConnection?.attorney.full_name}'s connection request`
                : `Let ${selectedConnection?.attorney.full_name} know why you're declining`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="response">Response Message {respondingAction === 'accept' && '(Optional)'}</Label>
              <Textarea
                id="response"
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder={
                  respondingAction === 'accept'
                    ? 'Thank you for reaching out. I look forward to working with you...'
                    : 'Thank you for your interest, however...'
                }
                rows={5}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setResponseDialogOpen(false)}
              disabled={isResponding}
            >
              Cancel
            </Button>
            <Button
              variant={respondingAction === 'accept' ? 'default' : 'destructive'}
              onClick={handleSubmitResponse}
              disabled={isResponding}
            >
              {isResponding ? 'Sending...' : respondingAction === 'accept' ? 'Accept Connection' : 'Decline Connection'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
