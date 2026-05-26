'use client';

import { Badge } from '@/components/ui/badge';
import { Database, Globe, Layers } from 'lucide-react';

export type DataSource = 'odp' | 'lens' | 'both';

interface DataSourceSelectorProps {
  value: DataSource;
  onChange: (source: DataSource) => void;
  /** Whether ODP data is available for current patent. */
  hasOdp?: boolean;
  /** Whether Lens data is available for current patent. */
  hasLens?: boolean;
  className?: string;
}

const OPTIONS: { value: DataSource; label: string; icon: typeof Database; description: string }[] = [
  { value: 'odp', label: 'USPTO ODP', icon: Database, description: 'US prosecution data' },
  { value: 'lens', label: 'Lens.org', icon: Globe, description: 'Global patent data' },
  { value: 'both', label: 'Both', icon: Layers, description: 'Combined view' },
];

export function DataSourceSelector({ value, onChange, hasOdp, hasLens, className }: DataSourceSelectorProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className || ''}`}>
      <span className="text-xs text-muted-foreground mr-1">Source:</span>
      <div className="flex gap-0.5 p-0.5 bg-muted rounded-lg">
        {OPTIONS.map((opt) => {
          const isActive = value === opt.value;
          const Icon = opt.icon;
          const isAvailable =
            opt.value === 'both' ? true :
            opt.value === 'odp' ? hasOdp !== false :
            opt.value === 'lens' ? hasLens !== false : true;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              disabled={!isAvailable}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-all
                ${isActive
                  ? 'bg-background shadow-sm font-medium text-foreground'
                  : isAvailable
                    ? 'text-muted-foreground hover:text-foreground'
                    : 'text-muted-foreground/40 cursor-not-allowed'
                }
              `}
              title={opt.description}
            >
              <Icon className="h-3 w-3" />
              {opt.label}
              {!isAvailable && (
                <Badge variant="outline" className="text-[9px] h-3.5 px-1 ml-0.5">N/A</Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Small inline badge showing data source origin. */
export function SourceBadge({ source }: { source: 'odp' | 'lens' }) {
  return source === 'odp' ? (
    <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-0.5 bg-blue-50 text-blue-700 border-blue-200">
      <Database className="h-2.5 w-2.5" />
      USPTO ODP
    </Badge>
  ) : (
    <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-0.5 bg-green-50 text-green-700 border-green-200">
      <Globe className="h-2.5 w-2.5" />
      Lens.org
    </Badge>
  );
}
