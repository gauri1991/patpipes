'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  FileText,
  Scale,
  CheckCircle,
  RefreshCw,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { infringementApi } from '@/services/infringementApi';
import { usptoOdpApi } from '@/services/usptoOdpApi';
import { apiClient } from '@/services/apiClient';
import { toast } from 'sonner';

export default function NewCasePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Form state
  const [caseName, setCaseName] = useState('');
  const [description, setDescription] = useState('');
  const [analysisType, setAnalysisType] = useState<string>('literal');
  const [patentNumber, setPatentNumber] = useState('');
  const [patentTitle, setPatentTitle] = useState('');
  const [patentAbstract, setPatentAbstract] = useState('');
  const [patentId, setPatentId] = useState<string | null>(null);
  const [accusedProduct, setAccusedProduct] = useState('');
  const [accusedProductDesc, setAccusedProductDesc] = useState('');
  const [accusedParty, setAccusedParty] = useState('');
  const [creating, setCreating] = useState(false);

  // Patent source
  const [patentSource, setPatentSource] = useState<'manual' | 'portfolio' | 'uspto'>('manual');

  // Portfolio selection
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [portfolioPatents, setPortfolioPatents] = useState<any[]>([]);
  const [loadingPortfolioPatents, setLoadingPortfolioPatents] = useState(false);


  // USPTO lookup
  const [usptoLookupLoading, setUsptoLookupLoading] = useState(false);
  const [usptoFound, setUsptoFound] = useState(false);

  // Handle ?patent_id= query param
  useEffect(() => {
    const patentIdParam = searchParams.get('patent_id');
    if (!patentIdParam) return;

    const fetchPatent = async () => {
      try {
        const res = await apiClient.get<any>(`/patents/patents/${patentIdParam}/`);
        if (res.success && res.data) {
          const patent = res.data;
          setPatentId(patent.id);
          setPatentNumber(patent.patent_number || '');
          setPatentTitle(patent.title || '');
          setPatentAbstract(patent.abstract || '');
          setCaseName(`${patent.title || 'Patent'} - Infringement Analysis`);
          setPatentSource('portfolio');
        }
      } catch (err) {
        console.error('Failed to load patent:', err);
      }
    };

    fetchPatent();
  }, [searchParams]);

  // Load portfolios when "From Portfolio" is selected
  useEffect(() => {
    if (patentSource !== 'portfolio' || portfolios.length > 0) return;
    setLoadingPortfolios(true);
    apiClient.get<any>('/patents/portfolios/', { params: { limit: 200 } })
      .then((res) => {
        if (res.success && res.data) {
          const list = Array.isArray(res.data) ? res.data : res.data.results || [];
          setPortfolios(list);
        }
      })
      .catch(() => toast.error('Failed to load portfolios'))
      .finally(() => setLoadingPortfolios(false));
  }, [patentSource, portfolios.length]);

  // Load patents when a portfolio is selected
  useEffect(() => {
    if (!selectedPortfolioId) {
      setPortfolioPatents([]);
      return;
    }
    setLoadingPortfolioPatents(true);
    apiClient.get<any>(`/patents/patents/?portfolio=${selectedPortfolioId}&limit=100`)
      .then((res) => {
        if (res.success && res.data) {
          setPortfolioPatents(res.data.results || []);
        }
      })
      .catch(() => toast.error('Failed to load portfolio patents'))
      .finally(() => setLoadingPortfolioPatents(false));
  }, [selectedPortfolioId]);

  // Debounced USPTO lookup
  useEffect(() => {
    if (patentSource !== 'uspto' || patentNumber.length < 5) {
      setUsptoFound(false);
      return;
    }

    const timer = setTimeout(async () => {
      setUsptoLookupLoading(true);
      try {
        const cleanNumber = patentNumber.replace(/^US/i, '').replace(/[,\s]/g, '').replace(/[A-Z]\d*$/i, '');
        const res = await usptoOdpApi.searchApplications({ q: `applicationNumberText:${cleanNumber}`, pagination: { offset: 0, limit: 1 } });
        if (res.success && res.data?.patentFileWrapperDataBag && res.data.patentFileWrapperDataBag.length > 0) {
          const app = res.data.patentFileWrapperDataBag[0];
          const title = app.applicationMetaData?.inventionTitle || '';
          if (title && !patentTitle) setPatentTitle(title);
          setUsptoFound(true);
        } else {
          setUsptoFound(false);
        }
      } catch {
        setUsptoFound(false);
      } finally {
        setUsptoLookupLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [patentNumber, patentSource, patentTitle]);

  const handleSelectPortfolioPatent = (patent: any) => {
    setPatentNumber(patent.patent_number || patent.application_number || '');
    setPatentTitle(patent.title || '');
    setPatentAbstract(patent.abstract || '');
    setPatentId(patent.id);
    if (!caseName) {
      setCaseName(`${patent.title || 'Patent'} - Infringement Analysis`);
    }
  };

  const handleCreateCase = async () => {
    if (!caseName || !patentNumber || !accusedProduct || !accusedParty) return;

    setCreating(true);
    try {
      const response = await infringementApi.createCase({
        case_name: caseName,
        description,
        patent_number: patentNumber,
        patent_title: patentTitle,
        patent_abstract: patentAbstract,
        accused_product_name: accusedProduct,
        accused_product_description: accusedProductDesc,
        accused_party_name: accusedParty,
        analysis_type: analysisType as any,
        status: 'draft',
        risk_level: 'medium',
        infringement_likelihood: 50,
        confidence_level: 50,
        is_confidential: true,
        ...(patentId ? { patent: patentId } : {}),
      });

      if (response.success && response.data) {
        toast.success('Case created successfully');
        router.push(`/dashboard/infringement/${response.data.id}`);
      } else {
        throw new Error(response.error || 'Failed to create case');
      }
    } catch (error) {
      console.error('Error creating case:', error);
      toast.error('Failed to create case');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/infringement" className="hover:text-foreground">
          Infringement
        </Link>
        <span>/</span>
        <span className="text-foreground">New Case</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Infringement Case</h1>
          <p className="text-muted-foreground">
            Start a new patent infringement analysis
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/infringement')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>

      {/* Case Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Case Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Case Name *</Label>
            <Input
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              placeholder="e.g., ProductX vs Patent US1234567"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the case..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Analysis Type</Label>
            <Select value={analysisType} onValueChange={setAnalysisType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="literal">Literal Infringement</SelectItem>
                <SelectItem value="doe">Doctrine of Equivalents</SelectItem>
                <SelectItem value="induced">Induced Infringement</SelectItem>
                <SelectItem value="contributory">Contributory Infringement</SelectItem>
                <SelectItem value="willful">Willful Infringement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patent Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Patent Information
            </CardTitle>
            <div className="flex gap-2">
              {(['manual', 'portfolio', 'uspto'] as const).map((src) => (
                <Button
                  key={src}
                  variant={patentSource === src ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPatentSource(src)}
                >
                  {src === 'manual' ? 'Manual' : src === 'portfolio' ? 'From Portfolio' : 'USPTO Lookup'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {patentSource === 'portfolio' && (
            <div className="space-y-3">
              {/* Portfolio selector */}
              <div className="space-y-2">
                <Label>Select Portfolio</Label>
                {loadingPortfolios ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Loading portfolios...
                  </div>
                ) : (
                  <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a portfolio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolios.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="flex items-center gap-2">
                            <Briefcase className="h-3 w-3 text-muted-foreground" />
                            {p.name}
                            <span className="text-xs text-muted-foreground">
                              ({p.total_patents ?? p.patents_count ?? 0} patents)
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Patents within selected portfolio */}
              {selectedPortfolioId && (
                <div className="space-y-2">
                  <Label>Select Patent</Label>
                  {loadingPortfolioPatents ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                      <RefreshCw className="h-4 w-4 animate-spin" /> Loading patents...
                    </div>
                  ) : portfolioPatents.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-2">No patents in this portfolio</div>
                  ) : (
                    <div className="border rounded-md max-h-60 overflow-y-auto">
                      {portfolioPatents.map((patent) => (
                        <button
                          key={patent.id}
                          className={`w-full text-left px-3 py-2 hover:bg-muted/50 border-b last:border-b-0 transition-colors ${
                            patentId === patent.id ? 'bg-green-50 border-green-200' : ''
                          }`}
                          onClick={() => handleSelectPortfolioPatent(patent)}
                        >
                          <p className="text-sm font-medium truncate">{patent.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {patent.patent_number || patent.application_number || '—'}
                            {patent.status && (
                              <span className="ml-2">{patent.status}</span>
                            )}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {patentId && (
            <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Linked to portfolio patent
              </span>
              <button
                className="text-green-600 hover:text-green-800 underline"
                onClick={() => setPatentId(null)}
              >
                Unlink
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Patent Number *</Label>
              <div className="relative">
                <Input
                  value={patentNumber}
                  onChange={(e) => {
                    setPatentNumber(e.target.value);
                    if (patentSource !== 'portfolio') setPatentId(null);
                  }}
                  placeholder="e.g., US10123456"
                />
                {patentSource === 'uspto' && usptoLookupLoading && (
                  <RefreshCw className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {patentSource === 'uspto' && usptoFound && (
                  <CheckCircle className="absolute right-3 top-2.5 h-4 w-4 text-green-500" />
                )}
              </div>
              {patentSource === 'uspto' && usptoFound && (
                <p className="text-xs text-green-600">Found in USPTO database</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Patent Title</Label>
              <Input
                value={patentTitle}
                onChange={(e) => setPatentTitle(e.target.value)}
                placeholder="Title of the patent..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Patent Abstract</Label>
            <Textarea
              value={patentAbstract}
              onChange={(e) => setPatentAbstract(e.target.value)}
              placeholder="Patent abstract or key claims..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Accused Product */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Accused Product/Service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product/Service Name *</Label>
              <Input
                value={accusedProduct}
                onChange={(e) => setAccusedProduct(e.target.value)}
                placeholder="Name of the accused product or service"
              />
            </div>
            <div className="space-y-2">
              <Label>Accused Party *</Label>
              <Input
                value={accusedParty}
                onChange={(e) => setAccusedParty(e.target.value)}
                placeholder="Name of the company or individual"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Product Description</Label>
            <Textarea
              value={accusedProductDesc}
              onChange={(e) => setAccusedProductDesc(e.target.value)}
              placeholder="Description of the accused product and its features..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/infringement')}
          disabled={creating}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreateCase}
          disabled={creating || !caseName || !patentNumber || !accusedProduct || !accusedParty}
        >
          {creating ? 'Creating...' : 'Create Case'}
        </Button>
      </div>
    </div>
  );
}
