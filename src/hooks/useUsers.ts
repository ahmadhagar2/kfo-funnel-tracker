import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    setUsers(data as User[]);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const addUser = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const { error } = await supabase.from('users').insert({ name: trimmed });
      if (error) {
        console.error('Error adding user:', error);
        return;
      }
      await fetchUsers();
    },
    [fetchUsers]
  );

  const renameUser = useCallback(
    async (id: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;
      const { error } = await supabase
        .from('users')
        .update({ name: trimmed })
        .eq('id', id);
      if (error) {
        console.error('Error renaming user:', error);
        return;
      }
      await fetchUsers();
    },
    [fetchUsers]
  );

  const deleteUser = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) {
        console.error('Error deleting user:', error);
        return;
      }
      await fetchUsers();
    },
    [fetchUsers]
  );

  return { users, addUser, renameUser, deleteUser };
}
