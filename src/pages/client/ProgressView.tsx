import { motion } from 'framer-motion';
import { Scale, Footprints, Dumbbell } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from 'recharts';

const weightData = [
  { week: 'W1', value: 82 },
  { week: 'W2', value: 81.5 },
  { week: 'W3', value: 81.2 },
  { week: 'W4', value: 80.8 },
  { week: 'W5', value: 80.3 },
  { week: 'W6', value: 80.1 },
  { week: 'W7', value: 79.6 },
];

const stepsData = [
  { day: 'Mon', value: 8200 },
  { day: 'Tue', value: 10500 },
  { day: 'Wed', value: 7800 },
  { day: 'Thu', value: 12000 },
  { day: 'Fri', value: 9300 },
  { day: 'Sat', value: 6500 },
  { day: 'Sun', value: 4200 },
];

export default function ProgressView() {
  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold">Progress</h1>
          <p className="text-muted-foreground text-sm">Track your journey</p>
        </motion.div>

        {/* Body Weight Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-card border border-border space-y-3"
        >
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
                    <stop offset="5%" stopColor="hsl(142, 72%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 72%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(220, 10%, 50%)' }} />
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Area type="monotone" dataKey="value" stroke="hsl(142, 72%, 45%)" strokeWidth={2} fill="url(#weightGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Steps Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-2xl bg-card border border-border space-y-3"
        >
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
                    <stop offset="5%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(220, 10%, 50%)' }} />
                <YAxis hide />
                <Area type="monotone" dataKey="value" stroke="hsl(210, 100%, 56%)" strokeWidth={2} fill="url(#stepsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Workout History */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
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
