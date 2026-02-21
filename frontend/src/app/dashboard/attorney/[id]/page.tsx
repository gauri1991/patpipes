/**
 * Attorney Profile Page
 * Detailed information about a specific attorney
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Award,
  Briefcase,
  Star,
  Calendar,
  Building2,
  GraduationCap,
  Languages,
  DollarSign,
  UserCheck,
  Link as LinkIcon,
  MessageSquare,
  TrendingUp,
  Shield,
  ShieldCheck
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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

import { attorneyApi, Attorney, AttorneyReview, AttorneyFirmHistory } from '@/services/attorneyApi';
import { useAttorneyReviews } from '@/hooks/useAttorneyData';

export default function AttorneyProfilePage() {
  const params = useParams();
  const router = useRouter();
  const attorneyId = params.id as string;

  const [attorney, setAttorney] = useState<Attorney | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Connection request dialog state
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [connectionType, setConnectionType] = useState('consultation');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [sendingConnection, setSendingConnection] = useState(false);

  // Reviews
  const { reviews, loading: reviewsLoading } = useAttorneyReviews({ attorney: attorneyId });

  // Firm history
  const [firmHistory, setFirmHistory] = useState<AttorneyFirmHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch attorney data
  useEffect(() => {
    const fetchAttorney = async () => {
      try {
        setLoading(true);
        const response = await attorneyApi.getAttorney(attorneyId);
        if (response.success && response.data) {
          setAttorney(response.data);
        } else {
          throw new Error(response.error || 'Attorney not found');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load attorney';
        setError(message);
        console.error('Attorney fetch error:', err);
        // Mock data fallback
        setAttorney(getMockAttorney());
      } finally {
        setLoading(false);
      }
    };

    fetchAttorney();
  }, [attorneyId]);

  // Fetch firm history when attorney loads
  useEffect(() => {
    if (!attorney?.registration_number || attorney.source !== 'uspto_roster') return;
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const response = await attorneyApi.getAttorneyFirmHistory(attorney.id);
        if (response.success && response.data) {
          setFirmHistory(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        console.error('Firm history fetch error:', err);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [attorney?.id, attorney?.registration_number, attorney?.source]);

  const handleSendConnection = async () => {
    if (!attorney || !connectionType || !connectionMessage.trim()) {
      return;
    }

    setSendingConnection(true);
    try {
      await attorneyApi.createConnection({
        attorney: attorney.id,
        connection_type: connectionType,
        message: connectionMessage,
        status: 'pending'
      });

      setConnectDialogOpen(false);
      setConnectionMessage('');
      // Success notification would go here
      alert('Connection request sent successfully!');
    } catch (error) {
      console.error('Error sending connection:', error);
      alert('Failed to send connection request');
    } finally {
      setSendingConnection(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getExperienceLevelLabel = (level: string) => {
    const labels = {
      junior: 'Junior Attorney',
      mid_level: 'Mid-Level Attorney',
      senior: 'Senior Attorney',
      partner: 'Partner'
    };
    return labels[level as keyof typeof labels] || level;
  };

  const formatRate = (min?: number, max?: number) => {
    if (!min && !max) return 'Contact for rates';
    if (min && max) return `$${min}-$${max}/hr`;
    if (min) return `From $${min}/hr`;
    if (max) return `Up to $${max}/hr`;
    return 'Contact for rates';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading attorney profile...</p>
        </div>
      </div>
    );
  }

  if (error || !attorney) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Attorney Not Found</h2>
          <p className="text-muted-foreground mb-4">{error || 'The attorney profile you are looking for does not exist.'}</p>
          <Button onClick={() => router.push('/dashboard/attorney')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Directory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/attorney')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Directory
      </Button>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center md:items-start">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={attorney.profile_photo} alt={attorney.full_name} />
                <AvatarFallback className="text-3xl">
                  {getInitials(attorney.first_name, attorney.last_name)}
                </AvatarFallback>
              </Avatar>
              {attorney.source === 'uspto_roster' && (
                <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 gap-1">
                  <ShieldCheck className="h-3 w-3" /> USPTO Verified
                </Badge>
              )}
              {attorney.is_verified && attorney.source !== 'uspto_roster' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>

            {/* Main Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{attorney.full_name}</h1>
                  {attorney.title && (
                    <p className="text-lg text-muted-foreground mb-2">
                      {attorney.title}
                      {attorney.law_firm_name && ` at ${attorney.law_firm_name}`}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">
                      {getExperienceLevelLabel(attorney.experience_level)}
                    </Badge>
                    {attorney.registration_number && (
                      <Badge variant="outline" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Reg. No. {attorney.registration_number}
                      </Badge>
                    )}
                  </div>
                </div>

                {attorney.is_featured && (
                  <Badge className="bg-purple-100 text-purple-800">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Featured
                  </Badge>
                )}
              </div>

              {/* Rating and Stats */}
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(Number(attorney.rating || 0))
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{Number(attorney.rating || 0).toFixed(1)}</span>
                  <span className="text-muted-foreground">({attorney.review_count} reviews)</span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="text-sm">
                  <span className="font-medium">{attorney.years_of_experience}</span> years experience
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {attorney.email ? (
                    <a href={`mailto:${attorney.email}`} className="hover:underline">
                      {attorney.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not available</span>
                  )}
                </div>
                {attorney.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${attorney.phone}`} className="hover:underline">
                      {attorney.phone}
                    </a>
                  </div>
                )}
                {attorney.linkedin_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={attorney.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      LinkedIn Profile
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={() => setConnectDialogOpen(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Connection Request
                </Button>
                {attorney.available_for_consultation && (
                  <Button variant="outline" size="lg">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Consultation
                  </Button>
                )}
                {attorney.accepting_new_clients && (
                  <Badge variant="secondary" className="px-4 py-2 bg-green-50 text-green-700">
                    Accepting New Clients
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Detailed Info */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {attorney.bio || 'No biography available.'}
                </p>
              </CardContent>
            </Card>

            {/* Rates & Availability */}
            <Card>
              <CardHeader>
                <CardTitle>Rates & Availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hourly Rate</span>
                  <span className="font-medium">{formatRate(attorney.hourly_rate_min, attorney.hourly_rate_max)}</span>
                </div>
                {attorney.consultation_fee && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Consultation Fee</span>
                    <span className="font-medium">${attorney.consultation_fee}</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New Clients</span>
                  <Badge variant={attorney.accepting_new_clients ? 'secondary' : 'outline'}>
                    {attorney.accepting_new_clients ? 'Accepting' : 'Not Accepting'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Consultations</span>
                  <Badge variant={attorney.available_for_consultation ? 'secondary' : 'outline'}>
                    {attorney.available_for_consultation ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Specializations */}
          <Card>
            <CardHeader>
              <CardTitle>Specializations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(attorney.specializations || []).map((spec, idx) => (
                  <Badge key={idx} variant="secondary">
                    {spec}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technology Areas */}
          {(attorney.technology_areas || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Technology Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(attorney.technology_areas || []).map((tech, idx) => (
                    <Badge key={idx} variant="outline">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Languages */}
          {(attorney.languages || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Languages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(attorney.languages || []).map((lang, idx) => (
                    <Badge key={idx} variant="outline">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="credentials" className="space-y-6">
          {/* Education */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {attorney.law_school && (
                <div>
                  <p className="font-medium">Law School</p>
                  <p className="text-sm text-muted-foreground">
                    {attorney.law_school}
                    {attorney.law_school_grad_year && ` (${attorney.law_school_grad_year})`}
                  </p>
                </div>
              )}
              {attorney.undergraduate && (
                <div>
                  <p className="font-medium">Undergraduate</p>
                  <p className="text-sm text-muted-foreground">{attorney.undergraduate}</p>
                </div>
              )}
              {attorney.technical_degree && (
                <div>
                  <p className="font-medium">Technical Degree</p>
                  <p className="text-sm text-muted-foreground">{attorney.technical_degree}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bar Admissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Bar Admissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(attorney.bar_admissions || []).map((bar, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{bar}</span>
                    <Badge variant="outline">Admitted</Badge>
                  </div>
                ))}
                {attorney.registration_number && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Registration Number</span>
                      <span className="font-medium">{attorney.registration_number}</span>
                    </div>
                    {attorney.admitted_year && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-muted-foreground">Admitted Year</span>
                        <span className="font-medium">{attorney.admitted_year}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          {reviewsLoading ? (
            <div className="text-center py-8">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
                <p className="text-muted-foreground">
                  Be the first to review this attorney
                </p>
              </CardContent>
            </Card>
          ) : (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        {review.is_verified && (
                          <Badge variant="outline" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold">{review.title}</h4>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm mb-3">{review.review_text}</p>
                  {review.service_type && (
                    <Badge variant="secondary" className="text-xs">
                      {review.service_type}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {attorney.source !== 'uspto_roster' ? (
            <Card>
              <CardContent className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Historical Data</h3>
                <p className="text-muted-foreground">
                  History tracking is available for USPTO roster attorneys only.
                </p>
              </CardContent>
            </Card>
          ) : historyLoading ? (
            <div className="text-center py-8">Loading history...</div>
          ) : firmHistory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
                <p className="text-muted-foreground">
                  Historical roster data has not been loaded yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Firm History Timeline
                </CardTitle>
                <CardDescription>
                  Career moves tracked from USPTO roster snapshots ({firmHistory.length} position{firmHistory.length !== 1 ? 's' : ''})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                  <div className="space-y-6">
                    {firmHistory.map((entry, idx) => {
                      const isLatest = idx === firmHistory.length - 1;
                      const startYear = new Date(entry.start_date).getFullYear();
                      const startMonth = new Date(entry.start_date).toLocaleString('default', { month: 'short' });
                      const endYear = new Date(entry.end_date).getFullYear();
                      const endMonth = new Date(entry.end_date).toLocaleString('default', { month: 'short' });
                      const dateRange = entry.start_date === entry.end_date
                        ? `${startMonth} ${startYear}`
                        : `${startMonth} ${startYear} - ${endMonth} ${endYear}`;

                      return (
                        <div key={`${entry.firm_name}-${entry.start_date}`} className="relative pl-10">
                          {/* Timeline dot */}
                          <div className={`absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 ${
                            isLatest
                              ? 'bg-blue-500 border-blue-500'
                              : 'bg-background border-muted-foreground'
                          }`} />

                          <div className={`p-4 rounded-lg border ${isLatest ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">
                                  {entry.firm_name}
                                  {isLatest && (
                                    <Badge className="ml-2 bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs">
                                      Current
                                    </Badge>
                                  )}
                                </h4>
                                {(entry.city || entry.state) && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <MapPin className="h-3 w-3" />
                                    {[entry.city, entry.state, entry.country].filter(Boolean).join(', ')}
                                  </p>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                                {dateRange}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Practice Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Practice Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Cases Handled</span>
                    <span className="font-bold text-lg">{attorney.cases_handled ?? 0}</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Patents Drafted</span>
                    <span className="font-bold text-lg">{attorney.patents_drafted ?? 0}</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Patents Granted</span>
                    <span className="font-bold text-lg">{attorney.patents_granted ?? 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Success Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-green-600 mb-2">
                    {attorney.success_rate ?? 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Success Rate</p>
                </div>
                <Progress value={attorney.success_rate ?? 0} className="h-3" />
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Highly Effective</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Proven Track Record</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Connection Request Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Connection Request</DialogTitle>
            <DialogDescription>
              Connect with {attorney.full_name} to discuss your legal needs
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="connection-type">Connection Type</Label>
              <Select value={connectionType} onValueChange={setConnectionType}>
                <SelectTrigger id="connection-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="representation">Legal Representation</SelectItem>
                  <SelectItem value="patent_filing">Patent Filing</SelectItem>
                  <SelectItem value="litigation">Litigation Support</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={connectionMessage}
                onChange={(e) => setConnectionMessage(e.target.value)}
                placeholder="Introduce yourself and describe your legal needs..."
                rows={6}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setConnectDialogOpen(false)}
              disabled={sendingConnection}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendConnection}
              disabled={sendingConnection || !connectionMessage.trim()}
            >
              {sendingConnection ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mock data fallback
function getMockAttorney(): Attorney {
  return {
    id: '00000001-0000-0000-0000-000000000000',
    first_name: 'Sarah',
    last_name: 'Johnson',
    full_name: 'Sarah Johnson',
    email: 'sarah.johnson@iplegalpartners.com',
    source: 'manual' as const,
    govt_employee: false,
    phone: '+1-555-0101',
    title: 'Partner',
    law_firm_name: 'IP Legal Partners LLP',
    independent: false,
    bar_admissions: ['California', 'New York', 'USPTO'],
    registration_number: '123456',
    admitted_year: 2008,
    law_school: 'Stanford Law School',
    law_school_grad_year: 2008,
    undergraduate: 'MIT - Computer Science',
    technical_degree: 'BS Computer Science',
    experience_level: 'partner',
    years_of_experience: 16,
    specializations: ['Patent Prosecution', 'Software Patents', 'AI/ML Patents', 'IP Strategy'],
    technology_areas: ['Software', 'AI/ML', 'Cloud Computing', 'Blockchain'],
    industries_served: ['Technology', 'FinTech', 'Healthcare IT'],
    bio: 'Sarah Johnson is a highly experienced patent attorney specializing in software and AI patents. With over 16 years of practice, she has helped numerous technology companies protect their intellectual property. Her technical background in computer science allows her to understand complex technical innovations and translate them into strong patent applications. Sarah has successfully prosecuted hundreds of patents and has a proven track record of securing valuable IP protection for her clients.',
    linkedin_url: 'https://linkedin.com/in/sarahjohnson',
    languages: ['English', 'Spanish', 'Mandarin'],
    hourly_rate_min: 500,
    hourly_rate_max: 750,
    accepting_new_clients: true,
    available_for_consultation: true,
    consultation_fee: 250,
    cases_handled: 150,
    patents_drafted: 200,
    patents_granted: 180,
    success_rate: 90,
    rating: 4.8,
    review_count: 32,
    is_verified: true,
    is_featured: true,
    is_active: true,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  };
}
