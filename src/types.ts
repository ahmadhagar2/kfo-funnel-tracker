export type Standort = 'Stadttheater' | 'Wiehre';

export type Bereich = 'Empfang' | 'Planbesprechungszimmer';

export type Werttyp =
  | 'online_termin'
  | 'telefonische_anfrage'
  | 'sonstiger_kontakt'
  | 'neuaufnahme'
  | 'planbesprechung'
  | 'unterschriebene_unterlagen';

export interface FunnelEntry {
  id: string;
  datum: string;
  uhrzeit: string;
  standort: Standort;
  bereich: Bereich;
  mitarbeiter: string;
  werttyp: Werttyp;
  anzahl: number;
  erstellt_am: string;
  geaendert_am: string;
}

export interface User {
  id: string;
  name: string;
}

export const KONTAKT_TYPEN: Werttyp[] = [
  'online_termin',
  'telefonische_anfrage',
  'sonstiger_kontakt',
];

export const WERTTYP_LABELS: Record<Werttyp, string> = {
  online_termin: 'Online-Termin',
  telefonische_anfrage: 'Telefonische Anfrage',
  sonstiger_kontakt: 'Sonstiger Kontakt',
  neuaufnahme: 'Neuaufnahme',
  planbesprechung: 'Planbesprechung',
  unterschriebene_unterlagen: 'Unterlagen unterzeichnet',
};

export const WERTTYP_COLORS: Record<Werttyp, string> = {
  online_termin: '#1a6fd4',
  telefonische_anfrage: '#12507a',
  sonstiger_kontakt: '#0d9488',
  neuaufnahme: '#b45309',
  planbesprechung: '#6d28d9',
  unterschriebene_unterlagen: '#15803d',
};
