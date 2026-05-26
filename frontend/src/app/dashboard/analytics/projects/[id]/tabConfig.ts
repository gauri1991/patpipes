export type TabId =
  | 'overview'
  | 'research'
  | 'datasets'
  | 'analysis'
  | 'visualizations'
  | 'reports';

export interface TabDef {
  id: TabId;
  label: string;
}

export interface ProjectTypeTabConfig {
  tabs: TabDef[];
  /** Route keys matching analysis tiles — these are featured in the Analysis tab */
  primaryAnalysis: string[];
}

const ALL_TABS: TabDef[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'research', label: 'Research' },
  { id: 'datasets', label: 'Datasets' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'visualizations', label: 'Visualizations' },
  { id: 'reports', label: 'Reports' },
];

function tabs(...ids: TabId[]): TabDef[] {
  return ids.map((id) => ALL_TABS.find((t) => t.id === id)!);
}

const STANDARD_TABS = tabs('overview', 'research', 'datasets', 'analysis', 'visualizations', 'reports');

export const PROJECT_TYPE_TAB_CONFIG: Record<string, ProjectTypeTabConfig> = {
  landscape_analysis: {
    tabs: STANDARD_TABS,
    primaryAnalysis: ['landscape', 'whitespace', 'trends'],
  },
  competitive_intelligence: {
    tabs: STANDARD_TABS,
    primaryAnalysis: ['landscape', 'whitespace', 'trends'],
  },
  fto_analysis: {
    tabs: STANDARD_TABS,
    primaryAnalysis: ['landscape', 'whitespace', 'trends'],
  },
  white_space_analysis: {
    tabs: STANDARD_TABS,
    primaryAnalysis: ['landscape', 'whitespace', 'trends'],
  },
  portfolio_assessment: {
    tabs: STANDARD_TABS,
    primaryAnalysis: ['landscape', 'whitespace', 'trends'],
  },
  technology_trends: {
    tabs: STANDARD_TABS,
    primaryAnalysis: ['landscape', 'whitespace', 'trends'],
  },
  market_analysis: {
    tabs: STANDARD_TABS,
    primaryAnalysis: ['landscape', 'whitespace', 'trends'],
  },
  investment_analysis: {
    tabs: STANDARD_TABS,
    primaryAnalysis: ['landscape', 'whitespace', 'trends'],
  },
  litigation_analysis: {
    tabs: STANDARD_TABS,
    primaryAnalysis: ['landscape', 'whitespace', 'trends'],
  },
  licensing_analysis: {
    tabs: STANDARD_TABS,
    primaryAnalysis: ['landscape', 'whitespace', 'trends'],
  },
  valuation_analysis: {
    tabs: STANDARD_TABS,
    primaryAnalysis: ['landscape', 'whitespace', 'trends'],
  },
  patent_mapping: {
    tabs: STANDARD_TABS,
    primaryAnalysis: ['landscape', 'whitespace', 'trends'],
  },
};

export function getTabConfig(projectType: string | undefined): ProjectTypeTabConfig {
  if (!projectType || !PROJECT_TYPE_TAB_CONFIG[projectType]) {
    return { tabs: ALL_TABS, primaryAnalysis: ['landscape', 'whitespace', 'trends'] };
  }
  return PROJECT_TYPE_TAB_CONFIG[projectType];
}
