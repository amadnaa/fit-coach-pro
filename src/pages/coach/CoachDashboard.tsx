import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Users, TrendingUp, Dumbbell, ClipboardList, X, Loader2 } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ClientRow {
  client_id: string;
  full_name: string;
}

interface RecentCheckIn {
  id: string;
  user_id: string;
  client_name: string;
  week_start: string;
  training_difficulty: string;
  recovery_level: string;
  energy_level: string;
}

export default function CoachDashboard() {
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [recentCheckins, setRecentCheckins] = useState<RecentCheckIn[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newClient, setNewClient] = useState({
    full_name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    height: '',
    weight: '',
    fitness_goal: '',
    notes: '',
  });

  useEffect(() => {
    if (!user) return;
    loadClients();
  }, [user]);

  const loadClients = async () => {
    if (!user) return;
    const { data } = await supabase.from('coach_clients').select('client_id').eq('coach_id', user.id);
    if (!data) return;
    const clientIds = data.map(d => d.client_id);
    if (clientIds.length === 0) return;

    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', clientIds);
    if (profiles) setClients(profiles.map(p => ({ client_id: p.user_id, full_name: p.full_name })));

    const { data: checkins } = await supabase.from('weekly_check_ins')
      .select('id, user_id, week_start, training_difficulty, recovery_level, energy_level')
      .in('user_id', clientIds)
      .order('created_at', { ascending: false })
      .limit(5);

    if (checkins && profiles) {
      const profileMap = new Map(profiles.map(p => [p.user_id, p.full_name]));
      setRecentCheckins(checkins.map(ci => ({
        ...ci,
        client_name: profileMap.get(ci.user_id) || 'Unknown',
      })));
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.full_name.trim() || !newClient.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-client', {
        body: {
          full_name: newClient.full_name.trim(),
          email: newClient.email.trim(),
          notes: newClient.notes.trim(),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Client created! Temporary password: ${data.temp_password}`);
      setShowCreateDialog(false);
      setNewClient({ full_name: '', email: '', phone: '', dob: '', gender: '', height: '', weight: '', fitness_goal: '', notes: '' });
      loadClients();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create client');
    } finally {
      setCreating(false);
    }
  };

  const filtered = clients.filter(c => c.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Coach Dashboard</p>
            <h1 className="text-2xl font-display font-bold">Your Clients</h1>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} size="icon" className="h-10 w-10 rounded-xl gradient-primary text-primary-foreground">
            <Plus className="h-5 w-5" />
          </Button>
        </motion.div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, value: String(clients.length), label: 'Active' },
            { icon: TrendingUp, value: '—', label: 'Avg Adherence' },
            { icon: Dumbbell, value: '—', label: 'Workouts/wk' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-3 rounded-xl bg-card border border-border text-center">
              <stat.icon className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-display font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {recentCheckins.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-2">
            <h2 className="text-sm font-semibold flex items-center gap-1.5"><ClipboardList className="h-4 w-4 text-primary" /> Recent Check-ins</h2>
            {recentCheckins.map(ci => (
              <div key={ci.id} onClick={() => navigate(`/coach/client/${ci.user_id}`)}
                className="p-3 rounded-xl bg-card border border-border cursor-pointer active:scale-[0.98] transition-transform">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{ci.client_name}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(ci.week_start), 'MMM d')}</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-[10px] text-muted-foreground">Difficulty: <span className="text-foreground capitalize">{ci.training_difficulty}</span></span>
                  <span className="text-[10px] text-muted-foreground">Recovery: <span className="text-foreground capitalize">{ci.recovery_level}</span></span>
                  <span className="text-[10px] text-muted-foreground">Energy: <span className="text-foreground capitalize">{ci.energy_level}</span></span>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-9 rounded-xl bg-secondary border-0" />
        </div>

        <div className="space-y-2">
          {filtered.map((client, i) => (
            <motion.div key={client.client_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/coach/client/${client.client_id}`)}
              className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                {client.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{client.full_name}</p>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && clients.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No clients yet. Tap + to add your first client.</p>
          )}
        </div>
      </div>

      {/* Create Client Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-card border border-border rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card rounded-t-3xl z-10">
              <h2 className="text-lg font-display font-bold">Create Client</h2>
              <button onClick={() => setShowCreateDialog(false)} className="text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Full Name *</label>
                <Input value={newClient.full_name} onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })} placeholder="John Smith" className="h-11 rounded-xl bg-secondary border-0" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email Address *</label>
                <Input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} placeholder="john@example.com" className="h-11 rounded-xl bg-secondary border-0" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Phone Number (optional)</label>
                <Input value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} placeholder="+44 7700 900000" className="h-11 rounded-xl bg-secondary border-0" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Date of Birth</label>
                  <Input type="date" value={newClient.dob} onChange={(e) => setNewClient({ ...newClient, dob: e.target.value })} className="h-11 rounded-xl bg-secondary border-0" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Gender</label>
                  <Select value={newClient.gender} onValueChange={(v) => setNewClient({ ...newClient, gender: v })}>
                    <SelectTrigger className="h-11 rounded-xl bg-secondary border-0">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Height (cm)</label>
                  <Input type="number" value={newClient.height} onChange={(e) => setNewClient({ ...newClient, height: e.target.value })} placeholder="175" className="h-11 rounded-xl bg-secondary border-0" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Weight (kg)</label>
                  <Input type="number" value={newClient.weight} onChange={(e) => setNewClient({ ...newClient, weight: e.target.value })} placeholder="75" className="h-11 rounded-xl bg-secondary border-0" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Fitness Goal</label>
                <Select value={newClient.fitness_goal} onValueChange={(v) => setNewClient({ ...newClient, fitness_goal: v })}>
                  <SelectTrigger className="h-11 rounded-xl bg-secondary border-0">
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose_fat">Lose Fat</SelectItem>
                    <SelectItem value="build_muscle">Build Muscle</SelectItem>
                    <SelectItem value="improve_endurance">Improve Endurance</SelectItem>
                    <SelectItem value="increase_strength">Increase Strength</SelectItem>
                    <SelectItem value="general_fitness">General Fitness</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <Textarea value={newClient.notes} onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })} placeholder="Any notes about this client..." className="min-h-[80px] rounded-xl bg-secondary border-0 resize-none" />
              </div>

              <Button onClick={handleCreateClient} disabled={creating} className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold">
                {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Client'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </MobileLayout>
  );
}
