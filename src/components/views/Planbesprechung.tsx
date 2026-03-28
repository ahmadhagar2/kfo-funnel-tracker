import { useState, useMemo } from 'react';
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
}

export default function Planbesprechung({ entries, users, addEntry }: Props) {
  const [standort, setStandort] = useState<Standort>('Stadttheater');
  const [arzt, setArzt] = useState(users[0]?.name || '');
  const [pressing, setPressing] = useState(false);
  const [lastEntry, setLastEntry] = useState<string | null>(null);

  if (!arzt && users.length > 0) {
    setArzt(users[0].name);
  }

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

  const handleClick = async () => {
    if (!arzt) return;
    await addEntry({
      standort,
      bereich: 'Planbesprechungszimmer',
      mitarbeiter: arzt,
      werttyp: 'planbesprechung',
    });
    setLastEntry(new Date().toLocaleTimeString('de-DE', { hour12: false }).slice(0, 5));
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
              <option key={u.id} value={u.name}>
                {u.name}
              </option>
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
        onPointerDown={() => setPressing(true)}
        onPointerUp={() => setPressing(false)}
        onPointerLeave={() => setPressing(false)}
      >
        Planbesprechung durchgeführt
      </button>

      {lastEntry && (
        <p className="pb-last-entry">Letzter Eintrag: {lastEntry} Uhr</p>
      )}
    </div>
  );
}
