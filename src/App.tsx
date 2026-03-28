import { useState } from 'react';
import Nav from './components/Nav';
import PinGate from './components/PinGate';
import UserModal from './components/UserModal';
import Empfang from './components/views/Empfang';
import Planbesprechung from './components/views/Planbesprechung';
import Dashboard from './components/views/Dashboard';
import { useEntries } from './hooks/useEntries';
import { useUsers } from './hooks/useUsers';

type View = 'empfang' | 'planbesprechung' | 'dashboard';

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('kfo_auth') === '1');
  const [view, setView] = useState<View>('empfang');
  const [showUserModal, setShowUserModal] = useState(false);
  const { entries, loading, realtimeConnected, addEntry, removeEntry, decrementOrRemove } =
    useEntries();
  const { users, addUser, renameUser, deleteUser } = useUsers();

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

  return (
    <div className="app">
      <Nav current={view} onChange={setView} realtimeConnected={realtimeConnected} />
      <main className="main">
        {view === 'empfang' && (
          <Empfang
            entries={entries}
            users={users}
            addEntry={addEntry}
            removeEntry={removeEntry}
            decrementOrRemove={decrementOrRemove}
            onOpenUserModal={() => setShowUserModal(true)}
            addUser={addUser}
            renameUser={renameUser}
            deleteUser={deleteUser}
          />
        )}
        {view === 'planbesprechung' && (
          <Planbesprechung entries={entries} users={users} addEntry={addEntry} />
        )}
        {view === 'dashboard' && <Dashboard entries={entries} />}
      </main>
      {showUserModal && (
        <UserModal
          users={users}
          addUser={addUser}
          renameUser={renameUser}
          deleteUser={deleteUser}
          onClose={() => setShowUserModal(false)}
        />
      )}
    </div>
  );
}
