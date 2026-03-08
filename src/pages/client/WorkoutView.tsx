import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowRight, ArrowDown, Check, RefreshCw, Play, ChevronLeft, Square, Clock, Trophy, ChevronDown, ChevronUp, Video, Dumbbell } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SetLog {
  reps: number;
  weight: number;
  completed: boolean;
  arrow?: 'up' | 'maintain' | 'down';
}

interface AlternativeExercise {
  id: string;
  name: string;
  muscle_group: string;
  movement_type: string;
  video_url?: string | null;
}

interface ExerciseState {
  name: string;
  targetSets: number;
  repMin: number;
  repMax: number;
  targetWeight: number;
  sets: SetLog[];
  muscleGroup: string;
  workoutExerciseId?: string;
  exerciseId?: string;
  videoUrl?: string | null;
  description?: string;
}

const mockExercises: ExerciseState[] = [
  { name: 'Barbell Bench Press', targetSets: 3, repMin: 8, repMax: 12, targetWeight: 70, sets: [], muscleGroup: 'Chest' },
  { name: 'Overhead Press', targetSets: 3, repMin: 8, repMax: 12, targetWeight: 40, sets: [], muscleGroup: 'Shoulders' },
  { name: 'Tricep Pushdown', targetSets: 3, repMin: 10, repMax: 15, targetWeight: 25, sets: [], muscleGroup: 'Triceps' },
  { name: 'Incline Dumbbell Fly', targetSets: 3, repMin: 10, repMax: 15, targetWeight: 14, sets: [], muscleGroup: 'Chest' },
];

