import { FunnelEntry, Werttyp, WERTTYP_LABELS } from '../types';

/** Export schema version – bumped whenever the column set changes. */
export const EXPORT_VERSION = 3;

/** Reporting-Gruppe pro Werttyp (analyse-freundliche Stufen-Bezeichnung). */
const REPORTING_STUFE: Record<Werttyp, string> = {
  online_termin: 'Erstkontakt',
  telefonische_anfrage: 'Erstkontakt',
  sonstiger_kontakt: 'Sonstiges',
  neuaufnahme: 'Neuaufnahme',
  wiedervorstellung: 'Wiedervorstellung',
  planbesprechung: 'Planbesprechung',
  kv_abgegeben: 'HKP/KV abgegeben',
  unterschriebene_unterlagen: 'Unterlagen unterschrieben',
};

/** Sortier-Reihenfolge pro Reporting-Stufe (für Funnel-Visualisierung). */
const FUNNEL_SORT: Record<string, number> = {
  Erstkontakt: 1,
  Neuaufnahme: 2,
  Planbesprechung: 3,
  'HKP/KV abgegeben': 4,
  'Unterlagen unterschrieben': 5,
  Wiedervorstellung: 6,
  Sonstiges: 9,
};

const WD_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/**
 * Vollständige Spaltenreihenfolge.
 * Die ersten 8 Spalten sind unverändert (id … anzahl);
 * alle weiteren Spalten sind ausschließlich hinten angehängt.
 */
export const EXPORT_HEADER: string[] = [
  // --- bestehende Spalten (exakt erhalten, gleiche Reihenfolge) ---
  'id', 'datum', 'uhrzeit', 'standort', 'bereich', 'mitarbeiter', 'werttyp', 'anzahl',
  // --- 1. Label-Spalten ---
  'werttyp_label', 'bereich_label', 'standort_label', 'mitarbeiter_label',
  // --- 2. Reporting-Gruppen ---
  'reporting_stufe', 'funnel_sort',
  // --- 3. Zeitspalten ---
  'datetime_iso', 'jahr', 'monat', 'monat_label', 'kw', 'wochentag', 'wochentag_label',
  // --- 4. Export-Metadaten ---
  'exportiert_am', 'export_version',
  // --- 5. Herkunft (rein additiv, ganz am Ende) ---
  'standort_quelle', 'benutzer_quelle',
];

/** ISO-8601 Kalenderwoche für ein gegebenes Datum (timezone-stabil über UTC). */
function isoWeek(year: number, month: number, day: number): number {
  const d = new Date(Date.UTC(year, month - 1, day));
  const dayNum = d.getUTCDay() || 7; // 1=Mo .. 7=So
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Bereitet alle Export-Zeilen auf (gemeinsam für beide Buttons).
 * `datum` bleibt unverändert YYYY-MM-DD; sämtliche Zeitspalten werden
 * rein additiv aus datum + uhrzeit berechnet.
 */
export function buildExportRows(entries: FunnelEntry[], exportiertAm: string): string[][] {
  return entries.map((e) => {
    const jahr = Number(e.datum.slice(0, 4));
    const monat = Number(e.datum.slice(5, 7));
    const tag = Number(e.datum.slice(8, 10));
    const monatLabel = e.datum.slice(0, 7); // YYYY-MM
    const utc = new Date(Date.UTC(jahr, monat - 1, tag));
    const wochentag = utc.getUTCDay() || 7; // 1=Mo .. 7=So
    const wochentagLabel = WD_LABELS[wochentag - 1];
    const kw = isoWeek(jahr, monat, tag);
    const stufe = REPORTING_STUFE[e.werttyp];

    return [
      // bestehende Spalten – unverändert
      e.id, e.datum, e.uhrzeit, e.standort, e.bereich, e.mitarbeiter, e.werttyp, String(e.anzahl),
      // Label-Spalten
      WERTTYP_LABELS[e.werttyp], e.bereich, e.standort, e.mitarbeiter,
      // Reporting-Gruppen
      stufe, String(FUNNEL_SORT[stufe] ?? 9),
      // Zeitspalten
      e.datum + 'T' + e.uhrzeit, String(jahr), String(monat), monatLabel, String(kw), String(wochentag), wochentagLabel,
      // Export-Metadaten
      exportiertAm, String(EXPORT_VERSION),
      // Herkunft (rein additiv)
      e.standort_quelle ?? 'unbekannt', e.benutzer_quelle ?? 'unbekannt',
    ];
  });
}

/** Quotet ein Feld, falls es Trennzeichen, Komma, Semikolon, Quote oder Zeilenumbruch enthält. */
function csvField(value: string, delimiter: string): string {
  if (
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r') ||
    value.includes(',') ||
    value.includes(';') ||
    value.includes(delimiter)
  ) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

/** Serialisiert Header + Zeilen zu einem CSV-String mit dem gewünschten Trennzeichen. */
export function serializeCsv(header: string[], rows: string[][], delimiter: string): string {
  return [header, ...rows]
    .map((cols) => cols.map((c) => csvField(c, delimiter)).join(delimiter))
    .join('\r\n');
}
