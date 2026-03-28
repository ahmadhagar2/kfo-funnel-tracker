import { useState } from 'react';
import { User } from '../types';

interface Props {
  users: User[];
  addUser: (name: string) => Promise<void>;
  renameUser: (id: string, name: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  onClose: () => void;
}

export default function UserModal({ users, addUser, renameUser, deleteUser, onClose }: Props) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addUser(newName);
    setNewName('');
  };

  const startRename = (user: User) => {
    setEditingId(user.id);
    setEditName(user.name);
  };

  const handleRename = async (id: string) => {
    await renameUser(id, editName);
    setEditingId(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Benutzer verwalten</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="user-list">
            {users.map((u) => (
              <div key={u.id} className="user-row">
                {editingId === u.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="user-edit-input"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(u.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <button className="btn-small" onClick={() => handleRename(u.id)}>
                      Speichern
                    </button>
                    <button className="btn-small secondary" onClick={() => setEditingId(null)}>
                      Abbrechen
                    </button>
                  </>
                ) : (
                  <>
                    <span className="user-name">{u.name}</span>
                    <button className="btn-small" onClick={() => startRename(u)}>
                      Umbenennen
                    </button>
                    <button
                      className="btn-small danger"
                      onClick={() => {
                        if (confirm(`"${u.name}" wirklich löschen?`)) deleteUser(u.id);
                      }}
                    >
                      Löschen
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="user-add">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Neuer Benutzer"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
            <button className="btn-small" onClick={handleAdd}>
              Hinzufügen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
