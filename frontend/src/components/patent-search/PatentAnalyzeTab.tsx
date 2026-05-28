'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Clock,
  Coins,
  Cpu,
  Hash,
  Search,
  FileText,
  BookOpen,
  Shield,
  AlertTriangle,
  Layers,
  Target,
  TreePine,
} from 'lucide-react';
import usptoOdpApi from '@/services/usptoOdpApi';
import type {
  PatentAnalysis,
  AnalysisModelKey,
  AnalysisCategoryKey,
  AnalysisKeywords,
  AnalysisNovelElements,
  AnalysisClaimScope,
  AnalysisEmbodiments,
  AnalysisBackground,
  AnalysisClaimTree,
  AnalysisMPF,
  AnalysisVulnerabilities,
} from '@/services/usptoOdpApi';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PatentAnalyzeTabProps {
  appId: string;
}

// ---------------------------------------------------------------------------
// Shared CollapsibleSection
// ---------------------------------------------------------------------------

function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  statusBadge,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  statusBadge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="flex items-center gap-2 w-full px-4 py-3 text-left font-semibold text-sm hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        {icon}
        <span className="flex-1">{title}</span>
        {statusBadge}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm leading-relaxed border-t pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Model selector & cost info
// ---------------------------------------------------------------------------

// Cost estimates assume sequential execution (max_workers=1) on Tier 1.
// Tier upgrades enable parallel execution → analysis runs ~3-4× faster at same cost.
const MODEL_INFO: Record<AnalysisModelKey, { label: string; cost: string; time: string }> = {
  haiku:  { label: 'Haiku 4.5 (Fast & Cheap)',   cost: '$0.07–0.25',  time: '~60–120s' },
  sonnet: { label: 'Sonnet 4.6 (Balanced)',      cost: '$0.22–0.74',  time: '~90–180s' },
  opus:   { label: 'Opus 4.6 (Highest Quality)', cost: '$0.12–0.41',  time: '~120–240s' },
};

const CATEGORY_INFO: Record<AnalysisCategoryKey, string> = {
  general: 'General',
  hi_tech: 'Hi-Tech / Software',
  biomedical: 'Biomedical',
  life_science: 'Life Science',
  mechanical: 'Mechanical',
  electrical: 'Electrical',
  chemical: 'Chemical',
  pharma: 'Pharmaceutical',
  semiconductor: 'Semiconductor',
};

// ---------------------------------------------------------------------------
// Loading animation section names
// ---------------------------------------------------------------------------

const LOADING_SECTIONS = [
  'Extracting keywords...',
  'Identifying novel elements...',
  'Analyzing claim scope...',
  'Mapping embodiments...',
  'Analyzing background & problems...',
  'Building claim dependency tree...',
  'Detecting means-plus-function elements...',
  'Assessing prosecution vulnerabilities...',
];

// ---------------------------------------------------------------------------
// AnalysisPromptState — "Run Analysis" CTA
// ---------------------------------------------------------------------------

