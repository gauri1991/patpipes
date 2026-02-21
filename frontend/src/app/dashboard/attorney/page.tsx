/**
 * Attorney Network Main Dashboard
 * Professional directory for patent attorneys and law firms
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Users,
  Building2,
  Star,
  Search,
  Filter,
  MapPin,
  Briefcase,
  Award,
  TrendingUp,
  UserCheck,
  X,
  Sliders,
  ShieldCheck
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useAttorneys, useFeaturedAttorneys, useAttorneyDirectoryStats } from '@/hooks/useAttorneyData';
import { Attorney } from '@/services/attorneyApi';

export default function AttorneyDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState('directory');

  // Advanced filter state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState('');
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [selectedTechAreas, setSelectedTechAreas] = useState<string[]>([]);
  const [selectedBarStates, setSelectedBarStates] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [maxHourlyRate, setMaxHourlyRate] = useState(1000);
  const [acceptingNewClients, setAcceptingNewClients] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedPractitionerType, setSelectedPractitionerType] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data from backend with server-side search and filters
  const { attorneys, loading: attorneysLoading } = useAttorneys({
    search: debouncedSearch || undefined,
    is_active: true,
    experience_level: selectedExperienceLevel || undefined,
    accepting_new_clients: acceptingNewClients || undefined,
    is_verified: verifiedOnly || undefined,
    source: selectedSource || undefined,
    practitioner_type: selectedPractitionerType || undefined,
  });
  const { featured, loading: featuredLoading } = useFeaturedAttorneys();
  const { stats, loading: statsLoading } = useAttorneyDirectoryStats();

  // Common specializations and technology areas
  const commonSpecializations = [
    'Patent Prosecution',
    'Patent Litigation',
    'Trademark',
    'Copyright',
    'Trade Secrets',
    'IP Licensing',
    'IP Strategy'
  ];

  const commonTechAreas = [
    'Software',
    'AI/ML',
    'Biotechnology',
    'Pharmaceuticals',
    'Electronics',
    'Mechanical',
    'Chemical'
  ];

  const commonBarStates = [
    'California',
    'New York',
    'Texas',
    'Florida',
    'Illinois',
    'Massachusetts',
    'Washington'
  ];

  // Server handles search, experience_level, source, practitioner_type,
  // accepting_new_clients, is_verified. Client handles remaining filters.
  const filteredAttorneys = attorneys
    .filter(a => {
      // Specializations filter (client-side — array field)
      if (selectedSpecializations.length > 0) {
        const hasSpec = selectedSpecializations.some(spec =>
          (a.specializations || []).includes(spec)
        );
        if (!hasSpec) return false;
      }

      // Technology areas filter (client-side — array field)
      if (selectedTechAreas.length > 0) {
        const hasTech = selectedTechAreas.some(tech =>
          (a.technology_areas || []).includes(tech)
        );
        if (!hasTech) return false;
      }

      // Bar admissions filter (client-side — array field)
      if (selectedBarStates.length > 0) {
        const hasBar = selectedBarStates.some(state =>
          (a.bar_admissions || []).includes(state)
        );
        if (!hasBar) return false;
      }

      // Rating filter (client-side)
      if (minRating > 0 && Number(a.rating || 0) < minRating) {
        return false;
      }

      // Hourly rate filter (client-side)
      if (a.hourly_rate_min && a.hourly_rate_min > maxHourlyRate) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return Number(b.rating || 0) - Number(a.rating || 0);
        case 'experience':
          return Number(b.years_of_experience || 0) - Number(a.years_of_experience || 0);
        case 'rate_low':
          return Number(a.hourly_rate_min || 0) - Number(b.hourly_rate_min || 0);
        case 'rate_high':
          return Number(b.hourly_rate_min || 0) - Number(a.hourly_rate_min || 0);
        case 'name':
          return (a.full_name || '').localeCompare(b.full_name || '');
        default:
          return 0;
      }
    });

  // Calculate active filters count
  const calculateActiveFilters = () => {
    let count = 0;
    if (selectedExperienceLevel) count++;
    if (selectedSpecializations.length > 0) count++;
    if (selectedTechAreas.length > 0) count++;
    if (selectedBarStates.length > 0) count++;
    if (minRating > 0) count++;
    if (maxHourlyRate < 1000) count++;
    if (acceptingNewClients) count++;
    if (verifiedOnly) count++;
    if (selectedSource) count++;
    if (selectedPractitionerType) count++;
    setActiveFiltersCount(count);
  };

  // Update active filters count when filters change
  // (Removed incorrect useState - filters are calculated via setTimeout in handlers)

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedExperienceLevel('');
    setSelectedSpecializations([]);
    setSelectedTechAreas([]);
    setSelectedBarStates([]);
    setMinRating(0);
    setMaxHourlyRate(1000);
    setAcceptingNewClients(false);
    setVerifiedOnly(false);
    setSelectedSource('');
    setSelectedPractitionerType('');
    calculateActiveFilters();
  };

  // Toggle multi-select filters
  const toggleFilter = (value: string, currentList: string[], setter: (list: string[]) => void) => {
    if (currentList.includes(value)) {
      setter(currentList.filter(v => v !== value));
    } else {
      setter([...currentList, value]);
    }
    setTimeout(calculateActiveFilters, 0);
  };

  const getExperienceLevelColor = (level: string) => {
    const colors = {
      junior: 'bg-blue-100 text-blue-800',
      mid_level: 'bg-green-100 text-green-800',
      senior: 'bg-purple-100 text-purple-800',
      partner: 'bg-red-100 text-red-800',
      unknown: 'bg-gray-100 text-gray-800'
    };
    return colors[level as keyof typeof colors] || colors.mid_level;
  };

  const getExperienceLevelLabel = (level: string) => {
    const labels = {
      junior: 'Junior',
      mid_level: 'Mid-Level',
      senior: 'Senior',
      partner: 'Partner',
      unknown: 'Unknown'
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

  const getInitials = (firstName: string, lastName: string) => {
    if (!firstName || !lastName) return '??';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attorney Network</h1>
          <p className="text-muted-foreground">
            Connect with patent attorneys and IP professionals
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Building2 className="h-4 w-4 mr-2" />
            Add Law Firm
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Attorney
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attorneys</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.total_attorneys || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              In network directory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Professionals</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? '...' : stats?.verified_attorneys || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Verified credentials
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepting Clients</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statsLoading ? '...' : stats?.accepting_clients || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for new work
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Experience</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {statsLoading ? '...' : stats?.avg_years_experience?.toFixed(1) || 0} yrs
            </div>
            <p className="text-xs text-muted-foreground">
              Years of practice
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">USPTO Verified</CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statsLoading ? '...' : stats?.uspto_roster_count?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              From USPTO roster
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="directory">Attorney Directory</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="firms">Law Firms</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Find an Attorney</CardTitle>
              <CardDescription>
                Search and connect with patent attorneys
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, registration number..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="experience">Most Experience</SelectItem>
                    <SelectItem value="rate_low">Lowest Rate</SelectItem>
                    <SelectItem value="rate_high">Highest Rate</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedSource || 'all'} onValueChange={(value) => {
                  setSelectedSource(value === 'all' ? '' : value);
                  setTimeout(calculateActiveFilters, 0);
                }}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="uspto_roster">USPTO Roster</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedPractitionerType || 'all'} onValueChange={(value) => {
                  setSelectedPractitionerType(value === 'all' ? '' : value);
                  setTimeout(calculateActiveFilters, 0);
                }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Practitioner Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="ATTORNEY">Attorney</SelectItem>
                    <SelectItem value="AGENT">Agent</SelectItem>
                    <SelectItem value="LIMITED">Limited Recognition</SelectItem>
                    <SelectItem value="DESIGN AGENT">Design Agent</SelectItem>
                  </SelectContent>
                </Select>

                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="relative">
                      <Sliders className="h-4 w-4 mr-2" />
                      Advanced Filters
                      {activeFiltersCount > 0 && (
                        <Badge className="ml-2 px-1.5 py-0 h-5 min-w-[20px] rounded-full bg-blue-600">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Advanced Filters</SheetTitle>
                      <SheetDescription>
                        Refine your attorney search with detailed criteria
                      </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 py-6">
                      {/* Experience Level */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Experience Level</Label>
                        <Select value={selectedExperienceLevel || 'all'} onValueChange={(value) => {
                          setSelectedExperienceLevel(value === 'all' ? '' : value);
                          setTimeout(calculateActiveFilters, 0);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Any experience level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="junior">Junior (0-3 years)</SelectItem>
                            <SelectItem value="mid_level">Mid-Level (4-7 years)</SelectItem>
                            <SelectItem value="senior">Senior (8-15 years)</SelectItem>
                            <SelectItem value="partner">Partner (15+ years)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Specializations */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Specializations</Label>
                        <div className="space-y-2">
                          {commonSpecializations.map((spec) => (
                            <div key={spec} className="flex items-center space-x-2">
                              <Checkbox
                                id={`spec-${spec}`}
                                checked={selectedSpecializations.includes(spec)}
                                onCheckedChange={() => toggleFilter(spec, selectedSpecializations, setSelectedSpecializations)}
                              />
                              <Label htmlFor={`spec-${spec}`} className="cursor-pointer font-normal">
                                {spec}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Technology Areas */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Technology Areas</Label>
                        <div className="space-y-2">
                          {commonTechAreas.map((tech) => (
                            <div key={tech} className="flex items-center space-x-2">
                              <Checkbox
                                id={`tech-${tech}`}
                                checked={selectedTechAreas.includes(tech)}
                                onCheckedChange={() => toggleFilter(tech, selectedTechAreas, setSelectedTechAreas)}
                              />
                              <Label htmlFor={`tech-${tech}`} className="cursor-pointer font-normal">
                                {tech}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bar Admissions */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Bar Admissions</Label>
                        <div className="space-y-2">
                          {commonBarStates.map((state) => (
                            <div key={state} className="flex items-center space-x-2">
                              <Checkbox
                                id={`bar-${state}`}
                                checked={selectedBarStates.includes(state)}
                                onCheckedChange={() => toggleFilter(state, selectedBarStates, setSelectedBarStates)}
                              />
                              <Label htmlFor={`bar-${state}`} className="cursor-pointer font-normal">
                                {state}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Minimum Rating */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-semibold">Minimum Rating</Label>
                          <span className="text-sm text-muted-foreground">{minRating.toFixed(1)}+</span>
                        </div>
                        <Slider
                          value={[minRating]}
                          onValueChange={(values) => {
                            setMinRating(values[0]);
                            setTimeout(calculateActiveFilters, 0);
                          }}
                          min={0}
                          max={5}
                          step={0.5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0</span>
                          <span>5</span>
                        </div>
                      </div>

                      {/* Max Hourly Rate */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-semibold">Max Hourly Rate</Label>
                          <span className="text-sm text-muted-foreground">
                            ${maxHourlyRate}{maxHourlyRate >= 1000 ? '+' : ''}
                          </span>
                        </div>
                        <Slider
                          value={[maxHourlyRate]}
                          onValueChange={(values) => {
                            setMaxHourlyRate(values[0]);
                            setTimeout(calculateActiveFilters, 0);
                          }}
                          min={100}
                          max={1000}
                          step={50}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>$100</span>
                          <span>$1000+</span>
                        </div>
                      </div>

                      {/* Boolean Filters */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Additional Criteria</Label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="accepting-clients"
                              checked={acceptingNewClients}
                              onCheckedChange={(checked) => {
                                setAcceptingNewClients(!!checked);
                                setTimeout(calculateActiveFilters, 0);
                              }}
                            />
                            <Label htmlFor="accepting-clients" className="cursor-pointer font-normal">
                              Accepting New Clients
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="verified-only"
                              checked={verifiedOnly}
                              onCheckedChange={(checked) => {
                                setVerifiedOnly(!!checked);
                                setTimeout(calculateActiveFilters, 0);
                              }}
                            />
                            <Label htmlFor="verified-only" className="cursor-pointer font-normal">
                              Verified Attorneys Only
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleClearFilters}
                        >
                          Clear All
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={() => setFiltersOpen(false)}
                        >
                          Apply Filters ({filteredAttorneys.length} results)
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Active Filters Display */}
              {activeFiltersCount > 0 && (
                <div className="mb-4 flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {selectedExperienceLevel && (
                    <Badge variant="secondary" className="gap-1">
                      {getExperienceLevelLabel(selectedExperienceLevel)}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setSelectedExperienceLevel('');
                          setTimeout(calculateActiveFilters, 0);
                        }}
                      />
                    </Badge>
                  )}
                  {selectedSpecializations.map(spec => (
                    <Badge key={spec} variant="secondary" className="gap-1">
                      {spec}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleFilter(spec, selectedSpecializations, setSelectedSpecializations)}
                      />
                    </Badge>
                  ))}
                  {selectedTechAreas.map(tech => (
                    <Badge key={tech} variant="secondary" className="gap-1">
                      {tech}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleFilter(tech, selectedTechAreas, setSelectedTechAreas)}
                      />
                    </Badge>
                  ))}
                  {selectedBarStates.map(state => (
                    <Badge key={state} variant="secondary" className="gap-1">
                      Bar: {state}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleFilter(state, selectedBarStates, setSelectedBarStates)}
                      />
                    </Badge>
                  ))}
                  {minRating > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      {minRating.toFixed(1)}+ stars
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setMinRating(0);
                          setTimeout(calculateActiveFilters, 0);
                        }}
                      />
                    </Badge>
                  )}
                  {maxHourlyRate < 1000 && (
                    <Badge variant="secondary" className="gap-1">
                      ≤${maxHourlyRate}/hr
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setMaxHourlyRate(1000);
                          setTimeout(calculateActiveFilters, 0);
                        }}
                      />
                    </Badge>
                  )}
                  {acceptingNewClients && (
                    <Badge variant="secondary" className="gap-1">
                      Accepting Clients
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setAcceptingNewClients(false);
                          setTimeout(calculateActiveFilters, 0);
                        }}
                      />
                    </Badge>
                  )}
                  {verifiedOnly && (
                    <Badge variant="secondary" className="gap-1">
                      Verified Only
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setVerifiedOnly(false);
                          setTimeout(calculateActiveFilters, 0);
                        }}
                      />
                    </Badge>
                  )}
                  {selectedSource && (
                    <Badge variant="secondary" className="gap-1">
                      Source: {selectedSource === 'uspto_roster' ? 'USPTO Roster' : 'Manual'}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setSelectedSource('');
                          setTimeout(calculateActiveFilters, 0);
                        }}
                      />
                    </Badge>
                  )}
                  {selectedPractitionerType && (
                    <Badge variant="secondary" className="gap-1">
                      Type: {selectedPractitionerType}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setSelectedPractitionerType('');
                          setTimeout(calculateActiveFilters, 0);
                        }}
                      />
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-7 text-xs"
                  >
                    Clear all
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                {attorneysLoading ? (
                  <div key="loading" className="text-center py-8">Loading attorneys...</div>
                ) : filteredAttorneys.length === 0 ? (
                  <div key="empty" className="text-center py-8 text-muted-foreground">
                    No attorneys found. Try adjusting your search.
                  </div>
                ) : (
                  filteredAttorneys.map((attorney) => (
                    <div key={attorney.id} className="p-4 border rounded-lg hover:bg-accent">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={attorney.profile_photo} alt={attorney.full_name} />
                          <AvatarFallback className="text-lg">
                            {getInitials(attorney.first_name, attorney.last_name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{attorney.full_name}</h3>
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
                            {attorney.is_featured && (
                              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Featured
                              </Badge>
                            )}
                            <Badge className={getExperienceLevelColor(attorney.experience_level)}>
                              {getExperienceLevelLabel(attorney.experience_level)}
                            </Badge>
                          </div>

                          {attorney.title && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {attorney.title}
                              {attorney.law_firm_name && ` at ${attorney.law_firm_name}`}
                            </p>
                          )}

                          {attorney.registration_number && (
                            <p className="text-sm text-muted-foreground mb-2">
                              Reg. No. <span className="font-medium">{attorney.registration_number}</span>
                            </p>
                          )}

                          {attorney.bio && (
                            <p className="text-sm mb-3 line-clamp-2">{attorney.bio}</p>
                          )}

                          <div className="flex items-center gap-6 text-sm mb-3">
                            {attorney.bar_admissions && attorney.bar_admissions.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Award className="h-4 w-4 text-muted-foreground" />
                                <span>{attorney.bar_admissions.join(', ')}</span>
                              </div>
                            )}
                            {attorney.years_of_experience && attorney.years_of_experience > 0 && (
                              <span className="text-muted-foreground">
                                {attorney.years_of_experience} years experience
                              </span>
                            )}
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="font-medium">{Number(attorney.rating || 0).toFixed(1)}</span>
                              <span className="text-muted-foreground">({attorney.review_count || 0} reviews)</span>
                            </div>
                          </div>

                          {attorney.specializations && attorney.specializations.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {attorney.specializations.slice(0, 5).map((spec, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium">
                                {formatRate(attorney.hourly_rate_min, attorney.hourly_rate_max)}
                              </span>
                              {attorney.accepting_new_clients && (
                                <Badge variant="secondary" className="bg-green-50 text-green-700">
                                  Accepting New Clients
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.href = `/dashboard/attorney/${attorney.id}`}
                              >
                                View Profile
                              </Button>
                              <Button size="sm">
                                Connect
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Featured Attorneys</CardTitle>
              <CardDescription>
                Top-rated patent attorneys in our network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featuredLoading ? (
                  <div className="text-center py-8">Loading featured attorneys...</div>
                ) : featured.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No featured attorneys available at this time.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {featured.map((attorney) => (
                      <Card key={attorney.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={attorney.profile_photo} alt={attorney.full_name} />
                              <AvatarFallback>
                                {getInitials(attorney.first_name, attorney.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{attorney.full_name}</h3>
                              {attorney.title && (
                                <p className="text-sm text-muted-foreground mb-1">
                                  {attorney.title}
                                </p>
                              )}
                              {attorney.registration_number && (
                                <p className="text-sm text-muted-foreground mb-1">
                                  Reg. No. <span className="font-medium">{attorney.registration_number}</span>
                                </p>
                              )}
                              <div className="flex items-center gap-2 mb-2">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-medium">{Number(attorney.rating || 0).toFixed(1)}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({attorney.review_count})
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => window.location.href = `/dashboard/attorney/${attorney.id}`}
                              >
                                View Profile
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="firms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Law Firm Directory</CardTitle>
              <CardDescription>
                Browse IP law firms and practices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Law Firm Directory</h3>
                <p className="text-muted-foreground mb-4">
                  Explore law firms specializing in patent and IP law
                </p>
                <Link href="/dashboard/attorney/firms">
                  <Button>Browse Law Firms</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
