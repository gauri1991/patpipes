/**
 * Law Firm Directory Page
 * Browse and search patent law firms
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  MapPin,
  Users,
  Star,
  TrendingUp,
  Award,
  Globe,
  Phone,
  Mail,
  ExternalLink,
  Filter,
  X,
  ChevronRight,
  Briefcase,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useLawFirms } from '@/hooks/useAttorneyData';
import attorneyApi, { LawFirm } from '@/services/attorneyApi';

const PAGE_SIZE = 20;

export default function LawFirmsDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [currentPage, setCurrentPage] = useState(0);

  // Directory stats + needs-review count
  const [needsReviewCount, setNeedsReviewCount] = useState(0);
  const [dirStats, setDirStats] = useState<{
    total_firms: number;
    verified_firms: number;
    firms_by_country: Record<string, number>;
    avg_rating: number;
  } | null>(null);

  useEffect(() => {
    attorneyApi.getNeedsReviewFirms({ limit: 1 }).then(res => {
      if (res.success && res.data) {
        const data = res.data as any;
        setNeedsReviewCount(data.count ?? (Array.isArray(data) ? data.length : 0));
      }
    }).catch(() => {});

    attorneyApi.getLawFirmStats().then(res => {
      if (res.success && res.data) {
        setDirStats(res.data as any);
      }
    }).catch(() => {});
  }, []);

  // Advanced filter state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedFirmSize, setSelectedFirmSize] = useState('');
  const [selectedPracticeAreas, setSelectedPracticeAreas] = useState<string[]>([]);
  const [selectedTechFocus, setSelectedTechFocus] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Map sort to backend ordering field
  const orderingMap: Record<string, string> = {
    rating: '-rating',
    attorneys: '-created_at',
    name: 'name',
    established: '-established_year',
  };

  // Fetch data with server-side search, sort, pagination
  const { lawFirms, totalCount, loading } = useLawFirms({
    is_active: true,
    search: debouncedSearch || undefined,
    firm_size: selectedFirmSize || undefined,
    ordering: orderingMap[sortBy] || '-rating',
    limit: PAGE_SIZE,
    offset: currentPage * PAGE_SIZE,
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Filter options
  const practiceAreas = [
    'Patent Prosecution',
    'Patent Litigation',
    'Trademark',
    'Copyright',
    'Trade Secrets',
    'IP Licensing',
    'IP Strategy',
    'Patent Portfolio Management'
  ];

  const techFocusAreas = [
    'Software',
    'AI/ML',
    'Biotechnology',
    'Pharmaceuticals',
    'Electronics',
    'Mechanical',
    'Chemical',
    'Medical Devices',
    'Telecommunications'
  ];

  const countries = [
    'United States',
    'United Kingdom',
    'Germany',
    'Japan',
    'China',
    'Canada',
    'Australia',
    'France',
    'Switzerland'
  ];

  // Server handles search, sort, and pagination — apply remaining client-side filters
  const filteredFirms = lawFirms.filter(firm => {
    if (selectedPracticeAreas.length > 0) {
      const hasArea = selectedPracticeAreas.some(area =>
        firm.practice_areas?.includes(area)
      );
      if (!hasArea) return false;
    }
    if (selectedTechFocus.length > 0) {
      const hasTech = selectedTechFocus.some(tech =>
        firm.technology_focus?.includes(tech)
      );
      if (!hasTech) return false;
    }
    if (selectedCountries.length > 0) {
      if (!selectedCountries.includes(firm.country)) return false;
    }
    if (verifiedOnly && !firm.is_verified) {
      return false;
    }
    return true;
  });

  // Calculate active filters count
  const calculateActiveFilters = () => {
    let count = 0;
    if (selectedFirmSize) count++;
    if (selectedPracticeAreas.length > 0) count++;
    if (selectedTechFocus.length > 0) count++;
    if (selectedCountries.length > 0) count++;
    if (verifiedOnly) count++;
    setActiveFiltersCount(count);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedFirmSize('');
    setSelectedPracticeAreas([]);
    setSelectedTechFocus([]);
    setSelectedCountries([]);
    setVerifiedOnly(false);
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

  const getFirmSizeLabel = (size: string) => {
    const labels: Record<string, string> = {
      solo: 'Solo Practitioner',
      small: 'Small (2-10)',
      medium: 'Medium (11-50)',
      large: 'Large (51-200)',
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

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Law Firm Directory</h1>
          <p className="text-muted-foreground">
            Browse and connect with patent law firms worldwide
          </p>
        </div>

        <div className="flex items-center gap-2">
          {needsReviewCount > 0 && (
            <Link href="/dashboard/attorney/firms/review">
              <Button variant="outline" size="sm">
                <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                Review Flagged Names ({needsReviewCount})
              </Button>
            </Link>
          )}
          <Link href="/dashboard/attorney">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              View Attorneys
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Firms</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(dirStats?.total_firms ?? totalCount).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              In network directory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Firms</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(dirStats?.verified_firms ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Verified credentials
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(dirStats?.firms_by_country ?? {}).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Global presence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {Number(dirStats?.avg_rating ?? 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average firm rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Find a Law Firm</CardTitle>
          <CardDescription>
            Search and filter by practice area, location, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search law firms..."
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
                <SelectItem value="attorneys">Most Attorneys</SelectItem>
                <SelectItem value="established">Oldest First</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 px-1.5 py-0 h-5 min-w-[20px] rounded-full bg-blue-600">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filter Law Firms</SheetTitle>
                  <SheetDescription>
                    Refine your search with detailed criteria
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-6">
                  {/* Firm Size */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Firm Size</Label>
                    <Select value={selectedFirmSize} onValueChange={(value) => {
                      setSelectedFirmSize(value);
                      setTimeout(calculateActiveFilters, 0);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sizes</SelectItem>
                        <SelectItem value="solo">Solo Practitioner</SelectItem>
                        <SelectItem value="small">Small (2-10)</SelectItem>
                        <SelectItem value="medium">Medium (11-50)</SelectItem>
                        <SelectItem value="large">Large (51-200)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (200+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Practice Areas */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Practice Areas</Label>
                    <div className="space-y-2">
                      {practiceAreas.map((area) => (
                        <div key={area} className="flex items-center space-x-2">
                          <Checkbox
                            id={`area-${area}`}
                            checked={selectedPracticeAreas.includes(area)}
                            onCheckedChange={() => toggleFilter(area, selectedPracticeAreas, setSelectedPracticeAreas)}
                          />
                          <Label htmlFor={`area-${area}`} className="cursor-pointer font-normal">
                            {area}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technology Focus */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Technology Focus</Label>
                    <div className="space-y-2">
                      {techFocusAreas.map((tech) => (
                        <div key={tech} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tech-${tech}`}
                            checked={selectedTechFocus.includes(tech)}
                            onCheckedChange={() => toggleFilter(tech, selectedTechFocus, setSelectedTechFocus)}
                          />
                          <Label htmlFor={`tech-${tech}`} className="cursor-pointer font-normal">
                            {tech}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Countries */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Country</Label>
                    <div className="space-y-2">
                      {countries.map((country) => (
                        <div key={country} className="flex items-center space-x-2">
                          <Checkbox
                            id={`country-${country}`}
                            checked={selectedCountries.includes(country)}
                            onCheckedChange={() => toggleFilter(country, selectedCountries, setSelectedCountries)}
                          />
                          <Label htmlFor={`country-${country}`} className="cursor-pointer font-normal">
                            {country}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Verified Only */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Additional Criteria</Label>
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
                        Verified Firms Only
                      </Label>
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
                      Apply Filters ({filteredFirms.length} results)
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
              {selectedFirmSize && (
                <Badge variant="secondary" className="gap-1">
                  {getFirmSizeLabel(selectedFirmSize)}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      setSelectedFirmSize('');
                      setTimeout(calculateActiveFilters, 0);
                    }}
                  />
                </Badge>
              )}
              {selectedPracticeAreas.map(area => (
                <Badge key={area} variant="secondary" className="gap-1">
                  {area}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFilter(area, selectedPracticeAreas, setSelectedPracticeAreas)}
                  />
                </Badge>
              ))}
              {selectedTechFocus.map(tech => (
                <Badge key={tech} variant="secondary" className="gap-1">
                  {tech}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFilter(tech, selectedTechFocus, setSelectedTechFocus)}
                  />
                </Badge>
              ))}
              {selectedCountries.map(country => (
                <Badge key={country} variant="secondary" className="gap-1">
                  {country}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFilter(country, selectedCountries, setSelectedCountries)}
                  />
                </Badge>
              ))}
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

          {/* Law Firms List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading law firms...</div>
            ) : filteredFirms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No law firms found. Try adjusting your search.
              </div>
            ) : (
              filteredFirms.map((firm) => (
                <Link key={firm.id} href={`/dashboard/attorney/firms/${firm.id}`}>
                  <div className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg bg-blue-100 text-blue-700">
                          {getInitials(firm.display_name || firm.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{firm.display_name || firm.name}</h3>
                          {firm.is_verified && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          <Badge className={getFirmSizeColor(firm.firm_size)}>
                            {getFirmSizeLabel(firm.firm_size)}
                          </Badge>
                        </div>

                        {firm.description && (
                          <p className="text-sm mb-3 line-clamp-2">{firm.description}</p>
                        )}

                        <div className="flex items-center gap-6 text-sm mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{firm.city}, {firm.country}</span>
                          </div>
                          {firm.established_year && (
                            <span className="text-muted-foreground">
                              Est. {firm.established_year}
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{Number(firm.rating || 0).toFixed(1)}</span>
                            <span className="text-muted-foreground">({firm.review_count} reviews)</span>
                          </div>
                          {firm.attorney_count && (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{firm.attorney_count} attorneys</span>
                            </div>
                          )}
                        </div>

                        {firm.practice_areas.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {firm.practice_areas.slice(0, 4).map((area, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                            {firm.practice_areas.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{firm.practice_areas.length - 4} more
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {firm.website && (
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                <span className="truncate max-w-[200px]">{firm.website.replace('https://', '')}</span>
                              </div>
                            )}
                            {firm.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>Contact</span>
                              </div>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            View Profile
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()} firms
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage + 1} of {totalPages.toLocaleString()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
