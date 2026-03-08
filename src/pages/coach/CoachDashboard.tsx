import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Users, TrendingUp, Dumbbell } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface MockClient {
  id: string;
  name: string;
  lastWorkout: string;
  weight: number;
  weightTrend: 'up' | 'down' | 'stable';
  adherence: number;
  avatar: string;
}

const mockClients: MockClient[] = [
  { id: '1', name: 'Sarah Johnson', lastWorkout: 'Today', weight: 62.5, weightTrend: 'down', adherence: 94, avatar: 'SJ' },
  { id: '2', name: 'Mike Chen', lastWorkout: 'Yesterday', weight: 85.2, weightTrend: 'stable', adherence: 87, avatar: 'MC' },
  { id: '3', name: 'Emma Wilson', lastWorkout: '2 days ago', weight: 58.0, weightTrend: 'down', adherence: 92, avatar: 'EW' },
  { id: '4', name: 'James Brown', lastWorkout: '3 days ago', weight: 92.1, weightTrend: 'up', adherence: 65, avatar: 'JB' },
];

export default function CoachDashboard() {
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const filtered = mockClients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-muted-foreground text-sm">Coach Dashboard</p>
            <h1 className="text-2xl font-display font-bold">Your Clients</h1>
          </div>
          <Button size="icon" className="h-10 w-10 rounded-xl gradient-primary text-primary-foreground">
            <Plus className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, value: '4', label: 'Active' },
            { icon: TrendingUp, value: '85%', label: 'Avg Adherence' },
            { icon: Dumbbell, value: '48', label: 'Workouts/wk' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-xl bg-card border border-border text-center"
            >
              <stat.icon className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-display font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 rounded-xl bg-secondary border-0"
          />
        </div>

        {/* Client List */}
        <div className="space-y-2">
          {filtered.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                {client.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{client.name}</p>
                <p className="text-xs text-muted-foreground">Last: {client.lastWorkout} · {client.weight}kg</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${client.adherence >= 80 ? 'text-primary' : client.adherence >= 60 ? 'text-warning' : 'text-destructive'}`}>
                  {client.adherence}%
                </p>
                <p className="text-[10px] text-muted-foreground">adherence</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
