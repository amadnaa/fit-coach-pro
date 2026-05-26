import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Send, Bell, Users, User } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';


interface Notification {
  id: string;
  title: string;
  body: string;
  sender_id: string | null;
  sender_name?: string;
  is_broadcast: boolean;
  read: boolean;
  created_at: string;
}

export default function NotificationCentre() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ title: '', body: '', recipientId: 'all' });
  const [sending, setSending] = useState(false);



  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    if (role === 'coach') fetchClients();

    // Realtime subscription for new notifications
    const channel = supabase
      .channel('notif-centre-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const n = payload.new as any;
          if (n.recipient_id === user.id || n.is_broadcast) {
            fetchNotifications();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, role]);

  const fetchNotifications = async () => {
    const { data } = await supabase.from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      const senderIds = [...new Set(data.filter(n => n.sender_id).map(n => n.sender_id!))];
      let senderMap = new Map<string, string>();
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', senderIds);
        if (profiles) senderMap = new Map(profiles.map(p => [p.user_id, p.full_name]));
      }
      setNotifications(data.map(n => ({ ...n, sender_name: n.sender_id ? senderMap.get(n.sender_id) || t('notifCentre.unknown') : t('notifCentre.system') })));

      // Mark unread as read
      const unreadIds = data.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
      }
    }
  };

  const fetchClients = async () => {
    if (!user) return;
    const { data } = await supabase.from('coach_clients').select('client_id').eq('coach_id', user.id);
    if (data) {
      const ids = data.map(d => d.client_id);
      if (ids.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', ids);
        if (profiles) setClients(profiles.map(p => ({ id: p.user_id, name: p.full_name })));
      }
    }
  };

  const handleSend = async () => {
    if (!form.body.trim() || !user) return;
    setSending(true);

    if (form.recipientId === 'all') {
      await supabase.from('notifications').insert({
        sender_id: user.id,
        title: form.title.trim(),
        body: form.body.trim(),
        is_broadcast: true,
      });
    } else {
      await supabase.from('notifications').insert({
        sender_id: user.id,
        recipient_id: form.recipientId,
        title: form.title.trim(),
        body: form.body.trim(),
        is_broadcast: false,
      });
    }

    toast.success(t('notifications.sentToast'));
    setForm({ title: '', body: '', recipientId: 'all' });
    setShowCompose(false);
    setSending(false);
    fetchNotifications();
  };

  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground"><ChevronLeft className="h-6 w-6" /></button>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold">Notifications</h1>
          </div>
          {role === 'coach' && (
            <button onClick={() => setShowCompose(!showCompose)} className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground">
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Compose */}
        {showCompose && role === 'coach' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-card border border-border space-y-3">
            <h3 className="text-sm font-semibold">Send Notification</h3>
            <Select value={form.recipientId} onValueChange={v => setForm(f => ({ ...f, recipientId: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Recipient" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all"><div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> All Clients</div></SelectItem>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}><div className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> {c.name}</div></SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title (optional)" className="rounded-xl" maxLength={100} />
            <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Message..." className="rounded-xl" rows={3} maxLength={500} />
            <Button onClick={handleSend} disabled={sending || !form.body.trim()} className="w-full rounded-xl gradient-primary text-primary-foreground font-semibold">
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </motion.div>
        )}

        {/* Notifications List */}
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <motion.div key={n.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className={cn("p-4 rounded-xl bg-card border border-border space-y-1", !n.read && "border-primary/30")}>
                {n.title && <p className="text-sm font-semibold">{n.title}</p>}
                <p className="text-sm text-foreground">{n.body}</p>
                <div className="flex items-center gap-2 pt-1">
                  <p className="text-[10px] text-muted-foreground">{n.sender_name}</p>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(n.created_at), 'MMM d, HH:mm')}</p>
                  {n.is_broadcast && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Broadcast</span>}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
