/**
 * PresentationViewer Component
 * Fullscreen presentation mode with slide navigation and speaker notes
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  BarChart3,
  FileText,
  Settings,
  Grid3x3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface Slide {
  id: number;
  type: 'title' | 'content' | 'chart' | 'table' | 'image' | 'two_column';
  title: string;
  subtitle?: string;
  content: any;
}

interface PresentationViewerProps {
  presentation: {
    id: string;
    name: string;
    description?: string;
    slides: Slide[];
    speaker_notes?: Record<string, string>;
    theme?: string;
    duration_minutes?: number;
  };
  onClose: () => void;
}

export default function PresentationViewer({ presentation, onClose }: PresentationViewerProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const slides = presentation.slides || [];
  const currentSlide = slides[currentSlideIndex];
  const progress = ((currentSlideIndex + 1) / slides.length) * 100;

  // Theme colors
  const getThemeColors = () => {
    switch (presentation.theme) {
      case 'modern_dark':
        return { bg: 'bg-neutral-900', text: 'text-white', accent: 'bg-cyan-500' };
      case 'professional_blue':
        return { bg: 'bg-blue-50', text: 'text-neutral-900', accent: 'bg-blue-600' };
      case 'clean_white':
        return { bg: 'bg-white', text: 'text-neutral-900', accent: 'bg-neutral-900' };
      case 'tech_gradient':
        return { bg: 'bg-gradient-to-br from-purple-900 to-blue-900', text: 'text-white', accent: 'bg-cyan-400' };
      default:
        return { bg: 'bg-white', text: 'text-neutral-900', accent: 'bg-blue-600' };
    }
  };

  const theme = getThemeColors();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevSlide();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'n' || e.key === 'N') {
        setShowSpeakerNotes(!showSpeakerNotes);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlideIndex, showSpeakerNotes]);

  // Timer for presentation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  }, [currentSlideIndex, slides.length]);

  const goToPrevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  }, [currentSlideIndex]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render slide content based on type
  const renderSlideContent = () => {
    if (!currentSlide) return null;

    switch (currentSlide.type) {
      case 'title':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl font-bold"
            >
              {currentSlide.title}
            </motion.h1>
            {currentSlide.subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl opacity-70"
              >
                {currentSlide.subtitle}
              </motion.p>
            )}
            {currentSlide.content?.presenter && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-xl opacity-60 space-y-2"
              >
                <p>{currentSlide.content.presenter}</p>
                {currentSlide.content.date && <p>{currentSlide.content.date}</p>}
              </motion.div>
            )}
          </div>
        );

      case 'content':
        return (
          <div className="flex flex-col h-full space-y-8 p-12">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl font-bold"
            >
              {currentSlide.title}
            </motion.h2>
            <div className="flex-1 overflow-auto space-y-6">
              {currentSlide.content?.items && (
                <ul className="space-y-4 text-2xl">
                  {currentSlide.content.items.map((item: string, idx: number) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="flex items-start space-x-4"
                    >
                      <span className={`w-2 h-2 ${theme.accent} rounded-full mt-3`} />
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
              {currentSlide.content?.highlights && (
                <ul className="space-y-4 text-2xl">
                  {currentSlide.content.highlights.map((highlight: string, idx: number) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="flex items-start space-x-4"
                    >
                      <span className={`w-2 h-2 ${theme.accent} rounded-full mt-3`} />
                      <span>{highlight}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
              {currentSlide.content?.metrics && (
                <div className="grid grid-cols-2 gap-6 mt-8">
                  {Object.entries(currentSlide.content.metrics).map(([key, value], idx) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                      className={`p-6 ${theme.accent} bg-opacity-10 rounded-lg`}
                    >
                      <p className="text-lg opacity-60 capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-4xl font-bold mt-2">{String(value)}</p>
                    </motion.div>
                  ))}
                </div>
              )}
              {currentSlide.content?.categories && (
                <div className="space-y-4">
                  {currentSlide.content.categories.map((category: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xl font-semibold">{category.name}</p>
                          <p className="text-lg opacity-60">{category.patents} patents ({category.share})</p>
                        </div>
                        <Badge variant={category.trend === 'up' ? 'default' : category.trend === 'down' ? 'destructive' : 'secondary'}>
                          {category.trend}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              {currentSlide.content?.competitors && (
                <div className="space-y-4">
                  {currentSlide.content.competitors.map((competitor: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-2xl font-bold">{competitor.name}</p>
                        <Badge variant={competitor.threat_level === 'Critical' ? 'destructive' : competitor.threat_level === 'High' ? 'default' : 'secondary'}>
                          {competitor.threat_level}
                        </Badge>
                      </div>
                      <p className="text-lg opacity-60">Focus: {competitor.focus_areas.join(', ')}</p>
                      <p className="text-lg opacity-60">Filing Rate: {competitor.filing_rate}</p>
                    </motion.div>
                  ))}
                </div>
              )}
              {currentSlide.content?.opportunities && (
                <div className="space-y-4">
                  {currentSlide.content.opportunities.map((opp: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xl font-bold">{opp.area}</p>
                        <div className="flex gap-2">
                          <Badge variant="default">{opp.potential} Potential</Badge>
                          <Badge variant="secondary">{opp.competition} Competition</Badge>
                        </div>
                      </div>
                      <p className="text-lg opacity-60">Value: {opp.estimated_value}</p>
                      <p className="text-lg">{opp.recommendation}</p>
                    </motion.div>
                  ))}
                </div>
              )}
              {currentSlide.content?.trends && (
                <div className="space-y-4">
                  {currentSlide.content.trends.map((trend: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xl font-bold">{trend.trend}</p>
                        <div className="flex gap-2">
                          <Badge variant="default">{trend.status}</Badge>
                          <Badge variant="secondary">{trend.patents_2024}</Badge>
                        </div>
                      </div>
                      <p className="text-lg opacity-60">Impact: {trend.impact} | Timeline: {trend.timeline}</p>
                    </motion.div>
                  ))}
                </div>
              )}
              {currentSlide.content?.risks && (
                <div className="space-y-4">
                  {currentSlide.content.risks.map((risk: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xl font-bold">{risk.risk}</p>
                        <Badge variant={risk.level === 'High' ? 'destructive' : risk.level === 'Medium' ? 'default' : 'secondary'}>
                          {risk.level} Risk
                        </Badge>
                      </div>
                      <p className="text-lg opacity-60">Areas: {risk.areas.join(', ')}</p>
                      <p className="text-lg">Mitigation: {risk.mitigation}</p>
                    </motion.div>
                  ))}
                </div>
              )}
              {currentSlide.content?.recommendations && (
                <div className="space-y-4">
                  {currentSlide.content.recommendations.map((rec: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={rec.priority === 'Critical' ? 'destructive' : rec.priority === 'High' ? 'default' : 'secondary'}>
                          {rec.priority}
                        </Badge>
                        <span className="text-sm opacity-60">{rec.timeline}</span>
                      </div>
                      <p className="text-xl font-bold mb-2">{rec.action}</p>
                      <p className="text-lg opacity-60">Resources: {rec.resources}</p>
                      <p className="text-lg">Expected: {rec.expected_outcome}</p>
                    </motion.div>
                  ))}
                </div>
              )}
              {currentSlide.content?.timeline && (
                <div className="space-y-4">
                  {currentSlide.content.timeline.map((item: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
                    >
                      <p className="text-2xl font-bold mb-2">{item.quarter}</p>
                      <ul className="space-y-1">
                        {item.actions.map((action: string, i: number) => (
                          <li key={i} className="text-lg opacity-80">• {action}</li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              )}
              {currentSlide.content?.summary && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-3">Summary</h3>
                    <ul className="space-y-2">
                      {currentSlide.content.summary.map((item: string, idx: number) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + idx * 0.1 }}
                          className="text-lg"
                        >
                          • {item}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                  {currentSlide.content?.next_steps && (
                    <div>
                      <h3 className="text-2xl font-bold mb-3">Next Steps</h3>
                      <ul className="space-y-2">
                        {currentSlide.content.next_steps.map((item: string, idx: number) => (
                          <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + idx * 0.1 }}
                            className="text-lg"
                          >
                            • {item}
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'chart':
        return (
          <div className="flex flex-col h-full space-y-8 p-12">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl font-bold"
            >
              {currentSlide.title}
            </motion.h2>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-4xl">
                <div className={`p-8 ${theme.accent} bg-opacity-10 rounded-lg border-2 border-dashed`}>
                  <div className="flex items-center justify-center h-96">
                    <BarChart3 className="w-24 h-24 opacity-30" />
                    <p className="ml-4 text-2xl opacity-60">Chart: {currentSlide.content?.chart_type || 'Visualization'}</p>
                  </div>
                </div>
                {currentSlide.content?.insights && (
                  <div className="mt-6 space-y-2">
                    {currentSlide.content.insights.map((insight: string, idx: number) => (
                      <motion.p
                        key={idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                        className="text-lg opacity-70"
                      >
                        • {insight}
                      </motion.p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-2xl opacity-50">Slide type not implemented</p>
          </div>
        );
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${theme.bg} ${theme.text}`}>
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="text-white">
            <p className="font-semibold">{presentation.name}</p>
            <p className="text-sm opacity-70">
              Slide {currentSlideIndex + 1} of {slides.length}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <span className="text-white text-sm">{formatTime(timeElapsed)}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="h-full pt-20 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlideIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderSlideContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Speaker Notes */}
      {showSpeakerNotes && (
        <div className="absolute bottom-20 left-0 right-0 bg-black bg-opacity-80 text-white p-6 max-h-48 overflow-y-auto">
          <p className="text-sm font-semibold mb-2">Speaker Notes:</p>
          <p className="text-sm opacity-80">
            {presentation.speaker_notes?.[String(currentSlide?.id)] || 'No notes for this slide'}
          </p>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevSlide}
            disabled={currentSlideIndex === 0}
            className="text-white hover:bg-white hover:bg-opacity-20 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex-1">
            <Progress value={progress} className="h-2" />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextSlide}
            disabled={currentSlideIndex === slides.length - 1}
            className="text-white hover:bg-white hover:bg-opacity-20 disabled:opacity-30"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Slide Thumbnails */}
        <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`flex-shrink-0 w-24 h-16 rounded border-2 transition-all ${
                idx === currentSlideIndex
                  ? 'border-cyan-500 opacity-100'
                  : 'border-white border-opacity-30 opacity-50 hover:opacity-75'
              }`}
            >
              <div className="w-full h-full bg-white bg-opacity-10 rounded flex items-center justify-center">
                <span className="text-white text-xs">{idx + 1}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-32 right-4 bg-black bg-opacity-70 text-white p-3 rounded text-xs space-y-1">
        <p className="font-semibold mb-2">Keyboard Shortcuts:</p>
        <p>→ / Space: Next slide</p>
        <p>←: Previous slide</p>
        <p>F: Toggle fullscreen</p>
        <p>N: Toggle speaker notes</p>
        <p>Esc: Exit presentation</p>
      </div>
    </div>
  );
}
