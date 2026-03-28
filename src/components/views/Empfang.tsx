import { useState, useRef, useCallback } from 'react';
import {
  FunnelEntry,
  Standort,
  Werttyp,
  WERTTYP_LABELS,
  WERTTYP_COLORS,
  User,
  KONTAKT_TYPEN,
} from '../../types';
import { today } from '../../lib/dateUtils';

interface Props {
  entries: FunnelEntry[];
  users: User[];
  addEntry: (p: {
    standort: Standort;
    bereich: 'Empfang';
    mitarbeiter: string;
    werttyp: Werttyp;
  }) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  decrementOrRemove: (p: {
    standort: Standort;
    bereich: 'Empfang';
    mitarbeiter: string;
    werttyp: Werttyp;
  }) => Promise<void>;
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

const FUNNEL_TILES: { werttyp: Werttyp; hint: string }[] = [
  { werttyp: 'neuaufnahme', hint: 'Neuer Patient aufgenommen' },
  { werttyp: 'unterschriebene_unterlagen', hint: 'Vertrag / Unterlagen' },
];

export default function Empfang({
  entries,
  users,
  addEntry,
  removeEntry,
  decrementOrRemove,
  onOpenUserModal,
}: Props) {
  const [standort, setStandort] = useState<Standort>('Stadttheater');
  const [mitarbeiter, setMitarbeiter] = useState(users[0]?.name || '');
  const [flashTile, setFlashTile] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  // Sync mitarbeiter when users load
  if (!mitarbeiter && users.length > 0) {
    setMitarbeiter(users[0].name);
  }

  const todayEntries = entries.filter((e) => e.datum === today());

  const todayCount = (typ: Werttyp) =>
    todayEntries
      .filter((e) => e.werttyp === typ)
      .reduce((s, e) => s + e.anzahl, 0);

  const kontakteToday = todayEntries
    .filter((e) => KONTAKT_TYPEN.includes(e.werttyp))
    .reduce((s, e) => s + e.anzahl, 0);

  const flash = (key: string) => {
    setFlashTile(key);
    setTimeout(() => setFlashTile(null), 300);
  };

  const handleTap = useCallback(
    (werttyp: Werttyp) => {
      if (!mitarbeiter) return;
      flash(werttyp);
      addEntry({ standort, bereich: 'Empfang', mitarbeiter, werttyp });
    },
    [standort, mitarbeiter, addEntry]
  );

  const handleLongPress = useCallback(
    (werttyp: Werttyp) => {
      if (!mitarbeiter) return;
      decrementOrRemove({ standort, bereich: 'Empfang', mitarbeiter, werttyp });
    },
    [standort, mitarbeiter, decrementOrRemove]
  );

  const onPointerDown = (werttyp: Werttyp) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      handleLongPress(werttyp);
    }, 500);
  };

  const onPointerUp = (werttyp: Werttyp) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!isLongPress.current) {
      handleTap(werttyp);
    }
  };

  const onPointerCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const exportCsv = () => {
    const header = 'id,datum,uhrzeit,standort,bereich,mitarbeiter,werttyp,anzahl';
    const rows = entries.map(
      (e) =>
        `${e.id},${e.datum},${e.uhrzeit},${e.standort},${e.bereich},${e.mitarbeiter},${e.werttyp},${e.anzahl}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `funnel_export_${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const todayLog = todayEntries.filter(
    (e) => e.bereich === 'Empfang' || KONTAKT_TYPEN.includes(e.werttyp) || e.werttyp === 'neuaufnahme' || e.werttyp === 'unterschriebene_unterlagen'
  );

  return (
    <div className="empfang">
      {/* Meta bar */}
      <div className="meta-bar">
        <label>
          Standort
          <select value={standort} onChange={(e) => setStandort(e.target.value as Standort)}>
            <option value="Stadttheater">Stadttheater</option>
            <option value="Wiehre">Wiehre</option>
          </select>
        </label>
        <label>
          Mitarbeiter
          <select value={mitarbeiter} onChange={(e) => setMitarbeiter(e.target.value)}>
            {users.map((u) => (
              <option key={u.id} value={u.name}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <button className="icon-button" onClick={onOpenUserModal} title="Benutzer verwalten">
          ⚙
        </button>
        <button className="icon-button" onClick={exportCsv} title="CSV Export">
          ↓ CSV
        </button>
      </div>

      {/* Day summary */}
      <div className="day-summary">
        <div className="summary-card" style={{ borderColor: '#1a6fd4' }}>
          <span className="summary-value">{kontakteToday}</span>
          <span className="summary-label">Neue Kontakte</span>
        </div>
        <div className="summary-card" style={{ borderColor: '#b45309' }}>
          <span className="summary-value">{todayCount('neuaufnahme')}</span>
          <span className="summary-label">Neuaufnahmen</span>
        </div>
        <div className="summary-card" style={{ borderColor: '#6d28d9' }}>
          <span className="summary-value">{todayCount('planbesprechung')}</span>
          <span className="summary-label">Planbesprechungen</span>
        </div>
        <div className="summary-card" style={{ borderColor: '#15803d' }}>
          <span className="summary-value">{todayCount('unterschriebene_unterlagen')}</span>
          <span className="summary-label">Unterlagen</span>
        </div>
      </div>

      {/* Tap tiles */}
      <div className="tile-section">
        <h3>Neue Kontakte</h3>
        <div className="tiles-grid">
          {KONTAKT_TILES.map(({ werttyp, hint }) => (
            <button
              key={werttyp}
              className={`tap-tile ${flashTile === werttyp ? 'flash' : ''}`}
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
          ))}
        </div>
      </div>

      <div className="tile-section">
        <h3>Weitere Funnel-Stufen</h3>
        <div className="tiles-grid">
          {FUNNEL_TILES.map(({ werttyp, hint }) => (
            <button
              key={werttyp}
              className={`tap-tile ${flashTile === werttyp ? 'flash' : ''}`}
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
          ))}
        </div>
      </div>

      {/* Today's log */}
      <div className="entry-log">
        <h3>Heutige Einträge</h3>
        {todayLog.length === 0 && <p className="empty-log">Noch keine Einträge heute.</p>}
        {todayLog.map((e) => (
          <div key={e.id} className="log-row">
            <span className="log-time">{e.uhrzeit.slice(0, 5)}</span>
            <span
              className="log-badge"
              style={{ backgroundColor: WERTTYP_COLORS[e.werttyp] }}
            >
              {WERTTYP_LABELS[e.werttyp]}
            </span>
            <span className="log-meta">
              {e.standort} · {e.mitarbeiter}
            </span>
            <button className="log-delete" onClick={() => removeEntry(e.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
