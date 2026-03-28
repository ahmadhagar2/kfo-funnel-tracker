type View = 'empfang' | 'planbesprechung' | 'dashboard';

interface NavProps {
  current: View;
  onChange: (view: View) => void;
  realtimeConnected: boolean;
}

export default function Nav({ current, onChange, realtimeConnected }: NavProps) {
  return (
    <nav className="nav">
      <div className="nav-brand">KFO Funnel</div>
      <div className="nav-links">
        <button
          className={current === 'empfang' ? 'nav-link active' : 'nav-link'}
          onClick={() => onChange('empfang')}
        >
          Empfang
        </button>
        <button
          className={current === 'planbesprechung' ? 'nav-link active' : 'nav-link'}
          onClick={() => onChange('planbesprechung')}
        >
          Planbesprechung
        </button>
        <button
          className={current === 'dashboard' ? 'nav-link active' : 'nav-link'}
          onClick={() => onChange('dashboard')}
        >
          Dashboard
        </button>
      </div>
      <div className={realtimeConnected ? 'live-indicator connected' : 'live-indicator'}>
        <span className="live-dot" />
        {realtimeConnected ? 'Live' : 'Offline'}
      </div>
    </nav>
  );
}
