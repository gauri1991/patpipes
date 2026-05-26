'use client';

import { useRouter } from 'next/navigation';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getModuleLinksForProject, ModuleLink } from '../config/projectModuleConfig';

// ── Props ────────────────────────────────────────────────────────────────────

interface ProjectModuleLinksProps {
  projectTypeName: string;
  projectId: string;
  variant: 'compact' | 'full';
  moduleCounts?: Record<string, number>; // optional counts keyed by moduleId
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Render a Lucide icon by its string name (e.g. "Search", "Briefcase").
 * Returns null when the icon cannot be resolved.
 */
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (LucideIcons as any)[name];
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
}

/**
 * Map a Tailwind text-color utility class to its hex value so it can be used
 * in inline style properties (e.g. borderLeftColor).
 */
function getColorHex(colorClass: string): string {
  const colorMap: Record<string, string> = {
    'text-cyan-500': '#06b6d4',
    'text-blue-500': '#3b82f6',
    'text-emerald-500': '#10b981',
    'text-red-500': '#ef4444',
    'text-violet-500': '#8b5cf6',
    'text-amber-500': '#f59e0b',
    'text-indigo-500': '#6366f1',
    'text-teal-500': '#14b8a6',
  };
  return colorMap[colorClass] || '#6b7280';
}

// ── Sub-components ───────────────────────────────────────────────────────────

function CompactView({
  moduleLinks,
}: {
  moduleLinks: ModuleLink[];
}) {
  const router = useRouter();

  if (moduleLinks.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5 flex-wrap">
        {moduleLinks.map((module) => (
          <Tooltip key={module.moduleId}>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(module.route);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-muted/50 hover:bg-muted transition-colors"
                aria-label={`Go to ${module.moduleName}`}
              >
                <DynamicIcon
                  name={module.icon}
                  className={`h-3.5 w-3.5 ${module.color}`}
                />
                <span className="text-muted-foreground">{module.moduleName}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>{module.description}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

function FullView({
  moduleLinks,
  moduleCounts,
}: {
  moduleLinks: ModuleLink[];
  moduleCounts?: Record<string, number>;
}) {
  const router = useRouter();

  if (moduleLinks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No linked modules for this project type.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {moduleLinks.map((module) => (
        <Card
          key={module.moduleId}
          className="border-l-4"
          style={{ borderLeftColor: getColorHex(module.color) }}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <DynamicIcon
                  name={module.icon}
                  className={`h-5 w-5 ${module.color}`}
                />
                {module.moduleName}
              </CardTitle>
              {moduleCounts?.[module.moduleId] !== undefined && (
                <Badge variant="secondary">
                  {moduleCounts[module.moduleId]}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {module.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {module.actions.map((action) => (
                <Button
                  key={action.route}
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(action.route)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function ProjectModuleLinks({
  projectTypeName,
  projectId,
  variant,
  moduleCounts,
}: ProjectModuleLinksProps) {
  const moduleLinks = getModuleLinksForProject(projectTypeName);

  if (variant === 'compact') {
    return <CompactView moduleLinks={moduleLinks} />;
  }

  return <FullView moduleLinks={moduleLinks} moduleCounts={moduleCounts} />;
}
