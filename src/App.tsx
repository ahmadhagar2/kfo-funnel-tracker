import { useState, useEffect, useRef, useCallback } from 'react';
import Nav from './components/Nav';
import PinGate from './components/PinGate';
import UserModal from './components/UserModal';
import Empfang from './components/views/Empfang';
import Planbesprechung from './components/views/Planbesprechung';
import Dashboard from './components/views/Dashboard';
import { useEntries } from './hooks/useEntries';
import { useUsers } from './hooks/useUsers';
import { Standort, STANDORT_FARBEN, Bereich, Werttyp } from './types';
import { today } from './lib/dateUtils';

type View = 'empfang' | 'planbesprechung' | 'dashboard';

// Descriptor of the just-saved event, used to compose the toast and to undo it.
export interface SavedInfo {
  ereignis: string;
  standort: Standort;
  bereich: Bereich;
  werttyp: Werttyp;
}

function isStandort(v: string | null): v is Standort {
  return v === 'Stadttheater' || v === 'Wiehre';
}

// URL-Parameter hat Vorrang vor localStorage; kein stiller Default.
// Liefert zusätzlich die Herkunft des Standorts mit (für standort_quelle).
function readInitialStandort(): { standort: Standort | null; quelle: string | null } {
  const param = new URLSearchParams(window.location.search).get('standort')?.toLowerCase();
  if (param === 'wiehre') return { standort: 'Wiehre', quelle: 'url_parameter' };
  if (param === 'stadttheater') return { standort: 'Stadttheater', quelle: 'url_parameter' };
  const stored = localStorage.getItem('kfo_standort');
  if (isStandort(stored)) return { standort: stored, quelle: 'device_default' };
  return { standort: null, quelle: null };
}

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('kfo_auth') === '1');
  const [view, setView] = useState<View>('empfang');
  const [showUserModal, setShowUserModal] = useState(false);

  const [standort, setStandort] = useState<Standort | null>(() => readInitialStandort().standort);
  const [standortQuelle, setStandortQuelle] = useState<string | null>(() => readInitialStandort().quelle);
  const [benutzer, setBenutzer] = useState<string | null>(() => localStorage.getItem('kfo_benutzer'));
  const [benutzerQuelle, setBenutzerQuelle] = useState<string | null>(() =>
    localStorage.getItem('kfo_benutzer') ? 'device_default' : null
  );
  // Merkt sich, ob die nächste Benutzerauswahl aus einem "Benutzer wechseln" stammt.
  const benutzerWechselPending = useRef(false);

  const [toast, setToast] = useState<{ text: string; descriptor: SavedInfo } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { entries, loading, realtimeConnected, addEntry, removeEntry, decrementOrRemove } =
    useEntries();
  const { users, addUser, renameUser, deleteUser } = useUsers();

  // Immer-aktuelle Eintragsliste für Undo (vermeidet veraltete Closures).
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  // localStorage spiegeln.
  useEffect(() => {
    if (standort) localStorage.setItem('kfo_standort', standort);
  }, [standort]);
  useEffect(() => {
    if (benutzer) localStorage.setItem('kfo_benutzer', benutzer);
  }, [benutzer]);

  // Gespeicherten Benutzer verwerfen, wenn er nicht mehr existiert.
  useEffect(() => {
    if (benutzer && users.length > 0 && !users.some((u) => u.name === benutzer)) {
      setBenutzer(null);
    }
  }, [users, benutzer]);

  const showToast = useCallback((info: SavedInfo) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({
      text: `Gespeichert: ${info.ereignis} · ${info.standort} · ${benutzer ?? ''}`,
      descriptor: info,
    });
    toastTimer.current = setTimeout(() => setToast(null), 7000);
  }, [benutzer]);

  // Letzten passenden Eintrag von heute entfernen (gleiche Semantik wie −1).
  const handleUndo = useCallback(() => {
    if (toast) {
      const d = toast.descriptor;
      const todayStr = today();
      const match = entriesRef.current
        .filter(
          (e) =>
            e.datum === todayStr &&
            e.standort === d.standort &&
            e.bereich === d.bereich &&
            e.werttyp === d.werttyp
        )
        .sort((a, b) => b.uhrzeit.localeCompare(a.uhrzeit))[0];
      if (match) removeEntry(match.id);
    }
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }, [toast, removeEntry]);

  const wechselStandort = () => {
    if (!standort) return;
    const ziel: Standort = standort === 'Stadttheater' ? 'Wiehre' : 'Stadttheater';
    if (window.confirm(`Aktueller Standort: ${standort}. Wirklich zu ${ziel} wechseln?`)) {
      setStandort(ziel);
      setStandortQuelle('changed_in_session');
    }
  };

  // Auswahl-Screen: erste Wahl ist 'manual_selected', nach "Benutzer wechseln" 'changed_in_session'.
  const waehleBenutzer = (name: string) => {
    setBenutzer(name);
    setBenutzerQuelle(benutzerWechselPending.current ? 'changed_in_session' : 'manual_selected');
    benutzerWechselPending.current = false;
  };

  const wechselBenutzer = () => {
    benutzerWechselPending.current = true;
    setBenutzer(null);
  };

  const waehleStandort = (ziel: Standort) => {
    setStandort(ziel);
    setStandortQuelle('manual_selected');
  };

  if (!authed) {
    return <PinGate onSuccess={() => setAuthed(true)} />;
  }

  if (loading) {
    return (
      <div className="loading">
        <p>Daten werden geladen...</p>
      </div>
    );
  }

  // Ereigniserfassung braucht zwingend Standort UND Benutzer.
  const needsContext = view === 'empfang' || view === 'planbesprechung';
  const farbe = standort ? STANDORT_FARBEN[standort] : '#1a1a2e';

  let body;
  if (needsContext && !standort) {
    body = (
      <div className="selection-screen">
        <h2 className="selection-title">Welche Praxis ist aktiv?</h2>
        <div className="standort-pick">
          <button
            className="standort-btn"
            style={{ background: STANDORT_FARBEN.Stadttheater }}
            onClick={() => waehleStandort('Stadttheater')}
          >
            Stadttheater
          </button>
          <button
            className="standort-btn"
            style={{ background: STANDORT_FARBEN.Wiehre }}
            onClick={() => waehleStandort('Wiehre')}
          >
            Wiehre
          </button>
        </div>
      </div>
    );
  } else if (needsContext && !benutzer) {
    body = (
      <div className="selection-screen">
        <h2 className="selection-title">Wer erfasst gerade?</h2>
        {users.length === 0 && <p className="selection-empty">Noch keine Benutzer angelegt.</p>}
        <div className="benutzer-pick">
          {users.map((u) => (
            <button key={u.id} className="benutzer-btn" onClick={() => waehleBenutzer(u.name)}>
              {u.name}
            </button>
          ))}
        </div>
        <button className="icon-button" onClick={() => setShowUserModal(true)}>
          Benutzer verwalten
        </button>
      </div>
    );
  } else {
    body = (
      <>
        {needsContext && standort && benutzer && (
          <div className="status-bar" style={{ background: farbe }}>
            <span className="status-text">
              Aktiv: <strong>{standort}</strong> · Benutzer: <strong>{benutzer}</strong>
            </span>
            <span className="status-actions">
              <button className="status-btn" onClick={wechselStandort}>
                Standort wechseln
              </button>
              <button className="status-btn" onClick={wechselBenutzer}>
                Benutzer wechseln
              </button>
            </span>
          </div>
        )}
        {view === 'empfang' && standort && benutzer && (
          <Empfang
            entries={entries}
            users={users}
            standort={standort}
            benutzer={benutzer}
            standortQuelle={standortQuelle ?? 'unbekannt'}
            benutzerQuelle={benutzerQuelle ?? 'unbekannt'}
            addEntry={addEntry}
            removeEntry={removeEntry}
            decrementOrRemove={decrementOrRemove}
            onSaved={showToast}
            onOpenUserModal={() => setShowUserModal(true)}
            addUser={addUser}
            renameUser={renameUser}
            deleteUser={deleteUser}
          />
        )}
        {view === 'planbesprechung' && standort && benutzer && (
          <Planbesprechung
            entries={entries}
            users={users}
            standort={standort}
            benutzer={benutzer}
            standortQuelle={standortQuelle ?? 'unbekannt'}
            benutzerQuelle={benutzerQuelle ?? 'unbekannt'}
            addEntry={addEntry}
            removeEntry={removeEntry}
            onSaved={showToast}
          />
        )}
        {view === 'dashboard' && <Dashboard entries={entries} />}
      </>
    );
  }

  return (
    <div className="app">
      <Nav current={view} onChange={setView} realtimeConnected={realtimeConnected} />
      <main className="main">{body}</main>
      {showUserModal && (
        <UserModal
          users={users}
          addUser={addUser}
          renameUser={renameUser}
          deleteUser={deleteUser}
          onClose={() => setShowUserModal(false)}
        />
      )}
      {toast && (
        <div className="toast">
          <span className="toast-text">{toast.text}</span>
          <button className="toast-undo" onClick={handleUndo}>
            Rückgängig
          </button>
        </div>
      )}
    </div>
  );
}
