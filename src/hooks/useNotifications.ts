import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useNotifications() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isSubscribedRef = useRef(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) { setUnreadCount(0); return; }

    const { count: directCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('read', false);

    const { count: broadcastCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_broadcast', true)
      .eq('read', false);

    setUnreadCount((directCount || 0) + (broadcastCount || 0));
  }, [user]);

  const fetchUnreadCountRef = useRef(fetchUnreadCount);
  useEffect(() => {
    fetchUnreadCountRef.current = fetchUnreadCount;
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!user) return;

    // Guard: if already subscribed, don't create another channel
    if (isSubscribedRef.current) return;

    fetchUnreadCountRef.current();

    // Tear down any existing channel before creating a new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `notifications-realtime-${user.id}-${Date.now()}`;

    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotif = payload.new as any;
          if (newNotif.recipient_id === user.id || newNotif.is_broadcast) {
            setUnreadCount(prev => prev + 1);
            toast(newNotif.title || 'New notification', {
              description: newNotif.body,
            });
          }
        }
      )
      .subscribe();

    isSubscribedRef.current = true;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      isSubscribedRef.current = false;
    };
  }, [user]);

  return { unreadCount, refetchUnread: fetchUnreadCount };
}