export default function WorkoutView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentExercise, setCurrentExercise] = useState(0);
  const [exercises, setExercises] = useState<ExerciseState[]>(mockExercises);
  const [currentSet, setCurrentSet] = useState(0);
  const [reps, setReps] = useState(0);
  const [weight, setWeight] = useState(mockExercises[0].targetWeight);
  const [completedSets, setCompletedSets] = useState<SetLog[][]>(mockExercises.map(() => []));
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [workoutFinished, setWorkoutFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [alternatives, setAlternatives] = useState<AlternativeExercise[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [workoutName, setWorkoutName] = useState('Push Day');
  const [planInfo, setPlanInfo] = useState<{ cycle_week: number; name: string } | null>(null);
  const [activeWorkouts, setActiveWorkouts] = useState<{ id: string; name: string; day_number: number }[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  // Load exercises from active workout plan
  useEffect(() => {
    if (!user) return;
    const loadPlan = async () => {
      setLoadingPlan(true);
      
      // Get active plan
      const { data: planData } = await supabase
        .from('workout_plans')
        .select('id, name, cycle_week')
        .eq('client_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!planData) {
        setLoadingPlan(false);
        return; // Will fall back to mock exercises
      }

      setPlanInfo({ cycle_week: planData.cycle_week, name: planData.name });

      // Get workouts for this plan
      const { data: workoutsData } = await supabase
        .from('workouts')
        .select('id, name, day_number')
        .eq('plan_id', planData.id)
        .order('day_number');

      if (!workoutsData || workoutsData.length === 0) {
        setLoadingPlan(false);
        return;
      }

      setActiveWorkouts(workoutsData);
      // Auto-select first workout
      setSelectedWorkoutId(workoutsData[0].id);
      setLoadingPlan(false);
    };
    loadPlan();
  }, [user]);

  // Load exercises when workout selection changes
  useEffect(() => {
    if (!selectedWorkoutId || !user) return;
    const loadExercises = async () => {
      const workout = activeWorkouts.find(w => w.id === selectedWorkoutId);
      if (workout) setWorkoutName(workout.name);

      const { data: exData } = await supabase
        .from('workout_exercises')
        .select('id, exercise_id, sets, rep_range_min, rep_range_max, target_weight, sort_order, exercises(name, muscle_group, video_url, description)')
        .eq('workout_id', selectedWorkoutId)
        .order('sort_order');

      if (exData && exData.length > 0) {
        const loaded: ExerciseState[] = exData.map(ex => ({
          name: (ex.exercises as any)?.name || 'Unknown',
          targetSets: ex.sets,
          repMin: ex.rep_range_min,
          repMax: ex.rep_range_max,
          targetWeight: ex.target_weight || 0,
          sets: [],
          muscleGroup: ((ex.exercises as any)?.muscle_group || 'other').charAt(0).toUpperCase() + ((ex.exercises as any)?.muscle_group || 'other').slice(1),
          workoutExerciseId: ex.id,
          exerciseId: ex.exercise_id,
          videoUrl: (ex.exercises as any)?.video_url,
          description: (ex.exercises as any)?.description,
        }));
        setExercises(loaded);
        setCompletedSets(loaded.map(() => []));
        setWeight(loaded[0].targetWeight);
        setCurrentExercise(0);
        setCurrentSet(0);
        setReps(0);
      }
    };
    loadExercises();
  }, [selectedWorkoutId, user]);

  // Timer
  useEffect(() => {
    if (workoutStarted && startTime && !workoutFinished) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [workoutStarted, startTime, workoutFinished]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const exercise = exercises[currentExercise];

  const handleOpenSwap = async (index: number) => {
    setSwapIndex(index);
    setSwapDialogOpen(true);
    setLoadingAlternatives(true);

    const ex = exercises[index];
    // Fetch alternatives from same muscle group
    const { data } = await supabase.from('exercises').select('id, name, muscle_group, movement_type, video_url')
      .eq('muscle_group', ex.muscleGroup.toLowerCase())
      .neq('name', ex.name)
      .limit(10);

    setAlternatives((data || []) as AlternativeExercise[]);
    setLoadingAlternatives(false);
  };

  const handleSwapExercise = (alt: AlternativeExercise) => {
    if (swapIndex === null) return;
    const updated = [...exercises];
    updated[swapIndex] = {
      ...updated[swapIndex],
      name: alt.name,
      muscleGroup: alt.muscle_group.charAt(0).toUpperCase() + alt.muscle_group.slice(1),
      exerciseId: alt.id,
      videoUrl: alt.video_url,
    };
    setExercises(updated);
    setSwapDialogOpen(false);
    toast.success(`Swapped to ${alt.name}`);
  };

  const handleStartWorkout = async () => {
    setWorkoutStarted(true);
    const now = new Date();
    setStartTime(now);

    if (user) {
      const { data } = await supabase.from('workout_sessions').insert({
        user_id: user.id,
        started_at: now.toISOString(),
        total_exercises: exercises.length,
      }).select('id').single();
      if (data) setSessionId(data.id);
    }
  };

  const handleLogSet = async () => {
    const newSets = [...completedSets];
    newSets[currentExercise] = [...newSets[currentExercise], { reps, weight, completed: true }];
    setCompletedSets(newSets);

    // Save to workout_logs
    if (user && exercise.workoutExerciseId) {
      await supabase.from('workout_logs').insert({
        user_id: user.id,
        workout_exercise_id: exercise.workoutExerciseId,
        set_number: newSets[currentExercise].length,
        reps, weight,
      });
    }

    if (newSets[currentExercise].length >= exercise.targetSets) {
      if (currentExercise < exercises.length - 1) {
        // Move to next exercise
        setCurrentExercise(currentExercise + 1);
        setCurrentSet(0);
        setWeight(exercises[currentExercise + 1].targetWeight);
        setReps(0);
      } else {
        // Last set of last exercise — auto-end workout
        handleEndWorkout();
      }
    } else {
      setCurrentSet(currentSet + 1);
      setReps(0);
    }
  };

  const handleArrow = (direction: 'up' | 'maintain' | 'down') => {
    const newSets = [...completedSets];
    const lastSet = newSets[currentExercise][newSets[currentExercise].length - 1];
    if (lastSet) lastSet.arrow = direction;
    setCompletedSets(newSets);
  };

  const handleEndWorkout = async () => {
    const now = new Date();
    const durationSeconds = startTime ? Math.floor((now.getTime() - startTime.getTime()) / 1000) : 0;
    const totalSets = completedSets.reduce((sum, sets) => sum + sets.length, 0);
    const totalReps = completedSets.reduce((sum, sets) => sum + sets.reduce((s, set) => s + set.reps, 0), 0);
    const exercisesCompleted = completedSets.filter(sets => sets.length > 0).length;

    if (user && sessionId) {
      await supabase.from('workout_sessions').update({
        ended_at: now.toISOString(),
        duration_seconds: durationSeconds,
        exercises_completed: exercisesCompleted,
        total_sets_completed: totalSets,
        total_reps: totalReps,
        completed: true,
      }).eq('id', sessionId);
    }

    setWorkoutFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
    toast.success('Workout saved!');
  };

  // Summary screen
  if (workoutFinished) {
    const totalSets = completedSets.reduce((sum, sets) => sum + sets.length, 0);
    const totalRepsCount = completedSets.reduce((sum, sets) => sum + sets.reduce((s, set) => s + set.reps, 0), 0);
    const exercisesCompleted = completedSets.filter(sets => sets.length > 0).length;

    return (
      <MobileLayout hideNav>
        <div className="px-5 pt-12 space-y-6 flex flex-col items-center text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}>
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center">
              <Trophy className="h-10 w-10 text-primary-foreground" />
            </div>
          </motion.div>
          <div>
            <h1 className="text-2xl font-display font-bold">Workout Complete!</h1>
            <p className="text-muted-foreground text-sm mt-1">Great session 💪</p>
          </div>
          <div className="grid grid-cols-3 gap-4 w-full">
            <div className="p-4 rounded-2xl bg-card border border-border">
              <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{formatTime(elapsed)}</p>
              <p className="text-[10px] text-muted-foreground">Duration</p>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border">
              <p className="text-lg font-bold">{totalSets}</p>
              <p className="text-[10px] text-muted-foreground">Sets</p>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border">
              <p className="text-lg font-bold">{totalRepsCount}</p>
              <p className="text-[10px] text-muted-foreground">Total Reps</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{exercisesCompleted}/{exercises.length} exercises completed</p>
          <Button onClick={() => navigate('/dashboard')} className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-semibold">
            Back to Dashboard
          </Button>
        </div>
      </MobileLayout>
    );
  }

  if (!workoutStarted) {
    return (
      <MobileLayout>
        <div className="px-5 pt-6 space-y-6">
          <h1 className="text-2xl font-display font-bold">Push Day</h1>
          <p className="text-muted-foreground text-sm">Week 2 · Cycle 1</p>

          <div className="space-y-3">
            {exercises.map((ex, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="rounded-2xl bg-card border border-border overflow-hidden">
                  {/* Exercise Header */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => setExpandedExercise(expandedExercise === i ? null : i)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{i + 1}</div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">{ex.targetSets} sets · {ex.repMin}-{ex.repMax} reps · {ex.targetWeight}kg</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenSwap(i); }}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    {expandedExercise === i ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedExercise === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{ex.muscleGroup}</span>
                          </div>
                          {ex.videoUrl && (
                            <div className="rounded-xl overflow-hidden bg-secondary">
                              {ex.videoUrl.includes('youtube') || ex.videoUrl.includes('youtu.be') ? (
                                <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-3 text-sm text-primary hover:underline">
                                  <Video className="h-4 w-4" /> Watch Video
                                </a>
                              ) : (
                                <video src={ex.videoUrl} controls className="w-full h-32 object-cover" />
                              )}
                            </div>
                          )}
                          {ex.description && (
                            <p className="text-xs text-muted-foreground">{ex.description}</p>
                          )}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-lg bg-secondary">
                              <p className="text-sm font-bold">{ex.targetSets}</p>
                              <p className="text-[10px] text-muted-foreground">Sets</p>
                            </div>
                            <div className="p-2 rounded-lg bg-secondary">
                              <p className="text-sm font-bold">{ex.repMin}-{ex.repMax}</p>
                              <p className="text-[10px] text-muted-foreground">Reps</p>
                            </div>
                            <div className="p-2 rounded-lg bg-secondary">
                              <p className="text-sm font-bold">{ex.targetWeight}kg</p>
                              <p className="text-[10px] text-muted-foreground">Target</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>

          <Button onClick={handleStartWorkout} className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-semibold text-base">
            <Play className="h-5 w-5 mr-2" /> Start Workout
          </Button>
        </div>

        {/* Swap Alternatives Dialog */}
        <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">Swap Exercise</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {loadingAlternatives ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading alternatives...</div>
              ) : alternatives.length > 0 ? (
                alternatives.map((alt) => (
                  <button
                    key={alt.id}
                    onClick={() => handleSwapExercise(alt)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Dumbbell className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alt.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{alt.muscle_group} · {alt.movement_type}</p>
                    </div>
                    {alt.video_url && <Video className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">No alternatives found for this muscle group</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout hideNav>
      <div className="px-5 pt-6 space-y-5">
        {/* Header with timer */}
        <div className="flex items-center gap-3">
          <button onClick={() => setWorkoutStarted(false)} className="text-muted-foreground">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Exercise {currentExercise + 1}/{exercises.length}</p>
            <h2 className="font-display font-bold text-lg">{exercise.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground font-mono">
              <Clock className="h-3 w-3 inline mr-1" />{formatTime(elapsed)}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {exercise.muscleGroup}
            </span>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex gap-1.5">
          {exercises.map((_, i) => (
            <div key={i} className={cn("h-1.5 rounded-full flex-1 transition-colors",
              i < currentExercise ? "bg-primary" : i === currentExercise ? "bg-primary/50" : "bg-secondary")} />
          ))}
        </div>

        {/* Set Info */}
        <div className="text-center py-4 space-y-1">
          <p className="text-muted-foreground text-sm">Set {completedSets[currentExercise].length + 1} of {exercise.targetSets}</p>
          <p className="text-sm text-muted-foreground">Target: {exercise.repMin}-{exercise.repMax} reps @ {exercise.targetWeight}kg</p>
        </div>

        {/* Input Area */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground text-center block">Weight (kg)</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setWeight(Math.max(0, weight - 2.5))} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg font-bold">−</button>
              <div className="flex-1 h-14 rounded-xl bg-card border border-border flex items-center justify-center text-2xl font-display font-bold">{weight}</div>
              <button onClick={() => setWeight(weight + 2.5)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg font-bold">+</button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground text-center block">Reps</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setReps(Math.max(0, reps - 1))} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg font-bold">−</button>
              <div className="flex-1 h-14 rounded-xl bg-card border border-border flex items-center justify-center text-2xl font-display font-bold">{reps}</div>
              <button onClick={() => setReps(reps + 1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg font-bold">+</button>
            </div>
          </div>
        </div>

        {/* Log Set Button */}
        <Button onClick={handleLogSet} disabled={reps === 0} className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-semibold text-base">
          <Check className="h-5 w-5 mr-2" /> Log Set
        </Button>

        {/* End Workout Button */}
        <Button onClick={handleEndWorkout} variant="outline" className="w-full h-12 rounded-2xl border-destructive text-destructive hover:bg-destructive/10 font-semibold text-sm">
          <Square className="h-4 w-4 mr-2" /> End Workout
        </Button>

        {/* Arrow Method */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">How did it feel?</p>
          <div className="flex gap-3 justify-center">
            {[
              { dir: 'up' as const, icon: ArrowUp, label: 'Increase', color: 'text-primary' },
              { dir: 'maintain' as const, icon: ArrowRight, label: 'Maintain', color: 'text-warning' },
              { dir: 'down' as const, icon: ArrowDown, label: 'Decrease', color: 'text-destructive' },
            ].map(({ dir, icon: Icon, label, color }) => (
              <button key={dir} onClick={() => handleArrow(dir)}
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
                <Icon className={cn("h-5 w-5", color)} />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Completed Sets */}
        <AnimatePresence>
          {completedSets[currentExercise].length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
              <p className="text-xs text-muted-foreground">Completed Sets</p>
              {completedSets[currentExercise].map((set, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{i + 1}</div>
                  <span className="text-sm">{set.weight}kg × {set.reps} reps</span>
                  {set.arrow && <span className="ml-auto text-xs text-muted-foreground">{set.arrow === 'up' ? '↑' : set.arrow === 'down' ? '↓' : '→'}</span>}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
