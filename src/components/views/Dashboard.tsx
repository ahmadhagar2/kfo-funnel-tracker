import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { FunnelEntry, Standort } from '../../types';
import {
  today,
  weekRange,
  monthRange,
  prevDay,
  prevWeekRange,
  prevMonthRange,
  weekdayIndex,
  WEEKDAY_LABELS,
} from '../../lib/dateUtils';
import {
  filterByRange,
  filterByStandort,
  kontakteSum,
  neuaufnahmenSum,
  planbesprechungenSum,
  unterlagenSum,
  conversionRate,
  delta,
} from '../../lib/kpi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

type Period = 'heute' | 'woche' | 'monat';

interface Props {
  entries: FunnelEntry[];
}

export default function Dashboard({ entries }: Props) {
  const [period, setPeriod] = useState<Period>('heute');
  const [standort, setStandort] = useState<'Alle' | Standort>('Alle');

  const ranges = useMemo(() => {
    const todayStr = today();
    const [wF, wT] = weekRange();
    const [mF, mT] = monthRange();
    const prevDayStr = prevDay();
    const [pwF, pwT] = prevWeekRange();
    const [pmF, pmT] = prevMonthRange();
    return {
      heute: { from: todayStr, to: todayStr, prevFrom: prevDayStr, prevTo: prevDayStr },
      woche: { from: wF, to: wT, prevFrom: pwF, prevTo: pwT },
      monat: { from: mF, to: mT, prevFrom: pmF, prevTo: pmT },
    };
  }, []);

  const r = ranges[period];

  const filtered = useMemo(
    () => filterByStandort(filterByRange(entries, r.from, r.to), standort),
    [entries, r, standort]
  );
  const prevFiltered = useMemo(
    () => filterByStandort(filterByRange(entries, r.prevFrom, r.prevTo), standort),
    [entries, r, standort]
  );

  const kpi = {
    kontakte: kontakteSum(filtered),
    neuaufnahmen: neuaufnahmenSum(filtered),
    planbesprechungen: planbesprechungenSum(filtered),
    unterlagen: unterlagenSum(filtered),
  };
  const prevKpi = {
    kontakte: kontakteSum(prevFiltered),
    neuaufnahmen: neuaufnahmenSum(prevFiltered),
    planbesprechungen: planbesprechungenSum(prevFiltered),
    unterlagen: unterlagenSum(prevFiltered),
  };

  // Funnel bars
  const maxFunnel = Math.max(kpi.kontakte, 1);
  const funnelStages = [
    { label: 'Kontakte', value: kpi.kontakte, color: '#1a6fd4' },
    { label: 'Neuaufnahmen', value: kpi.neuaufnahmen, color: '#b45309' },
    { label: 'Planbesprechungen', value: kpi.planbesprechungen, color: '#6d28d9' },
    { label: 'Unterlagen', value: kpi.unterlagen, color: '#15803d' },
  ];

  // Weekly bar chart data
  const weeklyData = useMemo(() => {
    const [wF, wT] = weekRange();
    const weekEntries = filterByStandort(filterByRange(entries, wF, wT), standort);
    const counts = [0, 0, 0, 0, 0, 0, 0];
    weekEntries.forEach((e) => {
      if (
        e.werttyp === 'online_termin' ||
        e.werttyp === 'telefonische_anfrage' ||
        e.werttyp === 'sonstiger_kontakt'
      ) {
        counts[weekdayIndex(e.datum)] += e.anzahl;
      }
    });
    return {
      labels: WEEKDAY_LABELS,
      datasets: [
        {
          label: 'Neue Kontakte',
          data: counts,
          backgroundColor: '#1a6fd4',
          borderRadius: 4,
        },
      ],
    };
  }, [entries, standort]);

  // Monthly line chart data
  const monthlyData = useMemo(() => {
    const [mF, mT] = monthRange();
    const monthEntries = filterByStandort(filterByRange(entries, mF, mT), standort);
    const lastDay = parseInt(mT.slice(8, 10));
    const labels: string[] = [];
    const kontakte: number[] = [];
    const pb: number[] = [];
    const unt: number[] = [];
    for (let d = 1; d <= lastDay; d++) {
      const ds = `${mF.slice(0, 8)}${String(d).padStart(2, '0')}`;
      labels.push(String(d));
      const dayEntries = monthEntries.filter((e) => e.datum === ds);
      kontakte.push(kontakteSum(dayEntries));
      pb.push(planbesprechungenSum(dayEntries));
      unt.push(unterlagenSum(dayEntries));
    }
    return {
      labels,
      datasets: [
        { label: 'Kontakte', data: kontakte, borderColor: '#1a6fd4', backgroundColor: '#1a6fd4', tension: 0.3 },
        { label: 'Planbesprechungen', data: pb, borderColor: '#6d28d9', backgroundColor: '#6d28d9', tension: 0.3 },
        { label: 'Unterlagen', data: unt, borderColor: '#15803d', backgroundColor: '#15803d', tension: 0.3 },
      ],
    };
  }, [entries, standort]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  return (
    <div className="dashboard">
      {/* Controls */}
      <div className="dash-controls">
        <div className="period-selector">
          {(['heute', 'woche', 'monat'] as Period[]).map((p) => (
            <button
              key={p}
              className={period === p ? 'period-btn active' : 'period-btn'}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        <select
          value={standort}
          onChange={(e) => setStandort(e.target.value as 'Alle' | Standort)}
          className="dash-standort"
        >
          <option value="Alle">Alle Standorte</option>
          <option value="Stadttheater">Stadttheater</option>
          <option value="Wiehre">Wiehre</option>
        </select>
      </div>

      {/* KPI cards */}
      <div className="kpi-grid">
        <KpiCard
          label="Neue Kontakte"
          value={kpi.kontakte}
          color="#1a6fd4"
          delta={delta(kpi.kontakte, prevKpi.kontakte)}
        />
        <KpiCard
          label="Neuaufnahmen"
          value={kpi.neuaufnahmen}
          color="#b45309"
          delta={delta(kpi.neuaufnahmen, prevKpi.neuaufnahmen)}
        />
        <KpiCard
          label="Planbesprechungen"
          value={kpi.planbesprechungen}
          color="#6d28d9"
          delta={delta(kpi.planbesprechungen, prevKpi.planbesprechungen)}
        />
        <KpiCard
          label="Unterlagen"
          value={kpi.unterlagen}
          color="#15803d"
          delta={delta(kpi.unterlagen, prevKpi.unterlagen)}
        />
      </div>

      {/* Funnel */}
      <div className="funnel-section">
        <h3>Funnel</h3>
        {funnelStages.map((s) => (
          <div key={s.label} className="funnel-bar-row">
            <span className="funnel-bar-label">{s.label}</span>
            <div className="funnel-bar-track">
              <div
                className="funnel-bar-fill"
                style={{
                  width: `${Math.max((s.value / maxFunnel) * 100, 0)}%`,
                  backgroundColor: s.color,
                }}
              >
                {s.value > 0 && (
                  <span className="funnel-bar-pct">
                    {kpi.kontakte > 0
                      ? ((s.value / kpi.kontakte) * 100).toFixed(0) + '%'
                      : ''}
                  </span>
                )}
              </div>
            </div>
            <span className="funnel-bar-value">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Conversion rates */}
      <div className="conversion-grid">
        <ConversionCard
          label="Kontakte → Neuaufnahmen"
          value={conversionRate(kpi.neuaufnahmen, kpi.kontakte)}
        />
        <ConversionCard
          label="Neuaufnahmen → Planbesprechungen"
          value={conversionRate(kpi.planbesprechungen, kpi.neuaufnahmen)}
        />
        <ConversionCard
          label="Planbesprechungen → Unterlagen"
          value={conversionRate(kpi.unterlagen, kpi.planbesprechungen)}
        />
        <ConversionCard
          label="Gesamtabschlussquote"
          value={conversionRate(kpi.unterlagen, kpi.kontakte)}
        />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Neue Kontakte pro Wochentag</h3>
          <div className="chart-container">
            <Bar data={weeklyData} options={chartOptions} />
          </div>
        </div>
        <div className="chart-card">
          <h3>Monatsverlauf</h3>
          <div className="chart-container">
            <Line data={monthlyData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  color,
  delta: d,
}: {
  label: string;
  value: number;
  color: string;
  delta: { value: number; label: string };
}) {
  return (
    <div className="kpi-card" style={{ borderTopColor: color }}>
      <span className="kpi-value">{value}</span>
      <span className="kpi-label">{label}</span>
      <span className={`kpi-delta ${d.value > 0 ? 'up' : d.value < 0 ? 'down' : ''}`}>
        {d.label}
      </span>
    </div>
  );
}

function ConversionCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="conversion-card">
      <span className="conversion-value">{value}</span>
      <span className="conversion-label">{label}</span>
    </div>
  );
}
