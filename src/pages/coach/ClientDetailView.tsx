import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, TrendingUp, Footprints, Settings2, Clock, UtensilsCrossed, Dumbbell, ChevronDown, ChevronUp, Pencil, Check, X, Plus, Trash2 } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WorkoutPlan {
  id: string;
  name: string;
  split_type: string;
  frequency: number;
  cycle_week: number;
  is_active: boolean | null;
  created_at: string;
}

interface WorkoutWithExercises {
  id: string;
  name: string;
  day_number: number;
  exercises: WorkoutExerciseDetail[];
}

interface WorkoutExerciseDetail {
  id: string;
  exercise_id: string;
  exercise_name: string;
  muscle_group: string;
  sets: number;
  rep_range_min: number;
  rep_range_max: number;
  target_weight: number | null;
  sort_order: number;
  recent_logs: { set_number: number; weight: number; reps: number; completed_at: string }[];
}

export default function ClientDetailView() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [clientName, setClientName] = useState('');
  const [bodyweightData, setBodyweightData] = useState<{ date: string; weight: number }[]>([]);
  const [stepsData, setStepsData] = useState<{ date: string; steps: number }[]>([]);
  
  const [weeklyCheckins, setWeeklyCheckins] = useState<any[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<any[]>([]);
  const [foodLogs, setFoodLogs] = useState<any[]>([]);
  const [flags, setFlags] = useState({ food_tracking_enabled: false, step_tracking_enabled: true, cardio_tracking_enabled: false });
  const [flagsId, setFlagsId] = useState<string | null>(null);

  // Program tab state
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ sets: number; rep_range_min: number; rep_range_max: number; target_weight: number | null }>({ sets: 3, rep_range_min: 8, rep_range_max: 12, target_weight: null });
  const [loadingProgram, setLoadingProgram] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<{ id: string; name: string; muscle_group: string }[]>([]);
  const [addExerciseDialog, setAddExerciseDialog] = useState<string | null>(null); // workout_id
  const [selectedNewExercise, setSelectedNewExercise] = useState('');

  useEffect(() => {
    if (!clientId) return;

    supabase.from('profiles').select('full_name').eq('user_id', clientId).maybeSingle()
      .then(({ data }) => { if (data) setClientName(data.full_name); });

    supabase.from('bodyweight_logs').select('weight, logged_at').eq('user_id', clientId).order('logged_at', { ascending: true }).limit(30)
      .then(({ data }) => { if (data) setBodyweightData(data.map(d => ({ date: format(new Date(d.logged_at), 'MM/dd'), weight: d.weight }))); });

    supabase.from('step_logs').select('steps, logged_at').eq('user_id', clientId).order('logged_at', { ascending: true }).limit(30)
      .then(({ data }) => { if (data) setStepsData(data.map(d => ({ date: format(new Date(d.logged_at), 'MM/dd'), steps: d.steps }))); });

    supabase.from('weekly_check_ins').select('*').eq('user_id', clientId).order('week_start', { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setWeeklyCheckins(data); });

    supabase.from('workout_sessions').select('*').eq('user_id', clientId).order('started_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setWorkoutSessions(data); });

    supabase.from('food_logs').select('*').eq('user_id', clientId).order('logged_at', { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setFoodLogs(data); });

    supabase.from('feature_flags').select('*').eq('user_id', clientId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFlags({ food_tracking_enabled: data.food_tracking_enabled ?? false, step_tracking_enabled: data.step_tracking_enabled ?? true, cardio_tracking_enabled: data.cardio_tracking_enabled ?? false });
          setFlagsId(data.id);
        }
      });

    // Fetch workout plans for this client
    supabase.from('workout_plans').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setPlans(data as WorkoutPlan[]);
          const active = data.find(p => p.is_active);
          if (active) setSelectedPlanId(active.id);
          else if (data.length > 0) setSelectedPlanId(data[0].id);
        }
      });

    // Fetch available exercises
    supabase.from('exercises').select('id, name, muscle_group').order('name')
      .then(({ data }) => { if (data) setAvailableExercises(data); });
  }, [clientId]);

  // Fetch workouts + exercises when plan changes
  useEffect(() => {
    if (!selectedPlanId || !clientId) return;
    fetchPlanWorkouts();
  }, [selectedPlanId]);

  const fetchPlanWorkouts = async () => {
    if (!selectedPlanId || !clientId) return;
    setLoadingProgram(true);

    const { data: workoutsData } = await supabase
      .from('workouts')
      .select('id, name, day_number')
      .eq('plan_id', selectedPlanId)
      .order('day_number');

    if (!workoutsData) { setLoadingProgram(false); return; }

    const workoutsWithExercises: WorkoutWithExercises[] = [];

    for (const w of workoutsData) {
      const { data: exData } = await supabase
        .from('workout_exercises')
        .select('id, exercise_id, sets, rep_range_min, rep_range_max, target_weight, sort_order, exercises(name, muscle_group)')
        .eq('workout_id', w.id)
        .order('sort_order');

      const exercises: WorkoutExerciseDetail[] = [];

      for (const ex of (exData || [])) {
        // Fetch recent logs for this exercise
        const { data: logs } = await supabase
          .from('workout_logs')
          .select('set_number, weight, reps, completed_at')
          .eq('workout_exercise_id', ex.id)
          .eq('user_id', clientId)
          .order('completed_at', { ascending: false })
          .limit(10);

        exercises.push({
          id: ex.id,
          exercise_id: ex.exercise_id,
          exercise_name: (ex.exercises as any)?.name || 'Unknown',
          muscle_group: (ex.exercises as any)?.muscle_group || '',
          sets: ex.sets,
          rep_range_min: ex.rep_range_min,
          rep_range_max: ex.rep_range_max,
          target_weight: ex.target_weight,
          sort_order: ex.sort_order,
          recent_logs: (logs || []).map(l => ({
            set_number: l.set_number,
            weight: l.weight,
            reps: l.reps,
            completed_at: l.completed_at,
          })),
        });
      }

      workoutsWithExercises.push({ id: w.id, name: w.name, day_number: w.day_number, exercises });
    }

    setWorkouts(workoutsWithExercises);
    setLoadingProgram(false);
  };

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

  const startEditExercise = (ex: WorkoutExerciseDetail) => {
    setEditingExercise(ex.id);
    setEditValues({ sets: ex.sets, rep_range_min: ex.rep_range_min, rep_range_max: ex.rep_range_max, target_weight: ex.target_weight });
  };

  const saveExerciseEdit = async (exerciseId: string) => {
    const { error } = await supabase.from('workout_exercises').update({
      sets: editValues.sets,
      rep_range_min: editValues.rep_range_min,
      rep_range_max: editValues.rep_range_max,
      target_weight: editValues.target_weight,
    }).eq('id', exerciseId);

    if (error) { toast.error('Failed to update'); return; }
    toast.success('Exercise updated');
    setEditingExercise(null);
    fetchPlanWorkouts();
  };

  const deleteExerciseFromWorkout = async (exerciseId: string) => {
    const { error } = await supabase.from('workout_exercises').delete().eq('id', exerciseId);
    if (error) { toast.error('Failed to remove'); return; }
    toast.success('Exercise removed');
    fetchPlanWorkouts();
  };

  const addExerciseToWorkout = async (workoutId: string) => {
    if (!selectedNewExercise) return;
    const maxOrder = workouts.find(w => w.id === workoutId)?.exercises.reduce((max, e) => Math.max(max, e.sort_order), 0) ?? 0;
    const { error } = await supabase.from('workout_exercises').insert({
      workout_id: workoutId,
      exercise_id: selectedNewExercise,
      sets: 3,
      rep_range_min: 8,
      rep_range_max: 12,
      sort_order: maxOrder + 1,
    });
    if (error) { toast.error('Failed to add exercise'); return; }
    toast.success('Exercise added');
    setAddExerciseDialog(null);
    setSelectedNewExercise('');
    fetchPlanWorkouts();
  };

  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-4 pb-24">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/coach')} className="text-muted-foreground"><ChevronLeft className="h-6 w-6" /></button>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold">{clientName || 'Client'}</h1>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-6 rounded-xl bg-secondary h-9">
            <TabsTrigger value="overview" className="text-[9px] rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="program" className="text-[9px] rounded-lg">Program</TabsTrigger>
            <TabsTrigger value="sessions" className="text-[9px] rounded-lg">Sessions</TabsTrigger>
            <TabsTrigger value="nutrition" className="text-[9px] rounded-lg">Nutrition</TabsTrigger>
            <TabsTrigger value="checkins" className="text-[9px] rounded-lg">Check-ins</TabsTrigger>
            <TabsTrigger value="settings" className="text-[9px] rounded-lg">Settings</TabsTrigger>
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

          {/* PROGRAM TAB */}
          <TabsContent value="program" className="space-y-4 mt-4">
            {plans.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">No workout plans yet</p>
                <p className="text-xs text-muted-foreground">Create a plan for this client from the workout builder.</p>
              </div>
            ) : (
              <>
                {/* Plan Selector */}
                <div className="flex items-center gap-2">
                  <Select value={selectedPlanId || ''} onValueChange={setSelectedPlanId}>
                    <SelectTrigger className="rounded-xl h-9 text-sm">
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} {p.is_active ? '(Active)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {loadingProgram ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Loading program...</div>
                ) : workouts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No workouts in this plan</p>
                ) : (
                  workouts.map(workout => (
                    <div key={workout.id} className="rounded-2xl bg-card border border-border overflow-hidden">
                      {/* Workout Header */}
                      <button
                        onClick={() => setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id)}
                        className="w-full flex items-center justify-between p-4 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Dumbbell className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{workout.name}</p>
                            <p className="text-[10px] text-muted-foreground">Day {workout.day_number} · {workout.exercises.length} exercises</p>
                          </div>
                        </div>
                        {expandedWorkout === workout.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </button>

                      {/* Exercises */}
                      {expandedWorkout === workout.id && (
                        <div className="border-t border-border">
                          {workout.exercises.map(ex => (
                            <div key={ex.id} className="p-3 border-b border-border last:border-b-0 space-y-2">
                              {editingExercise === ex.id ? (
                                /* Edit Mode */
                                <div className="space-y-3">
                                  <p className="text-sm font-medium">{ex.exercise_name}</p>
                                  <div className="grid grid-cols-4 gap-2">
                                    <div>
                                      <label className="text-[9px] text-muted-foreground">Sets</label>
                                      <Input type="number" value={editValues.sets} onChange={e => setEditValues(v => ({ ...v, sets: parseInt(e.target.value) || 0 }))} className="h-8 text-xs rounded-lg" />
                                    </div>
                                    <div>
                                      <label className="text-[9px] text-muted-foreground">Min Reps</label>
                                      <Input type="number" value={editValues.rep_range_min} onChange={e => setEditValues(v => ({ ...v, rep_range_min: parseInt(e.target.value) || 0 }))} className="h-8 text-xs rounded-lg" />
                                    </div>
                                    <div>
                                      <label className="text-[9px] text-muted-foreground">Max Reps</label>
                                      <Input type="number" value={editValues.rep_range_max} onChange={e => setEditValues(v => ({ ...v, rep_range_max: parseInt(e.target.value) || 0 }))} className="h-8 text-xs rounded-lg" />
                                    </div>
                                    <div>
                                      <label className="text-[9px] text-muted-foreground">Target kg</label>
                                      <Input type="number" value={editValues.target_weight ?? ''} onChange={e => setEditValues(v => ({ ...v, target_weight: e.target.value ? parseFloat(e.target.value) : null }))} className="h-8 text-xs rounded-lg" placeholder="—" />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => saveExerciseEdit(ex.id)} className="h-7 text-xs rounded-lg gradient-primary text-primary-foreground flex-1">
                                      <Check className="h-3 w-3 mr-1" /> Save
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingExercise(null)} className="h-7 text-xs rounded-lg">
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                /* View Mode */
                                <>
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="text-sm font-medium">{ex.exercise_name}</p>
                                      <p className="text-[10px] text-muted-foreground capitalize">{ex.muscle_group}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => startEditExercise(ex)} className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center">
                                        <Pencil className="h-3 w-3 text-muted-foreground" />
                                      </button>
                                      <button onClick={() => deleteExerciseFromWorkout(ex.id)} className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center">
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex gap-3 text-[11px]">
                                    <span className="px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">{ex.sets} sets</span>
                                    <span className="px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">{ex.rep_range_min}-{ex.rep_range_max} reps</span>
                                    {ex.target_weight && (
                                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{ex.target_weight} kg</span>
                                    )}
                                  </div>

                                  {/* Recent Logs */}
                                  {ex.recent_logs.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-[10px] text-muted-foreground font-medium">Recent Performance</p>
                                      {/* Group by session date */}
                                      {(() => {
                                        const sessions = new Map<string, typeof ex.recent_logs>();
                                        ex.recent_logs.forEach(l => {
                                          const key = format(new Date(l.completed_at), 'MMM d');
                                          if (!sessions.has(key)) sessions.set(key, []);
                                          sessions.get(key)!.push(l);
                                        });
                                        return Array.from(sessions.entries()).slice(0, 3).map(([date, logs]) => (
                                          <div key={date} className="flex items-center gap-2">
                                            <span className="text-[9px] text-muted-foreground w-12 shrink-0">{date}</span>
                                            <div className="flex gap-1 flex-wrap">
                                              {logs.sort((a, b) => a.set_number - b.set_number).map((l, i) => (
                                                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-foreground">
                                                  {l.weight}kg×{l.reps}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        ));
                                      })()}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ))}

                          {/* Add Exercise Button */}
                          <button
                            onClick={() => setAddExerciseDialog(workout.id)}
                            className="w-full p-3 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Exercise
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </>
            )}
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

          <TabsContent value="nutrition" className="space-y-3 mt-4">
            {foodLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No nutrition logs yet</p>
            ) : (
              <>
                {(() => {
                  const today = foodLogs.length > 0 ? format(new Date(foodLogs[0].logged_at), 'yyyy-MM-dd') : '';
                  const todayLogs = foodLogs.filter(l => format(new Date(l.logged_at), 'yyyy-MM-dd') === today);
                  const totals = todayLogs.reduce((acc, l) => ({
                    calories: acc.calories + (l.calories || 0),
                    protein: acc.protein + (l.protein || 0),
                    carbs: acc.carbs + (l.carbs || 0),
                    fat: acc.fat + (l.fat || 0),
                  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
                  return (
                    <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium">Daily Summary – {format(new Date(today), 'MMM d')}</p>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center"><p className="text-lg font-bold">{totals.calories}</p><p className="text-[9px] text-muted-foreground">kcal</p></div>
                        <div className="text-center"><p className="text-lg font-bold text-blue-500">{totals.protein}g</p><p className="text-[9px] text-muted-foreground">Protein</p></div>
                        <div className="text-center"><p className="text-lg font-bold text-amber-500">{totals.carbs}g</p><p className="text-[9px] text-muted-foreground">Carbs</p></div>
                        <div className="text-center"><p className="text-lg font-bold text-rose-500">{totals.fat}g</p><p className="text-[9px] text-muted-foreground">Fat</p></div>
                      </div>
                    </div>
                  );
                })()}

                {foodLogs.map(log => (
                  <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{log.food_name}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(log.logged_at), 'MMM d, HH:mm')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">{log.calories} kcal</p>
                      <p className="text-[9px] text-muted-foreground">P{log.protein} C{log.carbs} F{log.fat}</p>
                    </div>
                  </div>
                ))}
              </>
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

      {/* Add Exercise Dialog */}
      <Dialog open={!!addExerciseDialog} onOpenChange={open => { if (!open) setAddExerciseDialog(null); }}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Add Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={selectedNewExercise} onValueChange={setSelectedNewExercise}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select exercise" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {availableExercises.map(ex => (
                  <SelectItem key={ex.id} value={ex.id}>
                    {ex.name} <span className="text-muted-foreground capitalize">({ex.muscle_group})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => addExerciseDialog && addExerciseToWorkout(addExerciseDialog)}
              disabled={!selectedNewExercise}
              className="w-full gradient-primary text-primary-foreground rounded-xl"
            >
              Add to Workout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
