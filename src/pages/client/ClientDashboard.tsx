import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Bell, Play, ChevronRight, TrendingUp, Footprints } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const warmupCategories = ['Legs', 'Full Body', 'Running', 'Arms / Hands', 'Mobility', 'Stretching'];

interface WarmupVideo {
  id: string;
  name: string;
  video_url: string | null;
  category: string;
  muscle_group: string;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Athlete';
  const today = new Date();

  const [warmupVideos, setWarmupVideos] = useState<WarmupVideo[]>([]);
  const [bodyweightData, setBodyweightData] = useState<{ date: string; weight: number }[]>([]);
  const [stepsData, setStepsData] = useState<{ date: string; steps: number }[]>([]);
  const [weeklyCheckIn, setWeeklyCheckIn] = useState({ training_difficulty: '', recovery_level: '', energy_level: '' });
  const [checkInSubmitted, setCheckInSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch warmup exercises
    supabase.from('exercises').select('id, name, video_url, category, muscle_group')
      .eq('category', 'warmup')
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

        {/* Warmup Videos Carousel */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
          <h2 className="text-lg font-display font-semibold">Warmup Videos</h2>
          {warmupVideos.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-5 px-5">
              {warmupVideos.map((video) => (
                <div key={video.id} className="flex-shrink-0 w-40">
                  <div className="w-40 h-24 rounded-xl bg-secondary flex items-center justify-center relative overflow-hidden">
                    {video.video_url ? (
                      <video src={video.video_url} className="w-full h-full object-cover rounded-xl" muted />
                    ) : (
                      <Play className="h-8 w-8 text-muted-foreground" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-[10px] text-white font-medium truncate">{video.name}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 capitalize">{video.muscle_group}</p>
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

        {/* Progress Graphs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-card border border-border space-y-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-medium">Bodyweight</p>
            </div>
            {bodyweightData.length > 1 ? (
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={bodyweightData}>
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-20 flex items-center justify-center">
                <p className="text-[10px] text-muted-foreground">No data yet</p>
              </div>
            )}
          </div>
          <div className="p-3 rounded-2xl bg-card border border-border space-y-2">
            <div className="flex items-center gap-1.5">
              <Footprints className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-medium">Steps</p>
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

        {/* Quick Stats / Gadgets */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
          <h2 className="text-lg font-display font-semibold">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Dumbbell, label: 'Workouts', value: '12', sublabel: 'this month' },
              { icon: TrendingUp, label: 'Streak', value: '5', sublabel: 'days' },
            ].map((stat, i) => (
              <div key={stat.label} className="p-4 rounded-2xl bg-card border border-border">
                <stat.icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-2xl font-display font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.sublabel}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="space-y-3">
          <h2 className="text-lg font-display font-semibold">Recent Activity</h2>
          {['Pull Day - Yesterday', 'Leg Day - 2 days ago', 'Push Day - 3 days ago'].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Dumbbell className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.split(' - ')[0]}</p>
                <p className="text-xs text-muted-foreground">{item.split(' - ')[1]}</p>
              </div>
              <span className="text-xs text-primary font-medium">Completed</span>
            </div>
          ))}
        </motion.div>
      </div>
    </MobileLayout>
  );
}
