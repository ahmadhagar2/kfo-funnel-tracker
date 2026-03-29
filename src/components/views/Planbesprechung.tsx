import { useState, useMemo, useRef } from 'react';
import { FunnelEntry, Standort, User } from '../../types';
import { today, weekRange, monthRange } from '../../lib/dateUtils';
import { filterByRange, planbesprechungenSum } from '../../lib/kpi';

interface Props {
  entries: FunnelEntry[];
  users: User[];
  addEntry: (p: {
    standort: Standort;
    bereich: 'Planbesprechungszimmer';
    mitarbeiter: string;
    werttyp: 'planbesprechung';
  }) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
}

export default function Planbesprechung({ entries, users, addEntry, removeEntry }: Props) {
  const [standort, setStandort] = useState<Standort>('Stadttheater');
  const [arzt, setArzt] = useState(users[0]?.name || '');
  const [pressing, setPressing] = useState(false);
  const [lastEntry, setLastEntry] = useState<string | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  if (!arzt && users.length > 0) setArzt(users[0].name);

  const todayStr = today();
  const [weekFrom, weekTo] = weekRange();
  const [monthFrom, monthTo] = monthRange();

  const pbHeute = useMemo(
    () => planbesprechungenSum(filterByRange(entries, todayStr, todayStr)),
    [entries, todayStr]
  );
  const pbWoche = useMemo(
    () => planbesprechungenSum(filterByRange(entries, weekFrom, weekTo)),
    [entries, weekFrom, weekTo]
  );
  const pbMonat = useMemo(
    () => planbesprechungenSum(filterByRange(entries, monthFrom, monthTo)),
    [entries, monthFrom, monthTo]
  );

  const handlePointerDown = () => {
    setPressing(true);
    didLongPress.current = false;
    holdTimer.current = setTimeout(async () => {
      didLongPress.current = true;
      const todayEntries = entries
        .filter(e => e.datum === todayStr && e.werttyp === 'planbesprechung')
        .sort((a, b) => b.uhrzeit.localeCompare(a.uhrzeit));
      if (todayEntries.length > 0) {
        await removeEntry(todayEntries[0].id);
        setLastEntry('−1 rückgängig');
      }
    }, 500);
  };

  const handlePointerUp = () => {
    setPressing(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };

  const handleClick = async () => {
    if (didLongPress.current) return;
    if (!arzt) return;
    await addEntry({
      standort,
      bereich: 'Planbesprechungszimmer',
      mitarbeiter: arzt,
      werttyp: 'planbesprechung',
    });
    setLastEntry(new Date().toLocaleTimeString('de-DE', { hour12: false }).slice(0, 5) + ' Uhr');
  };

  return (
    <div className="planbesprechung">
      <div className="pb-kpis">
        <div className="pb-kpi">
          <span className="pb-kpi-value">{pbHeute}</span>
          <span className="pb-kpi-label">Heute</span>
        </div>
        <div className="pb-kpi">
          <span className="pb-kpi-value">{pbWoche}</span>
          <span className="pb-kpi-label">Woche</span>
        </div>
        <div className="pb-kpi">
          <span className="pb-kpi-value">{pbMonat}</span>
          <span className="pb-kpi-label">Monat</span>
        </div>
      </div>

      <div className="pb-controls">
        <label>
          Arzt
          <select value={arzt} onChange={(e) => setArzt(e.target.value)}>
            {users.map((u) => (
              <option key={u.id} value={u.name}>{u.name}</option>
            ))}
          </select>
        </label>
        <label>
          Standort
          <select value={standort} onChange={(e) => setStandort(e.target.value as Standort)}>
            <option value="Stadttheater">Stadttheater</option>
            <option value="Wiehre">Wiehre</option>
          </select>
        </label>
      </div>

      <button
        className={`pb-big-button ${pressing ? 'pressing' : ''}`}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        Planbesprechung durchgeführt
        <span style={{ display: 'block', fontSize: '13px', opacity: 0.6, marginTop: '8px', fontWeight: 400 }}>
          Gedrückt halten = −1
        </span>
      </button>

      {lastEntry && (
        <p className="pb-last-entry">Letzter Eintrag: {lastEntry}</p>
      )}
    </div>
  );
}

