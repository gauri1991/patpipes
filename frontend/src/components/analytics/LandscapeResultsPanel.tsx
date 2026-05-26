'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Users,
  Globe,
  Scale,
  Lightbulb,
  BarChart3,
  Shield,
  FileText,
  Network,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface LandscapeResultsPanelProps {
  result: Record<string, any>;
}

function Section({ title, description, icon: Icon, children, defaultOpen = true }: {
  title: string; description: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <CardTitle className="text-sm">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      {open && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function RankedTable({ data, columns }: { data: any[]; columns: { key: string; label: string; render?: (v: any, row: any) => React.ReactNode }[] }) {
  if (!data?.length) return <p className="text-sm text-muted-foreground py-4 text-center">No data available</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left pb-2 pr-3 text-xs font-medium text-muted-foreground">#</th>
            {columns.map(c => <th key={c.key} className="text-left pb-2 pr-3 text-xs font-medium text-muted-foreground">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-2 pr-3 text-muted-foreground">{i + 1}</td>
              {columns.map(c => (
                <td key={c.key} className="py-2 pr-3">
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '\u2014')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LandscapeResultsPanel({ result }: LandscapeResultsPanelProps) {
  if (!result || result.error) return null;

  const r = result;

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid gap-3 md:grid-cols-5">
        <MetricCard label="Patents Analyzed" value={r.total_patents || 0} />
        <MetricCard label="Unique Assignees" value={r.unique_assignees || 0} />
        <MetricCard label="Market Concentration" value={r.market_concentration || '\u2014'} sub={`HHI: ${r.hhi_score || 0}`} />
        <MetricCard label="Quality Avg" value={r.quality_index?.avg_score || 0} sub="out of 100" />
        <MetricCard label="Filing Trend" value={r.acceleration || '\u2014'} sub={r.acceleration_value ? `${r.acceleration_value > 0 ? '+' : ''}${r.acceleration_value}%` : ''} />
      </div>

      {/* A: Filing Activity */}
      <Section title="Filing Activity" description="Temporal trends, velocity, and seasonal patterns" icon={BarChart3}>
        <div className="space-y-4">
          {r.filing_by_year?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Filing Trend by Year</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={r.filing_by_year}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-3">
            {r.grant_lag && <MetricCard label="Avg Grant Lag" value={`${r.grant_lag.avg_years || 0} yrs`} sub={`${r.grant_lag.total_granted || 0} granted`} />}
            {r.quarterly_distribution && (
              <MetricCard
                label="Peak Quarter"
                value={r.quarterly_distribution.reduce((max: any, q: any) => q.count > (max?.count || 0) ? q : max, null)?.quarter || '\u2014'}
              />
            )}
            {r.yoy_growth_rates?.length > 0 && (
              <MetricCard
                label="Latest YoY Growth"
                value={`${r.yoy_growth_rates[r.yoy_growth_rates.length - 1]?.growth_rate || 0}%`}
              />
            )}
          </div>
        </div>
      </Section>

      {/* B: Assignee Analytics */}
      <Section title="Assignee Analytics" description="Top players, filing velocity, technology shifts, collaboration" icon={Users}>
        <div className="space-y-4">
          {r.top_assignees?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Top Assignees by Patent Count</p>
              <ResponsiveContainer width="100%" height={Math.min(r.top_assignees.length * 28, 300)}>
                <BarChart data={r.top_assignees.slice(0, 10)} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="assignee" width={140} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [`${v} patents`]} />
                  <Bar dataKey="patent_count" fill="#3b82f6" radius={[0, 3, 3, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {r.assignee_velocity?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Filing Velocity (Top 10)</p>
              <RankedTable
                data={r.assignee_velocity}
                columns={[
                  { key: 'assignee', label: 'Assignee', render: (v: string) => <span className="font-medium truncate max-w-[200px] block">{v}</span> },
                  { key: 'recent_3yr', label: 'Recent 3yr' },
                  { key: 'growth_pct', label: 'Growth', render: (v: number) => (
                    <Badge variant={v > 20 ? 'default' : v < -20 ? 'destructive' : 'secondary'} className="text-xs">
                      {v > 0 ? '+' : ''}{v}%
                    </Badge>
                  )},
                  { key: 'trend', label: 'Trend', render: (v: string) => <span className="capitalize text-xs">{v}</span> },
                ]}
              />
            </div>
          )}
          {r.collaboration_network?.total_joint_filings > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Collaboration Network</p>
              <p className="text-sm">{r.collaboration_network.total_joint_filings} joint filings detected</p>
              {r.collaboration_network.top_collaboration_pairs?.length > 0 && (
                <RankedTable
                  data={r.collaboration_network.top_collaboration_pairs.slice(0, 5)}
                  columns={[
                    { key: 'entity_a', label: 'Entity A' },
                    { key: 'entity_b', label: 'Entity B' },
                    { key: 'co_filings', label: 'Co-filings' },
                  ]}
                />
              )}
            </div>
          )}
        </div>
      </Section>

      {/* C: Inventor Analytics */}
      <Section title="Inventor Analytics" description="Top inventors, talent mobility, team vs solo" icon={Users} defaultOpen={false}>
        <div className="space-y-4">
          {r.top_inventors?.length > 0 && (
            <RankedTable
              data={r.top_inventors.slice(0, 10)}
              columns={[
                { key: 'inventor', label: 'Inventor' },
                { key: 'patent_count', label: 'Patents' },
                { key: 'companies', label: 'Companies', render: (v: string[]) => v?.join(', ') || '\u2014' },
              ]}
            />
          )}
          {r.inventor_team_stats && (
            <div className="grid gap-3 md:grid-cols-3">
              <MetricCard label="Avg Inventors/Patent" value={r.inventor_team_stats.overall_avg} />
              <MetricCard label="Solo Filings" value={`${r.inventor_team_stats.solo_pct}%`} />
              <MetricCard label="Team Filings" value={`${100 - r.inventor_team_stats.solo_pct}%`} />
            </div>
          )}
          {r.inventor_mobility?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Talent Mobility ({r.inventor_mobility.length} inventors moved)</p>
              <RankedTable
                data={r.inventor_mobility.slice(0, 8)}
                columns={[
                  { key: 'inventor', label: 'Inventor' },
                  { key: 'companies_count', label: 'Companies' },
                  { key: 'timeline', label: 'Path', render: (v: any[]) => v?.map((t: any) => t.company).join(' \u2192 ') || '\u2014' },
                ]}
              />
            </div>
          )}
        </div>
      </Section>

      {/* D: Classification Analytics */}
      <Section title="Technology Classification" description="CPC/IPC distribution, co-occurrence, diversification, evolution" icon={Network}>
        <div className="space-y-4">
          {r.cpc_distribution?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Top CPC Subclasses</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={r.cpc_distribution.slice(0, 12)} margin={{ bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="code" angle={-45} textAnchor="end" tick={{ fontSize: 10 }} height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {r.diversification && (
            <div className="grid gap-3 md:grid-cols-3">
              <MetricCard label="Diversification" value={r.diversification.interpretation?.replace(/_/g, ' ') || '\u2014'} sub={`Index: ${r.diversification.normalized_index}`} />
              <MetricCard label="Unique CPC Codes" value={r.diversification.unique_cpc_codes || 0} />
              <MetricCard label="Shannon Entropy" value={r.diversification.shannon_entropy || 0} />
            </div>
          )}
          {r.cpc_cooccurrence?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Technology Convergence (CPC Co-occurrence)</p>
              <RankedTable
                data={r.cpc_cooccurrence.slice(0, 8)}
                columns={[
                  { key: 'code_a', label: 'CPC A' },
                  { key: 'code_b', label: 'CPC B' },
                  { key: 'co_occurrences', label: 'Co-occurrences' },
                ]}
              />
            </div>
          )}
          {r.cross_domain_bridges?.total_cross_domain > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Cross-Domain Bridges</p>
              <p className="text-sm mb-2">{r.cross_domain_bridges.total_cross_domain} patents span multiple technology domains</p>
              <RankedTable
                data={r.cross_domain_bridges.bridge_combinations?.slice(0, 5) || []}
                columns={[
                  { key: 'sections', label: 'Domains', render: (v: any) => Array.isArray(v) ? v.join(' + ') : String(v || '\u2014') },
                  { key: 'count', label: 'Patents' },
                ]}
              />
            </div>
          )}
        </div>
      </Section>

      {/* E: Citation Analytics */}
      <Section title="Citation Analytics" description="Influence scoring, density trends, self-citation, concentration" icon={TrendingUp} defaultOpen={false}>
        <div className="space-y-4">
          {r.citation_density_trend?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Citation Density Over Time</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={r.citation_density_trend.slice(-15)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg_citations" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-3">
            {r.self_citation && <MetricCard label="Self-Citation Rate" value={`${r.self_citation.self_citation_pct}%`} sub={r.self_citation.interpretation?.replace(/_/g, ' ')} />}
            {r.citation_concentration && <MetricCard label="Citation Gini" value={r.citation_concentration.gini_coefficient || r.citation_concentration.gini || 0} sub={r.citation_concentration.interpretation?.replace(/_/g, ' ')} />}
            {r.citation_influence?.length > 0 && <MetricCard label="Top Influencer Score" value={r.citation_influence[0].influence_score} sub={r.citation_influence[0].patent_id} />}
          </div>
          {r.citation_influence?.length > 0 && (
            <RankedTable
              data={r.citation_influence.slice(0, 8)}
              columns={[
                { key: 'patent_id', label: 'Patent', render: (v: string) => <span className="font-mono text-xs">{v}</span> },
                { key: 'forward_citations', label: 'Fwd Citations' },
                { key: 'age_years', label: 'Age (yrs)' },
                { key: 'influence_score', label: 'Score', render: (v: number) => <Badge variant="secondary">{v}</Badge> },
              ]}
            />
          )}
        </div>
      </Section>

      {/* F: Claims Analytics */}
      <Section title="Claims Analytics" description="Claim counts, independent vs dependent ratio, trends" icon={FileText} defaultOpen={false}>
        <div className="space-y-4">
          {r.claims_stats && (
            <div className="grid gap-3 md:grid-cols-4">
              <MetricCard label="Avg Claims" value={r.claims_stats.avg || 0} />
              <MetricCard label="Median Claims" value={r.claims_stats.median || 0} />
              <MetricCard label="With Claims Data" value={r.claims_stats.total_with_claims || 0} />
              <MetricCard label="Max Claims" value={r.claims_stats.max || 0} />
            </div>
          )}
          {r.claim_type_ratio && (
            <div className="grid gap-3 md:grid-cols-2">
              <MetricCard label="Independent Claims" value={r.claim_type_ratio.total_independent || 0} sub={`${r.claim_type_ratio.independent_pct || 0}%`} />
              <MetricCard label="Dependent Claims" value={r.claim_type_ratio.total_dependent || 0} />
            </div>
          )}
          {r.claim_count_trend?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Average Claims Per Patent Over Time</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={r.claim_count_trend.slice(-15)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg_claims" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Section>

      {/* G: Geographic */}
      <Section title="Geographic Distribution" description="Jurisdiction spread, concentration, PCT vs direct, heatmap" icon={Globe} defaultOpen={false}>
        <div className="space-y-4">
          {r.geographic_distribution && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Top Jurisdictions</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={Object.entries(r.geographic_distribution).map(([k, v]) => ({ jurisdiction: k, count: v as number }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="jurisdiction" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-3">
            {r.geographic_concentration && <MetricCard label="Geo Concentration" value={r.geographic_concentration.interpretation?.replace(/_/g, ' ') || '\u2014'} sub={`HHI: ${r.geographic_concentration.hhi}`} />}
            {r.pct_vs_direct && <MetricCard label="PCT Filings" value={`${r.pct_vs_direct.pct_pct}%`} sub={`${r.pct_vs_direct.pct_national_phase} of ${r.pct_vs_direct.pct_national_phase + r.pct_vs_direct.direct_filing}`} />}
            {r.geographic_concentration && <MetricCard label="Jurisdictions" value={r.geographic_concentration.unique_jurisdictions || 0} />}
          </div>
        </div>
      </Section>

      {/* H: Legal Status */}
      <Section title="Legal Status" description="Status distribution, abandonment rate, expiry cliff" icon={Shield} defaultOpen={false}>
        <div className="space-y-4">
          {r.status_distribution?.length > 0 && (
            <div className="grid gap-3 md:grid-cols-4">
              {r.status_distribution.map((s: any) => (
                <MetricCard key={s.status} label={s.status.charAt(0).toUpperCase() + s.status.slice(1)} value={s.count} sub={`${s.pct}%`} />
              ))}
            </div>
          )}
          {r.abandonment_rate && <MetricCard label="Abandonment Rate" value={`${r.abandonment_rate.rate_pct}%`} sub={`${r.abandonment_rate.abandoned} of ${r.abandonment_rate.total}`} />}
          {r.expiry_cliff?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Expiry Cliff</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={r.expiry_cliff}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="expiring" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Section>

      {/* J: Quality & Impact */}
      <Section title="Quality & Impact" description="Quality index, breakthrough patents, blocking patents" icon={Lightbulb} defaultOpen={false}>
        <div className="space-y-4">
          {r.quality_index && (
            <>
              <div className="grid gap-3 md:grid-cols-4">
                <MetricCard label="Avg Quality Score" value={r.quality_index.avg_score} sub="out of 100" />
                {r.quality_index.score_distribution && Object.entries(r.quality_index.score_distribution).map(([k, v]) => (
                  <MetricCard key={k} label={k.replace(/_/g, ' ')} value={v as number} />
                ))}
              </div>
              {r.quality_index.top_quality_patents?.length > 0 && (
                <RankedTable
                  data={r.quality_index.top_quality_patents.slice(0, 8)}
                  columns={[
                    { key: 'patent_id', label: 'Patent', render: (v: string) => <span className="font-mono text-xs">{v}</span> },
                    { key: 'title', label: 'Title', render: (v: string) => <span className="truncate max-w-[200px] block">{v}</span> },
                    { key: 'quality_score', label: 'Score', render: (v: number) => <Badge variant="secondary">{v}</Badge> },
                  ]}
                />
              )}
            </>
          )}
          {r.blocking_patents?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Potential Blocking Patents</p>
              <RankedTable
                data={r.blocking_patents.slice(0, 8)}
                columns={[
                  { key: 'patent_id', label: 'Patent', render: (v: string) => <span className="font-mono text-xs">{v}</span> },
                  { key: 'assignee', label: 'Assignee' },
                  { key: 'forward_citations', label: 'Citations' },
                  { key: 'blocking_score', label: 'Block Score', render: (v: number) => <Badge variant="destructive">{v}</Badge> },
                ]}
              />
            </div>
          )}
        </div>
      </Section>

      {/* K: Competitive Intelligence */}
      <Section title="Competitive Intelligence" description="Technology overlap, first movers, Jaccard similarity" icon={Scale} defaultOpen={false}>
        <div className="space-y-4">
          {r.technology_overlap?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Technology Overlap Between Top Players</p>
              <RankedTable
                data={r.technology_overlap.slice(0, 8)}
                columns={[
                  { key: 'entity_a', label: 'Entity A', render: (v: string) => <span className="truncate max-w-[120px] block">{v}</span> },
                  { key: 'entity_b', label: 'Entity B', render: (v: string) => <span className="truncate max-w-[120px] block">{v}</span> },
                  { key: 'shared_count', label: 'Shared CPCs' },
                  { key: 'jaccard_similarity', label: 'Similarity', render: (v: number) => <Badge variant="secondary">{(v * 100).toFixed(0)}%</Badge> },
                ]}
              />
            </div>
          )}
          {r.first_movers?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">First Movers by CPC</p>
              <RankedTable
                data={r.first_movers.slice(0, 10)}
                columns={[
                  { key: 'cpc', label: 'CPC', render: (v: string) => <span className="font-mono">{v}</span> },
                  { key: 'first_filer', label: 'First Filer' },
                  { key: 'first_year', label: 'Year' },
                ]}
              />
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
