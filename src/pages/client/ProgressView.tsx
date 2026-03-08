import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scale, Footprints, Dumbbell, CalendarIcon, Plus, X } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, isSameDay } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

const weightData = [
  { week: 'W1', value: 82 }, { week: 'W2', value: 81.5 }, { week: 'W3', value: 81.2 },
  { week: 'W4', value: 80.8 }, { week: 'W5', value: 80.3 }, { week: 'W6', value: 80.1 }, { week: 'W7', value: 79.6 },
];

const stepsData = [
  { day: 'Mon', value: 8200 }, { day: 'Tue', value: 10500 }, { day: 'Wed', value: 7800 },
  { day: 'Thu', value: 12000 }, { day: 'Fri', value: 9300 }, { day: 'Sat', value: 6500 }, { day: 'Sun', value: 4200 },
];

interface ScheduledSession {
  id: string;
  session_date: string;
  title: string;
  notes: string | null;
}

export default function ProgressView() {
  const { user } = useAuth();
  const { flags } = useFeatureFlags();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('Training Session');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;
    const { data } = await supabase.from('scheduled_sessions')
      .select('*').eq('user_id', user.id).order('session_date', { ascending: true });
    if (data) setSessions(data);
  };

  const sessionDates = sessions.map(s => new Date(s.session_date + 'T00:00:00'));
  const selectedDaySessions = sessions.filter(s => selectedDate && isSameDay(new Date(s.session_date + 'T00:00:00'), selectedDate));

  const handleAddSession = async () => {
    if (!user || !selectedDate || !sessionTitle.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('scheduled_sessions').insert({
      user_id: user.id,
      session_date: format(selectedDate, 'yyyy-MM-dd'),
      title: sessionTitle.trim(),
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Session scheduled!');
    setShowAddSession(false);
    setSessionTitle('Training Session');
    fetchSessions();
  };

  const handleDeleteSession = async (id: string) => {
    await supabase.from('scheduled_sessions').delete().eq('id', id);
    toast.success('Session removed');
    fetchSessions();
  };

  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-6 pb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold">Progress</h1>
          <p className="text-muted-foreground text-sm">Track your journey</p>
        </motion.div>

        {/* Calendar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Training Calendar</h3>
            </div>
            <button onClick={() => setShowAddSession(true)} className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className={cn("p-3 pointer-events-auto")}
            modifiers={{ scheduled: sessionDates }}
            modifiersClassNames={{ scheduled: 'bg-primary/20 text-primary font-bold' }}
          />
          {/* Sessions for selected date */}
          {selectedDate && (
            <div className="px-4 pb-3 space-y-2">
              <p className="text-xs text-muted-foreground">{format(selectedDate, 'MMMM d, yyyy')}</p>
              {selectedDaySessions.length > 0 ? selectedDaySessions.map(s => (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary">
                  <Dumbbell className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium flex-1">{s.title}</span>
                  <button onClick={() => handleDeleteSession(s.id)} className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
                </div>
              )) : (
                <p className="text-[10px] text-muted-foreground">No sessions scheduled</p>
              )}
            </div>
          )}
          {/* Add Session Form */}
          {showAddSession && (
            <div className="px-4 pb-3 space-y-2 border-t border-border pt-3">
              <Input value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} placeholder="Session name" className="rounded-xl text-sm h-9" maxLength={50} />
              <div className="flex gap-2">
                <Button onClick={handleAddSession} disabled={saving} size="sm" className="rounded-xl gradient-primary text-primary-foreground text-xs flex-1">
                  {saving ? 'Saving...' : `Schedule for ${selectedDate ? format(selectedDate, 'MMM d') : '...'}`}
                </Button>
                <Button onClick={() => setShowAddSession(false)} size="sm" variant="outline" className="rounded-xl text-xs">Cancel</Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Body Weight Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Body Weight</h3>
            <span className="ml-auto text-xs text-primary font-medium">-2.4 kg</span>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightData}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#weightGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Steps Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="p-4 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Footprints className="h-4 w-4 text-info" />
            <h3 className="font-semibold text-sm">Steps This Week</h3>
            <span className="ml-auto text-xs text-muted-foreground">Avg 8,357</span>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stepsData}>
                <defs>
                  <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis hide />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--info))" strokeWidth={2} fill="url(#stepsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Workout History */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Workout History</h3>
          </div>
          {['Push Day', 'Pull Day', 'Leg Day', 'Push Day', 'Pull Day'].map((name, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Dumbbell className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{i + 1} day{i > 0 ? 's' : ''} ago</p>
              </div>
              <span className="text-xs text-primary">✓</span>
            </div>
          ))}
        </motion.div>
      </div>
    </MobileLayout>
  );
}
