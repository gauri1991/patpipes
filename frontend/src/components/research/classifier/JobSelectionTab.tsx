/**
 * Job Selection Tab - Choose and configure patent analysis jobs
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { 
  Search, Clock, Target, ArrowRight, Sparkles, Filter,
  Compass, BarChart3, Zap, Cog, Star, TrendingUp, Users, Shield,
  Plus, Wand2, FileText, Layers, Edit, Copy
} from 'lucide-react';
import { 
  JobTemplate, 
  JobSubmission, 
  JobTemplatesService, 
  JOB_CATEGORIES 
} from '@/services/jobTemplates';

interface JobSelectionTabProps {
  selectedDatasetIds: string[];
  onJobSelected: (submission: JobSubmission) => void;
}

const getIconComponent = (iconName: string) => {
  const icons: Record<string, React.ComponentType<any>> = {
    Network: TrendingUp,
    Users: Users,
    Search: Search,
    TrendingUp: TrendingUp,
    GitBranch: BarChart3,
    GitMerge: BarChart3,
    Shield: Shield,
    Target: Target,
    Handshake: Users,
    Database: BarChart3,
    List: BarChart3,
    BookOpen: BarChart3,
    Compass: Compass,
    BarChart3: BarChart3,
    Zap: Zap,
    Cog: Cog
  };
  return icons[iconName] || BarChart3;
};

export function JobSelectionTab({ 
  selectedDatasetIds, 
  onJobSelected
}: JobSelectionTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<JobTemplate | null>(null);
  const [intensity, setIntensity] = useState<'light' | 'standard' | 'deep'>('standard');
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [isStructuredMode, setIsStructuredMode] = useState(false);
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState<string>('');
  const [isContextStructured, setIsContextStructured] = useState(false);
  const [isDeliverablesStructured, setIsDeliverablesStructured] = useState(false);
  const [analysisDepth, setAnalysisDepth] = useState<'quick' | 'balanced' | 'deep'>('balanced');
  const [editingJob, setEditingJob] = useState<JobTemplate | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showJobView, setShowJobView] = useState(false);

  const allTemplates = JobTemplatesService.getAllTemplates();
  const popularTemplates = JobTemplatesService.getPopularTemplates();

  // LLM Prompt Engineering Templates
  const promptTemplates = {
    'role-based': {
      name: 'Role-Based Prompting',
      description: 'Define a specific expert role for the AI',
      template: `You are a senior patent analyst with 15 years of experience in technology innovation and intellectual property strategy. Your expertise includes competitive intelligence, technology landscape mapping, and freedom-to-operate analysis.

YOUR TASK:
Analyze the provided patent dataset focusing on [TECHNOLOGY AREA]. 

YOUR ANALYSIS SHOULD INCLUDE:
- Key technology trends and innovations
- Major players and their patent strategies  
- Competitive landscape overview
- Potential opportunities and risks

ANALYSIS REQUIREMENTS:
- Use your expertise to provide strategic insights
- Support findings with specific patent examples
- Highlight actionable recommendations
- Maintain objectivity and analytical rigor

Please provide your comprehensive analysis based on your professional expertise.`
    },
    'chain-of-thought': {
      name: 'Chain-of-Thought',
      description: 'Step-by-step reasoning approach',
      template: `Let's analyze the patent dataset systematically, thinking through each step:

STEP 1: Dataset Overview
First, let me examine the overall dataset characteristics:
- Total number of patents
- Time range covered
- Technology areas represented
- Geographic distribution

STEP 2: Technology Classification
Next, I'll categorize the patents by:
- Core technology themes
- Innovation types (incremental vs breakthrough)
- Application domains

STEP 3: Competitive Analysis
Then, I'll analyze the competitive landscape:
- Identify major patent holders
- Map their patent strategies
- Assess portfolio strengths/weaknesses

STEP 4: Trend Analysis
Following that, I'll examine trends:
- Technology evolution patterns
- Filing activity over time
- Emerging innovation areas

STEP 5: Strategic Insights
Finally, I'll synthesize findings into:
- Key opportunities
- Potential threats
- Strategic recommendations

Let me work through each step methodically...`
    },
    'few-shot': {
      name: 'Few-Shot Examples',
      description: 'Provide examples of desired output format',
      template: `I need you to analyze patent datasets and provide insights in a specific format. Here are examples:

EXAMPLE 1: Battery Technology Analysis
Key Findings:
• 347 patents analyzed (2020-2024)
• Top innovators: Tesla (23%), BYD (18%), CATL (15%)
• Emerging trend: Solid-state electrolytes (+120% growth)
• White space opportunity: Fast-charging algorithms

Strategic Recommendations:
1. Focus R&D on solid-state technology
2. Consider partnership with Tesla for charging tech
3. File defensive patents in electrolyte chemistry

EXAMPLE 2: AI Chip Analysis  
Key Findings:
• 892 patents analyzed (2019-2024)
• Top innovators: NVIDIA (31%), Intel (22%), AMD (19%)
• Emerging trend: Neuromorphic architectures (+200% growth)
• White space opportunity: Edge AI optimization

Strategic Recommendations:
1. Accelerate neuromorphic chip development
2. Patent edge computing innovations
3. Monitor NVIDIA's architectural patents

NOW ANALYZE THE PROVIDED DATASET:
Follow the exact same format and depth of analysis as shown in the examples above. Focus on [SPECIFY YOUR TECHNOLOGY AREA] and provide similarly structured insights.`
    },
    'constraint-based': {
      name: 'Constraint-Based',
      description: 'Define specific constraints and requirements',
      template: `ANALYSIS CONSTRAINTS:
- Dataset Scope: Patents from [TIME PERIOD]
- Geographic Focus: [REGIONS - e.g., US, EU, Asia]
- Patent Types: [SPECIFY - e.g., Utility patents only, exclude design]
- Technology Domain: [SPECIFIC AREA]
- Minimum Relevance Score: [e.g., >75%]

REQUIRED OUTPUT FORMAT:
1. Executive Summary (max 200 words)
2. Key Statistics Table
3. Top 10 Patent Holders List  
4. Technology Trend Chart Description
5. Competitive Positioning Matrix
6. Strategic Recommendations (3-5 bullet points)

ANALYSIS DEPTH REQUIREMENTS:
- Quantitative metrics for all claims
- Statistical significance testing where applicable
- Confidence intervals for trend predictions
- Citation analysis for impact assessment

DELIVERABLE SPECIFICATIONS:
- Professional business language
- Data-driven insights only
- Actionable recommendations
- Risk assessment included
- Timeline: [SPECIFY URGENCY]

Please analyze the patent dataset strictly within these constraints and deliver exactly the specified outputs.`
    },
    'question-answer': {
      name: 'Question-Answer Format',
      description: 'Structured Q&A approach',
      template: `Please analyze the patent dataset by answering these specific questions in detail:

COMPETITIVE INTELLIGENCE:
Q1: Who are the top 10 patent holders in this technology area?
Q2: What percentage of total patents does each major player control?
Q3: Which companies are increasing/decreasing their patent activity?
Q4: What are the key differentiators in their patent strategies?

TECHNOLOGY ANALYSIS:
Q5: What are the 5 main technology clusters in the dataset?
Q6: Which specific innovations are gaining the most traction?
Q7: What technical approaches are being abandoned or declining?
Q8: How has the technology evolved over the analyzed time period?

STRATEGIC INSIGHTS:
Q9: Where are the potential white space opportunities?
Q10: What are the strongest patent thickets or blocking positions?
Q11: Which patents pose the highest freedom-to-operate risks?
Q12: What licensing opportunities exist in this landscape?

MARKET IMPLICATIONS:
Q13: Which geographic markets show the strongest patent activity?
Q14: What do filing patterns suggest about commercialization timelines?
Q15: Which technologies are likely to dominate in the next 3-5 years?

Please provide comprehensive, data-backed answers to each question with specific patent examples where relevant.`
    },
    'persona-driven': {
      name: 'Persona-Driven',
      description: 'Analysis from specific stakeholder perspective',
      template: `Analyze this patent dataset from the perspective of a [SELECT PERSONA]:

PERSONA OPTIONS:
□ Startup Founder - Focus on market entry opportunities and IP risks
□ R&D Director - Focus on technology gaps and innovation opportunities  
□ IP Counsel - Focus on freedom-to-operate and litigation risks
□ Investor/VC - Focus on market potential and competitive moats
□ Business Development - Focus on partnership and licensing opportunities

SELECTED PERSONA: [SPECIFY]

As a [PERSONA], I need insights that directly impact my decisions and responsibilities:

PRIMARY CONCERNS:
- [List 3-4 key concerns for this persona]

CRITICAL QUESTIONS:
- [List 5-6 questions this persona would ask]

SUCCESS METRICS:
- [Define what success looks like for this persona]

Please analyze the patent data specifically through this lens, providing insights that are immediately actionable for someone in this role. Include specific recommendations, risk assessments, and opportunity identification relevant to my position and responsibilities.

Focus on practical implications and strategic guidance that I can present to stakeholders or use for decision-making.`
    }
  };

  const handleJobSelect = (template: JobTemplate) => {
    setSelectedJob(template);
    setShowJobView(true);
    setShowJobDetails(false);
    setIsEditMode(false);
    setShowCreateJob(false);
    // Reset custom inputs
    setCustomInputs({});
  };

  const handleEditJob = (template: JobTemplate) => {
    setEditingJob(template);
    setSelectedJob(template);
    setShowJobDetails(false);  // Don't show the old job details panel
    setShowCreateJob(false);   // Make sure create job panel isn't shown
    setShowJobView(false);     // Close the view panel
    setIsEditMode(true);       // Show the unified create/edit panel
    // Reset form states
    setCustomInputs({});
    setIsStructuredMode(false);
    setIsContextStructured(false);
    setIsDeliverablesStructured(false);
  };

  const handleDuplicateJob = (template: JobTemplate) => {
    // Create a copy for editing
    const duplicatedJob = {
      ...template,
      id: `${template.id}-copy-${Date.now()}`,
      name: `${template.name} (Copy)`,
    };
    setEditingJob(duplicatedJob);
    setSelectedJob(duplicatedJob);
    setShowJobDetails(true);
    setIsEditMode(true);
    setCustomInputs({});
  };

  const handleSubmitJob = () => {
    if (!selectedJob) return;

    const submission: JobSubmission = {
      templateId: selectedJob.id,
      datasetIds: selectedDatasetIds,
      projectId: 'current-project', // This should come from props
      intensity,
      inputs: customInputs,
      outputFormats: ['visualization', 'report'] // Default formats
    };

    onJobSelected(submission);
  };

  const getIntensityColor = (level: string) => {
    switch (level) {
      case 'light': return 'bg-green-100 text-green-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'deep': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = JOB_CATEGORIES[category as keyof typeof JOB_CATEGORIES]?.color || 'gray';
    const colorMap = {
      blue: 'border-blue-200 bg-blue-50',
      green: 'border-green-200 bg-green-50',
      purple: 'border-purple-200 bg-purple-50',
      orange: 'border-orange-200 bg-orange-50',
      gray: 'border-gray-200 bg-gray-50'
    };
    return colorMap[colors as keyof typeof colorMap] || colorMap.gray;
  };

  const JobCard = ({ template }: { template: JobTemplate }) => {
    const Icon = getIconComponent(template.icon);
    const isSelected = selectedJob?.id === template.id;
    
    return (
      <Card 
        className={`group transition-all hover:shadow-lg ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        } ${getCategoryColor(template.category)}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div 
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={() => handleJobSelect(template)}
            >
              <div className="p-2 rounded-lg bg-white shadow-sm">
                <Icon className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">{template.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {template.duration}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {popularTemplates.includes(template) && (
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditJob(template);
                  }}
                  title="Edit job"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateJob(template);
                  }}
                  title="Duplicate job"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent onClick={() => handleJobSelect(template)} className="cursor-pointer">
          <p className="text-sm text-muted-foreground mb-3">
            {template.description}
          </p>
          <div className="space-y-2">
            <div>
              <Label className="text-xs font-medium">Outputs</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {template.outputs.slice(0, 2).map((output, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {output}
                  </Badge>
                ))}
                {template.outputs.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.outputs.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Get filtered templates based on search and category
  const getFilteredTemplates = () => {
    let templates = allTemplates;
    
    if (selectedCategory !== 'all') {
      templates = templates.filter(t => t.category === selectedCategory);
    }
    
    if (searchQuery) {
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return templates;
  };

  const filteredTemplates = getFilteredTemplates();

  return (
    <div className="space-y-6">
      {!showJobDetails && !showCreateJob && !isEditMode && !showJobView ? (
        <>
          {/* Header */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Select Analysis Job</h3>
            <p className="text-sm text-muted-foreground">
              Choose from pre-configured jobs or create your own custom analysis
            </p>
          </div>

          {/* Search Bar with Category Dropdown and Create Job Button */}
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search analysis jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(JOB_CATEGORIES).map(([key, category]) => (
                  <SelectItem key={key} value={key}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={() => setShowCreateJob(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Job
            </Button>
          </div>

          {/* Popular Jobs Section (only when no filters) */}
          {!searchQuery && selectedCategory === 'all' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                <h4 className="font-medium">Popular Analysis Jobs</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {popularTemplates.map((template) => (
                  <JobCard key={template.id} template={template} />
                ))}
              </div>
            </div>
          )}

          {/* All Jobs Grid */}
          {(searchQuery || selectedCategory !== 'all') && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">
                  {selectedCategory !== 'all' 
                    ? `${JOB_CATEGORIES[selectedCategory as keyof typeof JOB_CATEGORIES].name} Jobs`
                    : 'Available Jobs'
                  }
                </h4>
                <Badge variant="secondary">
                  {filteredTemplates.length} jobs found
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <JobCard key={template.id} template={template} />
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No jobs found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or category filter
              </p>
              <Button 
                onClick={() => setShowCreateJob(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Custom Job
              </Button>
            </div>
          )}
        </>
      ) : showCreateJob || isEditMode ? (
        /* Custom Job Creation/Edit Panel - Prompt-based Interface */
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCreateJob(false);
                setIsEditMode(false);
                setEditingJob(null);
              }}
            >
              ← Back to Jobs
            </Button>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {isEditMode ? 'Edit Analysis Job' : 'Custom Analysis Instructions'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isEditMode 
                  ? 'Modify this job template to match your specific needs'
                  : 'Tell our AI what you want to analyze in natural language'
                }
              </p>
            </div>
            {isEditMode && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
                <Edit className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">Editing Mode</span>
              </div>
            )}
          </div>

          {/* Main Instruction Panel */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-blue-600" />
                Analysis Instructions
              </CardTitle>
              <CardDescription>
                Describe your analysis needs as if you're instructing a patent analyst
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="job-name">Give your analysis a name</Label>
                <Input 
                  id="job-name"
                  value={isEditMode ? editingJob?.name || '' : ''}
                  onChange={(e) => {
                    if (isEditMode && editingJob) {
                      setEditingJob({ ...editingJob, name: e.target.value });
                    }
                  }}
                  placeholder="e.g., Battery Technology Deep Dive"
                  className="mt-1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="main-prompt">What would you like to analyze?</Label>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Free-form</span>
                    <Switch 
                      checked={isStructuredMode}
                      onCheckedChange={setIsStructuredMode}
                    />
                    <span className="text-sm text-muted-foreground">Structured</span>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                {!isStructuredMode ? (
                  /* Free-form Mode */
                  <>
                    <Textarea 
                      id="main-prompt"
                      value={isEditMode ? editingJob?.description || '' : ''}
                      onChange={(e) => {
                        if (isEditMode && editingJob) {
                          setEditingJob({ ...editingJob, description: e.target.value });
                        }
                      }}
                      placeholder="Example: Analyze all battery-related patents in our dataset from the last 5 years. Focus on solid-state battery innovations, identify key players, emerging trends, and potential white spaces. Compare our portfolio against Tesla, BYD, and CATL. Highlight any freedom-to-operate risks and opportunities for licensing or collaboration."
                      className="mt-1 h-32 font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Be specific about what you want to discover, compare, or understand
                    </p>
                  </>
                ) : (
                  /* Structured Mode - LLM Prompt Templates */
                  <div className="space-y-4 mt-2">
                    <div>
                      <Label htmlFor="prompt-template">Choose Prompt Engineering Structure</Label>
                      <Select value={selectedPromptTemplate} onValueChange={setSelectedPromptTemplate}>
                        <SelectTrigger id="prompt-template" className="mt-1">
                          <SelectValue placeholder="Select a prompt structure..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(promptTemplates).map(([key, template]) => (
                            <SelectItem key={key} value={key}>
                              <div>
                                <div className="font-medium">{template.name}</div>
                                <div className="text-xs text-muted-foreground">{template.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedPromptTemplate && (
                      <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <Label className="text-sm font-medium text-gray-700">
                            {promptTemplates[selectedPromptTemplate as keyof typeof promptTemplates].name} Template:
                          </Label>
                          <p className="text-xs text-gray-600 mt-1">
                            {promptTemplates[selectedPromptTemplate as keyof typeof promptTemplates].description}
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="structured-prompt">Customize the prompt template:</Label>
                          <Textarea
                            id="structured-prompt"
                            value={promptTemplates[selectedPromptTemplate as keyof typeof promptTemplates]?.template || ''}
                            onChange={(e) => {
                              // Allow users to customize the template
                              const updatedTemplates = { ...promptTemplates };
                              if (selectedPromptTemplate) {
                                updatedTemplates[selectedPromptTemplate as keyof typeof promptTemplates] = {
                                  ...updatedTemplates[selectedPromptTemplate as keyof typeof promptTemplates],
                                  template: e.target.value
                                };
                              }
                            }}
                            className="mt-1 h-48 font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            💡 Tip: You can edit the template above. Look for [BRACKETS] to customize with your specific requirements.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg">
                          <div>
                            <Label className="text-xs font-medium text-blue-800">Quick Customizations:</Label>
                            <div className="space-y-2 mt-2">
                              <Input 
                                placeholder="Technology area (e.g., AI, batteries)"
                                className="text-sm h-8"
                              />
                              <Input 
                                placeholder="Time period (e.g., 2020-2024)"
                                className="text-sm h-8"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-blue-800">Template Benefits:</Label>
                            <ul className="text-xs text-blue-700 mt-2 space-y-1">
                              <li>• Proven prompt structure</li>
                              <li>• Higher quality outputs</li>
                              <li>• Consistent results</li>
                              <li>• Industry best practices</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Analysis Depth - Always shown */}
                <div>
                  <Label>Analysis Depth</Label>
                  <RadioGroup value={analysisDepth} onValueChange={(value: any) => setAnalysisDepth(value)} className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="quick" id="quick-main" />
                      <Label htmlFor="quick-main" className="font-normal">Quick Scan (15-20 min) - Key insights and overview</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="balanced" id="balanced-main" />
                      <Label htmlFor="balanced-main" className="font-normal">Balanced Analysis (30-45 min) - Comprehensive insights</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="deep" id="deep-main" />
                      <Label htmlFor="deep-main" className="font-normal">Deep Dive (60+ min) - Exhaustive research and analysis</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Example Prompts - Only shown in free-form mode */}
              {!isStructuredMode && (
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Quick Examples - Click to use</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {[
                      {
                        title: "Competitive Intelligence",
                        prompt: "Analyze how our patent portfolio compares to our top 3 competitors. Identify technology gaps, overlapping areas, and unique innovations."
                      },
                      {
                        title: "Technology Landscape",
                        prompt: "Map the entire technology landscape for [specific technology]. Show evolution over time, key innovators, and emerging sub-technologies."
                      },
                      {
                        title: "Freedom to Operate",
                        prompt: "Assess freedom-to-operate risks for [product/technology]. Identify blocking patents, workaround opportunities, and licensing targets."
                      },
                      {
                        title: "Innovation Trends",
                        prompt: "Identify emerging trends and breakthrough innovations in [field]. Predict future technology directions based on patent filing patterns."
                      }
                    ].map((example, idx) => (
                      <button
                        key={idx}
                        className="text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          const textarea = document.getElementById('main-prompt') as HTMLTextAreaElement;
                          if (textarea) textarea.value = example.prompt;
                        }}
                      >
                        <div className="text-sm font-medium">{example.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{example.prompt}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Context & Constraints */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Context & Focus
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Free-form</span>
                    <Switch 
                      checked={isContextStructured}
                      onCheckedChange={setIsContextStructured}
                      size="sm"
                    />
                    <span className="text-xs text-muted-foreground">Structured</span>
                    <Layers className="h-3 w-3 text-muted-foreground" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isContextStructured ? (
                  /* Free-form Mode */
                  <>
                    <div>
                      <Label htmlFor="context">Additional Context (Optional)</Label>
                      <Textarea 
                        id="context"
                        placeholder="Add any specific context, constraints, or focus areas...
Examples:
- Focus on US and EU markets only
- Prioritize patents filed after 2020
- Exclude design patents
- Consider only granted patents"
                        className="mt-1 h-24 font-mono text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="key-questions">Key Questions to Answer (Optional)</Label>
                      <Textarea 
                        id="key-questions"
                        placeholder="List specific questions you want answered...
Examples:
- Who are the top 10 patent holders?
- What are the main technology clusters?
- Which technologies are converging?
- What are the licensing opportunities?"
                        className="mt-1 h-24 font-mono text-sm"
                      />
                    </div>
                  </>
                ) : (
                  /* Structured Mode */
                  <div className="space-y-4">
                    {/* Constraints Checklist */}
                    <div>
                      <Label className="text-sm font-medium">Analysis Constraints</Label>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <Label className="text-xs font-medium text-gray-600">Geographic Scope</Label>
                          <div className="space-y-2 mt-2">
                            {['United States', 'European Union', 'Asia-Pacific', 'China', 'Global'].map(region => (
                              <div key={region} className="flex items-center space-x-2">
                                <input type="checkbox" id={`region-${region}`} className="rounded text-xs" />
                                <Label htmlFor={`region-${region}`} className="text-xs font-normal">{region}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium text-gray-600">Patent Types</Label>
                          <div className="space-y-2 mt-2">
                            {['Utility Patents', 'Design Patents', 'Provisional Patents', 'Granted Only', 'Published Only'].map(type => (
                              <div key={type} className="flex items-center space-x-2">
                                <input type="checkbox" id={`type-${type}`} className="rounded text-xs" defaultChecked={type === 'Utility Patents'} />
                                <Label htmlFor={`type-${type}`} className="text-xs font-normal">{type}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Time Period */}
                    <div>
                      <Label className="text-sm font-medium">Time Period</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div>
                          <Label htmlFor="date-from" className="text-xs">From</Label>
                          <Input id="date-from" type="date" className="text-xs h-8" />
                        </div>
                        <div>
                          <Label htmlFor="date-to" className="text-xs">To</Label>
                          <Input id="date-to" type="date" className="text-xs h-8" />
                        </div>
                      </div>
                    </div>

                    {/* Predefined Question Categories */}
                    <div>
                      <Label className="text-sm font-medium">Analysis Focus Areas</Label>
                      <div className="grid grid-cols-1 gap-3 mt-3">
                        {[
                          { category: 'Competitive Intelligence', questions: ['Market leaders identification', 'Patent portfolio comparison', 'Strategic positioning analysis'] },
                          { category: 'Technology Trends', questions: ['Emerging technology detection', 'Innovation timeline mapping', 'Technology convergence analysis'] },
                          { category: 'Market Analysis', questions: ['Geographic market distribution', 'Filing activity trends', 'Commercial readiness assessment'] },
                          { category: 'Risk Assessment', questions: ['Freedom-to-operate analysis', 'Patent thicket identification', 'Litigation risk evaluation'] },
                          { category: 'Opportunities', questions: ['White space identification', 'Licensing opportunities', 'Partnership potential assessment'] }
                        ].map(area => (
                          <div key={area.category} className="border rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <input type="checkbox" id={`area-${area.category}`} className="rounded" />
                              <Label htmlFor={`area-${area.category}`} className="text-sm font-medium">{area.category}</Label>
                            </div>
                            <div className="grid grid-cols-1 gap-1 ml-6">
                              {area.questions.map(question => (
                                <div key={question} className="flex items-center space-x-2">
                                  <input type="checkbox" id={`q-${question}`} className="rounded text-xs" />
                                  <Label htmlFor={`q-${question}`} className="text-xs font-normal text-gray-600">{question}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Expected Deliverables
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Free-form</span>
                    <Switch 
                      checked={isDeliverablesStructured}
                      onCheckedChange={setIsDeliverablesStructured}
                      size="sm"
                    />
                    <span className="text-xs text-muted-foreground">Structured</span>
                    <Layers className="h-3 w-3 text-muted-foreground" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isDeliverablesStructured ? (
                  /* Free-form Mode */
                  <div>
                    <Label htmlFor="outputs">What outputs do you need?</Label>
                    <Textarea 
                      id="outputs"
                      placeholder="Describe the deliverables you expect...
Examples:
- Executive summary report (2-3 pages)
- Technology landscape visualization
- Competitor comparison matrix
- Patent clustering map
- Timeline of innovations
- Risk assessment table
- Opportunity identification list"
                      className="mt-1 h-24 font-mono text-sm"
                    />
                  </div>
                ) : (
                  /* Structured Mode */
                  <div className="space-y-4">
                    {/* Report Templates */}
                    <div>
                      <Label className="text-sm font-medium">Report Templates</Label>
                      <div className="grid grid-cols-1 gap-2 mt-3">
                        {[
                          { name: 'Executive Summary', desc: '1-2 pages, high-level insights for leadership' },
                          { name: 'Technical Deep Dive', desc: '5-10 pages, detailed technical analysis' },
                          { name: 'Competitive Intelligence Brief', desc: 'Focus on competitor strategies and positioning' },
                          { name: 'Market Landscape Report', desc: 'Comprehensive market overview and trends' },
                          { name: 'Freedom-to-Operate Assessment', desc: 'IP risk analysis and mitigation strategies' },
                          { name: 'Innovation Roadmap', desc: 'Technology evolution and future directions' }
                        ].map(report => (
                          <div key={report.name} className="flex items-start space-x-2 p-2 border rounded">
                            <input type="checkbox" id={`report-${report.name}`} className="rounded mt-1" />
                            <div>
                              <Label htmlFor={`report-${report.name}`} className="text-sm font-medium">{report.name}</Label>
                              <p className="text-xs text-gray-600">{report.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Visualization Options */}
                    <div>
                      <Label className="text-sm font-medium">Visualizations & Charts</Label>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {[
                          'Technology Landscape Map',
                          'Patent Timeline Chart',
                          'Competitor Position Matrix',
                          'Patent Clustering Diagram',
                          'Innovation Trend Graph',
                          'Geographic Distribution Map',
                          'Citation Network Analysis',
                          'Technology Evolution Tree'
                        ].map(viz => (
                          <div key={viz} className="flex items-center space-x-2">
                            <input type="checkbox" id={`viz-${viz}`} className="rounded text-xs" />
                            <Label htmlFor={`viz-${viz}`} className="text-xs font-normal">{viz}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Data Formats */}
                    <div>
                      <Label className="text-sm font-medium">Output Formats</Label>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {[
                          { format: 'Interactive Dashboard', desc: 'Web-based, searchable interface' },
                          { format: 'Excel Spreadsheet', desc: 'Raw data with pivot tables' },
                          { format: 'PDF Report', desc: 'Professional formatted document' },
                          { format: 'PowerPoint Deck', desc: 'Presentation-ready slides' },
                          { format: 'JSON/CSV Export', desc: 'Raw data for further analysis' },
                          { format: 'Tableau Workbook', desc: 'Advanced visualization platform' }
                        ].map(item => (
                          <div key={item.format} className="flex items-start space-x-2">
                            <input type="checkbox" id={`format-${item.format}`} className="rounded text-xs mt-1" />
                            <div>
                              <Label htmlFor={`format-${item.format}`} className="text-xs font-medium">{item.format}</Label>
                              <p className="text-xs text-gray-500">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              <Clock className="h-4 w-4 inline mr-1" />
              Estimated processing time will be calculated based on your instructions
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateJob(false);
                  setIsEditMode(false);
                  setEditingJob(null);
                }}
              >
                Cancel
              </Button>
              
              {isEditMode && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (editingJob) {
                      alert(`Job "${editingJob.name}" has been saved as a custom template!`);
                      setIsEditMode(false);
                      setEditingJob(null);
                      setShowCreateJob(false);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Target className="h-4 w-4" />
                  Save as Template
                </Button>
              )}
              
              <Button 
                onClick={() => {
                  if (isEditMode && editingJob) {
                    // Handle edited job submission
                    const submission: JobSubmission = {
                      templateId: editingJob.id,
                      datasetIds: selectedDatasetIds,
                      projectId: 'current-project',
                      intensity: analysisDepth,
                      inputs: {},
                      outputFormats: ['visualization', 'report']
                    };
                    onJobSelected(submission);
                  } else {
                    // Handle custom job submission
                    alert('Your custom analysis instructions would be sent to AIMLOps for processing');
                    setShowCreateJob(false);
                  }
                }}
                className="flex items-center gap-2"
              >
                {isEditMode ? 'Run Edited Job' : 'Start Analysis'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : showJobView ? (
        /* Job View Panel - Preview job configuration */
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowJobView(false)}
            >
              ← Back to Jobs
            </Button>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{selectedJob?.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedJob?.description}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedJob && handleEditJob(selectedJob)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Job
              </Button>
            </div>
          </div>

          {/* Single Panel - Structured Job Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Compass className="h-5 w-5 text-blue-600" />
                Job Details & Configuration
              </CardTitle>
              <CardDescription>
                Complete overview of what this analysis job will do
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Basic Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Category:</span>
                        <Badge variant="outline" className="capitalize">
                          {selectedJob?.category}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Duration:</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-sm font-medium">{selectedJob?.duration}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Complexity:</span>
                        <Badge variant="secondary" className="text-xs">
                          {selectedJob?.estimatedTime ? `~${selectedJob.estimatedTime} min` : 'Variable'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Analysis Intensity Options */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Analysis Depth Options</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Light:</span>
                        <span className="font-medium">~{Math.round((selectedJob?.estimatedTime || 30) * 0.6)} mins</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Standard:</span>
                        <span className="font-medium">~{selectedJob?.estimatedTime || 30} mins</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Deep:</span>
                        <span className="font-medium">~{Math.round((selectedJob?.estimatedTime || 30) * 1.4)} mins</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expected Outputs */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Expected Outputs</h4>
                    <div className="space-y-2">
                      {selectedJob?.outputs.map((output, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700 leading-relaxed">{output}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Configuration Details */}
                <div className="space-y-4">
                  {/* Optional Parameters */}
                  {selectedJob?.optionalInputs && selectedJob.optionalInputs.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Configurable Parameters</h4>
                      <div className="space-y-2">
                        {selectedJob.optionalInputs.map((input, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 capitalize">
                              {input.replace('_', ' ')}:
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Optional
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dataset Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Dataset Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Selected datasets:</span>
                        <Badge variant="secondary" className="text-xs">
                          {selectedDatasetIds.length} dataset{selectedDatasetIds.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Processing mode:</span>
                        <span className="text-xs text-gray-500">
                          {selectedDatasetIds.length > 1 ? 'Merged analysis' : 'Single dataset'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Technical Details */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Technical Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">AI Models:</span>
                        <span className="text-xs text-gray-500">Multi-agent system</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Output format:</span>
                        <span className="text-xs text-gray-500">JSON + Visualizations</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Confidence scoring:</span>
                        <span className="text-xs text-gray-500">Included</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Information */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Ready to Run</p>
                    <p className="text-xs text-blue-700 mt-1">
                      This job will analyze your {selectedDatasetIds.length} selected dataset{selectedDatasetIds.length !== 1 ? 's' : ''} and 
                      generate comprehensive insights. Results will be available for download and visualization once complete.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => selectedJob && handleEditJob(selectedJob)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Customize Job
            </Button>
            
            <Button 
              onClick={handleSubmitJob}
              className="flex items-center gap-2"
              size="lg"
            >
              Run This Job
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        /* Job Configuration */
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowJobDetails(false);
                setIsEditMode(false);
                setEditingJob(null);
              }}
            >
              ← Back to Jobs
            </Button>
            <div className="flex-1">
              {isEditMode ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-600 font-medium">Editing Job</span>
                  </div>
                  <Input 
                    value={editingJob?.name || selectedJob?.name || ''}
                    onChange={(e) => {
                      if (editingJob) {
                        setEditingJob({ ...editingJob, name: e.target.value });
                      }
                    }}
                    className="text-lg font-semibold border-blue-200"
                    placeholder="Job name..."
                  />
                  <Textarea 
                    value={editingJob?.description || selectedJob?.description || ''}
                    onChange={(e) => {
                      if (editingJob) {
                        setEditingJob({ ...editingJob, description: e.target.value });
                      }
                    }}
                    className="text-sm text-muted-foreground border-blue-200"
                    placeholder="Job description..."
                    rows={2}
                  />
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold">{selectedJob?.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedJob?.description}</p>
                </div>
              )}
            </div>
            {isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditMode(false);
                  setEditingJob(null);
                }}
              >
                Cancel Edit
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Job Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Analysis Intensity</Label>
                  <Select value={intensity} onValueChange={(value: any) => setIntensity(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Badge className={getIntensityColor('light')}>Light</Badge>
                          <span>Quick overview (~{Math.round((selectedJob?.estimatedTime || 30) * 0.6)} mins)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="standard">
                        <div className="flex items-center gap-2">
                          <Badge className={getIntensityColor('standard')}>Standard</Badge>
                          <span>Comprehensive (~{selectedJob?.estimatedTime} mins)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="deep">
                        <div className="flex items-center gap-2">
                          <Badge className={getIntensityColor('deep')}>Deep</Badge>
                          <span>Exhaustive (~{Math.round((selectedJob?.estimatedTime || 30) * 1.4)} mins)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Optional Inputs */}
                {selectedJob?.optionalInputs && selectedJob.optionalInputs.length > 0 && (
                  <div className="space-y-3">
                    <Label>Optional Parameters</Label>
                    {selectedJob.optionalInputs.map((input) => (
                      <div key={input}>
                        <Label className="text-sm capitalize">
                          {input.replace('_', ' ')}
                        </Label>
                        <Input
                          placeholder={`Enter ${input.replace('_', ' ')}`}
                          value={customInputs[input] || ''}
                          onChange={(e) => setCustomInputs(prev => ({
                            ...prev,
                            [input]: e.target.value
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Expected Outputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">
                    {isEditMode ? 'Edit expected outputs:' : 'This job will generate:'}
                  </Label>
                  {isEditMode ? (
                    <div className="mt-2 space-y-2">
                      {(editingJob?.outputs || selectedJob?.outputs || []).map((output, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={output}
                            onChange={(e) => {
                              if (editingJob) {
                                const newOutputs = [...(editingJob.outputs || [])];
                                newOutputs[index] = e.target.value;
                                setEditingJob({ ...editingJob, outputs: newOutputs });
                              }
                            }}
                            className="text-sm"
                            placeholder="Output description..."
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            onClick={() => {
                              if (editingJob) {
                                const newOutputs = editingJob.outputs.filter((_, i) => i !== index);
                                setEditingJob({ ...editingJob, outputs: newOutputs });
                              }
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (editingJob) {
                            setEditingJob({ 
                              ...editingJob, 
                              outputs: [...(editingJob.outputs || []), 'New output'] 
                            });
                          }
                        }}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Output
                      </Button>
                    </div>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {selectedJob?.outputs.map((output, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          {output}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Estimated Time</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedJob?.duration} depending on dataset size and analysis intensity
                  </p>
                </div>

                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    You have selected {selectedDatasetIds.length} dataset(s) for analysis.
                    Results will be available for download and visualization once complete.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="flex justify-between">
            {isEditMode && (
              <Button
                variant="outline"
                onClick={() => {
                  // Save the edited job as a new template
                  if (editingJob) {
                    alert(`Job "${editingJob.name}" has been saved as a custom template!`);
                    setIsEditMode(false);
                    setEditingJob(null);
                  }
                }}
                className="flex items-center gap-2"
              >
                <Target className="h-4 w-4" />
                Save as Template
              </Button>
            )}
            
            <div className="flex gap-3">
              {isEditMode && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditMode(false);
                    setEditingJob(null);
                  }}
                >
                  Cancel Changes
                </Button>
              )}
              
              <Button 
                onClick={() => {
                  if (isEditMode && editingJob) {
                    // Use the edited job for submission
                    const submission: JobSubmission = {
                      templateId: editingJob.id,
                      datasetIds: selectedDatasetIds,
                      projectId: 'current-project',
                      intensity,
                      inputs: customInputs,
                      outputFormats: ['visualization', 'report']
                    };
                    onJobSelected(submission);
                  } else {
                    handleSubmitJob();
                  }
                }}
                className="flex items-center gap-2"
                size="lg"
              >
                {isEditMode ? 'Run Edited Job' : 'Start Analysis'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}