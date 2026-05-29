'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Package2, ChevronDown, ChevronRight, Sparkles, Download, FileSpreadsheet,
  FileJson, FileText, Save, Search, Filter, RefreshCw, Check, X,
  AlertCircle, CheckCircle2, Clock, Zap, BarChart2, Shield, Star, TrendingUp,
  CircleDot, Layers, Globe, Activity, Edit2, Trash2, Plus, Eye,
  ChevronUp, Info, ArrowRight, Loader2, Clipboard, Target, MessageSquare,
  BookOpen, Link2, UploadCloud, ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  analyticsApi,
  BundleAnalysisResult,
  BundleQualityRow,
  BundleConfiguration,
  BundleAttributes,
  AttributeCompleteness,
  PatentRecordText,
  SalesPackage,
  SalesPackageCreateData,
  SalesPackageArchetype,
  SalesPackagePattern,
  SalesPackageMetaTags,
  LintResult,
  QualityGatesResult,
  TierValidationResult,
  MCLEntry,
  ListingTierReport,
} from '@/services/analyticsApi';
import { apiClient } from '@/services/apiClient';
import { ImportPatentsDialog } from './ImportPatentsDialog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Portfolio {
  id: string;
  name: string;
  total_patents?: number;
  patent_count?: number;
}

interface PatentAttributeSummary {
  patent_id: string;
  patent_record_id: string;
  title: string;
  bundle_count: number;
  bundle_codes: string[];
  attribute_source: string;
  pct_filled: number;
}

// ─── Bundle category groupings ─────────────────────────────────────────────

const BUNDLE_CATEGORIES: { label: string; codes: string[] }[] = [
  {
    label: 'Technology',
    codes: ['TECH_DOMAIN', 'PRODUCT_ARCH', 'STACK_LAYER', 'USE_CASE', 'MANUFACTURING', 'MATERIALS_CHEM', 'ALGO_SOFTWARE'],
  },
  {
    label: 'Ecosystem',
    codes: ['SEP', 'INTEROPERABILITY', 'GEN_ROADMAP'],
  },
  {
    label: 'Claims',
    codes: ['CLAIM_TYPE', 'DETECTABILITY', 'FOUNDATIONAL', 'WHITESPACE', 'PICKET_FENCE', 'STRONG_CORE_TAIL'],
  },
  {
    label: 'Geographic & Family',
    codes: ['GEOGRAPHIC', 'FAMILY_TREE', 'LIFECYCLE', 'CONTINUATION_LIVE', 'PRE_EXPIRY', 'PROSECUTION'],
  },
  {
    label: 'Strategic',
    codes: ['CROSS_INDUSTRY', 'CONVERGENT_THEME', 'DEFENSIVE', 'ANCHOR_HALO', 'PROVENANCE'],
  },
  {
    label: 'Quality & Litigation',
    codes: ['EOU_BACKED', 'BATTLE_TESTED', 'CLEAN_TITLE', 'HIGH_CITATION', 'ADJACENT_REREAD', 'SALVAGE'],
  },
];

// Auto-package suggestion templates
const PACKAGE_TEMPLATES: { name: string; description: string; bundleCodes: string[]; transactionType: string }[] = [
  {
    name: 'Strong Core Portfolio',
    description: 'High-quality anchor patents with broad claims and strong detectability.',
    bundleCodes: ['ANCHOR_HALO', 'STRONG_CORE_TAIL', 'HIGH_CITATION', 'EOU_BACKED'],
    transactionType: 'sale',
  },
  {
    name: 'Licensing-Ready Bundle',
    description: 'Patents with evidence of use, survived challenges, and clean title.',
    bundleCodes: ['EOU_BACKED', 'BATTLE_TESTED', 'CLEAN_TITLE', 'DETECTABILITY'],
    transactionType: 'license',
  },
  {
    name: 'Standards & SEP Package',
    description: 'Standards-essential patents and interoperability claims.',
    bundleCodes: ['SEP', 'INTEROPERABILITY', 'GEOGRAPHIC'],
    transactionType: 'license',
  },
  {
    name: 'Defensive Shield',
    description: 'Defensive patents to counter litigation and assertion risk.',
    bundleCodes: ['DEFENSIVE', 'BATTLE_TESTED', 'PICKET_FENCE', 'FAMILY_TREE'],
    transactionType: 'cross',
  },
  {
    name: 'Technology Domain Lot',
    description: 'Organized by technology area for domain-specific buyers.',
    bundleCodes: ['TECH_DOMAIN', 'PRODUCT_ARCH', 'STACK_LAYER', 'ALGO_SOFTWARE'],
    transactionType: 'sale',
  },
  {
    name: 'Pre-Expiry Opportunity',
    description: 'Patents expiring soon — last window for monetization.',
    bundleCodes: ['PRE_EXPIRY', 'LIFECYCLE', 'CONTINUATION_LIVE'],
    transactionType: 'sale',
  },
];

// ─── Value Proposition Framework — archetype data (Section 4) ─────────────────

const ARCHETYPE_DATA: {
  code: SalesPackageArchetype;
  name: string;
  description: string;
  overWeights: string[];
  dealKiller: string;
  register: string;
  color: string;
}[] = [
  {
    code: 'OC-DEF', name: 'Operating Co. — Defensive',
    description: 'Building freedom-to-operate around current and next-gen products.',
    overWeights: ['H8 Clean title', 'F2 Trilateral', 'H10 No encumbrances', 'E4 Long term'],
    dealKiller: 'Unclear chain of title → state H8 clean + unencumbered.',
    register: 'Strategic, integrative',
    color: 'blue',
  },
  {
    code: 'OC-OFF', name: 'Operating Co. — Offensive',
    description: 'Building counter-assertion capability against named competitors.',
    overWeights: ['D1 External detect', 'D3 Reads-on', 'I1 Product-mapping', 'H9 EoU'],
    dealKiller: 'Doesn\'t read on a real product → signal D3 + mapped products.',
    register: 'Direct, named-target',
    color: 'orange',
  },
  {
    code: 'OC-EXP', name: 'Operating Co. — Market Expansion',
    description: 'Entering an adjacent market or technology category.',
    overWeights: ['A2 Secondary domains', 'G3 Cross-industry', 'G1 Convergence', 'C2 Breadth'],
    dealKiller: 'Too narrow for category → state C2 ≥ 2 + broad A2 coverage.',
    register: 'Forward-looking, category',
    color: 'purple',
  },
  {
    code: 'NPE-LIC', name: 'NPE — Licensing',
    description: 'Licensing entity assembling a willing-licensee program.',
    overWeights: ['D1 Detectability', 'D2 Teardown', 'I1 Product map', 'H9 EoU', 'E4 Term'],
    dealKiller: 'No claim charts / no mapped products → state H9 = Yes.',
    register: 'Monetization-focused',
    color: 'amber',
  },
  {
    code: 'NPE-LIT', name: 'NPE — Litigation',
    description: 'Patent assertion entity prepared to file and litigate.',
    overWeights: ['D2 Teardown detect', 'H7 Litigation survived', 'F2 Trilateral', 'H9 EoU'],
    dealKiller: 'Validity-exposed → emphasize H7 = Survived and low H2.',
    register: 'Litigation-explicit',
    color: 'red',
  },
  {
    code: 'DEF-AGG', name: 'Defensive Aggregator',
    description: 'Pooled-fund buyer keeping patents out of NPE hands.',
    overWeights: ['H1 Claim strength', 'H2 Low exposure', 'H8 Clean title', 'E4 Term', 'G3 Cross-industry'],
    dealKiller: 'High invalidity exposure or messy title → lead with H2 low + H8 clean.',
    register: 'Risk-managed, broad-relevance',
    color: 'teal',
  },
  {
    code: 'LIT-FIN', name: 'Litigation Finance',
    description: 'Investors funding enforcement campaigns for share of damages.',
    overWeights: ['E4 Remaining term', 'H9 EoU', 'I1 Mapped products', 'D2 Teardown'],
    dealKiller: 'Term too short OR no EoU → confirm E4 ≥ 1.5y AND H9 = Yes.',
    register: 'ROI-oriented, time-boxed',
    color: 'slate',
  },
];

const PATTERN_DATA: {
  code: SalesPackagePattern;
  name: string;
  whenToUse: string;
  wordTarget: string;
  compatible: SalesPackageArchetype[];
}[] = [
  {
    code: 'A', name: 'Strategic Flagship',
    whenToUse: '4+ assets, qualifying bundle composition (Anchor-Halo, Battle-Tested, EoU-Backed), AND a market context fact available.',
    wordTarget: '250-350 words',
    compatible: ['OC-EXP', 'OC-DEF', 'NPE-LIC', 'DEF-AGG'],
  },
  {
    code: 'B', name: 'Compressed Strategic',
    whenToUse: 'Single-asset listing with broad addressable buyer set (multiple credible buyer profiles nameable).',
    wordTarget: '180-220 words',
    compatible: ['OC-EXP', 'OC-OFF', 'NPE-LIC'],
  },
  {
    code: 'C', name: 'Technical-Spec',
    whenToUse: 'Multi-asset bundle where engineering specifics are the sell. No market context fact available.',
    wordTarget: '120-200 words',
    compatible: ['OC-DEF', 'OC-OFF', 'NPE-LIT', 'LIT-FIN'],
  },
  {
    code: 'D', name: 'Single-Asset Narrow',
    whenToUse: 'Single-asset listing with narrow positioning — one industry, one specific application.',
    wordTarget: '150-200 words',
    compatible: ['OC-EXP', 'OC-DEF'],
  },
];

const ARCHETYPE_COLORS: Record<string, string> = {
  blue: 'border-blue-500 bg-blue-50',
  orange: 'border-orange-500 bg-orange-50',
  purple: 'border-purple-500 bg-purple-50',
  amber: 'border-amber-500 bg-amber-50',
  red: 'border-red-500 bg-red-50',
  teal: 'border-teal-500 bg-teal-50',
  slate: 'border-slate-500 bg-slate-50',
};

const BUYER_PRESETS = [
  { id: 'all_on', label: 'All On', description: 'All 33 bundle types active', bundles: 33 },
  { id: 'npe', label: 'NPE / Assertion', description: 'Focused on assertion and licensing', bundles: 14 },
  { id: 'operating_company', label: 'Operating Co.', description: 'Balanced for product companies', bundles: 22 },
  { id: 'defensive', label: 'Defensive', description: 'Counter-assertion portfolios', bundles: 18 },
  { id: 'standards', label: 'Standards / SEP', description: 'SEP and interoperability focus', bundles: 12 },
  { id: 'ev_powertrain', label: 'EV Powertrain', description: 'Automotive tech packages', bundles: 9 },
];

const THRESHOLD_DEFS: { key: string; label: string; description: string; min: number; max: number; step: number }[] = [
  { key: 'sep_b1_cutoff', label: 'SEP Potential Cutoff', description: 'Min B1 score to qualify for SEP bundle', min: 0, max: 3, step: 1 },
  { key: 'interface_b3_cutoff', label: 'Interface Role Cutoff', description: 'Min B3 score for INTEROPERABILITY', min: 0, max: 3, step: 1 },
  { key: 'detect_d1_cutoff', label: 'External Detectability', description: 'Min D1 for DETECTABILITY bundle', min: 0, max: 3, step: 1 },
  { key: 'detect_d2_cutoff', label: 'Teardown Detectability', description: 'Min D2 for DETECTABILITY bundle', min: 0, max: 3, step: 1 },
  { key: 'family_e1_min', label: 'Min Family Size', description: 'Min related patents for FAMILY_TREE', min: 1, max: 10, step: 1 },
  { key: 'cross_industry_g3_cutoff', label: 'Cross-Industry Cutoff', description: 'Min G3 score', min: 0, max: 3, step: 1 },
  { key: 'defensive_d3_cutoff', label: 'Defensive Reads Cutoff', description: 'Min D3 for DEFENSIVE bundle', min: 0, max: 3, step: 1 },
  { key: 'whitespace_c4_cutoff', label: 'Design-Around Difficulty', description: 'Min C4 for WHITESPACE', min: 0, max: 3, step: 1 },
  { key: 'anchor_h1_cutoff', label: 'Anchor Strength', description: 'Min H1 for ANCHOR_HALO', min: 0, max: 3, step: 1 },
  { key: 'high_citation_h5_min', label: 'Min Forward Citations', description: 'Min H5 for HIGH_CITATION bundle', min: 5, max: 50, step: 5 },
  { key: 'pre_expiry_min_years', label: 'Pre-Expiry Min (yrs)', description: 'Earliest to flag as pre-expiry', min: 0, max: 5, step: 1 },
  { key: 'pre_expiry_max_years', label: 'Pre-Expiry Max (yrs)', description: 'Latest to flag as pre-expiry', min: 1, max: 10, step: 1 },
  { key: 'salvage_h1_max', label: 'Salvage Strength Max', description: 'Max H1 for SALVAGE bundle', min: 0, max: 2, step: 1 },
  { key: 'salvage_e4_max', label: 'Salvage Term Max (yrs)', description: 'Max term for SALVAGE', min: 1, max: 10, step: 1 },
  { key: 'salvage_h2_max', label: 'Salvage Prior Art Max', description: 'Max H2 for SALVAGE', min: 0, max: 2, step: 1 },
  { key: 'strength_depth_min', label: 'Strength Depth Min', description: 'Min patents for STRONG flag', min: 1, max: 20, step: 1 },
  { key: 'strength_detect_min', label: 'Strength Detect Min', description: 'Min avg D1 for STRONG flag', min: 0, max: 3, step: 1 },
  { key: 'strength_term_min', label: 'Strength Term Min (yrs)', description: 'Min avg term for STRONG flag', min: 0, max: 20, step: 1 },
];

const GATE_DEFS = [
  { key: 'gate_weakest_h1', label: 'Weakest H1 Gate', description: 'Flags bundles with very weak claim strength' },
  { key: 'gate_invalidity_exposure', label: 'Invalidity Exposure Gate', description: 'Flags bundles with high prior art risk' },
  { key: 'gate_eou_ready', label: 'EoU Ready Gate', description: 'Highlights bundles with evidence of use availability' },
  { key: 'gate_survived', label: 'Survived Challenge Gate', description: 'Flags patents that survived IPR/PGR' },
  { key: 'gate_cont_optionality', label: 'Continuation Optionality Gate', description: 'Flags live continuation opportunity' },
];

const DEFAULT_THRESHOLDS: Record<string, number> = {
  sep_b1_cutoff: 2, interface_b3_cutoff: 2, detect_d1_cutoff: 2, detect_d2_cutoff: 2,
  family_e1_min: 2, cross_industry_g3_cutoff: 2, defensive_d3_cutoff: 2, whitespace_c4_cutoff: 2,
  anchor_h1_cutoff: 2, high_citation_h5_min: 15, pre_expiry_min_years: 1, pre_expiry_max_years: 4,
  salvage_h1_max: 1, salvage_e4_max: 5, salvage_h2_max: 1, strength_depth_min: 4,
  strength_detect_min: 2, strength_term_min: 10,
};

