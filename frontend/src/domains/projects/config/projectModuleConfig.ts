/**
 * Project Module Configuration
 *
 * Maps each project type name to its related platform modules,
 * providing routes, icons, colors, and quick-launch actions.
 */

import { ProjectType } from '../types/project.types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ModuleAction {
  label: string;
  route: string;
}

export interface ModuleLink {
  moduleId: string;
  moduleName: string;
  description: string;
  route: string;
  icon: string;
  color: string;
  actions: ModuleAction[];
}

// ── Module Definitions ───────────────────────────────────────────────────────

const MODULE_PRIOR_ART: ModuleLink = {
  moduleId: 'prior-art',
  moduleName: 'Prior Art',
  description: 'Search and analyse prior art references relevant to this project.',
  route: '/dashboard/prior-art',
  icon: 'Search',
  color: 'text-cyan-500',
  actions: [
    { label: 'Search Prior Art', route: '/dashboard/prior-art' },
    { label: 'New Search', route: '/dashboard/prior-art/new' },
  ],
};

const MODULE_PORTFOLIO: ModuleLink = {
  moduleId: 'portfolio',
  moduleName: 'Portfolio',
  description: 'Manage patent portfolios linked to this project.',
  route: '/dashboard/portfolio',
  icon: 'Briefcase',
  color: 'text-blue-500',
  actions: [
    { label: 'View Portfolio', route: '/dashboard/portfolio' },
  ],
};

const MODULE_PATENT_SEARCH: ModuleLink = {
  moduleId: 'patent-search',
  moduleName: 'Patent Search',
  description: 'Search global patent databases for relevant documents.',
  route: '/dashboard/patent-search',
  icon: 'Globe',
  color: 'text-emerald-500',
  actions: [
    { label: 'Search Patents', route: '/dashboard/patent-search' },
  ],
};

const MODULE_INFRINGEMENT: ModuleLink = {
  moduleId: 'infringement',
  moduleName: 'Infringement',
  description: 'Track and analyse potential patent infringement cases.',
  route: '/dashboard/infringement',
  icon: 'AlertTriangle',
  color: 'text-red-500',
  actions: [
    { label: 'View Cases', route: '/dashboard/infringement' },
    { label: 'New Analysis', route: '/dashboard/infringement/new' },
  ],
};

const MODULE_ANALYTICS: ModuleLink = {
  moduleId: 'analytics',
  moduleName: 'Analytics',
  description: 'Visualise patent landscape analytics and trends.',
  route: '/dashboard/analytics',
  icon: 'BarChart3',
  color: 'text-violet-500',
  actions: [
    { label: 'View Analytics', route: '/dashboard/analytics' },
  ],
};

const MODULE_ANALYTICS_FTO: ModuleLink = {
  moduleId: 'analytics-fto',
  moduleName: 'Analytics FTO',
  description: 'Freedom-to-operate analysis and risk assessment.',
  route: '/dashboard/analytics',
  icon: 'BarChart3',
  color: 'text-violet-500',
  actions: [
    { label: 'View Analytics', route: '/dashboard/analytics' },
  ],
};

const MODULE_PROSECUTION: ModuleLink = {
  moduleId: 'prosecution',
  moduleName: 'Prosecution',
  description: 'Manage patent prosecution workflows and application filings.',
  route: '/dashboard/prosecution',
  icon: 'FileEdit',
  color: 'text-amber-500',
  actions: [
    { label: 'View Applications', route: '/dashboard/prosecution' },
  ],
};

const MODULE_WORKFLOWS: ModuleLink = {
  moduleId: 'workflows',
  moduleName: 'Workflows',
  description: 'Automate and track patent-related workflow processes.',
  route: '/dashboard/workflows',
  icon: 'GitBranch',
  color: 'text-indigo-500',
  actions: [
    { label: 'View Workflows', route: '/dashboard/workflows' },
  ],
};

const MODULE_CLASSIFICATIONS: ModuleLink = {
  moduleId: 'classifications',
  moduleName: 'Classifications',
  description: 'Browse and manage patent classification taxonomies.',
  route: '/dashboard/classifications',
  icon: 'Tags',
  color: 'text-teal-500',
  actions: [
    { label: 'Browse Classifications', route: '/dashboard/classifications' },
  ],
};

// ── Project-Type → Modules Mapping ───────────────────────────────────────────

/**
 * Keys are the canonical project type *names* (case-insensitive match).
 */
const PROJECT_TYPE_MODULE_MAP: Record<string, ModuleLink[]> = {
  'prior art search - patentability': [MODULE_PRIOR_ART, MODULE_PORTFOLIO, MODULE_PATENT_SEARCH],
  'prior art search - validity': [MODULE_PRIOR_ART, MODULE_PORTFOLIO, MODULE_PATENT_SEARCH],
  'prior art search - invalidity': [MODULE_PRIOR_ART, MODULE_PORTFOLIO, MODULE_PATENT_SEARCH],
  'freedom to operate search': [MODULE_ANALYTICS_FTO, MODULE_PORTFOLIO, MODULE_PATENT_SEARCH],
  'infringement search': [MODULE_INFRINGEMENT, MODULE_PORTFOLIO],
  'state of art search': [MODULE_PRIOR_ART, MODULE_ANALYTICS, MODULE_CLASSIFICATIONS],
  'patent portfolio analysis': [MODULE_ANALYTICS, MODULE_PORTFOLIO],
  'patent drafting - utility': [MODULE_PROSECUTION, MODULE_WORKFLOWS],
  'patent drafting - provisional': [MODULE_PROSECUTION, MODULE_WORKFLOWS],
  'patent illustration': [MODULE_PROSECUTION],
  'patent proofreading': [MODULE_PROSECUTION],
};

// ── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Return the list of ModuleLink objects for a given project type name.
 * Matching is case-insensitive. Returns an empty array when the type is unknown.
 */
export function getModuleLinksForProject(typeName: string): ModuleLink[] {
  const key = typeName.trim().toLowerCase();
  return PROJECT_TYPE_MODULE_MAP[key] ?? [];
}

/**
 * Resolve a project-type ID to its display name by looking it up in a list of
 * ProjectType objects. Returns an empty string when no match is found.
 */
export function resolveProjectTypeName(
  typeId: string,
  types: ProjectType[],
): string {
  const found = types.find((t) => t.id === typeId);
  return found?.name ?? '';
}
