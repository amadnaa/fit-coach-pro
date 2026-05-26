import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Play, X, Upload, Pencil, Trash2, ChevronLeft } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
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

const defaultForm = {
  name: '', description: '', video_url: '', muscle_group: 'chest' as string,
  movement_type: 'compound' as string, difficulty_level: 'intermediate',
  rep_range_min: 8, rep_range_max: 12, category: 'other' as string,
};

export default function ExerciseLibrary() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const tCat = (k: string) => t(`exCat.${k}`, { defaultValue: k });

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ ...defaultForm });

  // Detail / Edit state
  const [selectedExercise, setSelectedExercise] = useState<ExerciseRow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...defaultForm });
  const [editUploading, setEditUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchExercises = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('exercises').select('id, name, description, video_url, muscle_group, movement_type, difficulty_level, rep_range_min, rep_range_max, category').eq('created_by', user.id).order('name');
    if (data) setExercises(data);
  };

  useEffect(() => { fetchExercises(); }, []);

  const filtered = exercises.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === 'all' || e.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'create' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) { toast.error(t('errors.fileTooLarge')); return; }

    if (target === 'create') setUploading(true);
    else setEditUploading(true);

    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('exercise-videos').upload(filePath, file, { contentType: file.type });
    if (uploadError) {
      toast.error(t('errors.uploadFailed') + ': ' + uploadError.message);
      if (target === 'create') setUploading(false); else setEditUploading(false);
      return;
    }

    const { data: signedData } = await supabase.storage.from('exercise-videos').createSignedUrl(filePath, 60 * 60 * 24 * 365);
    const { data: urlData } = supabase.storage.from('exercise-videos').getPublicUrl(filePath);
    const videoUrl = signedData?.signedUrl || urlData.publicUrl;

    if (target === 'create') { setForm(f => ({ ...f, video_url: videoUrl })); setUploading(false); }
    else { setEditForm(f => ({ ...f, video_url: videoUrl })); setEditUploading(false); }
    toast.success(t('coach.videoUploaded'));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(t('errors.exerciseNameRequired')); return; }

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
    toast.success(t('coach.exerciseAdded'));
    setShowForm(false);
    setForm({ ...defaultForm });
    fetchExercises();
  };

  const openDetail = (ex: ExerciseRow) => {
    setSelectedExercise(ex);
    setIsEditing(false);
    setEditForm({
      name: ex.name,
      description: ex.description || '',
      video_url: ex.video_url || '',
      muscle_group: ex.muscle_group,
      movement_type: ex.movement_type,
      difficulty_level: ex.difficulty_level,
      rep_range_min: ex.rep_range_min,
      rep_range_max: ex.rep_range_max,
      category: ex.category,
    });
  };

  const handleUpdate = async () => {
    if (!selectedExercise || !editForm.name.trim()) { toast.error(t('errors.nameRequired')); return; }
    setSaving(true);
    const { error } = await supabase.from('exercises').update({
      name: editForm.name.trim(),
      description: editForm.description.trim() || null,
      video_url: editForm.video_url || null,
      muscle_group: editForm.muscle_group,
      movement_type: editForm.movement_type,
      difficulty_level: editForm.difficulty_level,
      rep_range_min: editForm.rep_range_min,
      rep_range_max: editForm.rep_range_max,
      category: editForm.category,
    }).eq('id', selectedExercise.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t('coach.exerciseUpdated'));
    setSelectedExercise(null);
    setIsEditing(false);
    fetchExercises();
  };

  const handleDelete = async () => {
    if (!selectedExercise) return;
    setDeleting(true);
    const { error } = await supabase.from('exercises').delete().eq('id', selectedExercise.id);
    setDeleting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t('coach.exerciseDeleted'));
    setSelectedExercise(null);
    fetchExercises();
  };

  const isVideoUrl = (url: string) => {
    if (!url) return false;
    return url.includes('youtube') || url.includes('youtu.be') || url.includes('vimeo');
  };

  const renderVideoSection = (url: string | null) => {
    if (!url) return <p className="text-xs text-muted-foreground py-4 text-center">{t('coach.noVideo')}</p>;
    if (isVideoUrl(url)) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-xl bg-secondary text-sm text-primary hover:underline">
          <Play className="h-4 w-4" /> {t('workout.watchVideo')}
        </a>

      );
    }
    return (
      <video src={url} controls className="w-full rounded-xl max-h-48 bg-secondary" />
    );
  };

  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">{t('coach.exercisesTitle')}</h1>
          <button onClick={() => setShowForm(true)} className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('coach.searchExercises')} value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-9 rounded-xl bg-secondary border-0" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button onClick={() => setActiveCategory('all')} className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap", activeCategory === 'all' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>{t('exLib.all')}</button>
          {allCategories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap", activeCategory === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>{tCat(c)}</button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((ex, i) => (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => openDetail(ex)}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {ex.video_url ? <Play className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ex.name}</p>
                <p className="text-xs text-muted-foreground">{tCat(ex.category)} · {tCat(ex.muscle_group)} · {tCat(ex.movement_type)}</p>
              </div>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium",
                ex.difficulty_level === 'beginner' ? 'bg-primary/10 text-primary' :
                ex.difficulty_level === 'intermediate' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'
              )}>{t(`coach.${ex.difficulty_level}`, { defaultValue: ex.difficulty_level })}</span>
            </motion.div>
          ))}
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">{t('coach.noExercisesFound')}</p>}
        </div>
      </div>

      {/* Exercise Detail / Edit Dialog */}
      <Dialog open={!!selectedExercise} onOpenChange={open => { if (!open) { setSelectedExercise(null); setIsEditing(false); } }}>
        <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? t('coach.editExercise') : selectedExercise?.name}</DialogTitle>
            <DialogDescription>
              {!isEditing && selectedExercise && `${tCat(selectedExercise.category)} · ${tCat(selectedExercise.muscle_group)} · ${tCat(selectedExercise.movement_type)}`}
              {isEditing && t('coach.updateExerciseDetails')}
            </DialogDescription>
          </DialogHeader>



          {selectedExercise && !isEditing && (
            <div className="space-y-4">
              {renderVideoSection(selectedExercise.video_url)}

              {selectedExercise.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('coach.description')}</p>
                  <p className="text-sm">{selectedExercise.description}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-xl bg-secondary overflow-hidden">
                  <p className="text-base font-bold">{selectedExercise.rep_range_min}-{selectedExercise.rep_range_max}</p>
                  <p className="text-[10px] text-muted-foreground">{t('coach.repRange')}</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-secondary overflow-hidden">
                  <p className="text-xs font-bold leading-5 truncate">{t(`coach.${selectedExercise.difficulty_level}`, { defaultValue: selectedExercise.difficulty_level })}</p>
                  <p className="text-[10px] text-muted-foreground">{t('coach.difficulty2')}</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-secondary overflow-hidden">
                  <p className="text-xs font-bold leading-5 truncate">{tCat(selectedExercise.movement_type)}</p>
                  <p className="text-[10px] text-muted-foreground">{t('coach.type')}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setIsEditing(true)} variant="outline" className="flex-1 rounded-xl">
                  <Pencil className="h-4 w-4 mr-1" /> {t('common.edit')}
                </Button>
                <Button onClick={handleDelete} disabled={deleting} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                  <Trash2 className="h-4 w-4 mr-1" /> {deleting ? '...' : t('common.delete')}
                </Button>

              </div>
            </div>
          )}

          {selectedExercise && isEditing && (
            <div className="space-y-3">
              <input ref={editFileInputRef} type="file" accept="video/*" onChange={(e) => handleVideoUpload(e, 'edit')} className="hidden" />

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('exLib.nameStar')}</label>
                <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('coach.description')}</label>
                <Textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="rounded-xl" rows={2} />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('coach.video')}</label>
                {editForm.video_url ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary">
                    <Play className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground flex-1 truncate">{t('coach.videoAttached')}</span>
                    <button onClick={() => setEditForm(f => ({ ...f, video_url: '' }))} className="text-destructive"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button variant="outline" onClick={() => editFileInputRef.current?.click()} disabled={editUploading} className="w-full rounded-xl">
                      <Upload className="h-4 w-4 mr-2" /> {editUploading ? t('coach.uploading') : t('coach.uploadVideo')}
                    </Button>
                    <Input placeholder="https://youtube.com/watch?v=..." onChange={e => setEditForm(f => ({ ...f, video_url: e.target.value }))} className="rounded-xl text-xs" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('coach.category')}</label>
                  <Select value={editForm.category} onValueChange={v => setEditForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{allCategories.map(c => <SelectItem key={c} value={c}>{tCat(c)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('coach.muscleGroup')}</label>
                  <Select value={editForm.muscle_group} onValueChange={v => setEditForm(f => ({ ...f, muscle_group: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{muscleGroups.map(g => <SelectItem key={g} value={g}>{tCat(g)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('coach.movementType')}</label>
                  <Select value={editForm.movement_type} onValueChange={v => setEditForm(f => ({ ...f, movement_type: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{movementTypes.map(mt => <SelectItem key={mt} value={mt}>{tCat(mt)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('coach.difficulty2')}</label>
                  <Select value={editForm.difficulty_level} onValueChange={v => setEditForm(f => ({ ...f, difficulty_level: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">{t('coach.beginner')}</SelectItem>
                      <SelectItem value="intermediate">{t('coach.intermediate')}</SelectItem>
                      <SelectItem value="advanced">{t('coach.advanced')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('coach.repMin')}</label>
                  <Input type="number" value={editForm.rep_range_min} onChange={e => setEditForm(f => ({ ...f, rep_range_min: Number(e.target.value) }))} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('coach.repMax')}</label>
                  <Input type="number" value={editForm.rep_range_max} onChange={e => setEditForm(f => ({ ...f, rep_range_max: Number(e.target.value) }))} className="rounded-xl" />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleUpdate} disabled={saving} className="flex-1 rounded-xl gradient-primary text-primary-foreground">
                  {saving ? t('common.saving') : t('exLib.saveChanges')}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl">{t('common.cancel')}</Button>
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>

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

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Video</label>
                  <input ref={fileInputRef} type="file" accept="video/*" onChange={(e) => handleVideoUpload(e, 'create')} className="hidden" />
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
                      <Input placeholder="https://youtube.com/watch?v=..." onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} className="rounded-xl text-xs" />
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
