import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scale, Footprints, Dumbbell, CalendarIcon, Plus, X, ChevronRight } from 'lucide-react';
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
import { useNavigate } from 'react-router-dom';


interface ScheduledSession {
  id: string;
  session_date: string;
  title: string;
  notes: string | null;
  workout_id: string | null;
}

interface WorkoutDay {
  id: string;
  name: string;
  day_number: number;
}

export default function ProgressView() {
  const { user } = useAuth();
  const { flags } = useFeatureFlags();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [eventType, setEventType] = useState<'workout' | 'other' | null>(null);
  const [bodyweightData, setBodyweightData] = useState<{ date: string; value: number }[]>([]);
  const [stepsData, setStepsData] = useState<{ date: string; value: number }[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<{ id: string; started_at: string; ended_at: string | null; duration_seconds: number | null; exercises_completed: number | null; total_exercises: number | null; completed: boolean }[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchSessions();
    fetchWorkoutDays();
    fetchBodyweight();
    fetchSteps();
    fetchWorkoutHistory();
  }, [user]);

  const fetchBodyweight = async () => {
    if (!user) return;
    const { data } = await supabase.from('bodyweight_logs').select('weight, logged_at')
      .eq('user_id', user.id).order('logged_at', { ascending: true }).limit(30);
    if (data) setBodyweightData(data.map(d => ({ date: format(new Date(d.logged_at), 'MM/dd'), value: d.weight })));
  };

  const fetchSteps = async () => {
    if (!user) return;
    const { data } = await supabase.from('step_logs').select('steps, logged_at')
      .eq('user_id', user.id).order('logged_at', { ascending: true }).limit(14);
    if (data) setStepsData(data.map(d => ({ date: format(new Date(d.logged_at), 'MM/dd'), value: d.steps })));
  };

  const fetchWorkoutHistory = async () => {
    if (!user) return;
    const { data } = await supabase.from('workout_sessions').select('id, started_at, ended_at, duration_seconds, exercises_completed, total_exercises, completed')
      .eq('user_id', user.id).eq('completed', true).order('ended_at', { ascending: false }).limit(10);
    if (data) setWorkoutHistory(data);
  };

    if (!user) return;
    const { data } = await supabase.from('scheduled_sessions')
      .select('*').eq('user_id', user.id).order('session_date', { ascending: true });
    if (data) setSessions(data as ScheduledSession[]);
  };

  const fetchWorkoutDays = async () => {
    if (!user) return;
    const { data: plan } = await supabase.from('workout_plans')
      .select('id').eq('client_id', user.id).eq('is_active', true).maybeSingle();
    if (!plan) return;
    const { data: workouts } = await supabase.from('workouts')
      .select('id, name, day_number').eq('plan_id', plan.id).order('day_number');
    if (workouts) setWorkoutDays(workouts);
  };

  const sessionDates = sessions.map(s => new Date(s.session_date + 'T00:00:00'));
  const selectedDaySessions = sessions.filter(s => selectedDate && isSameDay(new Date(s.session_date + 'T00:00:00'), selectedDate));

  const handleAddSession = async () => {
    if (!user || !selectedDate) return;
    if (eventType === 'workout' && !selectedWorkoutId) { toast.error('Pick a workout day'); return; }
    if (eventType === 'other' && !sessionTitle.trim()) { toast.error('Enter event name'); return; }

    const workout = workoutDays.find(w => w.id === selectedWorkoutId);
    const title = eventType === 'workout' ? `Day ${workout?.day_number}: ${workout?.name}` : sessionTitle.trim();

    setSaving(true);
    const { error } = await supabase.from('scheduled_sessions').insert({
      user_id: user.id,
      session_date: format(selectedDate, 'yyyy-MM-dd'),
      title,
      workout_id: eventType === 'workout' ? selectedWorkoutId : null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Session scheduled!');
    resetForm();
    fetchSessions();
  };

  const resetForm = () => {
    setShowAddSession(false);
    setSessionTitle('');
    setSelectedWorkoutId(null);
    setEventType(null);
  };

  const handleDeleteSession = async (id: string) => {
    await supabase.from('scheduled_sessions').delete().eq('id', id);
    toast.success('Session removed');
    fetchSessions();
  };

  const handleSessionClick = (session: ScheduledSession) => {
    if (session.workout_id) {
      navigate(`/workout?day=${session.workout_id}`);
    }
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
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg bg-secondary",
                    s.workout_id && "cursor-pointer hover:bg-secondary/80 transition-colors"
                  )}
                  onClick={() => handleSessionClick(s)}
                >
                  <Dumbbell className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium flex-1">{s.title}</span>
                  {s.workout_id && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }} className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
                </div>
              )) : (
                <p className="text-[10px] text-muted-foreground">No sessions scheduled</p>
              )}
            </div>
          )}
          {/* Add Session Form */}
          {showAddSession && (
            <div className="px-4 pb-3 space-y-3 border-t border-border pt-3">
              {/* Event type selector */}
              {eventType === null && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">What would you like to schedule?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEventType('workout')}
                      className="flex-1 p-3 rounded-xl border border-border bg-card text-center hover:border-primary/50 transition-colors"
                    >
                      <Dumbbell className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-xs font-medium">Workout Day</p>
                    </button>
                    <button
                      onClick={() => setEventType('other')}
                      className="flex-1 p-3 rounded-xl border border-border bg-card text-center hover:border-primary/50 transition-colors"
                    >
                      <CalendarIcon className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-xs font-medium">Other Event</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Workout day picker */}
              {eventType === 'workout' && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">Choose workout day</p>
                  {workoutDays.length > 0 ? (
                    <div className="space-y-1.5">
                      {workoutDays.map(w => (
                        <button
                          key={w.id}
                          onClick={() => setSelectedWorkoutId(w.id)}
                          className={cn(
                            "w-full flex items-center gap-2 p-2.5 rounded-xl border text-left text-sm transition-colors",
                            selectedWorkoutId === w.id
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-card text-muted-foreground hover:border-primary/30"
                          )}
                        >
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {w.day_number}
                          </div>
                          <span className="font-medium">{w.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No workout plan found. Complete onboarding first.</p>
                  )}
                </div>
              )}

              {/* Custom event name */}
              {eventType === 'other' && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">Event name</p>
                  <Input
                    value={sessionTitle}
                    onChange={e => setSessionTitle(e.target.value)}
                    placeholder="e.g. Yoga, Swimming, Rest day..."
                    className="rounded-xl text-sm h-9"
                    maxLength={50}
                  />
                </div>
              )}

              {/* Action buttons */}
              {eventType !== null && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddSession}
                    disabled={saving || (eventType === 'workout' && !selectedWorkoutId) || (eventType === 'other' && !sessionTitle.trim())}
                    size="sm"
                    className="rounded-xl gradient-primary text-primary-foreground text-xs flex-1"
                  >
                    {saving ? 'Saving...' : `Schedule for ${selectedDate ? format(selectedDate, 'MMM d') : '...'}`}
                  </Button>
                  <Button onClick={resetForm} size="sm" variant="outline" className="rounded-xl text-xs">Cancel</Button>
                </div>
              )}

              {eventType === null && (
                <Button onClick={resetForm} size="sm" variant="outline" className="rounded-xl text-xs w-full">Cancel</Button>
              )}
            </div>
          )}
        </motion.div>

        {/* Body Weight Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Body Weight</h3>
            {bodyweightData.length >= 2 && (() => {
              const delta = bodyweightData[bodyweightData.length - 1].value - bodyweightData[0].value;
              const sign = delta > 0 ? '+' : '';
              return <span className={cn("ml-auto text-xs font-medium", delta > 0 ? 'text-destructive' : delta < 0 ? 'text-green-500' : 'text-muted-foreground')}>{sign}{delta.toFixed(1)} kg</span>;
            })()}
          </div>
          {bodyweightData.length > 0 ? (
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bodyweightData}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#weightGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-36 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">No weight data yet. Log your bodyweight from the dashboard.</p>
            </div>
          )}
        </motion.div>

        {/* Steps Chart - only show if enabled */}
        {flags.step_tracking_enabled && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="p-4 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Footprints className="h-4 w-4 text-info" />
            <h3 className="font-semibold text-sm">Steps</h3>
            {stepsData.length > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                Avg {Math.round(stepsData.reduce((s, d) => s + d.value, 0) / stepsData.length).toLocaleString()}
              </span>
            )}
          </div>
          {stepsData.length > 0 ? (
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stepsData}>
                  <defs>
                    <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis hide />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--info))" strokeWidth={2} fill="url(#stepsGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-36 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">No step data yet</p>
            </div>
          )}
        </motion.div>
        )}

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
