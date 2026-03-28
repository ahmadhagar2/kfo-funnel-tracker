import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { FunnelEntry, Werttyp, Standort, Bereich } from '../types';
import { today, nowTime } from '../lib/dateUtils';

export function useEntries() {
  const [entries, setEntries] = useState<FunnelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from('funnel_entries')
      .select('*')
      .order('datum', { ascending: false })
      .order('uhrzeit', { ascending: false });
    if (error) {
      console.error('Error fetching entries:', error);
      return;
    }
    setEntries(data as FunnelEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();

    const channel = supabase
      .channel('funnel_entries_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'funnel_entries' },
        () => {
          fetchEntries();
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchEntries]);

  const addEntry = useCallback(
    async (params: {
      standort: Standort;
      bereich: Bereich;
      mitarbeiter: string;
      werttyp: Werttyp;
    }) => {
      const { error } = await supabase.from('funnel_entries').insert({
        datum: today(),
        uhrzeit: nowTime(),
        standort: params.standort,
        bereich: params.bereich,
        mitarbeiter: params.mitarbeiter,
        werttyp: params.werttyp,
        anzahl: 1,
      });
      if (error) console.error('Error adding entry:', error);
    },
    []
  );

  const removeEntry = useCallback(async (id: string) => {
    const { error } = await supabase.from('funnel_entries').delete().eq('id', id);
    if (error) console.error('Error removing entry:', error);
  }, []);

  const decrementOrRemove = useCallback(
    async (params: {
      standort: Standort;
      bereich: Bereich;
      mitarbeiter: string;
      werttyp: Werttyp;
    }) => {
      // Find latest matching entry for today
      const todayStr = today();
      const match = entries.find(
        (e) =>
          e.datum === todayStr &&
          e.standort === params.standort &&
          e.bereich === params.bereich &&
          e.werttyp === params.werttyp
      );
      if (match) {
        await removeEntry(match.id);
      }
    },
    [entries, removeEntry]
  );

  return { entries, loading, realtimeConnected, addEntry, removeEntry, decrementOrRemove };
}