const DEFAULT_GATE_TOGGLES: Record<string, boolean> = {
  gate_weakest_h1: true, gate_invalidity_exposure: true, gate_eou_ready: true,
  gate_survived: true, gate_cont_optionality: true,
};

function strengthColor(flag: string | null) {
  if (flag === 'STRONG') return 'text-green-600';
  if (flag === 'MODERATE') return 'text-amber-600';
  if (flag === 'WEAK') return 'text-red-500';
  return 'text-neutral-400';
}

function strengthDot(flag: string | null) {
  if (flag === 'STRONG') return 'bg-green-500';
  if (flag === 'MODERATE') return 'bg-amber-500';
  if (flag === 'WEAK') return 'bg-red-500';
  return 'bg-neutral-300';
}

function sourceColor(src: string) {
  if (src === 'ai') return 'bg-purple-100 text-purple-700';
  if (src === 'manual') return 'bg-blue-100 text-blue-700';
  if (src === 'mixed') return 'bg-cyan-100 text-cyan-700';
  if (src === 'derived') return 'bg-neutral-100 text-neutral-600';
  return 'bg-neutral-50 text-neutral-400';
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SalesPackageProjectDetail() {
  const router = useRouter();
  const { id: projectId } = useParams<{ id: string }>();

  const [projectName, setProjectName] = useState<string>('');

  // Import dialog state
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Analysis state
  const [result, setResult] = useState<BundleAnalysisResult | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<string>('');
  const [runProgress, setRunProgress] = useState<{ current: number; total: number } | null>(null);
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Attributes
  const [attributes, setAttributes] = useState<BundleAttributes[]>([]);
  const [attrTotal, setAttrTotal] = useState(0);
  const [attrOffset, setAttrOffset] = useState(0);
  const [attrSearch, setAttrSearch] = useState('');
  const [attrLoading, setAttrLoading] = useState(false);
  // Live Group A / H&I completeness, refreshed on every attribute load (Classify/Score All).
  const [liveCompleteness, setLiveCompleteness] = useState<AttributeCompleteness | null>(null);
  const [editingAttr, setEditingAttr] = useState<BundleAttributes | null>(null);
  const [viewingAttr, setViewingAttr] = useState<BundleAttributes | null>(null);
  const [patentText, setPatentText] = useState<PatentRecordText | null>(null);
  const [patentTextLoading, setPatentTextLoading] = useState(false);
  const [patentDetailTab, setPatentDetailTab] = useState<'attributes' | 'text' | 'claims'>('attributes');
  const [selectedAttrIds, setSelectedAttrIds] = useState<Set<string>>(new Set());
  const [aiScoring, setAiScoring] = useState(false);
  const [groupAScoring, setGroupAScoring] = useState(false);
  const [enriching, setEnriching] = useState(false);
  // Live progress for bulk operations
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; label: string } | null>(null);

  // Configuration
  const [preset, setPreset] = useState('all_on');
  const [thresholds, setThresholds] = useState<Record<string, number>>({ ...DEFAULT_THRESHOLDS });
  const [enabledBundles, setEnabledBundles] = useState<Record<string, boolean>>({});
  const [gateToggles, setGateToggles] = useState<Record<string, boolean>>({ ...DEFAULT_GATE_TOGGLES });
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(BUNDLE_CATEGORIES.map(c => c.label)));
  const [showThresholds, setShowThresholds] = useState(false);
  const [showGates, setShowGates] = useState(false);

  // Bundles explorer
  const [selectedBundle, setSelectedBundle] = useState<BundleQualityRow | null>(null);
  const [bundlePatents, setBundlePatents] = useState<PatentAttributeSummary[]>([]);
  const [bundlePatentSearch, setBundlePatentSearch] = useState('');
  const [bundleScoreFilter, setBundleScoreFilter] = useState<string>('all');
  const [bundleSubTab, setBundleSubTab] = useState<'explorer' | 'matrix' | 'scorecard'>('explorer');

  // Package builder
  const [selectedBundleCodes, setSelectedBundleCodes] = useState<Set<string>>(new Set());
  const [pkgName, setPkgName] = useState('');
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgTransactionType, setPkgTransactionType] = useState<string>('sale');
  const [pkgBuyerTargets, setPkgBuyerTargets] = useState('');
  const [pkgNotes, setPkgNotes] = useState('');
  const [pkgStatus, setPkgStatus] = useState<string>('draft');
  const [pkgPrimaryArchetype, setPkgPrimaryArchetype] = useState<SalesPackageArchetype | ''>('');
  const [pkgSecondaryArchetype, setPkgSecondaryArchetype] = useState<SalesPackageArchetype | ''>('');
  const [pkgListingPattern, setPkgListingPattern] = useState<SalesPackagePattern | ''>('');
  const [savedPackages, setSavedPackages] = useState<SalesPackage[]>([]);
  const [savingPkg, setSavingPkg] = useState(false);
  const [loadedPkgId, setLoadedPkgId] = useState<string | null>(null);
  const [exportingFmt, setExportingFmt] = useState<string | null>(null);
  const [bundleSearch, setBundleSearch] = useState('');
  const [pkgBundleStrengthFilter, setPkgBundleStrengthFilter] = useState<string>('all');

  // Value Proposition tab
  const [vpPatternOverride, setVpPatternOverride] = useState<SalesPackagePattern | ''>('');
  const [mclEntries, setMclEntries] = useState<MCLEntry[]>([]);
  const [addingMCL, setAddingMCL] = useState(false);
  const [newMCLEntry, setNewMCLEntry] = useState<Partial<MCLEntry>>({});
  const [generatingVP, setGeneratingVP] = useState(false);
  const [generatedTeaser, setGeneratedTeaser] = useState('');
  const [generatedListing, setGeneratedListing] = useState('');
  const [tierReport, setTierReport] = useState<ListingTierReport | null>(null);
  const [vpSubTab, setVpSubTab] = useState<'teaser' | 'listing' | 'analysis' | 'deck' | 'cim'>('teaser');
  const [suggestedPattern, setSuggestedPattern] = useState<SalesPackagePattern | ''>('');
  const [vpCopied, setVpCopied] = useState(false);
  const [suggestedArchetype, setSuggestedArchetype] = useState<SalesPackageArchetype | ''>('');
  const [archetypeReason, setArchetypeReason] = useState('');
  const [metaTags, setMetaTags] = useState<SalesPackageMetaTags | null>(null);
  const [lintResults, setLintResults] = useState<LintResult[] | null>(null);
  const [qualityGates, setQualityGates] = useState<QualityGatesResult | null>(null);
  const [tierValidation, setTierValidation] = useState<TierValidationResult | null>(null);
  const [generatedDeck, setGeneratedDeck] = useState('');
  const [generatedCIM, setGeneratedCIM] = useState('');
  const [generatingDeck, setGeneratingDeck] = useState(false);
  const [generatingCIM, setGeneratingCIM] = useState(false);

  // Global
  const [activeTab, setActiveTab] = useState('attributes');

  // ── Load project name ─────────────────────────────────────────────────────
  useEffect(() => {
    analyticsApi.getProject(projectId)
      .then(res => {
        if (res.success && res.data) setProjectName(res.data.name || '');
      })
      .catch(() => {});
  }, [projectId]);

  // ── Load saved result + packages when project changes ────────────────────
  useEffect(() => {
    if (!projectId) return;
    analyticsApi.getBundleAnalysisResult(projectId).then(res => {
      if (res.success && res.data?.result) {
        setResult(res.data.result);
        if (res.data.task_id && res.data.task_status === 'queued') {
          setTaskId(res.data.task_id);
          startPolling(res.data.task_id);
        }
      }
    }).catch(() => {});
    analyticsApi.getSalesPackages(projectId).then(res => {
      if (res.success && res.data) setSavedPackages(res.data);
    }).catch(() => {});
    loadAttributes(0);
  }, [projectId]);

  // ── Attribute loading ────────────────────────────────────────────────────
  const loadAttributes = useCallback(async (offset: number) => {
    if (!projectId) return;
    setAttrLoading(true);
    try {
      const res = await analyticsApi.getBundleAttributes(projectId, 50, offset);
      if (res.success && res.data) {
        const incoming = res.data.results;
        setAttributes(offset === 0 ? incoming : prev => [...prev, ...incoming]);
        setAttrTotal(res.data.count);
        setAttrOffset(offset + res.data.results.length);
        if (res.data.attribute_completeness) setLiveCompleteness(res.data.attribute_completeness);
      }
    } finally {
      setAttrLoading(false);
    }
  }, [projectId]);

  // ── Polling ───────────────────────────────────────────────────────────────
  const startPolling = useCallback((tid: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setAnalysisRunning(true);
    pollRef.current = setInterval(async () => {
      if (!projectId) return;
      const res = await analyticsApi.getBundleAnalysisResult(projectId);
      if (!res.success) return;
      const s = res.data?.task_status;
      setTaskStatus(s || '');
      if (res.data?.progress) setRunProgress(res.data.progress);
      if (s === 'completed' || s === 'failed' || s === 'unknown') {
        clearInterval(pollRef.current!);
        setAnalysisRunning(false);
        if (s === 'completed' && res.data?.result) setResult(res.data.result);
      }
    }, 3000);
  }, [projectId]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── Run analysis ─────────────────────────────────────────────────────────
  const runAnalysis = async () => {
    if (!projectId) return;
    setAnalysisRunning(true);
    setRunProgress(null);
    const config: Partial<BundleConfiguration> = { preset, thresholds, enabled_bundles: enabledBundles, gate_toggles: gateToggles };
    const res = await analyticsApi.runBundleAnalysis(projectId, config);
    if (res.success && res.data) {
      const d = res.data as any;
      if (d.task_id) { setTaskId(d.task_id); startPolling(d.task_id); }
      else { setResult(d); setAnalysisRunning(false); }
    } else {
      setAnalysisRunning(false);
    }
  };

  // H & I fields only — Group A is owned by the analyst via Technology Classification
  const HI_FIELDS = [
    'h1_claim_strength','h2_prior_art_exposure','h3_prosecution_risk','h4_divided_infringement_risk',
    'h7_litigation_history','h8_chain_of_title','h9_eou_availability','h10_encumbrance_status',
    'i1_product_mapping_confidence','i2_implementation_maturity','i3_adjacent_market_reread','i4_workaround_complexity',
  ];

  // ── Bulk processor: concurrent batches with live progress ───────────────
  // Fires CONCURRENCY calls in parallel, waits for the batch, then starts the next.
  // First call primes the Anthropic prompt cache; subsequent calls all cache-hit.
  //
  // Anthropic output token rate limits (binding constraint = output TPM):
  //   Tier 1 ($5):   8,000 out-TPM  → safe at CONCURRENCY = 1  (sequential, ~152 min / 1302 patents)
  //   Tier 2 ($40): 32,000 out-TPM  → safe at CONCURRENCY = 5  (~30 min / 1302 patents)
  //   Tier 3 ($200): 64,000+ out-TPM → safe at CONCURRENCY = 10+ (~15 min / 1302 patents)
  //
  // Each patent produces ~550 output tokens.  Formula: CONCURRENCY ≤ (out-TPM / 550) × (7s / 60s)
  const CONCURRENCY = 1; // Tier 1 safe — change to 5 after reaching Tier 2 ($40 purchased)

  const runBulkWithProgress = async (
    ids: string[],
    label: string,
    callFn: (id: string) => Promise<unknown>,
  ) => {
    if (!projectId || ids.length === 0) return;
    setBulkProgress({ done: 0, total: ids.length, label });
    let done = 0;

    // Batch 1: single patent to prime the Anthropic prompt cache
    try { await callFn(ids[0]); } catch { /* skip */ }
    done = 1;
    setBulkProgress({ done, total: ids.length, label });

    // Remaining batches: CONCURRENCY in parallel
    for (let i = 1; i < ids.length; i += CONCURRENCY) {
      const batch = ids.slice(i, i + CONCURRENCY);
      await Promise.allSettled(batch.map(id => callFn(id)));
      done += batch.length;
      setBulkProgress({ done, total: ids.length, label });
      // Refresh table after each batch so scores appear live
      await loadAttributes(0);
    }

    setBulkProgress(null);
  };

  // ── AI score all ─────────────────────────────────────────────────────────
  const scoreAllWithAI = async () => {
    if (!projectId || aiScoring) return;
    setAiScoring(true);
    // Collect all unscored patent IDs for this project
    const res = await analyticsApi.getBundleAttributes(projectId, 200, 0);
    const ids = res.success && res.data
      ? res.data.results.map((a: { patent_record_id: string }) => a.patent_record_id)
      : [];
    await runBulkWithProgress(
      ids,
      'Scoring H&I quality attributes',
      (id) => analyticsApi.extractBundleAttributes(projectId, [id], HI_FIELDS),
    );
    setAiScoring(false);
  };

  const scoreSingleWithAI = async (recId: string) => {
    if (!projectId) return;
    setBulkProgress({ done: 0, total: 1, label: 'Scoring H&I attributes…' });
    await analyticsApi.extractBundleAttributes(projectId, [recId], HI_FIELDS);
    setBulkProgress(null);
    await loadAttributes(0);
  };

  const classifyAllGroupA = async () => {
    if (!projectId || groupAScoring) return;
    setGroupAScoring(true);
    const res = await analyticsApi.getBundleAttributes(projectId, 200, 0);
    const ids = res.success && res.data
      ? res.data.results.map((a: { patent_record_id: string }) => a.patent_record_id)
      : [];
    await runBulkWithProgress(
      ids,
      'Classifying technology domains (Group A)',
      (id) => analyticsApi.classifyTechnology(projectId, [id]),
    );
    setGroupAScoring(false);
  };

  const classifySingleGroupA = async (recId: string) => {
    if (!projectId) return;
    setBulkProgress({ done: 0, total: 1, label: 'Classifying technology domain…' });
    await analyticsApi.classifyTechnology(projectId, [recId]);
    setBulkProgress(null);
    await loadAttributes(0);
  };

  // ── USPTO ODP enrichment ──────────────────────────────────────────────────
  // Pulls real patent data (title, abstract, claims, dates, assignee) from USPTO
  // ODP into the platform-wide Patent table and hydrates this project's records.
  const enrichSingleFromODP = async (recId: string) => {
    if (!projectId) return;
    setBulkProgress({ done: 0, total: 1, label: 'Enriching from USPTO ODP…' });
    const res = await analyticsApi.enrichFromODP(projectId, [recId]);
    setBulkProgress(null);
    if (res.success && (res.data?.enriched_count ?? 0) === 0) {
      const err = res.data?.results?.[0]?.error;
      if (err) alert(`Enrichment failed: ${err}`);
    }
    await loadAttributes(0);
  };

  const enrichAllFromODP = async () => {
    if (!projectId || enriching) return;
    setEnriching(true);
    // Collect un-enriched patent record IDs across the project.
    const res = await analyticsApi.getBundleAttributes(projectId, 200, 0);
    const ids = res.success && res.data
      ? res.data.results.filter(a => !a.enriched).map(a => a.patent_record_id)
      : [];
    await runBulkWithProgress(
      ids,
      'Enriching patents from USPTO ODP',
      (id) => analyticsApi.enrichFromODP(projectId, [id]),
    );
    setEnriching(false);
  };

  // Count of patents not yet enriched (from currently loaded rows).
  const unenrichedCount = attributes.filter(a => !a.enriched).length;

  // ── Bundle explorer — get patents in selected bundle ──────────────────────
  useEffect(() => {
    if (!selectedBundle || !result) { setBundlePatents([]); return; }
    const summary = result.patent_attribute_summary || [];
    const inBundle = summary.filter(p => p.bundle_codes.includes(selectedBundle.bundle_code));
    setBundlePatents(inBundle);
  }, [selectedBundle, result]);

  // ── Package save ─────────────────────────────────────────────────────────
  const savePackage = async () => {
    if (!projectId || !pkgName || selectedBundleCodes.size === 0) return;
    setSavingPkg(true);
    const data: SalesPackageCreateData = {
      name: pkgName, description: pkgDescription,
      bundle_codes: Array.from(selectedBundleCodes),
      transaction_type: pkgTransactionType as any,
      status: pkgStatus as any,
      buyer_targets: pkgBuyerTargets, notes: pkgNotes,
      primary_archetype: pkgPrimaryArchetype,
      secondary_archetype: pkgSecondaryArchetype,
      listing_pattern: pkgListingPattern,
      mcl_entries: mclEntries,
    };
    let res;
    if (loadedPkgId) {
      res = await analyticsApi.updateSalesPackage(projectId, loadedPkgId, data);
    } else {
      res = await analyticsApi.createSalesPackage(projectId, data);
    }
    if (res.success && res.data) {
      setSavedPackages(prev => {
        const filtered = prev.filter(p => p.id !== res.data!.id);
        return [res.data!, ...filtered];
      });
      setLoadedPkgId(res.data.id);
    }
    setSavingPkg(false);
  };

  // ── Load a saved package ─────────────────────────────────────────────────
  const loadPackage = (pkg: SalesPackage) => {
    setLoadedPkgId(pkg.id);
    setPkgName(pkg.name);
    setPkgDescription(pkg.description);
    setSelectedBundleCodes(new Set(pkg.bundle_codes));
    setPkgTransactionType(pkg.transaction_type);
    setPkgBuyerTargets(pkg.buyer_targets);
    setPkgNotes(pkg.notes);
    setPkgStatus(pkg.status);
    setPkgPrimaryArchetype(pkg.primary_archetype || '');
    setPkgSecondaryArchetype(pkg.secondary_archetype || '');
    setPkgListingPattern(pkg.listing_pattern || '');
    setMclEntries(pkg.mcl_entries || []);
    setGeneratedTeaser(pkg.generated_teaser || '');
    setGeneratedListing(pkg.generated_listing || '');
    setTierReport(pkg.listing_tier_report || null);
    setSuggestedPattern(pkg.listing_pattern || '');
    setSuggestedArchetype(pkg.suggested_archetype || '');
    setArchetypeReason(pkg.archetype_reason || '');
    setMetaTags(pkg.meta_tags || null);
    setLintResults(pkg.lint_results || null);
    setQualityGates(pkg.quality_gates || null);
    setTierValidation(pkg.tier_validation || null);
    setGeneratedDeck(pkg.generated_deck || '');
    setGeneratedCIM(pkg.generated_cim || '');
  };

  const newPackage = () => {
    setLoadedPkgId(null); setPkgName(''); setPkgDescription('');
    setSelectedBundleCodes(new Set()); setPkgTransactionType('sale');
    setPkgBuyerTargets(''); setPkgNotes(''); setPkgStatus('draft');
    setPkgPrimaryArchetype(''); setPkgSecondaryArchetype(''); setPkgListingPattern('');
    setMclEntries([]); setGeneratedTeaser(''); setGeneratedListing('');
    setTierReport(null); setSuggestedPattern(''); setVpPatternOverride('');
    setSuggestedArchetype(''); setArchetypeReason(''); setMetaTags(null);
    setLintResults(null); setQualityGates(null); setTierValidation(null);
    setGeneratedDeck(''); setGeneratedCIM('');
  };

  // ── Auto-generate package from template ──────────────────────────────────
  const applyTemplate = (tpl: typeof PACKAGE_TEMPLATES[0]) => {
    setPkgName(tpl.name);
    setPkgDescription(tpl.description);
    setPkgTransactionType(tpl.transactionType);
    setSelectedBundleCodes(new Set(tpl.bundleCodes));
    setLoadedPkgId(null);
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const exportPackage = async (fmt: 'excel' | 'json' | 'pdf') => {
    if (!projectId) return;
    setExportingFmt(fmt);
    try {
      const resp = await analyticsApi.exportSalesPackage(projectId, {
        bundle_codes: Array.from(selectedBundleCodes),
        package_name: pkgName || 'Sales Package',
        format: fmt,
      });
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pkgName || 'sales-package'}.${fmt === 'excel' ? 'xlsx' : fmt}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingFmt(null);
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalPatents = result?.total_patents ?? attrTotal;
  // Prefer live completeness (refreshed after Classify/Score All) over the snapshot
  // baked into the last bundle-analysis result.
  const completeness = liveCompleteness ?? result?.attribute_completeness;
  const qualifiedBundles = result?.qualified_bundles ?? [];
  const scorecard = result?.quality_scorecard ?? [];
  const aiScoredCount = completeness?.with_ai_attributes ?? 0;
  const pctComplete = completeness?.pct_complete ?? 0;
  const pctAComplete = completeness?.pct_a_complete ?? 0;

  // Package builder derived
  const pkgBundles = scorecard.filter(s => selectedBundleCodes.has(s.bundle_code));
  const pkgPatentCount = pkgBundles.reduce((sum, b) => sum + b.patent_count, 0);
  const pkgAvgStrength = pkgBundles.length
    ? pkgBundles.reduce((s, b) => s + (b.avg_claim_strength ?? 0), 0) / pkgBundles.length
    : 0;
  const pkgAvgTerm = pkgBundles.length
    ? pkgBundles.reduce((s, b) => s + (b.avg_remaining_term ?? 0), 0) / pkgBundles.length
    : 0;
  const pkgPioneerCount = pkgBundles.reduce((s, b) => s + (b.pioneer_count ?? 0), 0);
  const pkgTrilateral = pkgBundles.length
    ? pkgBundles.reduce((s, b) => s + (b.pct_trilateral ?? 0), 0) / pkgBundles.length
    : 0;

  // Filtered attributes
  const filteredAttrs = attributes.filter(a =>
    !attrSearch || a.title?.toLowerCase().includes(attrSearch.toLowerCase()) || a.patent_id?.includes(attrSearch)
  );

  // Filtered bundles for explorer left panel
  const filteredScorecard = scorecard.filter(s => {
    const matchesSearch = !bundleSearch || s.bundle_name.toLowerCase().includes(bundleSearch.toLowerCase());
    const matchesStrength = bundleScoreFilter === 'all' || s.strength_flag === bundleScoreFilter;
    return matchesSearch && matchesStrength;
  });

  // Filtered bundle patents in explorer
  const filteredBundlePatents = bundlePatents.filter(p =>
    !bundlePatentSearch || p.title.toLowerCase().includes(bundlePatentSearch.toLowerCase()) || p.patent_id.includes(bundlePatentSearch)
  );

  // Filtered bundles for package builder
  const filteredPkgBundleOptions = scorecard.filter(s => {
    const matchSearch = !bundleSearch || s.bundle_name.toLowerCase().includes(bundleSearch.toLowerCase());
    const matchStrength = pkgBundleStrengthFilter === 'all' || s.strength_flag === pkgBundleStrengthFilter;
    return matchSearch && matchStrength;
  });

  // ── Assignment matrix shortcut ────────────────────────────────────────────
  const matrix = result?.assignment_matrix;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/sales-package')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{projectName || 'Loading…'}</h1>
              <p className="text-muted-foreground">Bundle and package patents for sale or licensing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)} className="gap-1.5">
              <UploadCloud className="w-4 h-4" />
              Import Patents
            </Button>
          </div>
        </div>

        <ImportPatentsDialog
          open={showImportDialog}
          projectId={projectId}
          onOpenChange={setShowImportDialog}
          onImportComplete={() => loadAttributes(0)}
        />

        <div className="flex flex-col gap-4">
            {/* ── KPI Bar ── */}
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: 'Total Patents', value: totalPatents.toLocaleString(), icon: <Layers className="w-4 h-4" /> },
                {
                  label: 'Attr. Complete', icon: <Activity className="w-4 h-4" />,
                  value: completeness ? `${pctComplete.toFixed(0)}%` : '—',
                  sub: completeness ? `${completeness.total} scored` : 'Run analysis first',
                },
                { label: 'Bundles Qualified', value: qualifiedBundles.length || '—', icon: <BarChart2 className="w-4 h-4" /> },
                { label: 'AI Scored', value: aiScoredCount || '—', icon: <Sparkles className="w-4 h-4" /> },
                { label: 'Saved Packages', value: savedPackages.length, icon: <Package2 className="w-4 h-4" /> },
              ].map(kpi => (
                <Card key={kpi.label} className="border border-neutral-200">
                  <CardContent className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-neutral-500">{kpi.label}</span>
                      <span className="text-neutral-400">{kpi.icon}</span>
                    </div>
                    <p className="text-2xl font-bold text-neutral-900">{kpi.value}</p>
                    {(kpi as any).sub && <p className="text-xs text-neutral-400 mt-0.5">{(kpi as any).sub}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ── Analysis progress banner ── */}
            {analysisRunning && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Running bundle analysis…</p>
                  {runProgress && (
                    <Progress value={(runProgress.current / runProgress.total) * 100} className="h-1 mt-1" />
                  )}
                </div>
                <span className="text-xs text-blue-600">{taskStatus}</span>
              </div>
            )}

            {/* ── Tabs ── */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList>
                <TabsTrigger value="attributes">Attributes</TabsTrigger>
                <TabsTrigger value="configure">Configure</TabsTrigger>
                <TabsTrigger value="bundles" disabled={!result}>
                  Bundles {result && <span className="ml-1.5 text-xs bg-neutral-100 px-1.5 py-0.5 rounded">{qualifiedBundles.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="builder">Package Builder</TabsTrigger>
                <TabsTrigger value="value-prop" disabled={!loadedPkgId}>
                  Value Proposition {loadedPkgId && generatedListing && <span className="ml-1.5 w-2 h-2 rounded-full bg-green-500 inline-block" />}
                </TabsTrigger>
              </TabsList>

              {/* ══ TAB 1: ATTRIBUTES ══ */}
              <TabsContent value="attributes" className="mt-4 space-y-4">
                {/* Completeness group cards */}
                {completeness && (
                  <div className="grid grid-cols-9 gap-2">
                    {['A','B','C','D','E','F','G','H','I'].map(g => (
                      <Card key={g} className="border border-neutral-200">
                        <CardContent className="px-3 py-2 text-center">
                          <div className="text-xs font-bold text-neutral-500 mb-1">Group {g}</div>
                          <div className="text-sm font-semibold text-neutral-800">
                            {g === 'H' || g === 'I' ? `${pctComplete.toFixed(0)}%` : g === 'A' ? `${pctAComplete.toFixed(0)}%` : '—'}
                          </div>
                          <Progress value={g === 'H' || g === 'I' ? pctComplete : g === 'A' ? pctAComplete : 0} className="h-1 mt-1" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* H & I scoring banner */}
                {projectId && totalPatents > 0 && aiScoredCount < totalPatents && (
                  <div className="flex items-center gap-4 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
                    <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-800">
                        {totalPatents - aiScoredCount} of {totalPatents} patents unscored
                        <span className="ml-2 text-purple-600 font-normal">· Est. cost ~$7 for full portfolio</span>
                      </p>
                      <p className="text-xs text-purple-600 mt-0.5">AI scores 18 quality attributes (Groups H & I) per patent using Claude</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={scoreAllWithAI}
                      disabled={aiScoring}
                      className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                    >
                      {aiScoring ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                      Score All with AI
                    </Button>
                  </div>
                )}

                {/* USPTO ODP enrichment banner */}
                {projectId && unenrichedCount > 0 && (
                  <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <Globe className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800">
                        {unenrichedCount} patent{unenrichedCount === 1 ? '' : 's'} not yet enriched
                      </p>
                      <p className="text-xs text-amber-600 mt-0.5">Pull real title, abstract, claims, dates & assignee from USPTO ODP — saved to the platform-wide patent store</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={enrichAllFromODP}
                      disabled={enriching}
                      className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                    >
                      {enriching ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Globe className="w-3 h-3 mr-1" />}
                      Enrich All
                    </Button>
                  </div>
                )}

                {/* Group A classification banner */}
                {projectId && totalPatents > 0 && pctAComplete < 100 && (
                  <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                    <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">
                        Technology domains unclassified
                        <span className="ml-2 text-blue-600 font-normal">· {pctAComplete.toFixed(0)}% complete</span>
                      </p>
                      <p className="text-xs text-blue-600 mt-0.5">AI classifies domain, subcategory, stack layer, subsystem & use-case (Group A) from patent text + CPC codes</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={classifyAllGroupA}
                      disabled={groupAScoring}
                      className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                    >
                      {groupAScoring ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                      Classify All
                    </Button>
                  </div>
                )}

                {/* Patent attribute table */}
                <Card className="border border-neutral-200">
                  <CardHeader className="px-4 py-3 border-b border-neutral-100">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Patent Attributes ({attrTotal.toLocaleString()} total)</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                          <Input
                            value={attrSearch}
                            onChange={e => setAttrSearch(e.target.value)}
                            placeholder="Search patents…"
                            className="pl-8 h-8 text-xs w-56"
                          />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => loadAttributes(0)} disabled={attrLoading}>
                          <RefreshCw className={`w-3 h-3 ${attrLoading ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-neutral-100 bg-neutral-50">
                            <th className="text-left px-4 py-2 font-medium text-neutral-500 w-8">
                              <input type="checkbox" onChange={e => {
                                if (e.target.checked) setSelectedAttrIds(new Set(filteredAttrs.map(a => a.patent_record_id)));
                                else setSelectedAttrIds(new Set());
                              }} />
                            </th>
                            <th className="text-left px-4 py-2 font-medium text-neutral-500">Patent</th>
                            <th className="text-left px-4 py-2 font-medium text-neutral-500">Domain (A1)</th>
                            <th className="text-left px-4 py-2 font-medium text-neutral-500">Term (E4)</th>
                            <th className="text-left px-4 py-2 font-medium text-neutral-500">Strength (H1)</th>
                            <th className="text-left px-4 py-2 font-medium text-neutral-500">Filled %</th>
                            <th className="text-left px-4 py-2 font-medium text-neutral-500">Source</th>
                            <th className="text-right px-4 py-2 font-medium text-neutral-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAttrs.length === 0 && (
                            <tr><td colSpan={8} className="text-center py-8 text-neutral-400">
                              {attrLoading ? 'Loading…' : 'No attribute data yet. Run analysis to populate.'}
                            </td></tr>
                          )}
                          {filteredAttrs.map(attr => (
                            <tr
                              key={attr.patent_record_id}
                              className="border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer"
                              onClick={() => {
                                setViewingAttr(attr);
                                setPatentText(null);
                                setPatentDetailTab('attributes');
                                setPatentTextLoading(true);
                                analyticsApi.getPatentRecordText(projectId, attr.patent_record_id)
                                  .then(res => { if (res.success && res.data) setPatentText(res.data); })
                                  .catch(() => {})
                                  .finally(() => setPatentTextLoading(false));
                              }}
                            >
                              <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedAttrIds.has(attr.patent_record_id)}
                                  onChange={e => {
                                    const s = new Set(selectedAttrIds);
                                    if (e.target.checked) s.add(attr.patent_record_id); else s.delete(attr.patent_record_id);
                                    setSelectedAttrIds(s);
                                  }}
                                />
                              </td>
                              <td className="px-4 py-2">
                                <div className="font-medium text-neutral-800 truncate max-w-xs hover:text-neutral-600">{attr.title || '—'}</div>
                                <div className="text-neutral-400 font-mono">{attr.patent_id}</div>
                              </td>
                              <td className="px-4 py-2 text-neutral-600">{attr.a1_primary_domain || '—'}</td>
                              <td className="px-4 py-2 text-neutral-600">
                                {attr.e4_remaining_term_years != null ? `${attr.e4_remaining_term_years}y` : '—'}
                              </td>
                              <td className="px-4 py-2">
                                {attr.h1_claim_strength != null
                                  ? <span className={`font-semibold ${attr.h1_claim_strength >= 2 ? 'text-green-600' : attr.h1_claim_strength === 1 ? 'text-amber-600' : 'text-red-500'}`}>{attr.h1_claim_strength}/3</span>
                                  : <span className="text-neutral-300">—</span>}
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-1.5">
                                  <Progress value={attr.last_ai_extraction ? 75 : 15} className="h-1.5 w-16" />
                                  <span className="text-neutral-400">{attr.last_ai_extraction ? '~75%' : '~15%'}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${sourceColor(attr.ai_extracted_fields?.length ? 'ai' : attr.manually_set_fields?.length ? 'manual' : 'derived')}`}>
                                  {attr.ai_extracted_fields?.length ? 'AI' : attr.manually_set_fields?.length ? 'Manual' : 'Derived'}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                  {attr.enriched ? (
                                    <span title="Enriched from USPTO ODP" className="inline-flex items-center text-green-600 px-1">
                                      <Check className="w-3.5 h-3.5" />
                                    </span>
                                  ) : (
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                      title="Enrich from USPTO ODP"
                                      onClick={() => enrichSingleFromODP(attr.patent_record_id)}>
                                      <Globe className="w-3 h-3 mr-1" />Enrich
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    title="Classify technology domain (Group A)"
                                    onClick={() => classifySingleGroupA(attr.patent_record_id)}>
                                    <Sparkles className="w-3 h-3 mr-1" />A
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                    title="Score quality attributes (Groups H & I)"
                                    onClick={() => scoreSingleWithAI(attr.patent_record_id)}>
                                    <Sparkles className="w-3 h-3 mr-1" />H&I
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs"
                                    onClick={() => setEditingAttr(attr)}>
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {attrOffset < attrTotal && (
                      <div className="px-4 py-3 border-t border-neutral-100">
                        <Button variant="outline" size="sm" onClick={() => loadAttributes(attrOffset)} disabled={attrLoading}>
                          Load more ({attrTotal - attrOffset} remaining)
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bulk score selected / live progress bar */}
                {(selectedAttrIds.size > 0 || bulkProgress) && (
                  <div className="flex items-center gap-3 bg-neutral-900 text-white rounded-lg px-4 py-3">
                    {bulkProgress ? (
                      /* ── Live progress ── */
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">{bulkProgress.label}</span>
                            <span className="text-xs text-neutral-400 ml-3 shrink-0">
                              {bulkProgress.done} / {bulkProgress.total}
                            </span>
                          </div>
                          <div className="w-full bg-neutral-700 rounded-full h-1.5">
                            <div
                              className="bg-cyan-400 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${Math.round((bulkProgress.done / bulkProgress.total) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-cyan-400" />
                      </>
                    ) : (
                      /* ── Selection actions ── */
                      <>
                        <span className="text-sm">{selectedAttrIds.size} patents selected</span>
                        <div className="flex gap-2 ml-auto">
                          <Button size="sm" variant="secondary"
                            onClick={async () => {
                              const ids = Array.from(selectedAttrIds);
                              setSelectedAttrIds(new Set());
                              await runBulkWithProgress(
                                ids,
                                'Classifying technology domains (Group A)',
                                (id) => analyticsApi.classifyTechnology(projectId!, [id]),
                              );
                            }}>
                            <Sparkles className="w-3 h-3 mr-1" /> Classify Tech (A)
                          </Button>
                          <Button size="sm" variant="secondary"
                            onClick={async () => {
                              const ids = Array.from(selectedAttrIds);
                              setSelectedAttrIds(new Set());
                              await runBulkWithProgress(
                                ids,
                                'Scoring H&I quality attributes',
                                (id) => analyticsApi.extractBundleAttributes(projectId!, [id], HI_FIELDS),
                              );
                            }}>
                            <Sparkles className="w-3 h-3 mr-1" /> Score Quality (H&I)
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* ══ TAB 2: CONFIGURE ══ */}
              <TabsContent value="configure" className="mt-4 space-y-4">
                {/* Buyer Profile presets */}
                <Card className="border border-neutral-200">
                  <CardHeader className="px-4 py-3 border-b border-neutral-100">
                    <CardTitle className="text-sm font-medium">Buyer Profile</CardTitle>
                    <CardDescription className="text-xs">Select a preset tailored to your target buyer</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-3">
                      {BUYER_PRESETS.map(bp => (
                        <button
                          key={bp.id}
                          onClick={() => setPreset(bp.id)}
                          className={`text-left p-3 rounded-lg border transition-all ${preset === bp.id
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : 'border-neutral-200 hover:border-neutral-400 bg-white'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold">{bp.label}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${preset === bp.id ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                              {bp.bundles} bundles
                            </span>
                          </div>
                          <p className={`text-xs ${preset === bp.id ? 'text-white/70' : 'text-neutral-500'}`}>{bp.description}</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Bundle toggles by category */}
                <Card className="border border-neutral-200">
                  <CardHeader className="px-4 py-3 border-b border-neutral-100">
                    <CardTitle className="text-sm font-medium">Bundle Types</CardTitle>
                    <CardDescription className="text-xs">Enable or disable individual bundle types</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {BUNDLE_CATEGORIES.map(cat => (
                      <div key={cat.label} className="border-b border-neutral-100 last:border-0">
                        <button
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-50 text-sm font-medium text-neutral-700"
                          onClick={() => setOpenCategories(prev => {
                            const s = new Set(prev);
                            if (s.has(cat.label)) s.delete(cat.label); else s.add(cat.label);
                            return s;
                          })}
                        >
                          <span>{cat.label} <span className="text-neutral-400 font-normal ml-1">({cat.codes.length})</span></span>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs text-neutral-400 hover:text-neutral-600 underline"
                              onClick={e => { e.stopPropagation(); const m: Record<string, boolean> = {}; cat.codes.forEach(c => m[c] = true); setEnabledBundles(p => ({ ...p, ...m })); }}
                            >all on</span>
                            <span
                              className="text-xs text-neutral-400 hover:text-neutral-600 underline"
                              onClick={e => { e.stopPropagation(); const m: Record<string, boolean> = {}; cat.codes.forEach(c => m[c] = false); setEnabledBundles(p => ({ ...p, ...m })); }}
                            >all off</span>
                            {openCategories.has(cat.label) ? <ChevronUp className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />}
                          </div>
                        </button>
                        {openCategories.has(cat.label) && (
                          <div className="grid grid-cols-2 gap-0 px-4 pb-2">
                            {cat.codes.map(code => (
                              <div key={code} className="flex items-center justify-between py-1.5 pr-2">
                                <span className="text-xs text-neutral-600 font-mono">{code}</span>
                                <Switch
                                  checked={enabledBundles[code] !== false}
                                  onCheckedChange={v => setEnabledBundles(p => ({ ...p, [code]: v }))}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Thresholds */}
                <Card className="border border-neutral-200">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700"
                    onClick={() => setShowThresholds(p => !p)}
                  >
                    <span>Advanced Thresholds</span>
                    {showThresholds ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showThresholds && (
                    <CardContent className="px-4 pb-4 pt-0">
                      <div className="grid grid-cols-3 gap-4">
                        {THRESHOLD_DEFS.map(t => (
                          <div key={t.key}>
                            <div className="flex items-center justify-between mb-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <label className="text-xs font-medium text-neutral-700 cursor-help flex items-center gap-1">
                                    {t.label} <Info className="w-3 h-3 text-neutral-400" />
                                  </label>
                                </TooltipTrigger>
                                <TooltipContent><p className="text-xs max-w-xs">{t.description}</p></TooltipContent>
                              </Tooltip>
                              <span className="text-xs font-mono bg-neutral-100 px-1.5 py-0.5 rounded">{thresholds[t.key] ?? t.min}</span>
                            </div>
                            <Slider
                              min={t.min} max={t.max} step={t.step}
                              value={[thresholds[t.key] ?? t.min]}
                              onValueChange={([v]) => setThresholds(p => ({ ...p, [t.key]: v }))}
                              className="mt-1"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Quality Gates */}
                <Card className="border border-neutral-200">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700"
                    onClick={() => setShowGates(p => !p)}
                  >
                    <span>Quality Gates</span>
                    {showGates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showGates && (
                    <CardContent className="px-4 pb-4 pt-0 grid grid-cols-1 gap-2">
                      {GATE_DEFS.map(g => (
                        <div key={g.key} className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 bg-neutral-50">
                          <div>
                            <p className="text-xs font-medium text-neutral-800">{g.label}</p>
                            <p className="text-xs text-neutral-500">{g.description}</p>
                          </div>
                          <Switch
                            checked={gateToggles[g.key] !== false}
                            onCheckedChange={v => setGateToggles(p => ({ ...p, [g.key]: v }))}
                          />
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>

                {/* Run button */}
                <div className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-neutral-800">Ready to analyse</p>
                    {result?.run_at && (
                      <p className="text-xs text-neutral-400 mt-0.5">Last run: {result.run_at}</p>
                    )}
                  </div>
                  <Button onClick={runAnalysis} disabled={analysisRunning || !projectId} className="bg-neutral-900 text-white hover:bg-neutral-800">
                    {analysisRunning ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analysing…</> : <><Zap className="w-4 h-4 mr-2" />Run Bundle Analysis</>}
                  </Button>
                </div>
              </TabsContent>

              {/* ══ TAB 3: BUNDLES ══ */}
              <TabsContent value="bundles" className="mt-4">
                {!result ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <BarChart2 className="w-10 h-10 text-neutral-300" />
                    <p className="text-neutral-500">Run bundle analysis to explore results</p>
                    <Button onClick={() => setActiveTab('configure')} variant="outline" size="sm">Go to Configure</Button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-4">
                      {(['explorer', 'matrix', 'scorecard'] as const).map(t => (
                        <Button key={t} variant={bundleSubTab === t ? 'default' : 'outline'} size="sm"
                          onClick={() => setBundleSubTab(t)} className="capitalize">
                          {t === 'explorer' ? 'Bundle Explorer' : t === 'matrix' ? 'Assignment Matrix' : 'Quality Scorecard'}
                        </Button>
                      ))}
                    </div>

                    {/* Bundle Explorer */}
                    {bundleSubTab === 'explorer' && (
                      <div className="flex gap-4 h-[600px]">
                        {/* Left: bundle list */}
                        <Card className="w-72 shrink-0 border border-neutral-200 flex flex-col">
                          <CardHeader className="px-3 py-2.5 border-b border-neutral-100 shrink-0">
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <Input value={bundleSearch} onChange={e => setBundleSearch(e.target.value)}
                                  placeholder="Search bundles…" className="pl-6 h-7 text-xs" />
                              </div>
                              <Select value={bundleScoreFilter} onValueChange={setBundleScoreFilter}>
                                <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All</SelectItem>
                                  <SelectItem value="STRONG">Strong</SelectItem>
                                  <SelectItem value="MODERATE">Moderate</SelectItem>
                                  <SelectItem value="WEAK">Weak</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </CardHeader>
                          <div className="flex-1 overflow-y-auto">
                            {BUNDLE_CATEGORIES.map(cat => {
                              const catBundles = filteredScorecard.filter(s => cat.codes.includes(s.bundle_code));
                              if (catBundles.length === 0) return null;
                              return (
                                <div key={cat.label}>
                                  <div className="px-3 py-1.5 text-xs font-semibold text-neutral-400 bg-neutral-50 sticky top-0">
                                    {cat.label}
                                  </div>
                                  {catBundles.map(s => (
                                    <button
                                      key={s.bundle_code}
                                      onClick={() => { setSelectedBundle(s); setBundlePatentSearch(''); }}
                                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-neutral-50 transition-colors ${selectedBundle?.bundle_code === s.bundle_code ? 'bg-neutral-100' : ''}`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${strengthDot(s.strength_flag)}`} />
                                        <span className="text-xs text-neutral-700 truncate max-w-[140px]">{s.bundle_name}</span>
                                      </div>
                                      <Badge variant="secondary" className="text-xs shrink-0">{s.patent_count}</Badge>
                                    </button>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </Card>

                        {/* Right: patent list for selected bundle */}
                        <Card className="flex-1 border border-neutral-200 flex flex-col">
                          {!selectedBundle ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-neutral-400">
                              <CircleDot className="w-8 h-8" />
                              <p className="text-sm">Select a bundle to explore its patents</p>
                            </div>
                          ) : (
                            <>
                              <CardHeader className="px-4 py-3 border-b border-neutral-100 shrink-0">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                      <div className={`w-2.5 h-2.5 rounded-full ${strengthDot(selectedBundle.strength_flag)}`} />
                                      {selectedBundle.bundle_name}
                                      <span className={`text-xs font-normal ${strengthColor(selectedBundle.strength_flag)}`}>
                                        {selectedBundle.strength_flag}
                                      </span>
                                    </CardTitle>
                                    <div className="flex gap-3 mt-1">
                                      {[
                                        { l: 'Patents', v: selectedBundle.patent_count },
                                        { l: 'Avg H1', v: selectedBundle.avg_claim_strength?.toFixed(1) ?? '—' },
                                        { l: 'Avg Term', v: selectedBundle.avg_remaining_term ? `${selectedBundle.avg_remaining_term.toFixed(0)}y` : '—' },
                                        { l: 'Trilateral', v: selectedBundle.pct_trilateral ? `${selectedBundle.pct_trilateral.toFixed(0)}%` : '—' },
                                        { l: 'Pioneer', v: selectedBundle.pioneer_count ?? 0 },
                                      ].map(m => (
                                        <span key={m.l} className="text-xs text-neutral-500">{m.l}: <strong className="text-neutral-800">{m.v}</strong></span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <div className="relative">
                                      <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" />
                                      <Input value={bundlePatentSearch} onChange={e => setBundlePatentSearch(e.target.value)}
                                        placeholder="Search…" className="pl-6 h-7 text-xs w-40" />
                                    </div>
                                    <Button size="sm" variant="outline" className="h-7 text-xs"
                                      onClick={() => { setSelectedBundleCodes(prev => { const s = new Set(prev); s.add(selectedBundle.bundle_code); return s; }); setActiveTab('builder'); }}>
                                      Add to Package
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <div className="flex-1 overflow-y-auto">
                                <table className="w-full text-xs">
                                  <thead className="bg-neutral-50 sticky top-0">
                                    <tr className="border-b border-neutral-100">
                                      <th className="text-left px-4 py-2 font-medium text-neutral-500 w-8">
                                        <input type="checkbox" onChange={e => {
                                          // select all for package
                                        }} />
                                      </th>
                                      <th className="text-left px-4 py-2 font-medium text-neutral-500">Patent</th>
                                      <th className="text-left px-4 py-2 font-medium text-neutral-500">H1</th>
                                      <th className="text-left px-4 py-2 font-medium text-neutral-500">Term</th>
                                      <th className="text-left px-4 py-2 font-medium text-neutral-500">Bundles</th>
                                      <th className="text-left px-4 py-2 font-medium text-neutral-500">Source</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {filteredBundlePatents.length === 0 && (
                                      <tr><td colSpan={6} className="text-center py-8 text-neutral-400">No patents found</td></tr>
                                    )}
                                    {filteredBundlePatents.map(p => (
                                      <tr key={p.patent_record_id} className="border-b border-neutral-50 hover:bg-neutral-50">
                                        <td className="px-4 py-2">
                                          <input type="checkbox" onChange={e => {
                                            const s = new Set(selectedBundleCodes);
                                            if (e.target.checked) s.add(selectedBundle.bundle_code); else s.delete(selectedBundle.bundle_code);
                                            setSelectedBundleCodes(s);
                                          }} checked={selectedBundleCodes.has(selectedBundle.bundle_code)} />
                                        </td>
                                        <td className="px-4 py-2 max-w-xs">
                                          <div className="font-medium text-neutral-800 truncate">{p.title || '—'}</div>
                                          <div className="text-neutral-400 font-mono">{p.patent_id}</div>
                                        </td>
                                        <td className="px-4 py-2">—</td>
                                        <td className="px-4 py-2">—</td>
                                        <td className="px-4 py-2">{p.bundle_count}</td>
                                        <td className="px-4 py-2">
                                          <span className={`text-xs px-1.5 py-0.5 rounded ${sourceColor(p.attribute_source)}`}>
                                            {p.attribute_source || 'none'}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          )}
                        </Card>
                      </div>
                    )}

                    {/* Assignment Matrix */}
                    {bundleSubTab === 'matrix' && (
                      <Card className="border border-neutral-200">
                        <CardHeader className="px-4 py-3 border-b border-neutral-100">
                          <CardTitle className="text-sm font-medium">Assignment Matrix</CardTitle>
                          <CardDescription className="text-xs">Patents (rows) × Bundle types (columns). ✓ = patent qualifies for that bundle.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 overflow-auto max-h-[560px]">
                          {matrix && matrix.patent_ids.length > 0 ? (
                            <table className="text-xs border-collapse">
                              <thead className="sticky top-0 bg-white z-10">
                                <tr>
                                  <th className="text-left px-3 py-2 font-medium text-neutral-500 min-w-48 border-b border-r border-neutral-100">Patent</th>
                                  {matrix.bundle_codes.map((code, i) => (
                                    <th key={code} className="px-2 py-2 font-medium text-neutral-500 border-b border-neutral-100 min-w-24 text-center">
                                      <Tooltip>
                                        <TooltipTrigger className="block w-full truncate text-xs">{code}</TooltipTrigger>
                                        <TooltipContent><p>{matrix.bundle_names?.[i] ?? code}</p></TooltipContent>
                                      </Tooltip>
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {matrix.patent_ids.slice(0, 200).map((pid, ri) => (
                                  <tr key={pid} className="hover:bg-neutral-50">
                                    <td className="px-3 py-1 border-b border-r border-neutral-50 font-mono text-neutral-700 truncate max-w-48">{pid}</td>
                                    {matrix.matrix[ri]?.map((val: boolean, ci: number) => (
                                      <td key={ci} className="px-2 py-1 border-b border-neutral-50 text-center">
                                        {val ? <Check className="w-3 h-3 text-green-500 mx-auto" /> : null}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="py-12 text-center text-neutral-400 text-sm">
                              Matrix is empty — run analysis and score attributes first.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Quality Scorecard */}
                    {bundleSubTab === 'scorecard' && (
                      <Card className="border border-neutral-200">
                        <CardHeader className="px-4 py-3 border-b border-neutral-100">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">Quality Scorecard</CardTitle>
                            <Select value={bundleScoreFilter} onValueChange={setBundleScoreFilter}>
                              <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All bundles</SelectItem>
                                <SelectItem value="STRONG">Strong only</SelectItem>
                                <SelectItem value="MODERATE">Moderate</SelectItem>
                                <SelectItem value="WEAK">Weak</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-neutral-50">
                              <tr className="border-b border-neutral-100">
                                {['Bundle','Patents','Quality','Avg H1','Avg Breadth','Trilateral %','Avg Term','Detectability','Fwd Citations','SEP %','Cont %'].map(h => (
                                  <th key={h} className="text-left px-3 py-2 font-medium text-neutral-500 whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {filteredScorecard.map(s => (
                                <tr key={s.bundle_code} className="border-b border-neutral-50 hover:bg-neutral-50">
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-1.5">
                                      <div className={`w-2 h-2 rounded-full ${strengthDot(s.strength_flag)}`} />
                                      <span className="font-medium text-neutral-800">{s.bundle_name}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 font-semibold">{s.patent_count}</td>
                                  <td className={`px-3 py-2 font-semibold ${strengthColor(s.strength_flag)}`}>{s.strength_flag ?? '—'}</td>
                                  <td className="px-3 py-2">{s.avg_claim_strength?.toFixed(1) ?? '—'}</td>
                                  <td className="px-3 py-2">{s.avg_breadth?.toFixed(1) ?? '—'}</td>
                                  <td className="px-3 py-2">{s.pct_trilateral ? `${s.pct_trilateral.toFixed(0)}%` : '—'}</td>
                                  <td className="px-3 py-2">{s.avg_remaining_term ? `${s.avg_remaining_term.toFixed(0)}y` : '—'}</td>
                                  <td className="px-3 py-2">{s.avg_detectability?.toFixed(1) ?? '—'}</td>
                                  <td className="px-3 py-2">{s.avg_forward_citations?.toFixed(0) ?? '—'}</td>
                                  <td className="px-3 py-2">{s.pct_sep ? `${s.pct_sep.toFixed(0)}%` : '—'}</td>
                                  <td className="px-3 py-2">{s.pct_continuation_live ? `${s.pct_continuation_live.toFixed(0)}%` : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              {/* ══ TAB 4: PACKAGE BUILDER ══ */}
              <TabsContent value="builder" className="mt-4">
                {/* Saved packages chips */}
                {savedPackages.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="text-xs text-neutral-500 shrink-0">Saved packages:</span>
                    <button onClick={newPackage} className="text-xs border border-dashed border-neutral-300 px-2 py-1 rounded-full hover:border-neutral-500 text-neutral-400">
                      + New
                    </button>
                    {savedPackages.map(pkg => (
                      <button key={pkg.id}
                        onClick={() => loadPackage(pkg)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${loadedPkgId === pkg.id ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 hover:border-neutral-400 text-neutral-700'}`}
                      >
                        {pkg.name}
                        <span className="ml-1 opacity-60">({pkg.bundle_count})</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Auto-generate templates */}
                {!result && (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Package2 className="w-10 h-10 text-neutral-300" />
                    <p className="text-neutral-500 text-sm">Run bundle analysis first to build packages</p>
                    <Button onClick={() => setActiveTab('configure')} variant="outline" size="sm">Go to Configure</Button>
                  </div>
                )}

                {result && (
                  <div className="grid grid-cols-12 gap-4">
                    {/* Col 1: Bundle selection (4 cols) */}
                    <div className="col-span-4 space-y-3">
                      <Card className="border border-neutral-200">
                        <CardHeader className="px-3 py-2.5 border-b border-neutral-100">
                          <CardTitle className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Select Bundles</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2.5 space-y-1">
                          <div className="flex gap-2 mb-2">
                            <div className="relative flex-1">
                              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" />
                              <Input value={bundleSearch} onChange={e => setBundleSearch(e.target.value)}
                                placeholder="Filter…" className="pl-6 h-7 text-xs" />
                            </div>
                            <Select value={pkgBundleStrengthFilter} onValueChange={setPkgBundleStrengthFilter}>
                              <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="STRONG">Strong</SelectItem>
                                <SelectItem value="MODERATE">Moderate</SelectItem>
                                <SelectItem value="WEAK">Weak</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="max-h-96 overflow-y-auto space-y-0.5">
                            {filteredPkgBundleOptions.map(s => (
                              <label key={s.bundle_code}
                                className={`flex items-center gap-2.5 px-2 py-1.5 rounded cursor-pointer hover:bg-neutral-50 transition-colors ${selectedBundleCodes.has(s.bundle_code) ? 'bg-neutral-50' : ''}`}
                              >
                                <input type="checkbox"
                                  checked={selectedBundleCodes.has(s.bundle_code)}
                                  onChange={e => {
                                    const s2 = new Set(selectedBundleCodes);
                                    if (e.target.checked) s2.add(s.bundle_code); else s2.delete(s.bundle_code);
                                    setSelectedBundleCodes(s2);
                                  }}
                                />
                                <div className={`w-2 h-2 rounded-full shrink-0 ${strengthDot(s.strength_flag)}`} />
                                <span className="text-xs text-neutral-700 flex-1 truncate">{s.bundle_name}</span>
                                <Badge variant="secondary" className="text-xs shrink-0">{s.patent_count}</Badge>
                              </label>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Auto-suggest templates */}
                      <Card className="border border-neutral-200">
                        <CardHeader className="px-3 py-2.5 border-b border-neutral-100">
                          <CardTitle className="text-xs font-semibold text-neutral-600 uppercase tracking-wide flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-purple-500" /> Auto Suggestions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2.5 space-y-1.5">
                          {PACKAGE_TEMPLATES.map(tpl => (
                            <button key={tpl.name}
                              onClick={() => applyTemplate(tpl)}
                              className="w-full text-left px-2.5 py-2 rounded border border-neutral-100 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-neutral-800">{tpl.name}</span>
                                <span className="text-xs text-neutral-400">{tpl.bundleCodes.length} bundles</span>
                              </div>
                              <p className="text-xs text-neutral-500 mt-0.5 leading-tight">{tpl.description}</p>
                            </button>
                          ))}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Col 2: Package details (5 cols) */}
                    <div className="col-span-5">
                      <Card className="border border-neutral-200 h-full">
                        <CardHeader className="px-4 py-3 border-b border-neutral-100">
                          <CardTitle className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Package Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Package Name *</Label>
                            <Input value={pkgName} onChange={e => setPkgName(e.target.value)}
                              placeholder="e.g., Cybersecurity Core Portfolio" className="h-9" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Description</Label>
                            <Textarea value={pkgDescription} onChange={e => setPkgDescription(e.target.value)}
                              placeholder="Describe what this package contains and why…" rows={3} className="text-sm" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Transaction Type</Label>
                              <Select value={pkgTransactionType} onValueChange={setPkgTransactionType}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sale">Outright Sale</SelectItem>
                                  <SelectItem value="license">License</SelectItem>
                                  <SelectItem value="co_dev">Co-development</SelectItem>
                                  <SelectItem value="cross">Cross-license</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Status</Label>
                              <Select value={pkgStatus} onValueChange={setPkgStatus}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="ready">Ready</SelectItem>
                                  <SelectItem value="sent">Sent</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {/* Buyer Archetype Picker */}
                          <div className="space-y-1.5">
                            <Label className="text-xs">Buyer Archetype</Label>
                            <p className="text-xs text-neutral-400">Select the primary buyer type to target. This determines the listing pattern and language register.</p>
                            <div className="grid grid-cols-2 gap-1.5 mt-1">
                              {ARCHETYPE_DATA.map(arch => {
                                const isPrimary = pkgPrimaryArchetype === arch.code;
                                const isSecondary = pkgSecondaryArchetype === arch.code;
                                return (
                                  <button
                                    key={arch.code}
                                    type="button"
                                    onClick={() => {
                                      if (isPrimary) {
                                        setPkgPrimaryArchetype('');
                                      } else if (isSecondary) {
                                        setPkgSecondaryArchetype('');
                                      } else if (!pkgPrimaryArchetype) {
                                        setPkgPrimaryArchetype(arch.code);
                                      } else if (!pkgSecondaryArchetype && arch.code !== pkgPrimaryArchetype) {
                                        setPkgSecondaryArchetype(arch.code);
                                      } else {
                                        setPkgPrimaryArchetype(arch.code);
                                        setPkgSecondaryArchetype('');
                                      }
                                    }}
                                    className={`text-left p-2 rounded-lg border-2 transition-all ${
                                      isPrimary
                                        ? ARCHETYPE_COLORS[arch.color] + ' border-opacity-100'
                                        : isSecondary
                                        ? 'border-neutral-400 bg-neutral-50'
                                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className="text-xs font-mono font-bold text-neutral-700">{arch.code}</span>
                                      {isPrimary && <span className="text-xs text-white bg-neutral-800 px-1 rounded">Primary</span>}
                                      {isSecondary && <span className="text-xs text-neutral-600 bg-neutral-200 px-1 rounded">2nd</span>}
                                    </div>
                                    <p className="text-xs font-medium text-neutral-800 leading-tight">{arch.name.split(' — ')[1] || arch.name}</p>
                                    <p className="text-xs text-neutral-500 leading-tight mt-0.5 line-clamp-2">{arch.description}</p>
                                  </button>
                                );
                              })}
                            </div>
                            {pkgPrimaryArchetype && (
                              <div className="mt-1.5 p-2 rounded-lg bg-neutral-50 border border-neutral-200">
                                {(() => {
                                  const arch = ARCHETYPE_DATA.find(a => a.code === pkgPrimaryArchetype);
                                  return arch ? (
                                    <div className="space-y-1">
                                      <p className="text-xs font-medium text-neutral-700">Key attributes to highlight:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {arch.overWeights.map(w => (
                                          <span key={w} className="text-xs bg-white border border-neutral-200 px-1.5 py-0.5 rounded font-mono">{w}</span>
                                        ))}
                                      </div>
                                      <p className="text-xs text-amber-700 mt-1"><strong>Deal-killer:</strong> {arch.dealKiller}</p>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Internal Notes</Label>
                            <Textarea value={pkgNotes} onChange={e => setPkgNotes(e.target.value)}
                              placeholder="Deal strategy, contact history, next steps…" rows={2} className="text-sm" />
                          </div>

                          {/* Pricing — Coming Soon */}
                          <div className="rounded-lg border border-dashed border-neutral-200 px-4 py-3 bg-neutral-50">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-neutral-500">Pricing</span>
                              <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                            </div>
                            <p className="text-xs text-neutral-400">Asking price, royalty rate, and deal valuation tools will be available in a future release.</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Col 3: Summary + Export (3 cols) */}
                    <div className="col-span-3 space-y-3">
                      <Card className="border border-neutral-200">
                        <CardHeader className="px-3 py-2.5 border-b border-neutral-100">
                          <CardTitle className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Package Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 space-y-2">
                          {selectedBundleCodes.size === 0 ? (
                            <p className="text-xs text-neutral-400 text-center py-4">Select bundles to see summary</p>
                          ) : (
                            <>
                              <div className="text-center py-2">
                                <div className="text-3xl font-bold text-neutral-900">{pkgPatentCount.toLocaleString()}</div>
                                <div className="text-xs text-neutral-500">patents in package</div>
                              </div>
                              <div className="space-y-1.5">
                                {[
                                  { l: 'Bundles', v: selectedBundleCodes.size },
                                  { l: 'Avg Claim Strength', v: pkgAvgStrength.toFixed(1) },
                                  { l: 'Avg Remaining Term', v: `${pkgAvgTerm.toFixed(0)}y` },
                                  { l: 'Pioneer Patents', v: pkgPioneerCount },
                                  { l: 'Trilateral %', v: `${pkgTrilateral.toFixed(0)}%` },
                                ].map(m => (
                                  <div key={m.l} className="flex items-center justify-between text-xs">
                                    <span className="text-neutral-500">{m.l}</span>
                                    <span className="font-semibold text-neutral-800">{m.v}</span>
                                  </div>
                                ))}
                                {pkgPrimaryArchetype && (
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-neutral-500">Archetype</span>
                                    <span className="font-mono font-semibold text-neutral-800">{pkgPrimaryArchetype}</span>
                                  </div>
                                )}
                                {pkgListingPattern && (
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-neutral-500">Pattern</span>
                                    <span className="font-semibold text-neutral-800">
                                      {pkgListingPattern} — {PATTERN_DATA.find(p => p.code === pkgListingPattern)?.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="border-t border-neutral-100 pt-2 space-y-1">
                                <p className="text-xs font-medium text-neutral-600 mb-1">Selected bundles:</p>
                                <div className="flex flex-wrap gap-1">
                                  {Array.from(selectedBundleCodes).map(c => (
                                    <span key={c} className="text-xs bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-mono">{c}</span>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>

                      {/* Export */}
                      <Card className="border border-neutral-200">
                        <CardHeader className="px-3 py-2.5 border-b border-neutral-100">
                          <CardTitle className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Export</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 space-y-2">
                          {(['excel', 'json', 'pdf'] as const).map(fmt => (
                            <Button key={fmt} variant="outline" size="sm"
                              className="w-full justify-start text-xs h-8"
                              disabled={selectedBundleCodes.size === 0 || exportingFmt !== null}
                              onClick={() => exportPackage(fmt)}
                            >
                              {exportingFmt === fmt ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : (
                                fmt === 'excel' ? <FileSpreadsheet className="w-3 h-3 mr-2 text-green-600" /> :
                                fmt === 'json' ? <FileJson className="w-3 h-3 mr-2 text-blue-600" /> :
                                <FileText className="w-3 h-3 mr-2 text-red-500" />
                              )}
                              {fmt === 'excel' ? 'Excel Workbook (4 sheets)' : fmt === 'json' ? 'JSON Data Dump' : 'PDF Pitch Summary'}
                            </Button>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Save */}
                      <Button
                        onClick={savePackage}
                        disabled={!pkgName || selectedBundleCodes.size === 0 || savingPkg}
                        className="w-full bg-neutral-900 text-white hover:bg-neutral-800"
                      >
                        {savingPkg ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {loadedPkgId ? 'Update Package' : 'Save Package'}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ══ TAB 5: VALUE PROPOSITION ══ */}
              <TabsContent value="value-prop" className="mt-4">
                {!loadedPkgId ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <MessageSquare className="w-10 h-10 text-neutral-300" />
                    <p className="text-neutral-500 text-sm">Save a package in Package Builder first</p>
                    <Button onClick={() => setActiveTab('builder')} variant="outline" size="sm">Go to Package Builder</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-12 gap-4">
                    {/* ── Left panel: Setup + MCL ── */}
                    <div className="col-span-4 space-y-3">
                      {/* Package info */}
                      <Card className="border border-neutral-200">
                        <CardHeader className="px-3 py-2.5 border-b border-neutral-100">
                          <CardTitle className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Package</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 space-y-2">
                          <p className="text-sm font-semibold text-neutral-800">{pkgName}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {pkgPrimaryArchetype ? (
                              <Badge variant="outline" className="text-xs font-mono">{pkgPrimaryArchetype} — Primary</Badge>
                            ) : (
                              <button onClick={() => setActiveTab('builder')} className="text-xs text-amber-600 underline">
                                Set archetype in Package Builder
                              </button>
                            )}
                            {pkgSecondaryArchetype && (
                              <Badge variant="secondary" className="text-xs font-mono">{pkgSecondaryArchetype} — Secondary</Badge>
                            )}
                          </div>

                          {/* Pattern override */}
                          <div className="space-y-1">
                            <p className="text-xs text-neutral-500">Listing Pattern Override</p>
                            <div className="flex gap-1">
                              {(['A', 'B', 'C', 'D'] as SalesPackagePattern[]).map(p => (
                                <button
                                  key={p}
                                  onClick={() => setVpPatternOverride(prev => prev === p ? '' : p)}
                                  className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-all ${
                                    vpPatternOverride === p
                                      ? 'bg-neutral-900 text-white border-neutral-900'
                                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                                  }`}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                            {vpPatternOverride && (
                              <p className="text-xs text-neutral-500">
                                <strong>Pattern {vpPatternOverride}:</strong> {PATTERN_DATA.find(pd => pd.code === vpPatternOverride)?.name} · {PATTERN_DATA.find(pd => pd.code === vpPatternOverride)?.wordTarget}
                              </p>
                            )}
                            {suggestedPattern && !vpPatternOverride && (
                              <p className="text-xs text-neutral-400">Auto-suggest: Pattern {suggestedPattern} — {PATTERN_DATA.find(pd => pd.code === suggestedPattern)?.name}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Market Context Library (MCL) */}
                      <Card className="border border-neutral-200">
                        <CardHeader className="px-3 py-2.5 border-b border-neutral-100">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-xs font-semibold text-neutral-600 uppercase tracking-wide flex items-center gap-1.5">
                              <BookOpen className="w-3 h-3" /> Market Context
                            </CardTitle>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="w-3 h-3 text-neutral-400" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                  T4 market context facts — cited, sourced external signals (regulatory, standards, adoption). Used only when you add them here. Unlock Block 4 in Pattern A listings.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 space-y-2">
                          {mclEntries.length === 0 && !addingMCL && (
                            <p className="text-xs text-neutral-400 text-center py-2">No market context facts yet.<br />Add sourced T4 facts to unlock Block 4.</p>
                          )}
                          {mclEntries.map((entry, idx) => (
                            <div key={entry.id} className="flex items-start gap-2 p-2 rounded border border-neutral-100 bg-neutral-50">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-mono text-neutral-500">{entry.id}</p>
                                <p className="text-xs text-neutral-700 leading-tight line-clamp-2">{entry.statement}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {entry.source && <Link2 className="w-3 h-3 text-neutral-400 shrink-0" />}
                                  <span className="text-xs text-neutral-400 truncate">{entry.source || 'No source'}</span>
                                  {entry.source_date && <span className="text-xs text-neutral-400">· {entry.source_date}</span>}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const updated = mclEntries.filter((_, i) => i !== idx);
                                  setMclEntries(updated);
                                  if (loadedPkgId && projectId) {
                                    analyticsApi.updateSalesPackage(projectId, loadedPkgId, { mcl_entries: updated }).catch(() => {});
                                  }
                                }}
                                className="text-neutral-300 hover:text-red-400 transition-colors shrink-0"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}

                          {addingMCL ? (
                            <div className="space-y-2 p-2 rounded border border-neutral-200 bg-white">
                              <Input
                                placeholder="Domain tag (e.g. cardiac rhythm management)"
                                value={newMCLEntry.domain_tag || ''}
                                onChange={e => setNewMCLEntry(prev => ({ ...prev, domain_tag: e.target.value }))}
                                className="h-7 text-xs"
                              />
                              <Textarea
                                placeholder="Sourced T4 statement (a specific, verifiable fact)"
                                value={newMCLEntry.statement || ''}
                                onChange={e => setNewMCLEntry(prev => ({ ...prev, statement: e.target.value }))}
                                rows={2}
                                className="text-xs"
                              />
                              <Input
                                placeholder="Source URL or citation"
                                value={newMCLEntry.source || ''}
                                onChange={e => setNewMCLEntry(prev => ({ ...prev, source: e.target.value }))}
                                className="h-7 text-xs"
                              />
                              <Input
                                placeholder="Source date (e.g. 2024-03)"
                                value={newMCLEntry.source_date || ''}
                                onChange={e => setNewMCLEntry(prev => ({ ...prev, source_date: e.target.value }))}
                                className="h-7 text-xs"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" className="flex-1 h-7 text-xs"
                                  disabled={!newMCLEntry.statement}
                                  onClick={() => {
                                    const entry: MCLEntry = {
                                      id: `MCL-${String(mclEntries.length + 1).padStart(3, '0')}`,
                                      domain_tag: newMCLEntry.domain_tag || '',
                                      statement: newMCLEntry.statement || '',
                                      source: newMCLEntry.source || '',
                                      source_date: newMCLEntry.source_date || '',
                                    };
                                    const updated = [...mclEntries, entry];
                                    setMclEntries(updated);
                                    setNewMCLEntry({});
                                    setAddingMCL(false);
                                    if (loadedPkgId && projectId) {
                                      analyticsApi.updateSalesPackage(projectId, loadedPkgId, { mcl_entries: updated }).catch(() => {});
                                    }
                                  }}
                                >
                                  Add
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAddingMCL(false); setNewMCLEntry({}); }}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAddingMCL(true)}
                              className="w-full text-xs text-neutral-500 border border-dashed border-neutral-300 rounded py-1.5 hover:border-neutral-400 hover:text-neutral-700 transition-colors flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add T4 Context Fact
                            </button>
                          )}
                        </CardContent>
                      </Card>

                      {/* Generate button */}
                      <Button
                        onClick={async () => {
                          if (!projectId || !loadedPkgId) return;
                          setGeneratingVP(true);
                          try {
                            const res = await analyticsApi.generateListing(projectId, {
                              package_id: loadedPkgId,
                              pattern_override: vpPatternOverride || null,
                            });
                            if (res.success && res.data) {
                              setGeneratedTeaser(res.data.teaser);
                              setGeneratedListing(res.data.listing);
                              setTierReport(res.data.tier_report);
                              setSuggestedPattern(res.data.suggested_pattern);
                              setSuggestedArchetype(res.data.suggested_archetype || '');
                              setArchetypeReason(res.data.archetype_reason || '');
                              setMetaTags(res.data.meta_tags || null);
                              setLintResults(res.data.lint_results || null);
                              setQualityGates(res.data.quality_gates || null);
                              setTierValidation(res.data.tier_validation || null);
                              setVpSubTab('teaser');
                              setSavedPackages(prev => prev.map(p =>
                                p.id === loadedPkgId
                                  ? { ...p, generated_teaser: res.data!.teaser, generated_listing: res.data!.listing, listing_tier_report: res.data!.tier_report }
                                  : p
                              ));
                            }
                          } finally {
                            setGeneratingVP(false);
                          }
                        }}
                        disabled={generatingVP || !pkgPrimaryArchetype}
                        className="w-full bg-neutral-900 text-white hover:bg-neutral-800"
                      >
                        {generatingVP ? (
                          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating…</>
                        ) : (
                          <><Sparkles className="w-4 h-4 mr-2" /> Generate Value Proposition</>
                        )}
                      </Button>
                      {!pkgPrimaryArchetype && (
                        <p className="text-xs text-neutral-400 text-center">Select a buyer archetype in Package Builder first.</p>
                      )}

                      {/* Rung 3: Deck */}
                      {generatedListing && (
                        <Button
                          onClick={async () => {
                            if (!projectId || !loadedPkgId) return;
                            setGeneratingDeck(true);
                            try {
                              const res = await analyticsApi.generateDeck(projectId, loadedPkgId);
                              if (res.success && res.data) {
                                setGeneratedDeck(res.data.deck);
                                setVpSubTab('deck');
                              }
                            } finally {
                              setGeneratingDeck(false);
                            }
                          }}
                          disabled={generatingDeck}
                          variant="outline"
                          className="w-full"
                        >
                          {generatingDeck ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating Deck…</>
                          ) : (
                            <><FileText className="w-4 h-4 mr-2" /> Generate Offering Deck (Rung 3)</>
                          )}
                        </Button>
                      )}

                      {/* Rung 4: CIM */}
                      {generatedDeck && (
                        <Button
                          onClick={async () => {
                            if (!projectId || !loadedPkgId) return;
                            setGeneratingCIM(true);
                            try {
                              const res = await analyticsApi.generateCIM(projectId, loadedPkgId);
                              if (res.success && res.data) {
                                setGeneratedCIM(res.data.cim);
                                setVpSubTab('cim');
                              }
                            } finally {
                              setGeneratingCIM(false);
                            }
                          }}
                          disabled={generatingCIM}
                          variant="outline"
                          className="w-full"
                        >
                          {generatingCIM ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating CIM…</>
                          ) : (
                            <><BookOpen className="w-4 h-4 mr-2" /> Generate CIM Outline (Rung 4)</>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* ── Right panel: Output ── */}
                    <div className="col-span-8">
                      {!generatedTeaser && !generatedListing ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-64 gap-3 border border-dashed border-neutral-200 rounded-lg">
                          <Target className="w-10 h-10 text-neutral-300" />
                          <p className="text-neutral-500 text-sm font-medium">No value proposition generated yet</p>
                          <p className="text-xs text-neutral-400 text-center max-w-sm">
                            Select a buyer archetype, optionally add market context facts, then click Generate.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Tier report */}
                          {tierReport && (
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-neutral-50 border border-neutral-200 flex-wrap">
                              <span className="text-xs text-neutral-500 font-medium">Signal tiers:</span>
                              {(['t1', 't2', 't3', 't4'] as const).map(t => (
                                <span key={t} className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                                  t === 't1' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                  t === 't2' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                                  t === 't3' ? 'bg-green-50 border-green-200 text-green-700' :
                                  'bg-amber-50 border-amber-200 text-amber-700'
                                }`}>
                                  {t.toUpperCase()} {tierReport[t]}
                                </span>
                              ))}
                              {tierValidation && (
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${tierValidation.valid ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                  {tierValidation.valid ? '✓ Tier mix valid' : `${tierValidation.issues.length} tier issue${tierValidation.issues.length !== 1 ? 's' : ''}`}
                                </span>
                              )}
                              {qualityGates && (
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${qualityGates.all_passed ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                  {qualityGates.passed_count}/{qualityGates.total} gates
                                </span>
                              )}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger><Info className="w-3.5 h-3.5 text-neutral-400" /></TooltipTrigger>
                                  <TooltipContent className="text-xs max-w-xs">
                                    T1 = Verifiable patent facts · T2 = Workbook-scored attributes · T3 = Diligence-grade assertions (claim charts, clean title) · T4 = Sourced market context. Strong listing: 1-2 T1, 3-6 T2, 1-3 T3, 0-1 T4.
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}

                          {/* Sub-tabs */}
                          <div className="flex gap-1 border-b border-neutral-200 overflow-x-auto">
                            {([
                              { key: 'teaser', label: 'Teaser' },
                              { key: 'listing', label: 'Value Proposition' },
                              { key: 'analysis', label: 'Analysis' },
                              ...(generatedDeck ? [{ key: 'deck', label: 'Offering Deck' }] : []),
                              ...(generatedCIM ? [{ key: 'cim', label: 'CIM Outline' }] : []),
                            ] as { key: typeof vpSubTab; label: string }[]).map(t => (
                              <button
                                key={t.key}
                                onClick={() => setVpSubTab(t.key)}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                  vpSubTab === t.key
                                    ? 'border-neutral-900 text-neutral-900'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>

                          <div className="relative">
                            {/* Copy button (teaser/listing/deck/cim) */}
                            {['teaser', 'listing', 'deck', 'cim'].includes(vpSubTab) && (
                              <button
                                onClick={async () => {
                                  const textMap = { teaser: generatedTeaser, listing: generatedListing, deck: generatedDeck, cim: generatedCIM, analysis: '' };
                                  await navigator.clipboard.writeText(textMap[vpSubTab] || '');
                                  setVpCopied(true);
                                  setTimeout(() => setVpCopied(false), 2000);
                                }}
                                className="absolute top-2 right-2 z-10 flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 transition-colors px-2 py-1 rounded border border-neutral-200 bg-white"
                              >
                                {vpCopied ? <Check className="w-3 h-3 text-green-500" /> : <Clipboard className="w-3 h-3" />}
                                {vpCopied ? 'Copied!' : 'Copy'}
                              </button>
                            )}

                            {vpSubTab === 'teaser' && (
                              <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50 min-h-24">
                                <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">{generatedTeaser}</p>
                                <p className="text-xs text-neutral-400 mt-2">{generatedTeaser.split(/\s+/).filter(Boolean).length} words</p>
                              </div>
                            )}

                            {vpSubTab === 'listing' && (
                              <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50 min-h-48 prose prose-sm max-w-none">
                                {generatedListing.split('\n').map((line, i) => {
                                  if (line.startsWith('## ')) return <h2 key={i} className="text-sm font-bold text-neutral-900 mt-3 mb-1">{line.replace('## ', '')}</h2>;
                                  if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-xs font-semibold text-neutral-700 mt-2">{line.replace(/\*\*/g, '')}</p>;
                                  if (line.startsWith('- ')) return <p key={i} className="text-sm text-neutral-700 pl-3 before:content-['•'] before:mr-2 before:text-neutral-400">{line.replace('- ', '')}</p>;
                                  if (line.startsWith('*') && line.endsWith('*')) return <p key={i} className="text-xs text-neutral-400 italic">{line.replace(/\*/g, '')}</p>;
                                  if (line === '---') return <hr key={i} className="border-neutral-200 my-2" />;
                                  if (line === '') return <br key={i} />;
                                  return <p key={i} className="text-sm text-neutral-800 leading-relaxed">{line}</p>;
                                })}
                              </div>
                            )}

                            {vpSubTab === 'analysis' && (
                              <div className="space-y-4">
                                {/* Archetype suggestion */}
                                {suggestedArchetype && (
                                  <div className="p-3 rounded-lg border border-blue-100 bg-blue-50">
                                    <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5" /> Auto-Suggested Archetype (§4.5)
                                    </p>
                                    <p className="text-sm font-mono font-bold text-blue-800">{suggestedArchetype}</p>
                                    {archetypeReason && <p className="text-xs text-blue-600 mt-1">{archetypeReason}</p>}
                                  </div>
                                )}

                                {/* Meta tags */}
                                {metaTags && (
                                  <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50">
                                    <p className="text-xs font-semibold text-neutral-600 mb-2">Block 7 Meta Tags</p>
                                    <div className="space-y-1.5">
                                      {(['industries', 'technologies', 'transactions'] as const).map(group => (
                                        metaTags[group].length > 0 && (
                                          <div key={group} className="flex items-start gap-2">
                                            <span className="text-xs text-neutral-400 capitalize w-24 shrink-0">{group}:</span>
                                            <div className="flex flex-wrap gap-1">
                                              {metaTags[group].map(tag => (
                                                <span key={tag} className="text-xs bg-white border border-neutral-200 rounded px-1.5 py-0.5 text-neutral-700">{tag}</span>
                                              ))}
                                            </div>
                                          </div>
                                        )
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Tier coverage validation */}
                                {tierValidation && (
                                  <div className={`p-3 rounded-lg border ${tierValidation.valid ? 'border-green-100 bg-green-50' : 'border-amber-100 bg-amber-50'}`}>
                                    <p className={`text-xs font-semibold mb-2 flex items-center gap-1.5 ${tierValidation.valid ? 'text-green-700' : 'text-amber-700'}`}>
                                      {tierValidation.valid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                      Tier Coverage (§5.5) — {tierValidation.valid ? 'Valid' : 'Issues Found'}
                                    </p>
                                    <div className="flex gap-3 mb-2">
                                      {Object.entries(tierValidation.counts).map(([tier, count]) => (
                                        <div key={tier} className="text-center">
                                          <p className="text-sm font-bold text-neutral-800">{count}</p>
                                          <p className="text-xs text-neutral-500">{tier.toUpperCase()}</p>
                                        </div>
                                      ))}
                                    </div>
                                    {tierValidation.issues.map((issue, i) => (
                                      <p key={i} className="text-xs text-red-600 flex items-start gap-1"><X className="w-3 h-3 shrink-0 mt-0.5" />{issue}</p>
                                    ))}
                                    {tierValidation.warnings.map((w, i) => (
                                      <p key={i} className="text-xs text-amber-600 flex items-start gap-1"><AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />{w}</p>
                                    ))}
                                  </div>
                                )}

                                {/* Quality gates */}
                                {qualityGates && (
                                  <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50">
                                    <p className="text-xs font-semibold text-neutral-600 mb-2 flex items-center gap-1.5">
                                      <Shield className="w-3.5 h-3.5" /> Quality Gates (§17) — {qualityGates.passed_count}/{qualityGates.total} passed
                                    </p>
                                    <div className="space-y-1.5">
                                      {qualityGates.gates.map(gate => (
                                        <div key={gate.gate} className={`flex items-start gap-2 px-2 py-1.5 rounded border text-xs ${gate.passed ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
                                          {gate.passed ? <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" /> : <X className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />}
                                          <div>
                                            <span className="font-semibold text-neutral-700">{gate.label}</span>
                                            {gate.reason && <span className="text-neutral-500 ml-1">— {gate.reason}</span>}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Lint results */}
                                {lintResults && lintResults.length > 0 && (
                                  <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50">
                                    <p className="text-xs font-semibold text-neutral-600 mb-2 flex items-center gap-1.5">
                                      <AlertCircle className="w-3.5 h-3.5" /> Failure-Mode Lint (§15) — {lintResults.length} finding{lintResults.length !== 1 ? 's' : ''}
                                    </p>
                                    <div className="space-y-1.5">
                                      {lintResults.map((r, i) => (
                                        <div key={i} className={`flex items-start gap-2 px-2 py-1.5 rounded border text-xs ${r.severity === 'error' ? 'border-red-100 bg-red-50' : r.severity === 'warning' ? 'border-amber-100 bg-amber-50' : 'border-blue-100 bg-blue-50'}`}>
                                          <span className={`shrink-0 font-semibold uppercase tracking-wide ${r.severity === 'error' ? 'text-red-600' : r.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'}`}>{r.severity[0]}</span>
                                          <div>
                                            <span className="font-mono text-neutral-500">{r.mode}</span>
                                            <span className="text-neutral-700 ml-1">— {r.description}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {!suggestedArchetype && !metaTags && !tierValidation && !qualityGates && (!lintResults || lintResults.length === 0) && (
                                  <p className="text-xs text-neutral-400 text-center py-4">Generate a value proposition to see analysis results.</p>
                                )}
                              </div>
                            )}

                            {vpSubTab === 'deck' && (
                              <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50 min-h-48 prose prose-sm max-w-none">
                                {generatedDeck.split('\n').map((line, i) => {
                                  if (line.startsWith('# ')) return <h1 key={i} className="text-base font-bold text-neutral-900 mt-4 mb-1">{line.replace('# ', '')}</h1>;
                                  if (line.startsWith('## ')) return <h2 key={i} className="text-sm font-bold text-neutral-900 mt-3 mb-1">{line.replace('## ', '')}</h2>;
                                  if (line.startsWith('### ')) return <h3 key={i} className="text-xs font-semibold text-neutral-700 mt-2 mb-0.5">{line.replace('### ', '')}</h3>;
                                  if (line.startsWith('- ')) return <p key={i} className="text-sm text-neutral-700 pl-3 before:content-['•'] before:mr-2 before:text-neutral-400">{line.replace('- ', '')}</p>;
                                  if (line === '---') return <hr key={i} className="border-neutral-200 my-2" />;
                                  if (line === '') return <br key={i} />;
                                  return <p key={i} className="text-sm text-neutral-800 leading-relaxed">{line}</p>;
                                })}
                              </div>
                            )}

                            {vpSubTab === 'cim' && (
                              <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50 min-h-48 prose prose-sm max-w-none">
                                {generatedCIM.split('\n').map((line, i) => {
                                  if (line.startsWith('# ')) return <h1 key={i} className="text-base font-bold text-neutral-900 mt-4 mb-1">{line.replace('# ', '')}</h1>;
                                  if (line.startsWith('## ')) return <h2 key={i} className="text-sm font-bold text-neutral-900 mt-3 mb-1">{line.replace('## ', '')}</h2>;
                                  if (line.startsWith('### ')) return <h3 key={i} className="text-xs font-semibold text-neutral-700 mt-2 mb-0.5">{line.replace('### ', '')}</h3>;
                                  if (line.startsWith('- ')) return <p key={i} className="text-sm text-neutral-700 pl-3 before:content-['•'] before:mr-2 before:text-neutral-400">{line.replace('- ', '')}</p>;
                                  if (line === '---') return <hr key={i} className="border-neutral-200 my-2" />;
                                  if (line === '') return <br key={i} />;
                                  return <p key={i} className="text-sm text-neutral-800 leading-relaxed">{line}</p>;
                                })}
                              </div>
                            )}
                          </div>

                          {/* Export PDF */}
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              disabled={selectedBundleCodes.size === 0 || exportingFmt !== null}
                              onClick={() => exportPackage('pdf')}
                            >
                              {exportingFmt === 'pdf' ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <FileText className="w-3 h-3 mr-2 text-red-500" />}
                              Export PDF (includes value proposition)
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

        {/* ── Patent detail sheet ── */}
        <Sheet open={!!viewingAttr} onOpenChange={open => { if (!open) { setViewingAttr(null); setPatentText(null); } }}>
          <SheetContent side="right" className="w-[560px] sm:max-w-[560px] overflow-y-auto p-0">
            {viewingAttr && (
              <>
                <SheetHeader className="px-5 py-4 border-b border-neutral-100 sticky top-0 bg-white z-10">
                  <SheetTitle className="text-sm font-semibold text-neutral-900 leading-tight pr-8">
                    {viewingAttr.title || 'Patent Details'}
                  </SheetTitle>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="font-mono text-xs text-neutral-500">{viewingAttr.patent_id}</span>
                    {patentText?.assignee && <span className="text-xs text-neutral-500 truncate max-w-[180px]">{patentText.assignee}</span>}
                    {viewingAttr.ai_extracted_fields?.length > 0 && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">AI</span>
                    )}
                    {viewingAttr.manually_set_fields?.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Manual</span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs ml-auto"
                      onClick={() => { setEditingAttr(viewingAttr); setViewingAttr(null); }}
                    >
                      <Edit2 className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </div>

                  {/* Inline sub-tabs */}
                  <div className="flex gap-0 border-b border-neutral-100 mt-2 -mb-4">
                    {([
                      { key: 'attributes', label: 'Attributes' },
                      { key: 'text', label: 'Abstract' },
                      { key: 'claims', label: `Claims${patentText?.independent_claims_count ? ` (${patentText.independent_claims_count} ind.)` : ''}` },
                    ] as { key: typeof patentDetailTab; label: string }[]).map(t => (
                      <button
                        key={t.key}
                        onClick={() => setPatentDetailTab(t.key)}
                        className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                          patentDetailTab === t.key
                            ? 'border-neutral-900 text-neutral-900'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                    {patentTextLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400 self-center ml-2" />}
                  </div>
                </SheetHeader>

                <div className="px-5 py-4 space-y-5 text-xs">

                  {/* ── Text tab: Abstract + metadata ── */}
                  {patentDetailTab === 'text' && (
                    <div className="space-y-4">
                      {patentTextLoading && !patentText && (
                        <div className="flex items-center gap-2 text-neutral-400 py-8 justify-center">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading patent text…
                        </div>
                      )}
                      {!patentTextLoading && !patentText && (
                        <p className="text-neutral-400 text-center py-8">No text data available for this patent.</p>
                      )}
                      {patentText && (
                        <>
                          {/* Metadata row */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {[
                              { label: 'Assignee', val: patentText.assignee },
                              { label: 'Inventor', val: patentText.inventor },
                              { label: 'Filing Date', val: patentText.filing_date },
                              { label: 'Publication Date', val: patentText.publication_date },
                              { label: 'Grant Date', val: patentText.grant_date },
                              { label: 'Type', val: patentText.patent_type },
                              { label: 'Country', val: patentText.country_code },
                              { label: 'Legal Status', val: patentText.legal_status },
                              { label: 'IPC', val: patentText.ipc_classification },
                              { label: 'CPC', val: patentText.cpc_classification },
                            ].map(f => f.val ? (
                              <div key={f.label}>
                                <p className="text-neutral-400 mb-0.5">{f.label}</p>
                                <p className="text-neutral-800 font-medium break-words">{f.val}</p>
                              </div>
                            ) : null)}
                          </div>
                          {/* Abstract */}
                          {patentText.abstract ? (
                            <div>
                              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Abstract</p>
                              <p className="text-neutral-800 leading-relaxed whitespace-pre-wrap">{patentText.abstract}</p>
                            </div>
                          ) : (
                            <p className="text-neutral-400 text-center py-4">No abstract available.</p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* ── Claims tab ── */}
                  {patentDetailTab === 'claims' && (
                    <div className="space-y-3">
                      {patentTextLoading && !patentText && (
                        <div className="flex items-center gap-2 text-neutral-400 py-8 justify-center">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading claims…
                        </div>
                      )}
                      {!patentTextLoading && !patentText && (
                        <p className="text-neutral-400 text-center py-8">No claims data available.</p>
                      )}
                      {patentText && patentText.claims_structure?.length > 0 ? (
                        patentText.claims_structure.map((claim, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg border text-xs ${
                              claim.type === 'independent'
                                ? 'border-neutral-300 bg-white'
                                : 'border-neutral-100 bg-neutral-50 ml-4'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-semibold text-neutral-700">Claim {claim.number}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${claim.type === 'independent' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'}`}>
                                {claim.type}
                              </span>
                              {claim.references?.length > 0 && (
                                <span className="text-neutral-400">→ {claim.references.join(', ')}</span>
                              )}
                            </div>
                            <p className="text-neutral-700 leading-relaxed">{claim.text}</p>
                          </div>
                        ))
                      ) : patentText && patentText.claims ? (
                        <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50">
                          <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">{patentText.claims}</p>
                        </div>
                      ) : patentText ? (
                        <p className="text-neutral-400 text-center py-8">No claims text available.</p>
                      ) : null}
                    </div>
                  )}

                  {/* ── Attributes tab (existing content) ── */}
                  {patentDetailTab === 'attributes' && (<>
                  {/* Group A */}
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">A — Technology Classification (4 levels)</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {[
                        { label: 'L1 Domain', val: viewingAttr.a1_primary_domain },
                        { label: 'L2 Subcategory', val: viewingAttr.a2_tech_subcategory },
                        { label: 'L3 Technique', val: viewingAttr.a21_tech_detail },
                        { label: 'L4 Niche', val: viewingAttr.a22_tech_niche },
                        { label: 'Stack Layer', val: viewingAttr.a3_stack_layer },
                        { label: 'Subsystem', val: viewingAttr.a4_subsystem },
                        { label: 'Use Case', val: viewingAttr.a5_use_case },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-neutral-400 mb-0.5">{f.label}</p>
                          <p className="text-neutral-800 font-medium">{f.val || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Group B */}
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">B — Standards & Ecosystem</p>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                      {[
                        { label: 'SEP Potential', val: viewingAttr.b1_sep_potential?.toString() },
                        { label: 'Standard Tagged', val: viewingAttr.b2_standard_tagged },
                        { label: 'Interface Role', val: viewingAttr.b3_interface_role?.toString() },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-neutral-400 mb-0.5">{f.label}</p>
                          <p className="text-neutral-800 font-medium">{f.val ?? '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Group C */}
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">C — Claim Characteristics</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {[
                        { label: 'Claim Type', val: viewingAttr.c1_claim_type },
                        { label: 'Breadth (0–3)', val: viewingAttr.c2_breadth?.toString() },
                        { label: 'Claim Count', val: viewingAttr.c3_claim_count?.toString() },
                        { label: 'Design-Around Difficulty', val: viewingAttr.c4_design_around_difficulty?.toString() },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-neutral-400 mb-0.5">{f.label}</p>
                          <p className="text-neutral-800 font-medium">{f.val ?? '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Group D */}
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">D — Detectability</p>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                      {[
                        { label: 'External Detect.', val: viewingAttr.d1_external_detectability?.toString() },
                        { label: 'Teardown Detect.', val: viewingAttr.d2_teardown_detectability?.toString() },
                        { label: 'Reads on Products', val: viewingAttr.d3_reads_on_products?.toString() },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-neutral-400 mb-0.5">{f.label}</p>
                          <p className="text-neutral-800 font-medium">{f.val ?? '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Group E */}
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">E — Portfolio Position</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {[
                        { label: 'Family Size', val: viewingAttr.e1_family_size?.toString() },
                        { label: 'Prosecution Status', val: viewingAttr.e2_prosecution_status },
                        { label: 'Continuation', val: viewingAttr.e3_continuation != null ? (viewingAttr.e3_continuation ? 'Yes' : 'No') : undefined },
                        { label: 'Remaining Term', val: viewingAttr.e4_remaining_term_years != null ? `${viewingAttr.e4_remaining_term_years}y` : undefined },
                        { label: 'Maintenance Status', val: viewingAttr.e5_maintenance_status },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-neutral-400 mb-0.5">{f.label}</p>
                          <p className="text-neutral-800 font-medium">{f.val ?? '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Group F */}
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">F — Jurisdiction</p>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                      <div>
                        <p className="text-neutral-400 mb-0.5">Jurisdictions</p>
                        <p className="text-neutral-800 font-medium">{viewingAttr.f1_jurisdictions?.join(', ') || '—'}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400 mb-0.5">Trilateral</p>
                        <p className="text-neutral-800 font-medium">{viewingAttr.f2_trilateral != null ? (viewingAttr.f2_trilateral ? 'Yes' : 'No') : '—'}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400 mb-0.5">Major Market Score</p>
                        <p className="text-neutral-800 font-medium">{viewingAttr.f3_major_market_score?.toString() ?? '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Group G */}
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">G — Market Context</p>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                      {[
                        { label: 'Convergence Theme', val: viewingAttr.g1_convergence_theme },
                        { label: 'Generation Tag', val: viewingAttr.g2_generation_tag },
                        { label: 'Cross-Industry', val: viewingAttr.g3_cross_industry_applicability?.toString() },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-neutral-400 mb-0.5">{f.label}</p>
                          <p className="text-neutral-800 font-medium">{f.val ?? '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Group H */}
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">H — Quality & Vulnerability</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {[
                        { label: 'Claim Strength (0–3)', val: viewingAttr.h1_claim_strength?.toString() },
                        { label: 'Prior Art Exposure', val: viewingAttr.h2_prior_art_exposure?.toString() },
                        { label: 'Prosecution Risk', val: viewingAttr.h3_prosecution_risk?.toString() },
                        { label: 'Divided Infringement', val: viewingAttr.h4_divided_infringement_risk != null ? (viewingAttr.h4_divided_infringement_risk ? 'Yes' : 'No') : undefined },
                        { label: 'Forward Citations', val: viewingAttr.h5_forward_citations?.toString() },
                        { label: 'Backward Citations', val: viewingAttr.h6_backward_citations?.toString() },
                        { label: 'Litigation History', val: viewingAttr.h7_litigation_history },
                        { label: 'Chain of Title', val: viewingAttr.h8_chain_of_title },
                        { label: 'EOU Availability', val: viewingAttr.h9_eou_availability },
                        { label: 'Encumbrance Status', val: viewingAttr.h10_encumbrance_status },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-neutral-400 mb-0.5">{f.label}</p>
                          <p className={`font-medium ${f.label.includes('Strength') && f.val ? (Number(f.val) >= 2 ? 'text-green-600' : Number(f.val) === 1 ? 'text-amber-600' : 'text-red-500') : 'text-neutral-800'}`}>
                            {f.val ?? '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Group I */}
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">I — Commercial Relevance</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {[
                        { label: 'Product Mapping Confidence', val: viewingAttr.i1_product_mapping_confidence?.toString() },
                        { label: 'Implementation Maturity', val: viewingAttr.i2_implementation_maturity },
                        { label: 'Adjacent Market Reread', val: viewingAttr.i3_adjacent_market_reread?.toString() },
                        { label: 'Workaround Complexity', val: viewingAttr.i4_workaround_complexity?.toString() },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-neutral-400 mb-0.5">{f.label}</p>
                          <p className="text-neutral-800 font-medium">{f.val ?? '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Provenance */}
                  <div className="pt-2 border-t border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Provenance</p>
                    <div className="space-y-1.5">
                      {viewingAttr.last_ai_extraction && (
                        <p className="text-neutral-500">Last AI extraction: <span className="text-neutral-700">{new Date(viewingAttr.last_ai_extraction).toLocaleString()}</span></p>
                      )}
                      {viewingAttr.ai_extracted_fields?.length > 0 && (
                        <p className="text-neutral-500">AI fields ({viewingAttr.ai_extracted_fields.length}): <span className="text-neutral-600 font-mono">{viewingAttr.ai_extracted_fields.join(', ')}</span></p>
                      )}
                      {viewingAttr.manually_set_fields?.length > 0 && (
                        <p className="text-neutral-500">Manual fields ({viewingAttr.manually_set_fields.length}): <span className="text-neutral-600 font-mono">{viewingAttr.manually_set_fields.join(', ')}</span></p>
                      )}
                      {viewingAttr.derived_fields?.length > 0 && (
                        <p className="text-neutral-500">Derived fields ({viewingAttr.derived_fields.length}): <span className="text-neutral-600 font-mono">{viewingAttr.derived_fields.join(', ')}</span></p>
                      )}
                    </div>
                  </div>
                  </>)}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* ── Attribute edit dialog ── */}
        {editingAttr && (
          <Dialog open onOpenChange={() => setEditingAttr(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm">Edit Attributes — {editingAttr.patent_id || editingAttr.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 text-xs">
                {/* Group A */}
                <div>
                  <p className="font-semibold text-neutral-700 mb-2">Group A — Technology Classification</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'a1_primary_domain', label: 'L1 Domain' },
                      { key: 'a2_tech_subcategory', label: 'L2 Subcategory' },
                      { key: 'a21_tech_detail', label: 'L3 Technique' },
                      { key: 'a22_tech_niche', label: 'L4 Niche' },
                      { key: 'a4_subsystem', label: 'Subsystem' },
                      { key: 'a5_use_case', label: 'Use Case' },
                    ].map(f => (
                      <div key={f.key} className="space-y-1">
                        <Label className="text-xs">{f.label}</Label>
                        <Input className="h-7 text-xs"
                          value={(editingAttr as any)[f.key] ?? ''}
                          onChange={e => setEditingAttr(prev => prev ? { ...prev, [f.key]: e.target.value } : null)} />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Group H (most important) */}
                <div>
                  <p className="font-semibold text-neutral-700 mb-2">Group H — Quality & Vulnerability</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'h1_claim_strength', label: 'Claim Strength (0–3)', type: 'number' },
                      { key: 'h2_prior_art_exposure', label: 'Prior Art Exposure (0–3)', type: 'number' },
                      { key: 'h3_prosecution_risk', label: 'Prosecution Risk (0–3)', type: 'number' },
                      { key: 'h5_forward_citations', label: 'Forward Citations', type: 'number' },
                    ].map(f => (
                      <div key={f.key} className="space-y-1">
                        <Label className="text-xs">{f.label}</Label>
                        <Input className="h-7 text-xs" type={f.type}
                          value={(editingAttr as any)[f.key] ?? ''}
                          onChange={e => setEditingAttr(prev => prev ? { ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value } : null)} />
                      </div>
                    ))}
                    {[
                      { key: 'h7_litigation_history', label: 'Litigation History', opts: ['None', 'Filed', 'Survived', 'Lost'] },
                      { key: 'h8_chain_of_title', label: 'Chain of Title', opts: ['Clean', 'Issues', 'Unknown'] },
                      { key: 'h9_eou_availability', label: 'EoU Availability', opts: ['None', 'Partial', 'Full'] },
                      { key: 'h10_encumbrance_status', label: 'Encumbrance', opts: ['None', 'FRAND', 'Exclusive License', 'Other'] },
                    ].map(f => (
                      <div key={f.key} className="space-y-1">
                        <Label className="text-xs">{f.label}</Label>
                        <Select value={(editingAttr as any)[f.key] ?? ''} onValueChange={v => setEditingAttr(prev => prev ? { ...prev, [f.key]: v } : null)}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{f.opts.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Group I */}
                <div>
                  <p className="font-semibold text-neutral-700 mb-2">Group I — Market Signals</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'i1_product_mapping_confidence', label: 'Product Mapping (0–3)', type: 'number' },
                      { key: 'i3_adjacent_market_reread', label: 'Adjacent Market (0–3)', type: 'number' },
                      { key: 'i4_workaround_complexity', label: 'Workaround Complexity (0–3)', type: 'number' },
                    ].map(f => (
                      <div key={f.key} className="space-y-1">
                        <Label className="text-xs">{f.label}</Label>
                        <Input className="h-7 text-xs" type="number" min={0} max={3}
                          value={(editingAttr as any)[f.key] ?? ''}
                          onChange={e => setEditingAttr(prev => prev ? { ...prev, [f.key]: Number(e.target.value) } : null)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setEditingAttr(null)}>Cancel</Button>
                <Button size="sm" onClick={async () => {
                  if (!projectId || !editingAttr) return;
                  await analyticsApi.updateBundleAttributes(projectId, editingAttr.patent_record_id, editingAttr);
                  setEditingAttr(null);
                  await loadAttributes(0);
                }}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
}
