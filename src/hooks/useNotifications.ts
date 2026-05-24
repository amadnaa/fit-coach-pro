import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useNotifications() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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

  useEffect(() => {
    if (!user) return;

    let active = true; // prevents setState after unmount

    fetchUnreadCount();

    // Remove ALL existing channels that match our prefix to prevent
    // any stale subscribed channel from blocking a new .on() call
    const existingChannels = supabase.getChannels();
    existingChannels.forEach((ch) => {
      if (ch.topic.startsWith('realtime:notifications-realtime-')) {
        supabase.removeChannel(ch);
      }
    });
    channelRef.current = null;

    const channelName = `notifications-realtime-${user.id}-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          if (!active) return;
          const newNotif = payload.new as any;
          if (newNotif.recipient_id === user.id || newNotif.is_broadcast) {
            setUnreadCount(prev => prev + 1);
            toast(newNotif.title || 'Nueva notificación', {
              description: newNotif.body,
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      active = false;
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user, fetchUnreadCount]);

  return { unreadCount, refetchUnread: fetchUnreadCount };
}