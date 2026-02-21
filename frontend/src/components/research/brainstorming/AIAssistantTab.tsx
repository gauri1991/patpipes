'use client';

import { useState, useEffect } from 'react';
import { useBrainstorming } from '@/hooks/useBrainstorming';
import {
  Brain,
  Send,
  Sparkles,
  MessageSquare,
  Bot,
  User,
  RefreshCw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Search,
  Tag,
  Target,
  TrendingUp,
  FileText,
  Zap
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: AISuggestion[];
  feedback?: 'positive' | 'negative';
}

interface AISuggestion {
  type: 'keyword' | 'classification' | 'strategy' | 'competitor' | 'search_query';
  title: string;
  description: string;
  confidence: number;
  data?: any;
}

interface AIAssistantTabProps {
  projectId: string;
  sessionId: string | null;
}

export function AIAssistantTab({ projectId, sessionId }: AIAssistantTabProps) {
  const {
    aiInteractions,
    createAIInteraction,
    loading,
    error
  } = useBrainstorming(projectId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Initialize with welcome message and update from API
  useEffect(() => {
    if (sessionId && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'assistant',
        content: 'Hello! I\'m your AI research assistant. I can help you with:\n\n• Generating keyword ideas and variations\n• Suggesting relevant patent classifications\n• Analyzing competitor strategies\n• Recommending search approaches\n• Identifying technology gaps\n\nWhat would you like to explore today?',
        timestamp: new Date(),
        suggestions: [
          {
            type: 'keyword',
            title: 'Generate Keywords',
            description: 'Get AI-powered keyword suggestions for your technology',
            confidence: 0.9
          },
          {
            type: 'classification',
            title: 'Find Classifications',
            description: 'Discover relevant IPC/CPC classifications',
            confidence: 0.85
          },
          {
            type: 'strategy',
            title: 'Search Strategy',
            description: 'Build a comprehensive search strategy',
            confidence: 0.8
          }
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, [sessionId, messages.length]);

  // Load AI interactions from API
  useEffect(() => {
    if (aiInteractions && aiInteractions.length > 0) {
      const apiMessages: ChatMessage[] = aiInteractions.flatMap(interaction => [
        {
          id: `${interaction.id}-user`,
          type: 'user' as const,
          content: interaction.user_prompt,
          timestamp: new Date(interaction.created_at)
        },
        {
          id: `${interaction.id}-ai`,
          type: 'assistant' as const,
          content: interaction.ai_response,
          timestamp: new Date(interaction.created_at),
          feedback: interaction.is_helpful === true ? 'positive' as const : 
                    interaction.is_helpful === false ? 'negative' as const : undefined
        }
      ]);
      
      // Only add API messages if we don't have them already
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMessages = apiMessages.filter(msg => !existingIds.has(msg.id));
        return [...prev, ...newMessages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      });
    }
  }, [aiInteractions]);

  const quickPrompts = [
    {
      icon: Lightbulb,
      text: 'Generate keywords for neural network optimization',
      category: 'Keywords'
    },
    {
      icon: Tag,
      text: 'Find IPC classes for machine learning applications',
      category: 'Classifications'
    },
    {
      icon: Target,
      text: 'Analyze Google\'s AI patent strategy',
      category: 'Competitors'
    },
    {
      icon: Search,
      text: 'Build FTO search strategy for autonomous vehicles',
      category: 'Strategy'
    },
    {
      icon: TrendingUp,
      text: 'Identify white space in quantum computing',
      category: 'Analysis'
    },
    {
      icon: FileText,
      text: 'Extract concepts from this technical document',
      category: 'Text Analysis'
    }
  ];

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !sessionId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    const messageText = currentMessage;
    setMessages([...messages, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    try {
      const result = await createAIInteraction({
        interaction_type: 'question_answer',
        user_prompt: messageText,
        context_data: {
          session_id: sessionId,
          timestamp: new Date().toISOString()
        }
      });

      if (result) {
        const aiMessage: ChatMessage = {
          id: `${result.id}-ai`,
          type: 'assistant',
          content: result.ai_response,
          timestamp: new Date(result.created_at)
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Fallback response if API fails
        const fallbackResponse: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: 'I apologize, but I\'m having trouble processing your request right now. Please try again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fallbackResponse]);
      }
    } catch (error) {
      console.error('AI interaction failed:', error);
      const errorResponse: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = (userInput: string): ChatMessage => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('keyword') || lowerInput.includes('terms')) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Based on your request, here are some keyword suggestions for neural network optimization:\n\n**Core Terms:**\n• Neural network optimization\n• Model compression\n• Pruning algorithm\n• Quantization\n\n**Technical Variations:**\n• Network architecture optimization\n• Deep learning acceleration\n• Inference optimization\n• Model efficiency\n\n**Related Concepts:**\n• Knowledge distillation\n• Sparse neural networks\n• Edge computing optimization',
        timestamp: new Date(),
        suggestions: [
          {
            type: 'keyword',
            title: 'Export Keywords',
            description: 'Add these keywords to your keyword builder',
            confidence: 0.95
          },
          {
            type: 'search_query',
            title: 'Generate Search Query',
            description: 'Create a Boolean search query with these terms',
            confidence: 0.9
          }
        ]
      };
    }

    if (lowerInput.includes('classification') || lowerInput.includes('ipc') || lowerInput.includes('cpc')) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'For machine learning applications, here are the most relevant patent classifications:\n\n**Primary IPC Classes:**\n• G06N 3/04 - Neural network architectures\n• G06N 3/08 - Learning methods\n• G06N 20/00 - Machine learning (CPC)\n\n**Secondary Classes:**\n• G06F 17/16 - Matrix computations\n• G06K 9/62 - Pattern recognition\n• H04L 25/03 - Adaptive systems\n\n**Emerging Areas:**\n• G06N 10/00 - Quantum computing\n• G06N 3/045 - Convolutional neural networks (CPC)',
        timestamp: new Date(),
        suggestions: [
          {
            type: 'classification',
            title: 'Add Classifications',
            description: 'Add these to your classification browser',
            confidence: 0.92
          }
        ]
      };
    }

    if (lowerInput.includes('competitor') || lowerInput.includes('google') || lowerInput.includes('strategy')) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Google\'s AI patent strategy analysis:\n\n**Key Insights:**\n• 25,000+ AI-related patents filed\n• Focus areas: Neural networks, NLP, Computer vision\n• Aggressive filing strategy in emerging areas\n• Strong defensive portfolio in core search technologies\n\n**Patent Trends:**\n• 2,000+ new AI patents annually\n• Heavy investment in transformer architectures\n• Strategic partnerships with academic institutions\n\n**Competitive Threat:**\n• High threat level in ML/AI space\n• Broad patent coverage in foundational technologies',
        timestamp: new Date(),
        suggestions: [
          {
            type: 'competitor',
            title: 'Add to Competitor Analysis',
            description: 'Add Google to your competitor tracking',
            confidence: 0.88
          }
        ]
      };
    }

    // Default response
    return {
      id: Date.now().toString(),
      type: 'assistant',
      content: 'I understand you\'re looking for research assistance. Could you please provide more specific details about:\n\n• What technology area you\'re researching\n• What type of analysis you need (FTO, prior art, competitive intelligence)\n• Any specific companies or technologies of interest\n\nThis will help me provide more targeted and useful suggestions.',
      timestamp: new Date(),
      suggestions: [
        {
          type: 'strategy',
          title: 'Research Strategy Help',
          description: 'Get guidance on research methodology',
          confidence: 0.75
        }
      ]
    };
  };

  const handleQuickPrompt = (prompt: string) => {
    setCurrentMessage(prompt);
  };

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(messages.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleSuggestionClick = (suggestion: AISuggestion) => {
    // Handle different suggestion types
    console.log('Suggestion clicked:', suggestion);
  };

  if (!sessionId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
          <p className="text-muted-foreground">
            Please select or create a brainstorming session to chat with the AI assistant.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800 text-sm">Error loading AI assistant: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-[600px] space-y-4">
      {/* Chat Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">AI Research Assistant</CardTitle>
              <CardDescription className="text-sm">
                Powered by advanced language models - Ask me anything about patent research
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Prompts */}
      <Card>
        <CardContent className="p-4">
          <Label className="text-sm font-medium">Quick Prompts</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {quickPrompts.map((prompt, idx) => {
              const Icon = prompt.icon;
              return (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPrompt(prompt.text)}
                  className="justify-start h-auto p-3 text-left"
                >
                  <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium">{prompt.category}</div>
                    <div className="text-xs text-muted-foreground">{prompt.text}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-3">
                <div className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={message.type === 'user' ? 'bg-blue-100' : 'bg-purple-100'}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 space-y-2 ${message.type === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white ml-auto' 
                        : 'bg-muted'
                    }`}>
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.type === 'assistant' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 p-1"
                            onClick={() => handleCopyMessage(message.content)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-6 p-1 ${message.feedback === 'positive' ? 'text-green-600' : ''}`}
                            onClick={() => handleFeedback(message.id, 'positive')}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-6 p-1 ${message.feedback === 'negative' ? 'text-red-600' : ''}`}
                            onClick={() => handleFeedback(message.id, 'negative')}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="ml-11 space-y-2">
                    <Label className="text-xs text-muted-foreground">Suggested Actions</Label>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="h-auto p-2"
                        >
                          <div className="flex items-center gap-2">
                            {suggestion.type === 'keyword' && <Tag className="h-3 w-3" />}
                            {suggestion.type === 'classification' && <FileText className="h-3 w-3" />}
                            {suggestion.type === 'strategy' && <Target className="h-3 w-3" />}
                            {suggestion.type === 'competitor' && <TrendingUp className="h-3 w-3" />}
                            {suggestion.type === 'search_query' && <Search className="h-3 w-3" />}
                            <div className="text-left">
                              <div className="text-xs font-medium">{suggestion.title}</div>
                              <div className="text-xs text-muted-foreground">{suggestion.description}</div>
                            </div>
                            <Badge variant="secondary" className="text-xs ml-1">
                              {Math.round(suggestion.confidence * 100)}%
                            </Badge>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-purple-100">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask me anything about patent research, keywords, classifications, competitors..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={1}
              className="resize-none min-h-[40px]"
            />
            <Button onClick={handleSendMessage} disabled={!currentMessage.trim() || isTyping || !sessionId}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}