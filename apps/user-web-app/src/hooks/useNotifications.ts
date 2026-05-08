import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !supabase) return;
    const client = supabase;

    const loadNotifications = async () => {
      const { data } = await client
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(data);
        setUnread(data.filter((n: any) => !n.read).length);
      }
      setLoading(false);
    };

    loadNotifications();

    const channel = client
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnread((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [userId]);

  const markRead = async (id: string) => {
    await supabase?.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnread((prev) => Math.max(0, prev - 1));
  };

  return { notifications, unread, loading, markRead };
}
