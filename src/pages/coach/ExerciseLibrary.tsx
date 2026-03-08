import { useState, useEffect, useRef } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      toast.error('File too large. Max 20MB.');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('exercise-videos')
      .upload(filePath, file, { contentType: file.type });

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('exercise-videos')
      .getPublicUrl(filePath);

    // Since bucket is private, we use a signed URL approach
    const { data: signedData } = await supabase.storage
      .from('exercise-videos')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

    const videoUrl = signedData?.signedUrl || urlData.publicUrl;
    setForm(f => ({ ...f, video_url: videoUrl }));
    setUploading(false);
    toast.success('Video uploaded!');
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Exercise name is required'); return; }
    setSaving(true);
    const { error } = await supabase.from('exercises').insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      video_url: form.video_url || null,
      muscle_group: form.muscle_group,
      movement_type: form.movement_type,
      difficulty_level: form.difficulty_level,
      rep_range_min: form.rep_range_min,
      rep_range_max: form.rep_range_max,
      category: form.category,
      created_by: user?.id,
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
                {ex.video_url ? <Play className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-muted-foreground" />}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end" onClick={() => setShowForm(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="w-full max-h-[85vh] overflow-y-auto bg-card rounded-t-3xl p-5 pb-32 space-y-4 border-t border-border" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-semibold">Add Exercise</h2>
                <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl" placeholder="Barbell Bench Press" maxLength={100} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="rounded-xl" rows={2} placeholder="Optional description..." maxLength={500} />
                </div>

                {/* Video Upload or Link */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Video</label>
                  <input ref={fileInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                  {form.video_url ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary">
                      <Play className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground flex-1 truncate">{form.video_url.startsWith('http') && !form.video_url.includes('supabase') ? form.video_url : 'Video uploaded'}</span>
                      <button onClick={() => setForm(f => ({ ...f, video_url: '' }))} className="text-destructive"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full rounded-xl">
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Upload Video'}
                      </Button>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex-1 h-px bg-border" />
                        <span>or paste a link</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <Input
                        placeholder="https://youtube.com/watch?v=..."
                        onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
                        className="rounded-xl text-xs"
                      />
                    </div>
                  )}
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
                    <Input type="number" value={form.rep_range_min} onChange={e => setForm(f => ({ ...f, rep_range_min: Number(e.target.value) }))} className="rounded-xl" min={1} max={100} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Rep Max</label>
                    <Input type="number" value={form.rep_range_max} onChange={e => setForm(f => ({ ...f, rep_range_max: Number(e.target.value) }))} className="rounded-xl" min={1} max={100} />
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
