'use client';

import { useState, use, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, SplitSquareHorizontal, Focus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface Props {
  params: Promise<{
    draftId: string;
  }>;
}

export default function TestDraftingInterface({ params }: Props) {
  const resolvedParams = use(params);
  const [activeSection] = useState('title');
  const [sectionContent, setSectionContent] = useState<Record<string, string>>({
    title: 'Test Patent Title'
  });
  const [splitScreenMode, setSplitScreenMode] = useState(false);
  const [distractionFreeMode, setDistractionFreeMode] = useState(false);

  const handleContentChange = (value: string) => {
    setSectionContent(prev => ({
      ...prev,
      [activeSection]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar with Enhanced Toolbar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/prosecution/drafting">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="text-sm font-medium">Enhanced Patent Drafting - Test</div>
        </div>

        <div className="flex items-center gap-2">
          {/* Enhanced Editing Tools */}
          <Button 
            variant={splitScreenMode ? "default" : "ghost"} 
            size="sm"
            onClick={() => setSplitScreenMode(!splitScreenMode)}
          >
            <SplitSquareHorizontal className="h-4 w-4" />
          </Button>

          <Button 
            variant={distractionFreeMode ? "default" : "ghost"} 
            size="sm"
            onClick={() => setDistractionFreeMode(!distractionFreeMode)}
          >
            <Focus className="h-4 w-4" />
          </Button>

          <Button size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="bg-white shadow-sm border rounded-lg p-8">
            <h2 className="text-xl font-semibold mb-4">Test Editor</h2>
            
            <div className="mb-4">
              <div className="text-sm text-muted-foreground mb-2">
                Split Screen: {splitScreenMode ? 'ON' : 'OFF'} | 
                Distraction Free: {distractionFreeMode ? 'ON' : 'OFF'}
              </div>
            </div>
            
            <Input
              value={sectionContent[activeSection] || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              className="mb-4"
              placeholder="Enter patent title..."
            />
            
            <Textarea
              value="This is a test content area for the enhanced patent drafting interface."
              className="min-h-96"
              placeholder="Enter content..."
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
}