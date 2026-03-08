import { motion } from 'framer-motion';
import { Dumbbell, TrendingUp, Footprints, Calendar } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';

const quickStats = [
  { icon: Dumbbell, label: 'Workouts', value: '12', sublabel: 'this month' },
  { icon: TrendingUp, label: 'Streak', value: '5', sublabel: 'days' },
  { icon: Footprints, label: 'Steps', value: '8,240', sublabel: 'today' },
  { icon: Calendar, label: 'Adherence', value: '87%', sublabel: 'this cycle' },
];

export default function ClientDashboard() {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Athlete';

  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <p className="text-muted-foreground text-sm">Welcome back</p>
          <h1 className="text-2xl font-display font-bold">{firstName} 💪</h1>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          {quickStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <stat.icon className="h-5 w-5 text-primary mb-2" />
              <p className="text-2xl font-display font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.sublabel}</p>
            </motion.div>
          ))}
        </div>

        {/* Today's Workout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-display font-semibold">Today's Workout</h2>
          <div className="p-5 rounded-2xl gradient-primary text-primary-foreground space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">Push Day</p>
                <p className="text-sm opacity-80">4 exercises · ~60 min</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <Dumbbell className="h-6 w-6" />
              </div>
            </div>
            <button className="w-full py-3 rounded-xl bg-primary-foreground/20 text-center font-semibold text-sm backdrop-blur-sm hover:bg-primary-foreground/30 transition-colors">
              Start Workout
            </button>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
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
