import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Dumbbell, TrendingUp, Footprints, ClipboardList, Settings2, Clock, Trophy, UtensilsCrossed } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function ClientDetailView() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [clientName, setClientName] = useState('');
  const [bodyweightData, setBodyweightData] = useState<{ date: string; weight: number }[]>([]);
  const [stepsData, setStepsData] = useState<{ date: string; steps: number }[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [weeklyCheckins, setWeeklyCheckins] = useState<any[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<any[]>([]);
  const [foodLogs, setFoodLogs] = useState<any[]>([]);
  const [flags, setFlags] = useState({ food_tracking_enabled: false, step_tracking_enabled: true, cardio_tracking_enabled: false });
  const [flagsId, setFlagsId] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;

    supabase.from('profiles').select('full_name').eq('user_id', clientId).maybeSingle()
      .then(({ data }) => { if (data) setClientName(data.full_name); });

    supabase.from('bodyweight_logs').select('weight, logged_at').eq('user_id', clientId).order('logged_at', { ascending: true }).limit(30)
      .then(({ data }) => { if (data) setBodyweightData(data.map(d => ({ date: format(new Date(d.logged_at), 'MM/dd'), weight: d.weight }))); });

    supabase.from('step_logs').select('steps, logged_at').eq('user_id', clientId).order('logged_at', { ascending: true }).limit(30)
      .then(({ data }) => { if (data) setStepsData(data.map(d => ({ date: format(new Date(d.logged_at), 'MM/dd'), steps: d.steps }))); });

    supabase.from('workout_logs').select('id, reps, weight, set_number, completed_at, arrow_direction, workout_exercise_id').eq('user_id', clientId).order('completed_at', { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setWorkoutLogs(data); });

    supabase.from('weekly_check_ins').select('*').eq('user_id', clientId).order('week_start', { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setWeeklyCheckins(data); });

    supabase.from('workout_sessions').select('*').eq('user_id', clientId).order('started_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setWorkoutSessions(data); });

    supabase.from('feature_flags').select('*').eq('user_id', clientId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFlags({ food_tracking_enabled: data.food_tracking_enabled ?? false, step_tracking_enabled: data.step_tracking_enabled ?? true, cardio_tracking_enabled: data.cardio_tracking_enabled ?? false });
          setFlagsId(data.id);
        }
      });
  }, [clientId]);

  const updateFlag = async (key: string, value: boolean) => {
    setFlags(f => ({ ...f, [key]: value }));
    if (flagsId) {
      await supabase.from('feature_flags').update({ [key]: value }).eq('id', flagsId);
    } else {
      const { data } = await supabase.from('feature_flags').insert({ user_id: clientId!, [key]: value }).select('id').single();
      if (data) setFlagsId(data.id);
    }
    toast.success('Feature flag updated');
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  };

  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/coach')} className="text-muted-foreground"><ChevronLeft className="h-6 w-6" /></button>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold">{clientName || 'Client'}</h1>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-5 rounded-xl bg-secondary h-9">
            <TabsTrigger value="overview" className="text-[10px] rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="sessions" className="text-[10px] rounded-lg">Sessions</TabsTrigger>
            <TabsTrigger value="logs" className="text-[10px] rounded-lg">Logs</TabsTrigger>
            <TabsTrigger value="checkins" className="text-[10px] rounded-lg">Check-ins</TabsTrigger>
            <TabsTrigger value="settings" className="text-[10px] rounded-lg">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
              <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /><p className="text-sm font-medium">Bodyweight</p></div>
              {bodyweightData.length > 1 ? (
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={bodyweightData}><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis hide domain={['dataMin - 1', 'dataMax + 1']} /><Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} /></LineChart>
                </ResponsiveContainer>
              ) : <p className="text-xs text-muted-foreground text-center py-4">No data</p>}
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
              <div className="flex items-center gap-2"><Footprints className="h-4 w-4 text-primary" /><p className="text-sm font-medium">Steps</p></div>
              {stepsData.length > 1 ? (
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={stepsData}><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis hide domain={['dataMin - 500', 'dataMax + 500']} /><Line type="monotone" dataKey="steps" stroke="hsl(var(--info))" strokeWidth={2} dot={false} /></LineChart>
                </ResponsiveContainer>
              ) : <p className="text-xs text-muted-foreground text-center py-4">No data</p>}
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-3 mt-4">
            {workoutSessions.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No workout sessions yet</p> : (
              workoutSessions.map((session: any) => (
                <div key={session.id} className="p-4 rounded-2xl bg-card border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{format(new Date(session.started_at), 'MMM d, yyyy · HH:mm')}</p>
                    {session.completed ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Completed</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">Incomplete</span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-0.5" />
                      <p className="text-sm font-medium">{formatDuration(session.duration_seconds)}</p>
                      <p className="text-[9px] text-muted-foreground">Duration</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{session.exercises_completed}/{session.total_exercises}</p>
                      <p className="text-[9px] text-muted-foreground">Exercises</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{session.total_sets_completed}</p>
                      <p className="text-[9px] text-muted-foreground">Sets</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{session.total_reps}</p>
                      <p className="text-[9px] text-muted-foreground">Reps</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="logs" className="space-y-2 mt-4">
            {workoutLogs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No workout logs yet</p> : (
              workoutLogs.map(log => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Dumbbell className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.weight}kg × {log.reps} reps (Set {log.set_number})</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(log.completed_at), 'MMM d, HH:mm')}</p>
                  </div>
                  {log.arrow_direction && <span className="text-xs">{log.arrow_direction === 'up' ? '↑' : log.arrow_direction === 'down' ? '↓' : '→'}</span>}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="checkins" className="space-y-3 mt-4">
            {weeklyCheckins.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No check-ins yet</p> : (
              weeklyCheckins.map(ci => (
                <div key={ci.id} className="p-4 rounded-2xl bg-card border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-primary">{clientName}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(ci.week_start), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center"><p className="text-[10px] text-muted-foreground">Difficulty</p><p className="text-sm font-medium capitalize">{ci.training_difficulty}</p></div>
                    <div className="text-center"><p className="text-[10px] text-muted-foreground">Recovery</p><p className="text-sm font-medium capitalize">{ci.recovery_level}</p></div>
                    <div className="text-center"><p className="text-[10px] text-muted-foreground">Energy</p><p className="text-sm font-medium capitalize">{ci.energy_level}</p></div>
                  </div>
                  {ci.notes && <p className="text-xs text-muted-foreground">{ci.notes}</p>}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="p-4 rounded-2xl bg-card border border-border space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Settings2 className="h-4 w-4 text-primary" /> Feature Flags</h3>
              {[
                { key: 'food_tracking_enabled', label: 'Food Tracker' },
                { key: 'step_tracking_enabled', label: 'Step Tracking' },
                { key: 'cardio_tracking_enabled', label: 'Cardio Tracker' },
              ].map(f => (
                <div key={f.key} className="flex items-center justify-between">
                  <p className="text-sm">{f.label}</p>
                  <Switch checked={(flags as any)[f.key]} onCheckedChange={v => updateFlag(f.key, v)} />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}
