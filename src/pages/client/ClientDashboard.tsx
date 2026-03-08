import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Bell, Play, ChevronRight, TrendingUp, Footprints, Clock, Scale, Weight } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

const warmupCategories = ['Legs', 'Full Body', 'Running', 'Arms / Hands', 'Mobility', 'Stretching'];

interface WarmupVideo {
  id: string;
  name: string;
  video_url: string | null;
  category: string;
  muscle_group: string;
}

interface RecentSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  completed: boolean;
  duration_seconds: number | null;
  exercises_completed: number | null;
  total_exercises: number | null;
  workout_id: string | null;
  workout_name?: string;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { flags } = useFeatureFlags();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Athlete';
  const today = new Date();

  const [warmupVideos, setWarmupVideos] = useState<WarmupVideo[]>([]);
  const [bodyweightData, setBodyweightData] = useState<{ date: string; weight: number }[]>([]);
  const [stepsData, setStepsData] = useState<{ date: string; steps: number }[]>([]);
  const [weeklyCheckIn, setWeeklyCheckIn] = useState({ training_difficulty: '', recovery_level: '', energy_level: '' });
  const [checkInSubmitted, setCheckInSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);
  const [totalVolume, setTotalVolume] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<WarmupVideo | null>(null);

  const handleLogWeight = async () => {
    if (!user || !newWeight) return;
    const w = parseFloat(newWeight);
    if (isNaN(w) || w <= 0) { toast.error('Enter a valid weight'); return; }
    setSavingWeight(true);
    const { error } = await supabase.from('bodyweight_logs').insert({ user_id: user.id, weight: w });
    if (error) { toast.error('Failed to log weight'); setSavingWeight(false); return; }
    setBodyweightData(prev => [...prev, { date: format(new Date(), 'MM/dd'), weight: w }]);
    setNewWeight('');
    setWeightDialogOpen(false);
    setSavingWeight(false);
    toast.success(`Logged ${w} kg`);
  };

  useEffect(() => {
    if (!user) return;

    // Fetch warmup AND stretching exercises
    supabase.from('exercises').select('id, name, video_url, category, muscle_group')
      .in('category', ['warmup', 'stretching'])
      .then(({ data }) => { if (data) setWarmupVideos(data as WarmupVideo[]); });

    // Fetch bodyweight logs
    supabase.from('bodyweight_logs').select('weight, logged_at')
      .eq('user_id', user.id).order('logged_at', { ascending: true }).limit(14)
      .then(({ data }) => {
        if (data) setBodyweightData(data.map(d => ({ date: format(new Date(d.logged_at), 'MM/dd'), weight: d.weight })));
      });

    // Fetch step logs
    supabase.from('step_logs').select('steps, logged_at')
      .eq('user_id', user.id).order('logged_at', { ascending: true }).limit(14)
      .then(({ data }) => {
        if (data) setStepsData(data.map(d => ({ date: format(new Date(d.logged_at), 'MM/dd'), steps: d.steps })));
      });

    // Fetch recent completed workout sessions
    supabase.from('workout_sessions').select('*')
      .eq('user_id', user.id)
      .eq('completed', true)
      .order('ended_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setRecentSessions(data as RecentSession[]);
      });

    // Count workouts this month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    supabase.from('workout_sessions').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('started_at', monthStart)
      .then(({ count }) => { if (count !== null) setWorkoutCount(count); });

    // Total volume this month
    supabase.from('workout_logs').select('weight, reps')
      .eq('user_id', user.id)
      .gte('completed_at', monthStart)
      .then(({ data }) => {
        if (data) {
          const vol = data.reduce((sum, log) => sum + (log.weight * log.reps), 0);
          setTotalVolume(vol);
        }
      });

    // Check if weekly check-in already submitted this week
    const weekStart = getWeekStart(today);
    supabase.from('weekly_check_ins').select('id')
      .eq('user_id', user.id).eq('week_start', weekStart)
      .maybeSingle()
      .then(({ data }) => { if (data) setCheckInSubmitted(true); });
  }, [user]);

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return format(d, 'yyyy-MM-dd');
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  };

  const handleSubmitCheckIn = async () => {
    if (!user || !weeklyCheckIn.training_difficulty || !weeklyCheckIn.recovery_level || !weeklyCheckIn.energy_level) return;
    setSubmitting(true);
    const weekStart = getWeekStart(today);
    await supabase.from('weekly_check_ins').upsert({
      user_id: user.id,
      week_start: weekStart,
      training_difficulty: weeklyCheckIn.training_difficulty,
      recovery_level: weeklyCheckIn.recovery_level,
      energy_level: weeklyCheckIn.energy_level,
    }, { onConflict: 'user_id,week_start' });
    setCheckInSubmitted(true);
    setSubmitting(false);
  };

  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-5 pb-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{format(today, 'EEEE')}</p>
            <p className="text-xs text-muted-foreground">{format(today, 'MMMM d')}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
              {firstName[0]}
            </div>
            <p className="text-sm font-semibold">{firstName}</p>
          </div>
          <button onClick={() => navigate('/notifications')} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </button>
        </motion.div>

        {/* Today's Workout */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="p-5 rounded-2xl gradient-primary text-primary-foreground space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">Today's Workout</p>
                <p className="text-sm opacity-80">Push Day · 4 exercises · ~60 min</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <Dumbbell className="h-6 w-6" />
              </div>
            </div>
            <button
              onClick={() => navigate('/workout')}
              className="w-full py-3 rounded-xl bg-primary-foreground/20 text-center font-semibold text-sm backdrop-blur-sm hover:bg-primary-foreground/30 transition-colors"
            >
              Start Workout
            </button>
          </div>
        </motion.div>

        {/* Warmup Videos Carousel (includes warmup + stretching) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
          <h2 className="text-lg font-display font-semibold">Warmup & Stretching</h2>
          {warmupVideos.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-5 px-5">
              {warmupVideos.map((video) => (
                <div key={video.id} className="flex-shrink-0 w-40 cursor-pointer" onClick={() => setSelectedVideo(video)}>
                  <div className="w-40 h-24 rounded-xl bg-secondary flex items-center justify-center relative overflow-hidden">
                    <Play className="h-8 w-8 text-primary z-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-[10px] text-white font-medium truncate">{video.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-[10px] text-muted-foreground capitalize">{video.muscle_group}</p>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{video.category}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-5 px-5">
              {warmupCategories.map((cat) => (
                <div key={cat} className="flex-shrink-0 w-32 h-20 rounded-xl bg-secondary flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">{cat}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Bodyweight & Steps side by side */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-3">
          {/* Bodyweight */}
          <div className="p-3 rounded-2xl bg-card border border-border space-y-2 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setWeightDialogOpen(true)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-primary" />
                <p className="text-[11px] font-medium">Bodyweight</p>
              </div>
              {bodyweightData.length >= 2 && (() => {
                const delta = bodyweightData[bodyweightData.length - 1].weight - bodyweightData[0].weight;
                const sign = delta > 0 ? '+' : '';
                const color = delta > 0 ? 'text-red-500' : delta < 0 ? 'text-green-500' : 'text-muted-foreground';
                return (
                  <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-secondary", color)}>
                    {sign}{delta.toFixed(1)}
                  </span>
                );
              })()}
            </div>
            {bodyweightData.length >= 1 ? (
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={bodyweightData} margin={{ top: 5, right: 0, bottom: 0, left: -25 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '10px' }}
                    formatter={(value: number) => [`${value} kg`, 'Weight']}
                  />
                  <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2, fill: 'hsl(var(--primary))' }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-20 flex items-center justify-center">
                <p className="text-[10px] text-muted-foreground">Tap to log weight</p>
              </div>
            )}
          </div>

          {/* Steps - only show if enabled */}
          {flags.step_tracking_enabled && (
          <div className="p-3 rounded-2xl bg-card border border-border space-y-2">
            <div className="flex items-center gap-1">
              <Footprints className="h-3 w-3 text-primary" />
              <p className="text-[11px] font-medium">Steps</p>
            </div>
            {stepsData.length > 1 ? (
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={stepsData}>
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={['dataMin - 500', 'dataMax + 500']} />
                  <Line type="monotone" dataKey="steps" stroke="hsl(var(--info))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-20 flex items-center justify-center">
                <p className="text-[10px] text-muted-foreground">No data yet</p>
              </div>
            )}
          </div>
          )}
        </motion.div>

        {/* Weekly Check-in */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-3">
          <h2 className="text-lg font-display font-semibold">Weekly Check-in</h2>
          {checkInSubmitted ? (
            <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
              <p className="text-sm font-medium text-primary">✓ Submitted this week</p>
              <p className="text-xs text-muted-foreground">Your coach will review your answers</p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-card border border-border space-y-4">
              {/* Training Difficulty */}
              <div className="space-y-2">
                <p className="text-xs font-medium">How hard was training this week?</p>
                <div className="flex gap-2">
                  {['easy', 'moderate', 'hard', 'very_hard'].map(v => (
                    <button key={v} onClick={() => setWeeklyCheckIn(p => ({ ...p, training_difficulty: v }))}
                      className={cn("flex-1 py-2 rounded-xl text-[10px] font-medium border transition-colors capitalize",
                        weeklyCheckIn.training_difficulty === v ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground"
                      )}>{v.replace('_', ' ')}</button>
                  ))}
                </div>
              </div>
              {/* Recovery */}
              <div className="space-y-2">
                <p className="text-xs font-medium">How is your recovery?</p>
                <div className="flex gap-2">
                  {['poor', 'okay', 'good', 'great'].map(v => (
                    <button key={v} onClick={() => setWeeklyCheckIn(p => ({ ...p, recovery_level: v }))}
                      className={cn("flex-1 py-2 rounded-xl text-[10px] font-medium border transition-colors capitalize",
                        weeklyCheckIn.recovery_level === v ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground"
                      )}>{v}</button>
                  ))}
                </div>
              </div>
              {/* Energy */}
              <div className="space-y-2">
                <p className="text-xs font-medium">Energy levels?</p>
                <div className="flex gap-2">
                  {['low', 'moderate', 'high', 'peak'].map(v => (
                    <button key={v} onClick={() => setWeeklyCheckIn(p => ({ ...p, energy_level: v }))}
                      className={cn("flex-1 py-2 rounded-xl text-[10px] font-medium border transition-colors capitalize",
                        weeklyCheckIn.energy_level === v ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground"
                      )}>{v}</button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSubmitCheckIn}
                disabled={submitting || !weeklyCheckIn.training_difficulty || !weeklyCheckIn.recovery_level || !weeklyCheckIn.energy_level}
                className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Check-in'}
              </button>
            </div>
          )}
        </motion.div>

        {/* Quick Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
          <h2 className="text-lg font-display font-semibold">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Dumbbell, label: 'Workouts', value: String(workoutCount), sublabel: 'this month' },
              { icon: Weight, label: 'Volume', value: totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${totalVolume}kg`, sublabel: 'lifted this month' },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-2xl bg-card border border-border">
                <stat.icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-2xl font-display font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.sublabel}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity - from real workout sessions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="space-y-3">
          <h2 className="text-lg font-display font-semibold">Recent Activity</h2>
          {recentSessions.length > 0 ? (
            recentSessions.map((session) => (
              <div key={session.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Dumbbell className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Workout</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(session.ended_at || session.started_at), { addSuffix: true })}</span>
                    {session.duration_seconds && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{formatDuration(session.duration_seconds)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-primary font-medium">Completed</span>
                  {session.exercises_completed != null && session.total_exercises != null && (
                    <p className="text-[10px] text-muted-foreground">{session.exercises_completed}/{session.total_exercises} exercises</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-2xl bg-card border border-border text-center">
              <p className="text-sm text-muted-foreground">No completed workouts yet</p>
              <p className="text-xs text-muted-foreground mt-1">Complete a workout to see it here</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Log Weight Dialog */}
      <Dialog open={weightDialogOpen} onOpenChange={setWeightDialogOpen}>
        <DialogContent className="max-w-xs mx-auto">
          <DialogHeader>
            <DialogTitle>Log Bodyweight</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {bodyweightData.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Last: <span className="font-medium text-foreground">{bodyweightData[bodyweightData.length - 1].weight} kg</span>
              </p>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Weight (kg)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 75.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogWeight()}
                autoFocus
              />
            </div>
            <Button onClick={handleLogWeight} disabled={savingWeight || !newWeight} className="w-full gradient-primary text-primary-foreground">
              {savingWeight ? 'Saving...' : 'Log Weight'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Player Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-base">{selectedVideo?.name}</DialogTitle>
            <p className="text-xs text-muted-foreground capitalize">{selectedVideo?.muscle_group} · {selectedVideo?.category}</p>
          </DialogHeader>
          <div className="w-full aspect-video bg-black">
            {selectedVideo?.video_url ? (
              selectedVideo.video_url.includes('youtube') || selectedVideo.video_url.includes('youtu.be') ? (
                <iframe
                  src={selectedVideo.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  className="w-full h-full"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <video src={selectedVideo.video_url} className="w-full h-full object-contain" controls autoPlay />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No video available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}