function AnalysisPromptState({
  model,
  onModelChange,
  category,
  onCategoryChange,
  onRun,
}: {
  model: AnalysisModelKey;
  onModelChange: (m: AnalysisModelKey) => void;
  category: AnalysisCategoryKey;
  onCategoryChange: (c: AnalysisCategoryKey) => void;
  onRun: () => void;
}) {
  const info = MODEL_INFO[model];

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-6 py-10">
        <div className="rounded-full bg-primary/10 p-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-lg font-semibold">AI Patent Analysis</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            Run a deep analysis of this patent&apos;s claims, specification, and
            background to extract actionable insights across 8 dimensions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Select value={category} onValueChange={(v) => onCategoryChange(v as AnalysisCategoryKey)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CATEGORY_INFO) as AnalysisCategoryKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {CATEGORY_INFO[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={model} onValueChange={(v) => onModelChange(v as AnalysisModelKey)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(MODEL_INFO) as AnalysisModelKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {MODEL_INFO[key].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={onRun} size="lg">
            <Sparkles className="h-4 w-4 mr-2" />
            Run Analysis
          </Button>
        </div>

        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Coins className="h-3 w-3" /> Est. {info.cost}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> Est. {info.time}
          </span>
          {category !== 'general' && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" /> {CATEGORY_INFO[category]} prompts
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// AnalysisLoadingState — animated progress
// ---------------------------------------------------------------------------

function AnalysisLoadingState() {
  const [sectionIdx, setSectionIdx] = useState(0);
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setSectionIdx((prev) => (prev + 1) % LOADING_SECTIONS.length);
      setProgress((prev) => Math.min(prev + 12, 95));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-5 py-10">
        <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-10 w-10" />
        <div className="text-center space-y-2">
          <p className="font-medium text-sm">Analyzing patent...</p>
          <p className="text-muted-foreground text-sm">{LOADING_SECTIONS[sectionIdx]}</p>
        </div>
        <Progress value={progress} className="w-64" />
        <p className="text-xs text-muted-foreground">
          This may take 15–45 seconds depending on the model and patent length.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// AnalysisMetadataBar
// ---------------------------------------------------------------------------

function AnalysisMetadataBar({
  analysis,
  model,
  onModelChange,
  category,
  onCategoryChange,
  onReanalyze,
  isReanalyzing,
}: {
  analysis: PatentAnalysis;
  model: AnalysisModelKey;
  onModelChange: (m: AnalysisModelKey) => void;
  category: AnalysisCategoryKey;
  onCategoryChange: (c: AnalysisCategoryKey) => void;
  onReanalyze: () => void;
  isReanalyzing: boolean;
}) {
  const modelLabel = analysis.model_used.split('-').slice(1, -1).join(' ');
  const catLabel = analysis.prompt_category
    ? CATEGORY_INFO[analysis.prompt_category as AnalysisCategoryKey] || analysis.prompt_category
    : 'General';
  const dbPromptCount = analysis.prompts_used
    ? Object.values(analysis.prompts_used).filter((p) => p.source === 'database').length
    : 0;
  const totalPrompts = analysis.prompts_used ? Object.keys(analysis.prompts_used).length : 0;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            {modelLabel || analysis.model_used}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {catLabel}
          </Badge>
          <span className="flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {(analysis.total_input_tokens + analysis.total_output_tokens).toLocaleString()} tokens
          </span>
          <span className="flex items-center gap-1">
            <Coins className="h-3 w-3" />
            ${Number(analysis.total_cost_usd).toFixed(4)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {analysis.processing_time_seconds}s
          </span>
          {totalPrompts > 0 && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {dbPromptCount}/{totalPrompts} custom prompts
            </span>
          )}
          {analysis.cached && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              cached
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={category} onValueChange={(v) => onCategoryChange(v as AnalysisCategoryKey)}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CATEGORY_INFO) as AnalysisCategoryKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {CATEGORY_INFO[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={model} onValueChange={(v) => onModelChange(v as AnalysisModelKey)}>
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(MODEL_INFO) as AnalysisModelKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {MODEL_INFO[key].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={onReanalyze}
            disabled={isReanalyzing}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isReanalyzing ? 'animate-spin' : ''}`} />
            Re-analyze
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section Renderers
// ---------------------------------------------------------------------------

function SectionStatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const variant = status === 'completed' ? 'default' : status === 'partial' ? 'secondary' : 'destructive';
  return (
    <Badge variant={variant} className="text-[10px] px-1.5 py-0">
      {status}
    </Badge>
  );
}

function KeywordsSection({ data }: { data: AnalysisKeywords }) {
  if (!data?.technical_terms?.length) return <p className="text-muted-foreground">No keywords extracted.</p>;

  return (
    <div className="space-y-4">
      {data.technology_domain && (
        <p><span className="font-medium">Technology Domain:</span> {data.technology_domain}</p>
      )}
      {data.ipc_suggestion && (
        <p><span className="font-medium">IPC Suggestion:</span> {data.ipc_suggestion}</p>
      )}
      {data.key_distinguishing_terms?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.key_distinguishing_terms.map((t) => (
            <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
          ))}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-3 font-medium">Term</th>
              <th className="pb-2 pr-3 font-medium">Category</th>
              <th className="pb-2 pr-3 font-medium">Importance</th>
              <th className="pb-2 pr-3 font-medium">Claims</th>
              <th className="pb-2 font-medium">Context</th>
            </tr>
          </thead>
          <tbody>
            {data.technical_terms.map((kw, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-1.5 pr-3 font-medium">{kw.term}</td>
                <td className="py-1.5 pr-3">
                  <Badge variant="secondary" className="text-[10px]">{kw.category}</Badge>
                </td>
                <td className="py-1.5 pr-3">
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(kw.importance / 10) * 100}%` }}
                      />
                    </div>
                    <span>{kw.importance}/10</span>
                  </div>
                </td>
                <td className="py-1.5 pr-3">{kw.claim_locations?.join(', ')}</td>
                <td className="py-1.5 text-muted-foreground max-w-xs truncate">{kw.context_quote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NovelElementsSection({ data }: { data: AnalysisNovelElements }) {
  if (!data?.novel_elements?.length) return <p className="text-muted-foreground">No novel elements identified.</p>;

  return (
    <div className="space-y-4">
      {data.overall_novelty_assessment && (
        <p className="text-muted-foreground italic">{data.overall_novelty_assessment}</p>
      )}
      {data.novel_elements.map((el, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Claim {el.claim_number}</Badge>
            <span className="font-medium text-xs">{el.element_text}</span>
          </div>
          <p className="text-xs text-muted-foreground">{el.novelty_reasoning}</p>
          {el.spec_support && (
            <div className="bg-yellow-500/10 rounded p-2 text-xs">
              <span className="font-medium">Spec support:</span>{' '}
              <mark className="bg-yellow-200/30 rounded px-0.5">{el.spec_support}</mark>
              {el.spec_location_hint && (
                <span className="text-muted-foreground ml-1">({el.spec_location_hint})</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ClaimScopeSection({ data }: { data: AnalysisClaimScope }) {
  if (!data?.claims?.length) return <p className="text-muted-foreground">No claim scope data.</p>;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {data.total_independent_claims} independent claim(s) analyzed.
      </p>
      {data.claims.map((claim, i) => {
        if (claim.error) {
          return (
            <div key={i} className="border rounded-lg p-3 text-xs text-destructive">
              Claim {claim.claim_number}: Analysis failed — {claim.error}
            </div>
          );
        }
        return (
          <div key={i} className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline">Claim {claim.claim_number}</Badge>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Broadness:</span>
                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${claim.broadness_score}%`,
                      backgroundColor: claim.broadness_score > 70
                        ? 'hsl(var(--chart-2))'
                        : claim.broadness_score > 40
                        ? 'hsl(var(--chart-4))'
                        : 'hsl(var(--chart-1))',
                    }}
                  />
                </div>
                <span className="text-xs font-mono">{claim.broadness_score}/100</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{claim.broadness_reasoning}</p>
            {claim.key_limitations?.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1">Key Limitations:</p>
                <div className="flex flex-wrap gap-1">
                  {claim.key_limitations.map((lim, j) => (
                    <Badge
                      key={j}
                      variant={lim.narrowing_effect === 'high' ? 'destructive' : 'secondary'}
                      className="text-[10px]"
                    >
                      {lim.type}: {lim.text.slice(0, 50)}{lim.text.length > 50 ? '...' : ''}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {claim.overall_assessment && (
              <p className="text-xs">{claim.overall_assessment}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EmbodimentsSection({ data }: { data: AnalysisEmbodiments }) {
  if (!data?.embodiments?.length) return <p className="text-muted-foreground">No embodiments identified.</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Total: {data.total_count}</span>
        {data.primary_embodiment && <span>Primary: Embodiment {data.primary_embodiment}</span>}
      </div>
      {data.variation_summary && (
        <p className="text-xs text-muted-foreground italic">{data.variation_summary}</p>
      )}
      {data.embodiments.map((emb, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">#{emb.number}</Badge>
            <span className="font-medium text-xs">{emb.title}</span>
          </div>
          <p className="text-xs">{emb.summary}</p>
          {emb.figure_references?.length > 0 && (
            <div className="flex gap-1">
              {emb.figure_references.map((fig) => (
                <Badge key={fig} variant="secondary" className="text-[10px]">{fig}</Badge>
              ))}
            </div>
          )}
          {emb.distinguishing_aspects && (
            <p className="text-xs text-muted-foreground">{emb.distinguishing_aspects}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function BackgroundSection({ data }: { data: AnalysisBackground }) {
  if (!data?.summary) return <p className="text-muted-foreground">No background analysis available.</p>;

  return (
    <div className="space-y-4">
      {data.technical_field && (
        <p><span className="font-medium">Technical Field:</span> {data.technical_field}</p>
      )}
      <p className="text-xs text-muted-foreground italic">{data.summary}</p>

      {data.prior_art_deficiencies?.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2">Prior Art Deficiencies:</p>
          {data.prior_art_deficiencies.map((d, i) => (
            <div key={i} className="border-l-2 border-primary/30 pl-3 mb-2 text-xs">
              <p>{d.deficiency}</p>
              {d.source_quote && (
                <p className="text-muted-foreground mt-1">
                  <mark className="bg-yellow-200/30 rounded px-0.5">&ldquo;{d.source_quote}&rdquo;</mark>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {data.problems_identified?.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2">Problems Identified:</p>
          {data.problems_identified.map((p, i) => (
            <div key={i} className="border-l-2 border-destructive/30 pl-3 mb-2 text-xs">
              <p>{p.problem}</p>
              {p.source_quote && (
                <p className="text-muted-foreground mt-1">
                  <mark className="bg-yellow-200/30 rounded px-0.5">&ldquo;{p.source_quote}&rdquo;</mark>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {data.proposed_solutions?.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2">Proposed Solutions:</p>
          {data.proposed_solutions.map((s, i) => (
            <div key={i} className="border-l-2 border-green-500/30 pl-3 mb-2 text-xs">
              <p>{s.solution}</p>
              {s.source_quote && (
                <p className="text-muted-foreground mt-1">
                  <mark className="bg-yellow-200/30 rounded px-0.5">&ldquo;{s.source_quote}&rdquo;</mark>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClaimTreeSection({ data }: { data: AnalysisClaimTree }) {
  if (!data?.total_claims) return <p className="text-muted-foreground">No claim tree data.</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Total claims: {data.total_claims}</span>
        <span>Independent: {data.independent_count}</span>
        <span>Dependent: {data.dependent_count}</span>
      </div>

      {data.independent?.map((ind) => {
        const deps = data.tree?.[String(ind.claim_number)] || [];
        return (
          <div key={ind.claim_number} className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge>Claim {ind.claim_number}</Badge>
              <span className="text-xs font-medium">Independent</span>
              {deps.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({deps.length} dependent)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{ind.text_preview}</p>
            {deps.length > 0 && (
              <div className="ml-4 space-y-1 border-l-2 border-muted pl-3">
                {data.dependent
                  ?.filter((d) => d.depends_on === ind.claim_number)
                  .map((dep) => (
                    <div key={dep.claim_number} className="text-xs">
                      <span className="font-mono font-medium">Claim {dep.claim_number}</span>
                      <span className="text-muted-foreground ml-2">{dep.text_preview}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MPFSection({ data }: { data: AnalysisMPF }) {
  if (!data) return <p className="text-muted-foreground">No MPF analysis available.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge variant={data.has_mpf_elements ? 'destructive' : 'secondary'}>
          {data.has_mpf_elements ? `${data.total_mpf_count} MPF element(s) found` : 'No MPF elements'}
        </Badge>
      </div>
      {data.recommendation && (
        <p className="text-xs text-muted-foreground italic">{data.recommendation}</p>
      )}
      {data.mpf_elements?.map((el, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Claim {el.claim_number}</Badge>
            <Badge
              variant={el.risk_level === 'high' ? 'destructive' : el.risk_level === 'medium' ? 'secondary' : 'outline'}
              className="text-[10px]"
            >
              {el.risk_level} risk
            </Badge>
          </div>
          <p className="text-xs"><span className="font-medium">Element:</span> {el.element_text}</p>
          <p className="text-xs"><span className="font-medium">Function:</span> {el.function_described}</p>
          <p className="text-xs"><span className="font-medium">Structure:</span> {el.corresponding_structure}</p>
          {el.spec_support_quote && (
            <div className="bg-yellow-500/10 rounded p-2 text-xs">
              <mark className="bg-yellow-200/30 rounded px-0.5">{el.spec_support_quote}</mark>
            </div>
          )}
          {el.notes && <p className="text-xs text-muted-foreground">{el.notes}</p>}
        </div>
      ))}
    </div>
  );
}

function VulnerabilitiesSection({ data }: { data: AnalysisVulnerabilities }) {
  if (!data?.overall_prosecution_risk) return <p className="text-muted-foreground">No vulnerability data.</p>;

  const riskColor = {
    high: 'text-red-500',
    medium: 'text-yellow-500',
    low: 'text-green-500',
  };

  return (
    <div className="space-y-4">
      {/* Overall Risk */}
      <div className="border rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-xs">Overall Prosecution Risk:</span>
          <Badge
            variant={data.overall_prosecution_risk.rating === 'high' ? 'destructive' : 'secondary'}
          >
            {data.overall_prosecution_risk.rating?.toUpperCase()}
          </Badge>
        </div>
        <p className="text-xs">{data.overall_prosecution_risk.summary}</p>
        {data.overall_prosecution_risk.recommendations?.length > 0 && (
          <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
            {data.overall_prosecution_risk.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      {/* 101 Risk */}
      {data.section_101_risk && (
        <div className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-xs">35 U.S.C. 101 (Eligibility):</span>
            <span className={`text-xs font-medium ${riskColor[data.section_101_risk.risk_level as keyof typeof riskColor] || ''}`}>
              {data.section_101_risk.risk_level}
            </span>
          </div>
          <p className="text-xs">{data.section_101_risk.reasoning}</p>
          {data.section_101_risk.abstract_idea_candidates?.length > 0 && (
            <div>
              <span className="text-xs font-medium">Abstract idea candidates: </span>
              {data.section_101_risk.abstract_idea_candidates.map((a, i) => (
                <Badge key={i} variant="outline" className="text-[10px] mr-1">{a}</Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 112 Issues */}
      {data.section_112_issues?.length > 0 && (
        <div className="border rounded-lg p-3 space-y-2">
          <span className="font-medium text-xs">35 U.S.C. 112 Issues:</span>
          {data.section_112_issues.map((issue, i) => (
            <div key={i} className="border-l-2 border-destructive/30 pl-3 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Claim {issue.claim_number}</Badge>
                <span className="font-mono">&ldquo;{issue.term}&rdquo;</span>
                <Badge
                  variant={issue.severity === 'high' ? 'destructive' : 'secondary'}
                  className="text-[10px]"
                >
                  {issue.severity}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">{issue.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

type TabState = 'checking' | 'prompt' | 'loading' | 'error' | 'results';

export function PatentAnalyzeTab({ appId }: PatentAnalyzeTabProps) {
  const [state, setState] = useState<TabState>('checking');
  const [analysis, setAnalysis] = useState<PatentAnalysis | null>(null);
  const [model, setModel] = useState<AnalysisModelKey>('sonnet');
  const [category, setCategory] = useState<AnalysisCategoryKey>('general');
  const [error, setError] = useState('');
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  // Load cached analysis: on mount tries any result, on model/category change tries exact match
  const isInitialLoad = useRef(true);

  useEffect(() => {
    let cancelled = false;
    async function loadCached() {
      try {
        const res = await usptoOdpApi.analyzePatent(appId, {
          model,
          prompt_category: category,
          check_only: true,
        });
        if (cancelled) return;
        if (res.success && res.data) {
          const d = res.data;
          // On initial load, sync dropdowns to match the returned (possibly different) result
          if (isInitialLoad.current) {
            isInitialLoad.current = false;
            const modelKeys = Object.keys(MODEL_INFO) as AnalysisModelKey[];
            const matchedModel = modelKeys.find((k) => d.model_used?.includes(k));
            if (matchedModel) setModel(matchedModel);
            if (d.prompt_category) setCategory(d.prompt_category as AnalysisCategoryKey);
          }
          setAnalysis(d);
          setState('results');
        } else {
          setState('prompt');
        }
      } catch {
        if (!cancelled) setState('prompt');
      }
    }
    setState('checking');
    loadCached();
    return () => { cancelled = true; };
  }, [appId, model, category]);

  const runAnalysis = useCallback(
    async (forceRefresh = false) => {
      setState('loading');
      setError('');
      setIsReanalyzing(forceRefresh);

      try {
        const res = await usptoOdpApi.analyzePatent(appId, {
          model,
          prompt_category: category,
          force_refresh: forceRefresh,
        });

        if (res.success && res.data) {
          setAnalysis(res.data);
          setState('results');
        } else {
          setError(res.error || 'Analysis failed.');
          setState('error');
        }
      } catch {
        setError('An unexpected error occurred.');
        setState('error');
      } finally {
        setIsReanalyzing(false);
      }
    },
    [appId, model, category],
  );

  if (state === 'checking') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-3 py-10">
          <div className="animate-spin rounded-full border-2 border-primary border-t-transparent h-5 w-5" />
          <span className="text-sm text-muted-foreground">Checking for existing analysis...</span>
        </CardContent>
      </Card>
    );
  }

  if (state === 'prompt') {
    return (
      <AnalysisPromptState
        model={model}
        onModelChange={setModel}
        category={category}
        onCategoryChange={setCategory}
        onRun={() => runAnalysis(false)}
      />
    );
  }

  if (state === 'loading') {
    return <AnalysisLoadingState />;
  }

  if (state === 'error') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm text-center">{error}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setState('prompt')}>
              Back
            </Button>
            <Button size="sm" onClick={() => runAnalysis(false)}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === 'results' && analysis) {
    const ss = analysis.section_status || {};

    return (
      <div className="space-y-4">
        <AnalysisMetadataBar
          analysis={analysis}
          model={model}
          onModelChange={setModel}
          category={category}
          onCategoryChange={setCategory}
          onReanalyze={() => runAnalysis(true)}
          isReanalyzing={isReanalyzing}
        />

        <CollapsibleSection
          title="Keyword Extraction"
          icon={<Search className="h-4 w-4" />}
          defaultOpen
          statusBadge={<SectionStatusBadge status={ss.keywords} />}
        >
          <KeywordsSection data={analysis.keywords} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Novel Element Identification"
          icon={<Target className="h-4 w-4" />}
          statusBadge={<SectionStatusBadge status={ss.novel_elements} />}
        >
          <NovelElementsSection data={analysis.novel_elements} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Claim Scope & Broadness"
          icon={<Layers className="h-4 w-4" />}
          statusBadge={<SectionStatusBadge status={ss.claim_scope} />}
        >
          <ClaimScopeSection data={analysis.claim_scope} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Embodiment Analysis"
          icon={<FileText className="h-4 w-4" />}
          statusBadge={<SectionStatusBadge status={ss.embodiments} />}
        >
          <EmbodimentsSection data={analysis.embodiments} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Background & Problem Analysis"
          icon={<BookOpen className="h-4 w-4" />}
          statusBadge={<SectionStatusBadge status={ss.background_analysis} />}
        >
          <BackgroundSection data={analysis.background_analysis} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Claim Dependency Tree"
          icon={<TreePine className="h-4 w-4" />}
          statusBadge={<SectionStatusBadge status={ss.claim_tree} />}
        >
          <ClaimTreeSection data={analysis.claim_tree} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Means-Plus-Function Detection"
          icon={<Shield className="h-4 w-4" />}
          statusBadge={<SectionStatusBadge status={ss.means_plus_function} />}
        >
          <MPFSection data={analysis.means_plus_function} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Prosecution Vulnerability Assessment"
          icon={<AlertTriangle className="h-4 w-4" />}
          statusBadge={<SectionStatusBadge status={ss.vulnerabilities} />}
        >
          <VulnerabilitiesSection data={analysis.vulnerabilities} />
        </CollapsibleSection>
      </div>
    );
  }

  return null;
}

export default PatentAnalyzeTab;
