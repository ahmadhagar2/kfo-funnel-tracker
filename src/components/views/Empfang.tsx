import { useState, useRef, useCallback } from 'react';
import { FunnelEntry, Standort, Werttyp, WERTTYP_LABELS, WERTTYP_COLORS, User, KONTAKT_TYPEN } from '../../types';
import { today } from '../../lib/dateUtils';
import { buildExportRows, serializeCsv, EXPORT_HEADER } from '../../lib/csvExport';
import { SavedInfo } from '../../App';

interface Props {
  entries: FunnelEntry[];
  users: User[];
  standort: Standort;
  benutzer: string;
  standortQuelle: string;
  benutzerQuelle: string;
  addEntry: (p: { standort: Standort; bereich: 'Empfang'; mitarbeiter: string; werttyp: Werttyp; standort_quelle?: string; benutzer_quelle?: string }) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  decrementOrRemove: (p: { standort: Standort; bereich: 'Empfang'; mitarbeiter: string; werttyp: Werttyp }) => Promise<void>;
  onSaved: (info: SavedInfo) => void;
  onOpenUserModal: () => void;
  addUser: (name: string) => Promise<void>;
  renameUser: (id: string, name: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const KONTAKT_TILES: { werttyp: Werttyp; hint: string }[] = [
  { werttyp: 'online_termin', hint: 'Online-Buchung' },
  { werttyp: 'telefonische_anfrage', hint: 'Anruf' },
  { werttyp: 'sonstiger_kontakt', hint: 'Walk-in, E-Mail, etc.' },
];
const FUNNEL_ROW1: { werttyp: Werttyp; hint: string }[] = [
  { werttyp: 'neuaufnahme', hint: 'Neuer Patient' },
  { werttyp: 'wiedervorstellung', hint: 'War schon in der Praxis' },
];
const FUNNEL_ROW2: { werttyp: Werttyp; hint: string }[] = [
  { werttyp: 'unterschriebene_unterlagen', hint: 'Vertrag / Unterlagen' },
];
const FUNNEL_ROW3: { werttyp: Werttyp; hint: string }[] = [
  { werttyp: 'kv_abgegeben', hint: 'Retainer / Kostenvoranschlag' },
];

export default function Empfang({ entries, standort, benutzer, standortQuelle, benutzerQuelle, addEntry, removeEntry, decrementOrRemove, onSaved, onOpenUserModal }: Props) {
  const mitarbeiter = benutzer;
  const [flashTile, setFlashTile] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const todayStr = today();
  const todayEntries = entries.filter((e) => e.datum === todayStr);
  const todayCount = (typ: Werttyp) => todayEntries.filter((e) => e.werttyp === typ).reduce((s, e) => s + e.anzahl, 0);
  const kontakteToday = todayEntries.filter((e) => KONTAKT_TYPEN.includes(e.werttyp)).reduce((s, e) => s + e.anzahl, 0);

  const flash = (key: string) => { setFlashTile(key); setTimeout(() => setFlashTile(null), 300); };

  const handleTap = useCallback((werttyp: Werttyp) => {
    if (!mitarbeiter) return;
    flash(werttyp);
    addEntry({ standort, bereich: 'Empfang', mitarbeiter, werttyp, standort_quelle: standortQuelle, benutzer_quelle: benutzerQuelle });
    onSaved({ ereignis: WERTTYP_LABELS[werttyp], standort, bereich: 'Empfang', werttyp });
  }, [standort, mitarbeiter, standortQuelle, benutzerQuelle, addEntry, onSaved]);

  const handleLongPress = useCallback((werttyp: Werttyp) => {
    if (!mitarbeiter) return;
    decrementOrRemove({ standort, bereich: 'Empfang', mitarbeiter, werttyp });
  }, [standort, mitarbeiter, decrementOrRemove]);

  const onPointerDown = (werttyp: Werttyp) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => { isLongPress.current = true; handleLongPress(werttyp); }, 500);
  };
  const onPointerUp = (werttyp: Werttyp) => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    if (!isLongPress.current) handleTap(werttyp);
  };
  const onPointerCancel = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const exportCsv = (mode: 'analyse' | 'excel') => {
    const exportiertAm = new Date().toISOString();
    const rows = buildExportRows(entries, exportiertAm);
    const delimiter = mode === 'excel' ? ';' : ',';
    const content = serializeCsv(EXPORT_HEADER, rows, delimiter);
    // Excel DE: UTF-8 mit BOM, damit Umlaute & Semikolon-Trennung korrekt erkannt werden.
    const payload = mode === 'excel' ? '\uFEFF' + content : content;
    const blob = new Blob([payload], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'funnel_export_' + todayStr + (mode === 'excel' ? '_excel_de' : '_analyse') + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const renderTile = (werttyp: Werttyp, hint: string) => (
    <button
      key={werttyp}
      className={'tap-tile' + (flashTile === werttyp ? ' flash' : '')}
      style={{ backgroundColor: WERTTYP_COLORS[werttyp] }}
      onPointerDown={() => onPointerDown(werttyp)}
      onPointerUp={() => onPointerUp(werttyp)}
      onPointerLeave={onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="tile-label">{WERTTYP_LABELS[werttyp]}</span>
      <span className="tile-count">{todayCount(werttyp)}</span>
      <span className="tile-hint">{hint}</span>
    </button>
  );

  const todayLog = todayEntries.filter((e) =>
    e.bereich === 'Empfang' ||
    KONTAKT_TYPEN.includes(e.werttyp) ||
    e.werttyp === 'neuaufnahme' ||
    e.werttyp === 'wiedervorstellung' ||
    e.werttyp === 'unterschriebene_unterlagen' ||
    e.werttyp === 'kv_abgegeben'
  );

  return (
    <div className="empfang">
      <div className="meta-bar">
        <button className="icon-button" onClick={onOpenUserModal}>Benutzer</button>
        <button className="icon-button" onClick={() => exportCsv('analyse')}>CSV Analyse</button>
        <button className="icon-button" onClick={() => exportCsv('excel')}>CSV Excel DE</button>
      </div>
      <div className="day-summary">
        <div className="summary-card" style={{ borderColor: '#1a6fd4' }}>
          <span className="summary-value">{kontakteToday}</span>
          <span className="summary-label">Neue Kontakte</span>
        </div>
        <div className="summary-card" style={{ borderColor: '#b45309' }}>
          <span className="summary-value">{todayCount('neuaufnahme')}</span>
          <span className="summary-label">Neuaufnahmen</span>
        </div>
        <div className="summary-card" style={{ borderColor: '#c2410c' }}>
          <span className="summary-value">{todayCount('wiedervorstellung')}</span>
          <span className="summary-label">Wiedervorstellungen</span>
        </div>
        <div className="summary-card" style={{ borderColor: '#6d28d9' }}>
          <span className="summary-value">{todayCount('planbesprechung')}</span>
          <span className="summary-label">Planbesprechungen</span>
        </div>
        <div className="summary-card" style={{ borderColor: '#15803d' }}>
          <span className="summary-value">{todayCount('unterschriebene_unterlagen')}</span>
          <span className="summary-label">Unterlagen</span>
        </div>
        <div className="summary-card" style={{ borderColor: '#0891b2' }}>
          <span className="summary-value">{todayCount('kv_abgegeben')}</span>
          <span className="summary-label">KV abgegeben</span>
        </div>
      </div>
      <div className="tile-section">
        <h3>Neue Kontakte</h3>
        <div className="tiles-grid">
          {KONTAKT_TILES.map(({ werttyp, hint }) => renderTile(werttyp, hint))}
        </div>
      </div>
      <div className="tile-section">
        <h3>Weitere Funnel-Stufen</h3>
        <div className="tiles-grid">
          {FUNNEL_ROW1.map(({ werttyp, hint }) => renderTile(werttyp, hint))}
        </div>
        <div className="tiles-grid" style={{ marginTop: '10px' }}>
          {FUNNEL_ROW2.map(({ werttyp, hint }) => renderTile(werttyp, hint))}
        </div>
        <div className="tiles-grid" style={{ marginTop: '10px' }}>
          {FUNNEL_ROW3.map(({ werttyp, hint }) => renderTile(werttyp, hint))}
        </div>
      </div>
      <div className="entry-log">
        <h3>Heutige Eintraege</h3>
        {todayLog.length === 0 && <p className="empty-log">Noch keine Eintraege heute.</p>}
        {todayLog.map((e) => (
          <div key={e.id} className="log-row">
            <span className="log-time">{e.uhrzeit.slice(0, 5)}</span>
            <span className="log-badge" style={{ backgroundColor: WERTTYP_COLORS[e.werttyp] }}>{WERTTYP_LABELS[e.werttyp]}</span>
            <span className="log-meta">{e.standort} - {e.mitarbeiter}</span>
            <button className="log-delete" onClick={() => removeEntry(e.id)}>x</button>
          </div>
        ))}
      </div>
    </div>
  );
}
