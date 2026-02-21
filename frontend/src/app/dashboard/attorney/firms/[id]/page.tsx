/**
 * Law Firm Profile Page
 * Detailed view of a specific law firm
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  Star,
  Users,
  Award,
  TrendingUp,
  Calendar,
  Briefcase,
  UserCheck,
  ChevronLeft,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  FileText
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { attorneyApi, LawFirm, Attorney } from '@/services/attorneyApi';
import { toast } from 'sonner';

export default function LawFirmProfile() {
  const params = useParams();
  const router = useRouter();
  const firmId = params?.id as string;

  const [firm, setFirm] = useState<LawFirm | null>(null);
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (firmId) {
      fetchFirmData();
    }
  }, [firmId]);

  const fetchFirmData = async () => {
    try {
      setLoading(true);

      // Fetch firm details
      const firmResponse = await attorneyApi.getLawFirm(firmId);
      if (firmResponse.success && firmResponse.data) {
        setFirm(firmResponse.data);
      } else {
        throw new Error('Firm not found');
      }

      // Fetch firm attorneys
      const attorneysResponse = await attorneyApi.getLawFirmAttorneys(firmId);
      if (attorneysResponse.success && attorneysResponse.data) {
        setAttorneys(Array.isArray(attorneysResponse.data) ? attorneysResponse.data : [attorneysResponse.data]);
      }
    } catch (error) {
      console.error('Error fetching firm data:', error);
      toast.error('Failed to load law firm details');
      // Use mock data for demo
      setFirm(getMockFirm());
      setAttorneys(getMockAttorneys());
    } finally {
      setLoading(false);
    }
  };

  const getFirmSizeLabel = (size: string) => {
    const labels: Record<string, string> = {
      solo: 'Solo Practitioner',
      small: 'Small Firm (2-10)',
      medium: 'Medium Firm (11-50)',
      large: 'Large Firm (51-200)',
      enterprise: 'Enterprise (200+)'
    };
    return labels[size] || size;
  };

  const getFirmSizeColor = (size: string) => {
    const colors: Record<string, string> = {
      solo: 'bg-gray-100 text-gray-800',
      small: 'bg-blue-100 text-blue-800',
      medium: 'bg-green-100 text-green-800',
      large: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-red-100 text-red-800'
    };
    return colors[size] || colors.medium;
  };

  const getExperienceLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      junior: 'Junior',
      mid_level: 'Mid-Level',
      senior: 'Senior',
      partner: 'Partner'
    };
    return labels[level] || level;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAttorneyInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading law firm profile...</p>
        </div>
      </div>
    );
  }

  if (!firm) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Law firm not found</p>
          <Link href="/dashboard/attorney/firms">
            <Button>Back to Directory</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/attorney/firms">
        <Button variant="ghost" size="sm">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Directory
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start gap-6">
        <Avatar className="h-24 w-24">
          <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">
            {getInitials(firm.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{firm.display_name || firm.name}</h1>
            {firm.is_verified && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <UserCheck className="h-4 w-4 mr-1" />
                Verified
              </Badge>
            )}
            <Badge className={getFirmSizeColor(firm.firm_size)}>
              {getFirmSizeLabel(firm.firm_size)}
            </Badge>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>
                {firm.address && `${firm.address}, `}
                {firm.city}
                {firm.state && `, ${firm.state}`}
                {`, ${firm.country}`}
                {firm.postal_code && ` ${firm.postal_code}`}
              </span>
            </div>
            {firm.established_year && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Est. {firm.established_year}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <span className="text-2xl font-bold">{Number(firm.rating || 0).toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({firm.review_count} reviews)</span>
            </div>
            {firm.attorney_count && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-semibold">{firm.attorney_count}</span>
                  <span className="text-sm text-muted-foreground">attorneys</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button>
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Firm
            </Button>
            {firm.website && (
              <Button variant="outline" asChild>
                <a href={firm.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-2" />
                  Visit Website
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {firm.phone && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Phone className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{firm.phone}</p>
                </div>
              </div>
            )}
            {firm.email && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Mail className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{firm.email}</p>
                </div>
              </div>
            )}
            {firm.website && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Globe className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Website</p>
                  <a
                    href={firm.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {firm.website.replace('https://', '').replace('http://', '')}
                  </a>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attorneys">Attorneys ({attorneys.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({firm.review_count})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* About */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>About the Firm</CardTitle>
              </CardHeader>
              <CardContent>
                {firm.description ? (
                  <p className="text-sm leading-relaxed">{firm.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No description available.</p>
                )}
              </CardContent>
            </Card>

            {/* Practice Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Practice Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {firm.practice_areas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {firm.practice_areas.map((area, idx) => (
                      <Badge key={idx} variant="secondary" className="text-sm">
                        {area}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No practice areas listed.</p>
                )}
              </CardContent>
            </Card>

            {/* Technology Focus */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Technology Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                {firm.technology_focus.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {firm.technology_focus.map((tech, idx) => (
                      <Badge key={idx} variant="outline" className="text-sm">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No technology focus listed.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attorneys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attorneys at {firm.display_name || firm.name}</CardTitle>
              <CardDescription>
                Meet the patent professionals at this firm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attorneys.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No attorneys listed for this firm yet.
                  </div>
                ) : (
                  attorneys.map((attorney) => (
                    <Link key={attorney.id} href={`/dashboard/attorney/${attorney.id}`}>
                      <div className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={attorney.profile_photo} alt={attorney.full_name} />
                            <AvatarFallback>
                              {getAttorneyInitials(attorney.first_name, attorney.last_name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{attorney.full_name}</h4>
                              {attorney.is_verified && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>

                            {attorney.title && (
                              <p className="text-sm text-muted-foreground mb-1">{attorney.title}</p>
                            )}

                            {attorney.registration_number && (
                              <p className="text-sm text-muted-foreground mb-1">
                                Reg. No. <span className="font-medium">{attorney.registration_number}</span>
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-sm mb-2">
                              <span className="text-muted-foreground">
                                {attorney.years_of_experience} years experience
                              </span>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                <span className="font-medium">{Number(attorney.rating || 0).toFixed(1)}</span>
                              </div>
                            </div>

                            {attorney.specializations.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {attorney.specializations.slice(0, 3).map((spec, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {spec}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          <Button variant="ghost" size="sm">
                            View Profile
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Reviews</CardTitle>
              <CardDescription>
                What clients say about {firm.display_name || firm.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Reviews Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  Client reviews and testimonials will be displayed here
                </p>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="text-2xl font-bold">{Number(firm.rating || 0).toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    based on {firm.review_count} reviews
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Mock data for development
function getMockFirm(): LawFirm {
  return {
    id: '00000001-0000-0000-0000-000000000000',
    name: 'IP Legal Partners LLP',
    website: 'https://iplegalpartners.com',
    email: 'info@iplegalpartners.com',
    phone: '+1 (415) 555-0100',
    address: '123 Market Street, Suite 500',
    city: 'San Francisco',
    state: 'California',
    country: 'United States',
    postal_code: '94103',
    firm_size: 'medium',
    established_year: 2005,
    description: 'IP Legal Partners is a full-service intellectual property law firm with over 18 years of experience helping clients protect and monetize their innovations. Our team of experienced patent attorneys specializes in software patents, biotechnology, and electronics, providing comprehensive IP strategy and prosecution services to startups, enterprises, and individual inventors.',
    practice_areas: ['Patent Prosecution', 'Patent Litigation', 'Trademark', 'IP Strategy', 'Patent Portfolio Management', 'IP Licensing'],
    technology_focus: ['Software', 'AI/ML', 'Biotechnology', 'Electronics', 'Medical Devices'],
    rating: 4.7,
    review_count: 45,
    is_verified: true,
    is_active: true,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    attorney_count: 12
  };
}

function getMockAttorneys(): Attorney[] {
  return [
    {
      id: '00000001-0000-0000-0000-000000000000',
      first_name: 'Sarah',
      last_name: 'Johnson',
      full_name: 'Sarah Johnson',
      email: 'sarah.johnson@iplegalpartners.com',
      phone: '+1-555-0101',
      title: 'Managing Partner',
      independent: false,
      bar_admissions: ['California', 'New York'],
      registration_number: '123456',
      admitted_year: 2008,
      law_school: 'Stanford Law School',
      law_school_grad_year: 2008,
      experience_level: 'partner',
      years_of_experience: 16,
      specializations: ['Patent Prosecution', 'Software Patents', 'AI/ML Patents'],
      technology_areas: ['Software', 'AI/ML', 'Cloud Computing'],
      industries_served: ['Technology', 'FinTech'],
      bio: 'Experienced patent attorney specializing in software and AI patents',
      languages: ['English', 'Spanish'],
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
      source: 'manual' as const,
      govt_employee: false,
      is_active: true,
      created_at: '2023-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '00000002-0000-0000-0000-000000000000',
      first_name: 'Michael',
      last_name: 'Chen',
      full_name: 'Michael Chen',
      email: 'michael.chen@iplegalpartners.com',
      phone: '+1-555-0102',
      title: 'Senior Patent Attorney',
      independent: false,
      bar_admissions: ['California', 'USPTO'],
      experience_level: 'senior',
      years_of_experience: 12,
      specializations: ['Biotechnology Patents', 'Pharmaceutical Patents'],
      technology_areas: ['Biotechnology', 'Pharmaceuticals', 'Medical Devices'],
      industries_served: ['Healthcare', 'Biotech'],
      languages: ['English', 'Mandarin'],
      hourly_rate_min: 400,
      hourly_rate_max: 600,
      accepting_new_clients: true,
      available_for_consultation: true,
      cases_handled: 100,
      patents_drafted: 150,
      patents_granted: 130,
      success_rate: 87,
      rating: 4.6,
      review_count: 24,
      is_verified: true,
      is_featured: false,
      source: 'manual' as const,
      govt_employee: false,
      is_active: true,
      created_at: '2023-02-20T10:00:00Z',
      updated_at: '2024-02-20T10:00:00Z'
    }
  ];
}
