import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Play } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { MuscleGroup } from '@/types';

const muscleGroups: MuscleGroup[] = ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'biceps', 'triceps', 'core'];

const mockExercises = [
  { id: '1', name: 'Barbell Bench Press', muscle_group: 'chest', movement_type: 'compound', difficulty: 'intermediate' },
  { id: '2', name: 'Incline Dumbbell Press', muscle_group: 'chest', movement_type: 'compound', difficulty: 'intermediate' },
  { id: '3', name: 'Cable Fly', muscle_group: 'chest', movement_type: 'isolation', difficulty: 'beginner' },
  { id: '4', name: 'Barbell Row', muscle_group: 'back', movement_type: 'compound', difficulty: 'intermediate' },
  { id: '5', name: 'Lat Pulldown', muscle_group: 'back', movement_type: 'compound', difficulty: 'beginner' },
  { id: '6', name: 'Barbell Squat', muscle_group: 'quads', movement_type: 'compound', difficulty: 'advanced' },
  { id: '7', name: 'Leg Press', muscle_group: 'quads', movement_type: 'machine', difficulty: 'beginner' },
  { id: '8', name: 'Romanian Deadlift', muscle_group: 'hamstrings', movement_type: 'compound', difficulty: 'intermediate' },
  { id: '9', name: 'Overhead Press', muscle_group: 'shoulders', movement_type: 'compound', difficulty: 'intermediate' },
  { id: '10', name: 'Bicep Curl', muscle_group: 'biceps', movement_type: 'isolation', difficulty: 'beginner' },
  { id: '11', name: 'Tricep Pushdown', muscle_group: 'triceps', movement_type: 'isolation', difficulty: 'beginner' },
  { id: '12', name: 'Hip Thrust', muscle_group: 'glutes', movement_type: 'compound', difficulty: 'intermediate' },
];

export default function ExerciseLibrary() {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<MuscleGroup | 'all'>('all');

  const filtered = mockExercises.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = activeGroup === 'all' || e.muscle_group === activeGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Exercises</h1>
          <button className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 rounded-xl bg-secondary border-0"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveGroup('all')}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap",
              activeGroup === 'all' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            )}
          >All</button>
          {muscleGroups.map(g => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize",
                activeGroup === g ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              )}
            >{g}</button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((ex, i) => (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Play className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ex.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{ex.muscle_group} · {ex.movement_type}</p>
              </div>
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-medium capitalize",
                ex.difficulty === 'beginner' ? 'bg-primary/10 text-primary' :
                ex.difficulty === 'intermediate' ? 'bg-warning/10 text-warning' :
                'bg-destructive/10 text-destructive'
              )}>
                {ex.difficulty}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
