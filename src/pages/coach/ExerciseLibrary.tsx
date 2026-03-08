import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Play, X, Upload } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ExerciseCategory, MuscleGroup, MovementType } from '@/types';

const allCategories: ExerciseCategory[] = ['warmup', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'hamstrings', 'quads', 'core', 'cardio', 'stretching', 'other'];
const muscleGroups: MuscleGroup[] = ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'biceps', 'triceps', 'core'];
const movementTypes: MovementType[] = ['compound', 'isolation', 'machine', 'bodyweight'];

interface ExerciseRow {
  id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  muscle_group: string;
  movement_type: string;
  difficulty_level: string;
  rep_range_min: number;
  rep_range_max: number;
  category: string;
}

export default function ExerciseLibrary() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', description: '', video_url: '', muscle_group: 'chest' as string,
    movement_type: 'compound' as string, difficulty_level: 'intermediate',
    rep_range_min: 8, rep_range_max: 12, category: 'other' as string,
  });

  const fetchExercises = async () => {
    const { data } = await supabase.from('exercises').select('id, name, description, video_url, muscle_group, movement_type, difficulty_level, rep_range_min, rep_range_max, category').order('name');
    if (data) setExercises(data);
  };

  useEffect(() => { fetchExercises(); }, []);

  const filtered = exercises.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === 'all' || e.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Exercise name is required'); return; }
    setSaving(true);
    const { error } = await supabase.from('exercises').insert({
      name: form.name, description: form.description || null,
      video_url: form.video_url || null, muscle_group: form.muscle_group,
      movement_type: form.movement_type, difficulty_level: form.difficulty_level,
      rep_range_min: form.rep_range_min, rep_range_max: form.rep_range_max,
      category: form.category,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Exercise added!');
    setShowForm(false);
    setForm({ name: '', description: '', video_url: '', muscle_group: 'chest', movement_type: 'compound', difficulty_level: 'intermediate', rep_range_min: 8, rep_range_max: 12, category: 'other' });
    fetchExercises();
  };

  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Exercises</h1>
          <button onClick={() => setShowForm(true)} className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search exercises..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-9 rounded-xl bg-secondary border-0" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button onClick={() => setActiveCategory('all')} className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap", activeCategory === 'all' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>All</button>
          {allCategories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize", activeCategory === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>{c}</button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((ex, i) => (
            <motion.div key={ex.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Play className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ex.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{ex.category} · {ex.muscle_group} · {ex.movement_type}</p>
              </div>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium capitalize",
                ex.difficulty_level === 'beginner' ? 'bg-primary/10 text-primary' :
                ex.difficulty_level === 'intermediate' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'
              )}>{ex.difficulty_level}</span>
            </motion.div>
          ))}
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No exercises found</p>}
        </div>
      </div>

      {/* Add Exercise Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="w-full max-h-[90vh] overflow-y-auto bg-card rounded-t-3xl p-5 space-y-4 border-t border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-semibold">Add Exercise</h2>
                <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl" placeholder="Barbell Bench Press" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="rounded-xl" rows={2} placeholder="Optional description..." />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Video URL</label>
                  <Input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} className="rounded-xl" placeholder="https://..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>{allCategories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Muscle Group</label>
                    <Select value={form.muscle_group} onValueChange={v => setForm(f => ({ ...f, muscle_group: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>{muscleGroups.map(g => <SelectItem key={g} value={g} className="capitalize">{g}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Movement Type</label>
                    <Select value={form.movement_type} onValueChange={v => setForm(f => ({ ...f, movement_type: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>{movementTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Difficulty</label>
                    <Select value={form.difficulty_level} onValueChange={v => setForm(f => ({ ...f, difficulty_level: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Rep Min</label>
                    <Input type="number" value={form.rep_range_min} onChange={e => setForm(f => ({ ...f, rep_range_min: Number(e.target.value) }))} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Rep Max</label>
                    <Input type="number" value={form.rep_range_max} onChange={e => setForm(f => ({ ...f, rep_range_max: Number(e.target.value) }))} className="rounded-xl" />
                  </div>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold">
                {saving ? 'Saving...' : 'Add Exercise'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
