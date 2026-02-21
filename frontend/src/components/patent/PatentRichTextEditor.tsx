/**
 * Patent-Specific Rich Text Editor
 * Advanced editor with patent language support, cross-references, and collaboration features
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Undo,
  Redo,
  Search,
  Replace,
  Eye,
  MessageSquare,
  Clock,
  Users,
  Zap,
  BookOpen,
  Target,
  CheckCircle,
  AlertTriangle,
  Palette,
  Settings
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Patent-specific autocomplete suggestions
const patentLanguage = {
  claims: [
    'A method comprising:',
    'A system comprising:',
    'A device comprising:',
    'An apparatus comprising:',
    'According to one embodiment',
    'In one aspect of the invention',
    'The method of claim',
    'The system of claim',
    'wherein said',
    'configured to',
    'operatively coupled',
    'communicatively connected',
    'in response to',
    'based on',
    'characterized in that',
    'further comprising'
  ],
  description: [
    'Referring now to FIG.',
    'As shown in FIG.',
    'With reference to',
    'In accordance with',
    'As will be appreciated',
    'It should be understood',
    'In one embodiment',
    'According to an aspect',
    'The present invention',
    'Various embodiments',
    'Alternative embodiments',
    'Preferred embodiments'
  ],
  technical: [
    'artificial intelligence',
    'machine learning',
    'neural network',
    'deep learning',
    'algorithm',
    'processor',
    'memory',
    'database',
    'interface',
    'network',
    'communication',
    'transmission',
    'reception',
    'processing unit',
    'control unit',
    'storage device'
  ]
};

// Cross-reference patterns
const crossRefPatterns = {
  figures: /FIG\.\s*(\d+)/gi,
  claims: /claim\s+(\d+)/gi,
  sections: /section\s+(\d+(?:\.\d+)*)/gi,
  references: /\[(\d+)\]/gi
};

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  lineNumber: number;
  resolved: boolean;
  replies: Comment[];
}

interface Version {
  id: string;
  timestamp: string;
  author: string;
  message: string;
  content: string;
  changes: number;
}

interface PatentRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  sectionType: 'title' | 'field' | 'background' | 'summary' | 'description' | 'claims' | 'abstract';
  mode?: 'write' | 'review' | 'proofread';
  readOnly?: boolean;
  showAnalytics?: boolean;
  enableCollaboration?: boolean;
}

export default function PatentRichTextEditor({
  content,
  onChange,
  sectionType,
  mode = 'write',
  readOnly = false,
  showAnalytics = true,
  enableCollaboration = true
}: PatentRichTextEditorProps) {
  const [editorInstance, setEditorInstance] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [currentMode, setCurrentMode] = useState(mode);
  const [showToolbar, setShowToolbar] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(0);
  const [writingTime, setWritingTime] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [currentCollaborators, setCurrentCollaborators] = useState<string[]>(['John Smith', 'Sarah Johnson']);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const keystrokeCountRef = useRef<number>(0);

  // Initialize Monaco Editor with patent-specific configuration
  const handleEditorDidMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
    setEditorInstance(editor);
    editorRef.current = editor;

    // Register patent language for autocomplete
    monacoInstance.languages.registerCompletionItemProvider('plaintext', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        let suggestions: monaco.languages.CompletionItem[] = [];
        
        // Get appropriate suggestions based on section type
        const languageSet = sectionType === 'claims' ? patentLanguage.claims :
                          sectionType === 'description' ? patentLanguage.description :
                          patentLanguage.technical;

        suggestions = languageSet.map((item, index) => ({
          label: item,
          kind: monacoInstance.languages.CompletionItemKind.Text,
          insertText: item,
          range: range,
          sortText: `${index.toString().padStart(2, '0')}${item}`
        }));

        return { suggestions };
      }
    });

    // Add custom actions
    editor.addAction({
      id: 'patent-add-reference',
      label: 'Add Cross Reference',
      keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyR],
      run: () => {
        // Implementation for adding cross-references
        const selection = editor.getSelection();
        if (selection) {
          const selectedText = editor.getModel()?.getValueInRange(selection);
          console.log('Adding reference for:', selectedText);
        }
      }
    });

    editor.addAction({
      id: 'patent-add-comment',
      label: 'Add Comment',
      keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyM],
      run: () => {
        const position = editor.getPosition();
        if (position) {
          addComment(position.lineNumber);
        }
      }
    });

    // Track typing for analytics
    editor.onDidChangeModelContent(() => {
      keystrokeCountRef.current++;
      const currentTime = Date.now();
      const elapsed = (currentTime - startTimeRef.current) / 1000 / 60; // minutes
      setTypingSpeed(keystrokeCountRef.current / Math.max(elapsed, 1));
      setWritingTime(elapsed);
    });

  }, [sectionType]);

  // Update word count when content changes
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
    onChange(content);
  }, [content, onChange]);

  // Add comment functionality
  const addComment = (lineNumber: number) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      author: 'Current User',
      content: '',
      timestamp: new Date().toISOString(),
      lineNumber,
      resolved: false,
      replies: []
    };
    setComments(prev => [...prev, newComment]);
  };

  // Version control
  const saveVersion = (message: string) => {
    const newVersion: Version = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      author: 'Current User',
      message,
      content,
      changes: Math.floor(Math.random() * 50) + 1 // Mock change count
    };
    setVersions(prev => [newVersion, ...prev]);
  };

  // Cross-reference detection and highlighting
  const highlightCrossReferences = useCallback(() => {
    if (!editorInstance) return;

    const model = editorInstance.getModel();
    if (!model) return;

    const decorations: monaco.editor.IModelDeltaDecoration[] = [];
    const text = model.getValue();

    // Find and highlight cross-references
    Object.entries(crossRefPatterns).forEach(([type, pattern]) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const startPos = model.getPositionAt(match.index);
        const endPos = model.getPositionAt(match.index + match[0].length);
        
        decorations.push({
          range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
          options: {
            inlineClassName: 'cross-reference-highlight',
            hoverMessage: { value: `Cross-reference to ${type}: ${match[1]}` }
          }
        });
      }
    });

    editorInstance.deltaDecorations([], decorations);
  }, [editorInstance]);

  useEffect(() => {
    highlightCrossReferences();
  }, [content, highlightCrossReferences]);

  const getModeIcon = (m: string) => {
    switch (m) {
      case 'write': return <Zap className="h-4 w-4" />;
      case 'review': return <Eye className="h-4 w-4" />;
      case 'proofread': return <BookOpen className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getModeColor = (m: string) => {
    switch (m) {
      case 'write': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-green-100 text-green-800';
      case 'proofread': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Advanced Toolbar */}
        {showToolbar && !readOnly && (
          <div className="border-b bg-muted/50 p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Mode Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      {getModeIcon(currentMode)}
                      <Badge className={getModeColor(currentMode)}>
                        {currentMode}
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setCurrentMode('write')}>
                      <Zap className="mr-2 h-4 w-4" />
                      Writing Mode
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrentMode('review')}>
                      <Eye className="mr-2 h-4 w-4" />
                      Review Mode
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrentMode('proofread')}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Proofreading Mode
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Formatting Tools */}
                <div className="flex items-center gap-1 border-r pr-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Bold className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bold (Ctrl+B)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Italic className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Italic (Ctrl+I)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Underline className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Underline (Ctrl+U)</TooltipContent>
                  </Tooltip>
                </div>

                {/* Cross-Reference Tools */}
                <div className="flex items-center gap-1 border-r pr-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 text-xs">
                        FIG.
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Insert Figure Reference</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 text-xs">
                        CLAIM
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Insert Claim Reference</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Target className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reference Manager (Ctrl+R)</TooltipContent>
                  </Tooltip>
                </div>

                {/* Collaboration Tools */}
                {enableCollaboration && (
                  <div className="flex items-center gap-1 border-r pr-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => addComment(1)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Add Comment (Ctrl+M)</TooltipContent>
                    </Tooltip>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                          <Users className="h-4 w-4" />
                          {currentCollaborators.length > 0 && (
                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64">
                        <div className="space-y-2">
                          <h4 className="font-medium">Active Collaborators</h4>
                          {currentCollaborators.map((collaborator, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="h-2 w-2 bg-green-500 rounded-full" />
                              <span className="text-sm">{collaborator}</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={setShowVersions.bind(null, !showVersions)}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Version History</TooltipContent>
                    </Tooltip>
                  </div>
                )}

                {/* Search & Replace */}
                <div className="flex items-center gap-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Search className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <Input 
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Input 
                          placeholder="Replace with..."
                          value={replaceQuery}
                          onChange={(e) => setReplaceQuery(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1">Find</Button>
                          <Button size="sm" variant="outline" className="flex-1">Replace</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Analytics & Status */}
              {showAnalytics && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{wordCount} words</span>
                  <span>{Math.round(typingSpeed)} wpm</span>
                  <span>{Math.round(writingTime)}m</span>
                  {comments.length > 0 && (
                    <Badge variant="outline">
                      {comments.filter(c => !c.resolved).length} comments
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 relative">
          <Editor
            value={content}
            onChange={(value) => onChange(value || '')}
            onMount={handleEditorDidMount}
            language="plaintext"
            theme="vs"
            options={{
              fontSize: sectionType === 'title' ? 16 : 12,
              fontFamily: sectionType === 'title' ? 'Inter, sans-serif' : 'Times, serif',
              lineHeight: 1.6,
              wordWrap: 'on',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'on',
              quickSuggestions: {
                other: true,
                comments: true,
                strings: true
              },
              contextmenu: true,
              folding: sectionType === 'claims',
              renderWhitespace: currentMode === 'proofread' ? 'all' : 'none',
              renderControlCharacters: currentMode === 'proofread',
              rulers: sectionType === 'abstract' ? [150] : []
            }}
          />

          {/* Comments Overlay */}
          {comments.length > 0 && (
            <div className="absolute top-4 right-4 space-y-2">
              {comments.filter(c => !c.resolved).map((comment) => (
                <div key={comment.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-64">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{comment.author}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-4 w-4"
                      onClick={() => setComments(prev => 
                        prev.map(c => c.id === comment.id ? { ...c, resolved: true } : c)
                      )}
                    >
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs">{comment.content || 'Click to add comment...'}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    Line {comment.lineNumber}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Version History Panel */}
        {showVersions && (
          <div className="border-t bg-muted/30 p-4 max-h-48 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Version History</h4>
              <Button size="sm" onClick={() => saveVersion('Manual save')}>
                Save Version
              </Button>
            </div>
            <div className="space-y-2">
              {versions.map((version) => (
                <div key={version.id} className="flex items-center justify-between p-2 bg-background rounded border">
                  <div>
                    <div className="text-sm font-medium">{version.message}</div>
                    <div className="text-xs text-muted-foreground">
                      {version.author} • {new Date(version.timestamp).toLocaleString()} • {version.changes} changes
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .cross-reference-highlight {
          background-color: #e3f2fd;
          border-bottom: 1px solid #2196f3;
          cursor: pointer;
        }
      `}</style>
    </TooltipProvider>
  );
}