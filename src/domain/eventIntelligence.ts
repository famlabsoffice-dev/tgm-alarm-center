import type { EventOccurrence } from './eventModel';

export interface EventReport {
  id: string;
  occurrenceId: string;
  reporterId: string;
  variant: string | null;
  startUtc: string | null;
  endUtc: string | null;
  reference: string | null;
  submittedAt: string;
}

export interface ReporterReputation {
  reporterId: string;
  correctConfirmations: number;
  consistentReports: number;
  independentConfirmations: number;
}

export interface OccurrenceConsensus {
  occurrenceId: string;
  variant: string | null;
  startUtc: string | null;
  endUtc: string | null;
  confidence: number;
  reportIds: string[];
  disputed: boolean;
}

function normalized(value: string | null): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed.slice(0, 120) : null;
}

function bounded(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function validateEventReport(report: EventReport): string[] {
  const errors: string[] = [];
  if (!/^[a-z0-9][a-z0-9._:-]{1,159}$/.test(report.id)) errors.push('invalid-id');
  if (!report.occurrenceId || report.occurrenceId.length > 240) errors.push('invalid-occurrence');
  if (!report.reporterId || report.reporterId.length > 160) errors.push('invalid-reporter');
  if (report.reference && report.reference.length > 1000) errors.push('invalid-reference');
  if (!Number.isFinite(Date.parse(report.submittedAt))) errors.push('invalid-submitted-at');
  if (report.startUtc && !Number.isFinite(Date.parse(report.startUtc))) errors.push('invalid-start');
  if (report.endUtc && !Number.isFinite(Date.parse(report.endUtc))) errors.push('invalid-end');
  if (report.startUtc && report.endUtc && Date.parse(report.endUtc) <= Date.parse(report.startUtc)) errors.push('invalid-range');
  return errors;
}

export function buildConsensus(
  occurrence: EventOccurrence,
  reports: readonly EventReport[],
  reputations: readonly ReporterReputation[],
): OccurrenceConsensus {
  const relevant = reports.filter((report) => report.occurrenceId === occurrence.id && validateEventReport(report).length === 0);
  const byVariant = new Map<string, { weight: number; reportIds: string[] }>();
  const startVotes = new Map<string, { weight: number; reportIds: string[] }>();
  const endVotes = new Map<string, { weight: number; reportIds: string[] }>();
  const reputation = new Map(reputations.map((item) => [item.reporterId, item]));

  const addVote = (map: Map<string, { weight: number; reportIds: string[] }>, value: string, report: EventReport, weight: number) => {
    const current = map.get(value) ?? { weight: 0, reportIds: [] };
    current.weight += weight;
    current.reportIds.push(report.id);
    map.set(value, current);
  };

  for (const report of relevant) {
    const rep = reputation.get(report.reporterId);
    const weight = bounded(0.25 + Math.min(2, (rep?.correctConfirmations ?? 0) * 0.05) + Math.min(1, (rep?.independentConfirmations ?? 0) * 0.03));
    const variant = normalized(report.variant);
    if (variant) addVote(byVariant, variant.toLowerCase(), report, weight);
    if (report.startUtc) addVote(startVotes, report.startUtc, report, weight);
    if (report.endUtc) addVote(endVotes, report.endUtc, report, weight);
  }

  const winner = (map: Map<string, { weight: number; reportIds: string[] }>) => [...map.entries()].sort((a, b) => b[1].weight - a[1].weight)[0] ?? null;
  const variantWinner = winner(byVariant);
  const startWinner = winner(startVotes);
  const endWinner = winner(endVotes);
  const totalVariantWeight = [...byVariant.values()].reduce((sum, value) => sum + value.weight, 0);
  const topVariantConfidence = totalVariantWeight > 0 && variantWinner ? variantWinner[1].weight / totalVariantWeight : 0;
  const disputed = byVariant.size > 1 && topVariantConfidence < 0.75;
  const reportIds = [...new Set(relevant.map((report) => report.id))];

  return {
    occurrenceId: occurrence.id,
    variant: variantWinner?.[0] ?? occurrence.variant,
    startUtc: startWinner?.[0] ?? occurrence.startUtc,
    endUtc: endWinner?.[0] ?? occurrence.endUtc,
    confidence: bounded(Math.max(occurrence.confidence, topVariantConfidence)),
    reportIds,
    disputed,
  };
}
