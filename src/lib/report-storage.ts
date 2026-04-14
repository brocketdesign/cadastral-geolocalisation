import type { GeoResult } from '@/types';

export interface GeneratedReport {
  id: string;
  timestamp: number;
  result: GeoResult;
  agencyName?: string;
  clientName?: string;
}

const STORAGE_KEY = 'cadasmap_reports';

export function getGeneratedReports(): GeneratedReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GeneratedReport[];
  } catch {
    return [];
  }
}

export function addGeneratedReport(
  data: Omit<GeneratedReport, 'id' | 'timestamp'>
): GeneratedReport {
  const reports = getGeneratedReports();
  const report: GeneratedReport = {
    ...data,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  reports.unshift(report);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  return report;
}

export function removeGeneratedReport(id: string): void {
  const reports = getGeneratedReports().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function clearGeneratedReports(): void {
  localStorage.removeItem(STORAGE_KEY);
}
