'use client';

import { useState, useEffect } from 'react';
import { Quote, FileText, Plus, Link, ArrowRight, BookOpen, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PatentCitation {
  id: string;
  patent_number: string;
  title: string;
  assignee: string;
  publication_date: string;
  citation_text?: string;
  citation_type: 'prior_art' | 'blocking' | 'complementary' | 'competitive';
  relevance_score: number;
  added_to_session: boolean;
  brainstorming_context?: {
    related_keywords: string[];
    strategy_implications: string[];
    innovation_opportunities: string[];
  };
}

interface PatentCitationManagerProps {
  patents: any[];
  brainstormingData: {
    sessionId: string;
    projectId: string;
  };
  onCitationAdded?: (citation: PatentCitation) => void;
}

export function PatentCitationManager({ 
  patents, 
  brainstormingData,
  onCitationAdded
}: PatentCitationManagerProps) {
  const [citations, setCitations] = useState<PatentCitation[]>([]);
  const [selectedPatent, setSelectedPatent] = useState<any>(null);
  const [citationType, setCitationType] = useState<PatentCitation['citation_type']>('prior_art');
  const [citationText, setCitationText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    // Load existing citations from brainstorming session
    loadExistingCitations();
  }, [brainstormingData.sessionId]);

  const loadExistingCitations = () => {
    // Mock existing citations
    const mockCitations: PatentCitation[] = [
      {
        id: '1',
        patent_number: 'US10123456',
        title: 'Machine Learning Algorithm for Patent Classification',
        assignee: 'Tech Corp',
        publication_date: '2020-05-15',
        citation_text: 'This patent demonstrates prior art in ML-based patent classification, showing similar algorithmic approaches to our innovation.',
        citation_type: 'prior_art',
        relevance_score: 85,
        added_to_session: true,
        brainstorming_context: {
          related_keywords: ['machine learning', 'patent classification'],
          strategy_implications: ['Need to differentiate our approach', 'Consider alternative algorithms'],
          innovation_opportunities: ['Improve classification accuracy', 'Add real-time processing']
        }
      }
    ];
    setCitations(mockCitations);
  };

  const handleAddCitation = () => {
    if (!selectedPatent || !citationText.trim()) return;

    const newCitation: PatentCitation = {
      id: Date.now().toString(),
      patent_number: selectedPatent.patent_number,
      title: selectedPatent.title,
      assignee: selectedPatent.assignee,
      publication_date: selectedPatent.publication_date,
      citation_text: citationText.trim(),
      citation_type: citationType,
      relevance_score: Math.round(Math.random() * 40 + 60), // 60-100
      added_to_session: false,
      brainstorming_context: generateBrainstormingContext(selectedPatent, citationType)
    };

    setCitations(prev => [...prev, newCitation]);
    onCitationAdded?.(newCitation);

    // Reset form
    setSelectedPatent(null);
    setCitationText('');
    setShowAddForm(false);
  };

  const generateBrainstormingContext = (patent: any, type: PatentCitation['citation_type']) => {
    const contexts = {
      prior_art: {
        related_keywords: ['prior art', 'existing solution', 'baseline technology'],
        strategy_implications: ['Differentiation needed', 'Alternative approach required'],
        innovation_opportunities: ['Improvement potential', 'Gap identification']
      },
      blocking: {
        related_keywords: ['blocking patent', 'design around', 'licensing'],
        strategy_implications: ['Patent landscape analysis', 'Freedom to operate review'],
        innovation_opportunities: ['Alternative implementation', 'Licensing negotiation']
      },
      complementary: {
        related_keywords: ['complementary technology', 'integration opportunity', 'synergy'],
        strategy_implications: ['Partnership potential', 'Technology stack enhancement'],
        innovation_opportunities: ['Integration benefits', 'Combined solution value']
      },
      competitive: {
        related_keywords: ['competitive analysis', 'market position', 'differentiation'],
        strategy_implications: ['Competitive positioning', 'Market analysis needed'],
        innovation_opportunities: ['Competitive advantage', 'Market differentiation']
      }
    };

    return contexts[type];
  };

  const addCitationToBrainstorming = (citation: PatentCitation) => {
    setCitations(prev => 
      prev.map(c => 
        c.id === citation.id 
          ? { ...c, added_to_session: true }
          : c
      )
    );
    
    // Here you would make an API call to add the citation to the brainstorming session
    console.log('Adding citation to brainstorming session:', citation);
  };

  const getCitationTypeColor = (type: PatentCitation['citation_type']) => {
    switch (type) {
      case 'prior_art': return 'bg-blue-100 text-blue-700';
      case 'blocking': return 'bg-red-100 text-red-700';
      case 'complementary': return 'bg-green-100 text-green-700';
      case 'competitive': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCitationTypeIcon = (type: PatentCitation['citation_type']) => {
    switch (type) {
      case 'prior_art': return <BookOpen className="h-3 w-3" />;
      case 'blocking': return <FileText className="h-3 w-3" />;
      case 'complementary': return <Link className="h-3 w-3" />;
      case 'competitive': return <Star className="h-3 w-3" />;
      default: return <Quote className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg">
                <Quote className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Patent Citations</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{citations.length} citations</Badge>
                  <Badge variant="outline">
                    {citations.filter(c => c.added_to_session).length} in session
                  </Badge>
                </div>
              </div>
            </div>
            <Button 
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Citation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Citation Form */}
          {showAddForm && (
            <Card className="mb-4 border-dashed">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <Label>Select Patent</Label>
                    <Select onValueChange={(value) => {
                      const patent = patents.find(p => p.id === value);
                      setSelectedPatent(patent);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a patent to cite..." />
                      </SelectTrigger>
                      <SelectContent>
                        {patents.map((patent) => (
                          <SelectItem key={patent.id} value={patent.id}>
                            {patent.patent_number} - {patent.title.slice(0, 50)}...
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Citation Type</Label>
                    <Select value={citationType} onValueChange={(value: any) => setCitationType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prior_art">Prior Art</SelectItem>
                        <SelectItem value="blocking">Blocking Patent</SelectItem>
                        <SelectItem value="complementary">Complementary Technology</SelectItem>
                        <SelectItem value="competitive">Competitive Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Citation Text</Label>
                    <Textarea
                      placeholder="Describe how this patent relates to your brainstorming session..."
                      value={citationText}
                      onChange={(e) => setCitationText(e.target.value)}
                      className="h-20"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAddCitation}
                      disabled={!selectedPatent || !citationText.trim()}
                    >
                      Add Citation
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Citations List */}
          {citations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Quote className="h-12 w-12 mx-auto mb-4" />
              <p>No citations added yet</p>
              <p className="text-sm">Add patents as citations to enhance your brainstorming</p>
            </div>
          ) : (
            <div className="space-y-3">
              {citations.map((citation) => (
                <Card key={citation.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="font-mono text-sm">{citation.patent_number}</span>
                          <Badge className={getCitationTypeColor(citation.citation_type)}>
                            {getCitationTypeIcon(citation.citation_type)}
                            <span className="ml-1 capitalize">{citation.citation_type.replace('_', ' ')}</span>
                          </Badge>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-xs text-muted-foreground">
                              {citation.relevance_score}% relevant
                            </span>
                          </div>
                        </div>
                        <h3 className="font-medium text-sm line-clamp-1 mb-2">
                          {citation.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {citation.assignee} • {new Date(citation.publication_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Citation Text */}
                    <div className="bg-muted/50 rounded p-3 mb-3">
                      <p className="text-sm">{citation.citation_text}</p>
                    </div>

                    {/* Brainstorming Context */}
                    {citation.brainstorming_context && (
                      <div className="grid md:grid-cols-3 gap-3 mb-3 text-xs">
                        <div>
                          <span className="font-medium text-muted-foreground">Keywords:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {citation.brainstorming_context.related_keywords.map((keyword, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Strategy:</span>
                          <ul className="mt-1 space-y-1">
                            {citation.brainstorming_context.strategy_implications.map((implication, index) => (
                              <li key={index} className="flex items-start gap-1">
                                <ArrowRight className="h-2 w-2 mt-1 flex-shrink-0" />
                                {implication}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Opportunities:</span>
                          <ul className="mt-1 space-y-1">
                            {citation.brainstorming_context.innovation_opportunities.map((opportunity, index) => (
                              <li key={index} className="flex items-start gap-1">
                                <ArrowRight className="h-2 w-2 mt-1 flex-shrink-0" />
                                {opportunity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      {citation.added_to_session ? (
                        <Badge variant="secondary" className="text-xs">
                          <Link className="h-3 w-3 mr-1" />
                          Added to Session
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => addCitationToBrainstorming(citation)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add to Session
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <FileText className="h-3 w-3 mr-1" />
                        View Patent
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}