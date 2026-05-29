/**
 * Confidence check for a live USPTO ODP lookup against a local infringement case.
 *
 * The Overview tab searches ODP *by patent number*, so the returned
 * `applicationMetaData.patentNumber` will always equal the local number — it proves
 * nothing. A patent number can also be shared by unrelated demo/seed data (e.g. the local
 * case is an Apple "System-on-Chip" patent, but US 11,693,802 is really KIOXIA's "NAND
 * SWITCH"). So we gate on **title similarity** and **assignee match** instead.
 */

import type { InfringementCase, PatentBrief } from '@/services/infringementApi';
import type { ODPApplicationSummary } from '@/services/usptoOdpApi';

export interface OdpMatchResult {
  titleSimilarity: number;      // 0..1 token overlap of titles
  assigneeMatch: boolean | null; // null when local assignee is unknown
  confident: boolean;
  reason: string;               // human-readable explanation for the notice
  foundTitle: string;
  foundApplicant: string;
}

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'for', 'with', 'to', 'in', 'on', 'by', 'at',
  'system', 'method', 'apparatus', 'device', 'using', 'based',
]);

function tokens(s: string): string[] {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Jaccard overlap of significant title tokens (0..1). */
function titleSimilarity(a: string, b: string): number {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  A.forEach((t) => { if (B.has(t)) inter += 1; });
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** Normalize a company name for comparison (drop suffixes/punctuation). */
function normName(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(corporation|corp|incorporated|inc|llc|ltd|limited|gmbh|co|company|plc|sa|ag|kk)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function assigneesFrom(patent?: PatentBrief | null): string[] {
  const a = patent?.assignees;
  return Array.isArray(a) ? a.filter(Boolean) : [];
}

function applicantsFrom(odp: ODPApplicationSummary): string[] {
  const md: any = odp.applicationMetaData || {};
  const out: string[] = [];
  if (md.applicantNameText) out.push(md.applicantNameText);
  if (Array.isArray(md.applicantBag)) {
    md.applicantBag.forEach((x: any) => {
      if (typeof x === 'string') out.push(x);
      else if (x?.applicantNameText) out.push(x.applicantNameText);
    });
  }
  return out.filter(Boolean);
}

/** True when any local assignee shares a token with any USPTO applicant. */
function assigneesOverlap(localNames: string[], usptoNames: string[]): boolean {
  const L = localNames.map(normName).filter(Boolean);
  const U = usptoNames.map(normName).filter(Boolean);
  for (const l of L) {
    const lt = l.split(' ').filter(Boolean);
    for (const u of U) {
      if (l === u) return true;
      const ut = new Set(u.split(' ').filter(Boolean));
      if (lt.some((t) => ut.has(t))) return true;
    }
  }
  return false;
}

// A confident match needs either a reasonable title overlap or a matching assignee.
const TITLE_THRESHOLD = 0.4;

export function assessOdpMatch(
  caseData: InfringementCase,
  odp: ODPApplicationSummary,
): OdpMatchResult {
  const foundTitle = odp.applicationMetaData?.inventionTitle || '';
  const usptoApplicants = applicantsFrom(odp);
  const localAssignees = assigneesFrom(caseData.patent_detail);

  const sim = titleSimilarity(caseData.patent_title || '', foundTitle);

  let assigneeMatch: boolean | null = null;
  if (localAssignees.length && usptoApplicants.length) {
    assigneeMatch = assigneesOverlap(localAssignees, usptoApplicants);
  }

  const confident = assigneeMatch === true || sim >= TITLE_THRESHOLD;

  let reason: string;
  if (confident) {
    reason = assigneeMatch === true ? 'Assignee matches USPTO record.' : 'Title matches USPTO record.';
  } else {
    const bits: string[] = [];
    if (foundTitle) bits.push(`“${foundTitle}”`);
    if (usptoApplicants[0]) bits.push(usptoApplicants[0]);
    reason = bits.length
      ? `USPTO returned ${bits.join(' — ')}, which doesn’t match this case.`
      : 'No confidently matching USPTO record.';
  }

  return {
    titleSimilarity: sim,
    assigneeMatch,
    confident,
    reason,
    foundTitle,
    foundApplicant: usptoApplicants[0] || '',
  };
}
