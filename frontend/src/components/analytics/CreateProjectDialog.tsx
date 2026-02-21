/**
 * Comprehensive Create Project Dialog
 * Single-form view with conditional fields based on research goals
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface CreateProjectDialogProps {
  onSubmit: (data: any) => void;
}

export function CreateProjectDialog({ onSubmit }: CreateProjectDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'medium',
    status: 'draft',
    due_date: '',
    project_type: '',
    analysis_scope: {
      type: '',
      keywords: '',
      date_range_start: '',
      date_range_end: '',
      research_goals: [] as string[],
      research_requirements: '',
      // Market Opportunity Assessment
      target_markets: [] as string[],
      market_size_required: false,
      competitor_market_share: false,
      technology_adoption_timeline: '',
      key_market_players: '',
      market_entry_barriers: false,
      // Competitive Landscape Mapping
      competitor_companies: '',
      competitive_benchmarking: [] as string[],
      key_inventor_identification: false,
      corporate_hierarchy_analysis: false,
      citation_network_analysis: false,
      // Freedom to Operate
      product_description: '',
      fto_jurisdictions: [] as string[],
      product_launch_timeline: '',
      product_components: '',
      active_patents_only: true,
      claim_level_analysis: false,
      // Technology Trend Identification
      trend_analysis_period_start: '',
      trend_analysis_period_end: '',
      technology_classifications: '',
      filing_trend_analysis: false,
      citation_trend_analysis: false,
      emerging_tech_detection: false,
      tech_maturity_assessment: false,
      // White Space Discovery
      technology_focus_areas: '',
      white_space_classifications: '',
      crowded_vs_open_analysis: false,
      geographic_white_space: false,
      semantic_analysis: false,
      heat_map_visualization: false,
      // Patent Portfolio Evaluation
      portfolio_owner: '',
      portfolio_size: '',
      quality_assessment_criteria: [] as string[],
      geographic_coverage_analysis: false,
      portfolio_ranking: false,
      maintenance_cost_analysis: false,
      // Innovation Opportunity
      innovation_tech_domains: '',
      patent_gap_analysis: false,
      unmet_needs_assessment: false,
      cross_industry_opportunities: false,
      licensing_opportunity: false,
      // R&D Strategy Planning
      rd_focus_areas: '',
      technology_roadmap_timeline: '',
      internal_capability_assessment: false,
      ma_target_identification: false,
      technology_acquisition_strategy: false,
      resource_allocation_recommendations: false,
      // Technology Maturity Assessment
      technology_lifecycle_stage: '',
      patent_filing_velocity: false,
      innovation_rate_measurement: false,
      market_adoption_analysis: false,
      // Emerging Technology Identification
      tech_domains_to_monitor: '',
      time_series_period_start: '',
      time_series_period_end: '',
      patent_surge_detection: false,
      disruptive_tech_indicators: false,
      early_stage_patent_analysis: false,
      // Patent Landscape Report
      report_format: '',
      visualization_requirements: [] as string[],
      executive_summary_required: false,
      detailed_claim_analysis: false,
      competitive_positioning_charts: false
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim() || !formData.project_type) {
      alert('Please fill in all required fields (Project Name, Description, and Project Type)');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        analysis_scope: {
          ...formData.analysis_scope,
          type: formData.project_type,
          keywords: formData.analysis_scope.keywords.split(',').map(k => k.trim()).filter(k => k)
        }
      };

      await onSubmit(submitData);

      // Reset form (keeping this concise)
      setFormData({
        name: '',
        description: '',
        priority: 'medium',
        status: 'draft',
        due_date: '',
        project_type: '',
        analysis_scope: {
          type: '',
          keywords: '',
          date_range_start: '',
          date_range_end: '',
          research_goals: [],
          research_requirements: '',
          target_markets: [],
          market_size_required: false,
          competitor_market_share: false,
          technology_adoption_timeline: '',
          key_market_players: '',
          market_entry_barriers: false,
          competitor_companies: '',
          competitive_benchmarking: [],
          key_inventor_identification: false,
          corporate_hierarchy_analysis: false,
          citation_network_analysis: false,
          product_description: '',
          fto_jurisdictions: [],
          product_launch_timeline: '',
          product_components: '',
          active_patents_only: true,
          claim_level_analysis: false,
          trend_analysis_period_start: '',
          trend_analysis_period_end: '',
          technology_classifications: '',
          filing_trend_analysis: false,
          citation_trend_analysis: false,
          emerging_tech_detection: false,
          tech_maturity_assessment: false,
          technology_focus_areas: '',
          white_space_classifications: '',
          crowded_vs_open_analysis: false,
          geographic_white_space: false,
          semantic_analysis: false,
          heat_map_visualization: false,
          portfolio_owner: '',
          portfolio_size: '',
          quality_assessment_criteria: [],
          geographic_coverage_analysis: false,
          portfolio_ranking: false,
          maintenance_cost_analysis: false,
          innovation_tech_domains: '',
          patent_gap_analysis: false,
          unmet_needs_assessment: false,
          cross_industry_opportunities: false,
          licensing_opportunity: false,
          rd_focus_areas: '',
          technology_roadmap_timeline: '',
          internal_capability_assessment: false,
          ma_target_identification: false,
          technology_acquisition_strategy: false,
          resource_allocation_recommendations: false,
          technology_lifecycle_stage: '',
          patent_filing_velocity: false,
          innovation_rate_measurement: false,
          market_adoption_analysis: false,
          tech_domains_to_monitor: '',
          time_series_period_start: '',
          time_series_period_end: '',
          patent_surge_detection: false,
          disruptive_tech_indicators: false,
          early_stage_patent_analysis: false,
          report_format: '',
          visualization_requirements: [],
          executive_summary_required: false,
          detailed_claim_analysis: false,
          competitive_positioning_charts: false
        }
      });
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleResearchGoal = (goal: string) => {
    const goals = formData.analysis_scope.research_goals;
    if (goals.includes(goal)) {
      setFormData({
        ...formData,
        analysis_scope: {
          ...formData.analysis_scope,
          research_goals: goals.filter(g => g !== goal)
        }
      });
    } else {
      setFormData({
        ...formData,
        analysis_scope: {
          ...formData.analysis_scope,
          research_goals: [...goals, goal]
        }
      });
    }
  };

  const toggleArrayField = (field: string, value: string) => {
    const currentArray = (formData.analysis_scope as any)[field] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v: string) => v !== value)
      : [...currentArray, value];

    setFormData({
      ...formData,
      analysis_scope: {
        ...formData.analysis_scope,
        [field]: newArray
      }
    });
  };

  const selectedGoals = formData.analysis_scope.research_goals;

  // Helper function to check if a goal is selected
  const hasGoal = (goal: string) => selectedGoals.includes(goal);

  return (
    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create New Analytics Project</DialogTitle>
        <DialogDescription>
          Set up a comprehensive patent analytics and landscape analysis project
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6 py-4">
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <div className="pb-2 border-b">
            <h3 className="text-base font-semibold">Basic Information</h3>
          </div>

          <div className="space-y-4">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., AI Patent Landscape Analysis 2024"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Project Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the analysis objectives, scope, and expected outcomes..."
                rows={4}
                className="resize-none"
                required
              />
            </div>

            {/* Project Type and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_type">
                  Project Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.project_type}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    project_type: value,
                    analysis_scope: { ...formData.analysis_scope, type: value }
                  })}
                >
                  <SelectTrigger id="project_type">
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landscape_analysis">Landscape Analysis</SelectItem>
                    <SelectItem value="competitive_intelligence">Competitive Intelligence</SelectItem>
                    <SelectItem value="fto_analysis">FTO Analysis</SelectItem>
                    <SelectItem value="white_space_analysis">White Space Analysis</SelectItem>
                    <SelectItem value="portfolio_assessment">Portfolio Assessment</SelectItem>
                    <SelectItem value="technology_trends">Technology Trends</SelectItem>
                    <SelectItem value="market_analysis">Market Analysis</SelectItem>
                    <SelectItem value="investment_analysis">Investment Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="max-w-xs"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Section 2: Research Goals (MOVED UP) */}
        <div className="space-y-4">
          <div className="pb-2 border-b">
            <h3 className="text-base font-semibold">Research Goals</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Select research goals to reveal relevant analysis parameters
            </p>
          </div>

          <div className="space-y-4">
            {/* Research Goals Checkboxes */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Research Goals</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 border rounded-lg bg-muted/50">
                {[
                  'Market opportunity assessment',
                  'Competitive landscape mapping',
                  'Freedom to operate analysis',
                  'Technology trend identification',
                  'White space discovery',
                  'Patent portfolio evaluation',
                  'Innovation opportunity identification',
                  'R&D strategy planning',
                  'Technology maturity assessment',
                  'Emerging technology identification',
                  'Patent landscape report'
                ].map((goal) => (
                  <div key={goal} className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id={goal}
                      checked={formData.analysis_scope.research_goals.includes(goal)}
                      onChange={() => toggleResearchGoal(goal)}
                      className="mt-0.5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <Label htmlFor={goal} className="text-sm font-normal cursor-pointer leading-tight">
                      {goal}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Research Requirements */}
            <div className="space-y-2">
              <Label htmlFor="research_requirements">
                Detailed Research Requirements
              </Label>
              <Textarea
                id="research_requirements"
                value={formData.analysis_scope.research_requirements}
                onChange={(e) => setFormData({
                  ...formData,
                  analysis_scope: { ...formData.analysis_scope, research_requirements: e.target.value }
                })}
                placeholder="Provide detailed requirements for the research goals, specific deliverables, analysis depth, reporting format, key questions to answer, etc."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Describe specific requirements, deliverables, key questions to answer, and any special considerations
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Section 3: Analysis Scope (CONDITIONAL FIELDS) */}
        <div className="space-y-4">
          <div className="pb-2 border-b">
            <h3 className="text-base font-semibold">Analysis Scope</h3>
            {selectedGoals.length > 0 && (
              <div className="text-sm text-muted-foreground mt-1">
                Showing fields for: {selectedGoals.map(g => <Badge key={g} variant="secondary" className="ml-1">{g}</Badge>)}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Common Fields - Always Shown */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords & Search Terms</Label>
                <Textarea
                  id="keywords"
                  value={formData.analysis_scope.keywords}
                  onChange={(e) => setFormData({
                    ...formData,
                    analysis_scope: { ...formData.analysis_scope, keywords: e.target.value }
                  })}
                  placeholder="artificial intelligence, machine learning, neural networks (comma-separated)"
                  rows={2}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Enter comma-separated keywords for patent search</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_range_start">Analysis Period Start</Label>
                  <Input
                    id="date_range_start"
                    type="date"
                    value={formData.analysis_scope.date_range_start}
                    onChange={(e) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, date_range_start: e.target.value }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_range_end">Analysis Period End</Label>
                  <Input
                    id="date_range_end"
                    type="date"
                    value={formData.analysis_scope.date_range_end}
                    onChange={(e) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, date_range_end: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Conditional Fields Based on Research Goals */}

            {/* Market Opportunity Assessment Fields */}
            {hasGoal('Market opportunity assessment') && (
              <div className="p-4 border border-cyan-200 rounded-lg bg-cyan-50/50 space-y-4">
                <h4 className="font-medium text-sm text-cyan-900">Market Opportunity Assessment Parameters</h4>

                <div className="space-y-2">
                  <Label htmlFor="key_market_players">Key Market Players</Label>
                  <Textarea
                    id="key_market_players"
                    value={formData.analysis_scope.key_market_players}
                    onChange={(e) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, key_market_players: e.target.value }
                    })}
                    placeholder="List key companies or market players (comma-separated)"
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technology_adoption_timeline">Technology Adoption Timeline</Label>
                  <Input
                    id="technology_adoption_timeline"
                    value={formData.analysis_scope.technology_adoption_timeline}
                    onChange={(e) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, technology_adoption_timeline: e.target.value }
                    })}
                    placeholder="e.g., 2020-2025"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Analysis Requirements</Label>
                  <div className="space-y-2">
                    {[
                      { field: 'market_size_required', label: 'Market Size Information Required' },
                      { field: 'competitor_market_share', label: 'Competitor Market Share Analysis' },
                      { field: 'market_entry_barriers', label: 'Market Entry Barriers Assessment' }
                    ].map(({ field, label }) => (
                      <div key={field} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={field}
                          checked={(formData.analysis_scope as any)[field]}
                          onChange={(e) => setFormData({
                            ...formData,
                            analysis_scope: { ...formData.analysis_scope, [field]: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <Label htmlFor={field} className="text-sm font-normal cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Competitive Landscape Mapping Fields */}
            {hasGoal('Competitive landscape mapping') && (
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50/50 space-y-4">
                <h4 className="font-medium text-sm text-blue-900">Competitive Landscape Mapping Parameters</h4>

                <div className="space-y-2">
                  <Label htmlFor="competitor_companies">Competitor Companies/Assignees</Label>
                  <Textarea
                    id="competitor_companies"
                    value={formData.analysis_scope.competitor_companies}
                    onChange={(e) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, competitor_companies: e.target.value }
                    })}
                    placeholder="Google, Microsoft, IBM, Tesla (comma-separated)"
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Competitive Benchmarking Parameters</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Patent Count', 'Patent Quality', 'Technology Coverage', 'Market Position'].map((param) => (
                      <div key={param} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={param}
                          checked={formData.analysis_scope.competitive_benchmarking.includes(param)}
                          onChange={() => toggleArrayField('competitive_benchmarking', param)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor={param} className="text-sm font-normal cursor-pointer">
                          {param}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Additional Analysis</Label>
                  <div className="space-y-2">
                    {[
                      { field: 'key_inventor_identification', label: 'Key Inventor Identification Required' },
                      { field: 'corporate_hierarchy_analysis', label: 'Corporate Hierarchy Analysis' },
                      { field: 'citation_network_analysis', label: 'Citation Network Analysis' }
                    ].map(({ field, label }) => (
                      <div key={field} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={field}
                          checked={(formData.analysis_scope as any)[field]}
                          onChange={(e) => setFormData({
                            ...formData,
                            analysis_scope: { ...formData.analysis_scope, [field]: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor={field} className="text-sm font-normal cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Freedom to Operate Analysis Fields */}
            {hasGoal('Freedom to operate analysis') && (
              <div className="p-4 border border-orange-200 rounded-lg bg-orange-50/50 space-y-4">
                <h4 className="font-medium text-sm text-orange-900">Freedom to Operate Analysis Parameters</h4>

                <div className="space-y-2">
                  <Label htmlFor="product_description">Target Product/Technology Description</Label>
                  <Textarea
                    id="product_description"
                    value={formData.analysis_scope.product_description}
                    onChange={(e) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, product_description: e.target.value }
                    })}
                    placeholder="Describe the product or technology to be analyzed for FTO"
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product_components">Product Components to Analyze</Label>
                  <Textarea
                    id="product_components"
                    value={formData.analysis_scope.product_components}
                    onChange={(e) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, product_components: e.target.value }
                    })}
                    placeholder="List all components or aspects to be analyzed (comma-separated)"
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product_launch_timeline">Product Launch Timeline</Label>
                  <Input
                    id="product_launch_timeline"
                    type="date"
                    value={formData.analysis_scope.product_launch_timeline}
                    onChange={(e) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, product_launch_timeline: e.target.value }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Analysis Options</Label>
                  <div className="space-y-2">
                    {[
                      { field: 'active_patents_only', label: 'Active Patents Only (Exclude Expired/Lapsed)' },
                      { field: 'claim_level_analysis', label: 'Detailed Claim-Level Analysis Required' }
                    ].map(({ field, label }) => (
                      <div key={field} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={field}
                          checked={(formData.analysis_scope as any)[field]}
                          onChange={(e) => setFormData({
                            ...formData,
                            analysis_scope: { ...formData.analysis_scope, [field]: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <Label htmlFor={field} className="text-sm font-normal cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Technology Trend Identification Fields */}
            {hasGoal('Technology trend identification') && (
              <div className="p-4 border border-purple-200 rounded-lg bg-purple-50/50 space-y-4">
                <h4 className="font-medium text-sm text-purple-900">Technology Trend Identification Parameters</h4>

                <div className="space-y-2">
                  <Label htmlFor="technology_classifications">Technology Classifications (IPC/CPC)</Label>
                  <Input
                    id="technology_classifications"
                    value={formData.analysis_scope.technology_classifications}
                    onChange={(e) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, technology_classifications: e.target.value }
                    })}
                    placeholder="G06F, H04L, A61B (comma-separated)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trend_analysis_period_start">Trend Analysis Period Start</Label>
                    <Input
                      id="trend_analysis_period_start"
                      type="date"
                      value={formData.analysis_scope.trend_analysis_period_start}
                      onChange={(e) => setFormData({
                        ...formData,
                        analysis_scope: { ...formData.analysis_scope, trend_analysis_period_start: e.target.value }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trend_analysis_period_end">Trend Analysis Period End</Label>
                    <Input
                      id="trend_analysis_period_end"
                      type="date"
                      value={formData.analysis_scope.trend_analysis_period_end}
                      onChange={(e) => setFormData({
                        ...formData,
                        analysis_scope: { ...formData.analysis_scope, trend_analysis_period_end: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Trend Analysis Types</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { field: 'filing_trend_analysis', label: 'Filing Trend Analysis' },
                      { field: 'citation_trend_analysis', label: 'Citation Trend Analysis' },
                      { field: 'emerging_tech_detection', label: 'Emerging Technology Detection' },
                      { field: 'tech_maturity_assessment', label: 'Technology Maturity Assessment' }
                    ].map(({ field, label }) => (
                      <div key={field} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={field}
                          checked={(formData.analysis_scope as any)[field]}
                          onChange={(e) => setFormData({
                            ...formData,
                            analysis_scope: { ...formData.analysis_scope, [field]: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <Label htmlFor={field} className="text-sm font-normal cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* White Space Discovery Fields */}
            {hasGoal('White space discovery') && (
              <div className="p-4 border border-green-200 rounded-lg bg-green-50/50 space-y-4">
                <h4 className="font-medium text-sm text-green-900">White Space Discovery Parameters</h4>

                <div className="space-y-2">
                  <Label htmlFor="technology_focus_areas">Technology Focus Areas</Label>
                  <Textarea
                    id="technology_focus_areas"
                    value={formData.analysis_scope.technology_focus_areas}
                    onChange={(e) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, technology_focus_areas: e.target.value }
                    })}
                    placeholder="Describe technology areas to analyze for white space opportunities"
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="white_space_classifications">Classification Codes (IPC/CPC)</Label>
                  <Input
                    id="white_space_classifications"
                    value={formData.analysis_scope.white_space_classifications}
                    onChange={(e) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, white_space_classifications: e.target.value }
                    })}
                    placeholder="G06F, H04L, A61B (comma-separated)"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">White Space Analysis Options</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { field: 'crowded_vs_open_analysis', label: 'Crowded vs. Open Areas Analysis' },
                      { field: 'geographic_white_space', label: 'Geographic White Space Analysis' },
                      { field: 'semantic_analysis', label: 'Semantic Analysis Required' },
                      { field: 'heat_map_visualization', label: 'Heat Map Visualization' }
                    ].map(({ field, label }) => (
                      <div key={field} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={field}
                          checked={(formData.analysis_scope as any)[field]}
                          onChange={(e) => setFormData({
                            ...formData,
                            analysis_scope: { ...formData.analysis_scope, [field]: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <Label htmlFor={field} className="text-sm font-normal cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Patent Portfolio Evaluation Fields */}
            {hasGoal('Patent portfolio evaluation') && (
              <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50/50 space-y-4">
                <h4 className="font-medium text-sm text-indigo-900">Patent Portfolio Evaluation Parameters</h4>

                <div className="space-y-2">
                  <Label htmlFor="portfolio_owner">Target Portfolio Owner/Assignee</Label>
                  <Input
                    id="portfolio_owner"
                    value={formData.analysis_scope.portfolio_owner}
                    onChange={(e) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, portfolio_owner: e.target.value }
                    })}
                    placeholder="Company or organization name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolio_size">Portfolio Size Estimation</Label>
                  <Select
                    value={formData.analysis_scope.portfolio_size}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, portfolio_size: value }
                    })}
                  >
                    <SelectTrigger id="portfolio_size">
                      <SelectValue placeholder="Select estimated portfolio size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_50">Under 50 patents</SelectItem>
                      <SelectItem value="50_200">50-200 patents</SelectItem>
                      <SelectItem value="200_500">200-500 patents</SelectItem>
                      <SelectItem value="500_plus">500+ patents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quality Assessment Criteria</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Technical Strength', 'Legal Strength', 'Commercial Value', 'Strategic Importance'].map((criteria) => (
                      <div key={criteria} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={criteria}
                          checked={formData.analysis_scope.quality_assessment_criteria.includes(criteria)}
                          onChange={() => toggleArrayField('quality_assessment_criteria', criteria)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <Label htmlFor={criteria} className="text-sm font-normal cursor-pointer">
                          {criteria}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Additional Analysis</Label>
                  <div className="space-y-2">
                    {[
                      { field: 'geographic_coverage_analysis', label: 'Geographic Coverage Analysis' },
                      { field: 'portfolio_ranking', label: 'Portfolio Ranking (Core/Non-core/Non-aligned)' },
                      { field: 'maintenance_cost_analysis', label: 'Maintenance Cost Analysis' }
                    ].map(({ field, label }) => (
                      <div key={field} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={field}
                          checked={(formData.analysis_scope as any)[field]}
                          onChange={(e) => setFormData({
                            ...formData,
                            analysis_scope: { ...formData.analysis_scope, [field]: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <Label htmlFor={field} className="text-sm font-normal cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Innovation Opportunity Identification Fields */}
            {hasGoal('Innovation opportunity identification') && (
              <div className="p-4 border border-pink-200 rounded-lg bg-pink-50/50 space-y-4">
                <h4 className="font-medium text-sm text-pink-900">Innovation Opportunity Parameters</h4>

                <div className="space-y-2">
                  <Label htmlFor="innovation_tech_domains">Technology Domains of Interest</Label>
                  <Textarea
                    id="innovation_tech_domains"
                    value={formData.analysis_scope.innovation_tech_domains}
                    onChange={(e) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, innovation_tech_domains: e.target.value }
                    })}
                    placeholder="Describe technology domains to explore for innovation opportunities"
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Analysis Types</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { field: 'patent_gap_analysis', label: 'Patent Gap Analysis' },
                      { field: 'unmet_needs_assessment', label: 'Unmet Needs Assessment' },
                      { field: 'cross_industry_opportunities', label: 'Cross-Industry Innovation Opportunities' },
                      { field: 'licensing_opportunity', label: 'Licensing Opportunity Assessment' }
                    ].map(({ field, label }) => (
                      <div key={field} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={field}
                          checked={(formData.analysis_scope as any)[field]}
                          onChange={(e) => setFormData({
                            ...formData,
                            analysis_scope: { ...formData.analysis_scope, [field]: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                        <Label htmlFor={field} className="text-sm font-normal cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* R&D Strategy Planning Fields */}
            {hasGoal('R&D strategy planning') && (
              <div className="p-4 border border-teal-200 rounded-lg bg-teal-50/50 space-y-4">
                <h4 className="font-medium text-sm text-teal-900">R&D Strategy Planning Parameters</h4>

                <div className="space-y-2">
                  <Label htmlFor="rd_focus_areas">Current R&D Focus Areas</Label>
                  <Textarea
                    id="rd_focus_areas"
                    value={formData.analysis_scope.rd_focus_areas}
                    onChange={(e) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, rd_focus_areas: e.target.value }
                    })}
                    placeholder="Describe current R&D focus areas and priorities"
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technology_roadmap_timeline">Technology Roadmap Timeline</Label>
                  <Input
                    id="technology_roadmap_timeline"
                    value={formData.analysis_scope.technology_roadmap_timeline}
                    onChange={(e) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, technology_roadmap_timeline: e.target.value }
                    })}
                    placeholder="e.g., 2025-2030"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Strategic Analysis Components</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { field: 'internal_capability_assessment', label: 'Internal Capability Assessment' },
                      { field: 'ma_target_identification', label: 'M&A Target Identification' },
                      { field: 'technology_acquisition_strategy', label: 'Technology Acquisition Strategy' },
                      { field: 'resource_allocation_recommendations', label: 'Resource Allocation Recommendations' }
                    ].map(({ field, label }) => (
                      <div key={field} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={field}
                          checked={(formData.analysis_scope as any)[field]}
                          onChange={(e) => setFormData({
                            ...formData,
                            analysis_scope: { ...formData.analysis_scope, [field]: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                        <Label htmlFor={field} className="text-sm font-normal cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Technology Maturity Assessment Fields */}
            {hasGoal('Technology maturity assessment') && (
              <div className="p-4 border border-amber-200 rounded-lg bg-amber-50/50 space-y-4">
                <h4 className="font-medium text-sm text-amber-900">Technology Maturity Assessment Parameters</h4>

                <div className="space-y-2">
                  <Label htmlFor="technology_lifecycle_stage">Technology Lifecycle Stage</Label>
                  <Select
                    value={formData.analysis_scope.technology_lifecycle_stage}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, technology_lifecycle_stage: value }
                    })}
                  >
                    <SelectTrigger id="technology_lifecycle_stage">
                      <SelectValue placeholder="Select expected lifecycle stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emerging">Emerging</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="mature">Mature</SelectItem>
                      <SelectItem value="declining">Declining</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Maturity Indicators</Label>
                  <div className="space-y-2">
                    {[
                      { field: 'patent_filing_velocity', label: 'Patent Filing Velocity Analysis' },
                      { field: 'innovation_rate_measurement', label: 'Innovation Rate Measurement' },
                      { field: 'market_adoption_analysis', label: 'Market Adoption Analysis' }
                    ].map(({ field, label }) => (
                      <div key={field} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={field}
                          checked={(formData.analysis_scope as any)[field]}
                          onChange={(e) => setFormData({
                            ...formData,
                            analysis_scope: { ...formData.analysis_scope, [field]: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <Label htmlFor={field} className="text-sm font-normal cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Emerging Technology Identification Fields */}
            {hasGoal('Emerging technology identification') && (
              <div className="p-4 border border-violet-200 rounded-lg bg-violet-50/50 space-y-4">
                <h4 className="font-medium text-sm text-violet-900">Emerging Technology Identification Parameters</h4>

                <div className="space-y-2">
                  <Label htmlFor="tech_domains_to_monitor">Technology Domains to Monitor</Label>
                  <Textarea
                    id="tech_domains_to_monitor"
                    value={formData.analysis_scope.tech_domains_to_monitor}
                    onChange={(e) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, tech_domains_to_monitor: e.target.value }
                    })}
                    placeholder="Describe technology domains to monitor for emerging technologies"
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="time_series_period_start">Time-Series Analysis Start</Label>
                    <Input
                      id="time_series_period_start"
                      type="date"
                      value={formData.analysis_scope.time_series_period_start}
                      onChange={(e) => setFormData({
                        ...formData,
                        analysis_scope: { ...formData.analysis_scope, time_series_period_start: e.target.value }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time_series_period_end">Time-Series Analysis End</Label>
                    <Input
                      id="time_series_period_end"
                      type="date"
                      value={formData.analysis_scope.time_series_period_end}
                      onChange={(e) => setFormData({
                        ...formData,
                        analysis_scope: { ...formData.analysis_scope, time_series_period_end: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Detection Methods</Label>
                  <div className="space-y-2">
                    {[
                      { field: 'patent_surge_detection', label: 'Patent Surge Detection' },
                      { field: 'disruptive_tech_indicators', label: 'Disruptive Technology Indicators' },
                      { field: 'early_stage_patent_analysis', label: 'Early-Stage Patent Analysis' }
                    ].map(({ field, label }) => (
                      <div key={field} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={field}
                          checked={(formData.analysis_scope as any)[field]}
                          onChange={(e) => setFormData({
                            ...formData,
                            analysis_scope: { ...formData.analysis_scope, [field]: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                        <Label htmlFor={field} className="text-sm font-normal cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Patent Landscape Report Fields */}
            {hasGoal('Patent landscape report') && (
              <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 space-y-4">
                <h4 className="font-medium text-sm text-slate-900">Patent Landscape Report Parameters</h4>

                <div className="space-y-2">
                  <Label htmlFor="report_format">Report Format</Label>
                  <Select
                    value={formData.analysis_scope.report_format}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      analysis_scope: { ...formData.analysis_scope, report_format: value }
                    })}
                  >
                    <SelectTrigger id="report_format">
                      <SelectValue placeholder="Select report format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="powerpoint">PowerPoint Presentation</SelectItem>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="dashboard">Interactive Dashboard</SelectItem>
                      <SelectItem value="excel">Excel Workbook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Visualization Requirements</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Heat Maps', 'Network Graphs', 'Trend Charts', 'Geographic Maps'].map((viz) => (
                      <div key={viz} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={viz}
                          checked={formData.analysis_scope.visualization_requirements.includes(viz)}
                          onChange={() => toggleArrayField('visualization_requirements', viz)}
                          className="rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                        />
                        <Label htmlFor={viz} className="text-sm font-normal cursor-pointer">
                          {viz}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Report Components</Label>
                  <div className="space-y-2">
                    {[
                      { field: 'executive_summary_required', label: 'Executive Summary Required' },
                      { field: 'detailed_claim_analysis', label: 'Detailed Claim Analysis' },
                      { field: 'competitive_positioning_charts', label: 'Competitive Positioning Charts' }
                    ].map(({ field, label }) => (
                      <div key={field} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={field}
                          checked={(formData.analysis_scope as any)[field]}
                          onChange={(e) => setFormData({
                            ...formData,
                            analysis_scope: { ...formData.analysis_scope, [field]: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                        />
                        <Label htmlFor={field} className="text-sm font-normal cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Show message when no research goals are selected */}
            {selectedGoals.length === 0 && (
              <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50/50 text-center">
                <p className="text-sm text-muted-foreground">
                  Select one or more research goals above to see relevant analysis parameters
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <DialogFooter className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            <span className="text-red-500">*</span> Required fields
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
                  window.location.reload();
                }
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || !formData.description.trim() || !formData.project_type}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
