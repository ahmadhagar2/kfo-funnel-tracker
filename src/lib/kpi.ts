import { FunnelEntry, KONTAKT_TYPEN, Werttyp, Standort } from '../types';

export function filterByRange(
  entries: FunnelEntry[],
  from: string,
  to: string
): FunnelEntry[] {
  return entries.filter((e) => e.datum >= from && e.datum <= to);
}

export function filterByStandort(
  entries: FunnelEntry[],
  standort: Standort | 'Alle'
): FunnelEntry[] {
  if (standort === 'Alle') return entries;
  return entries.filter((e) => e.standort === standort);
}

export function sumByType(entries: FunnelEntry[], typ: Werttyp): number {
  return entries
    .filter((e) => e.werttyp === typ)
    .reduce((sum, e) => sum + e.anzahl, 0);
}

export function kontakteSum(entries: FunnelEntry[]): number {
  return entries
    .filter((e) => KONTAKT_TYPEN.includes(e.werttyp))
    .reduce((sum, e) => sum + e.anzahl, 0);
}

export function neuaufnahmenSum(entries: FunnelEntry[]): number {
  return sumByType(entries, 'neuaufnahme');
}

export function planbesprechungenSum(entries: FunnelEntry[]): number {
  return sumByType(entries, 'planbesprechung');
}

export function unterlagenSum(entries: FunnelEntry[]): number {
  return sumByType(entries, 'unterschriebene_unterlagen');
}

export function conversionRate(numerator: number, denominator: number): string {
  if (denominator === 0) return '—';
  return (numerator / denominator * 100).toFixed(1) + '%';
}

export function delta(current: number, previous: number): { value: number; label: string } {
  const diff = current - previous;
  if (diff > 0) return { value: diff, label: `▲ ${diff}` };
  if (diff < 0) return { value: diff, label: `▼ ${Math.abs(diff)}` };
  return { value: 0, label: '—' };
}
