import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { OnboardingData } from '@/types';

interface Step {
  title: string;
  subtitle: string;
  key: keyof OnboardingData;
  options?: { label: string; value: string | number }[];
  type: 'select' | 'text';
}

const steps: Step[] = [
  {
    title: 'Fitness Goal',
    subtitle: 'What is your primary fitness goal?',
    key: 'fitness_goal',
    type: 'select',
    options: [
      { label: '🔥 Lose Fat', value: 'lose_fat' },
      { label: '💪 Build Muscle', value: 'build_muscle' },
      { label: '🏃 Improve Endurance', value: 'improve_endurance' },
      { label: '🏋️ Increase Strength', value: 'increase_strength' },
      { label: '⚡ General Fitness', value: 'general_fitness' },
    ],
  },
  {
    title: 'Training Availability',
    subtitle: 'How many days per week can you train?',
    key: 'training_frequency',
    type: 'select',
    options: [
      { label: '1–2 days', value: 2 },
      { label: '3 days', value: 3 },
      { label: '4 days', value: 4 },
      { label: '5 days', value: 5 },
      { label: '6–7 days', value: 6 },
    ],
  },
  {
    title: 'Training Experience',
    subtitle: 'What is your current fitness level?',
    key: 'experience_level',
    type: 'select',
    options: [
      { label: '🌱 Beginner – never trained consistently', value: 'beginner' },
      { label: '📈 Intermediate – 6+ months of training', value: 'intermediate' },
      { label: '🏆 Advanced – 2+ years of structured training', value: 'advanced' },
    ],
  },
  {
    title: 'Programme Structure',
    subtitle: 'Which training split do you prefer?',
    key: 'preferred_split',
    type: 'select',
    options: [
      { label: '🔄 Full Body', value: 'full_body' },
      { label: '⬆️⬇️ Upper / Lower', value: 'upper_lower' },
      { label: '💥 Push / Pull / Legs', value: 'push_pull_legs' },
      { label: '🎯 Body Part Split', value: 'body_part_split' },
      { label: '🤔 Not sure – recommend one for me', value: 'auto' },
    ],
  },
  {
    title: 'Session Length',
    subtitle: 'How long can you train per session?',
    key: 'workout_duration',
    type: 'select',
    options: [
      { label: '30 minutes', value: 30 },
      { label: '45 minutes', value: 45 },
      { label: '60 minutes', value: 60 },
      { label: '75+ minutes', value: 75 },
    ],
  },
  {
    title: 'Equipment Access',
    subtitle: 'What equipment do you have access to?',
    key: 'equipment_access',
    type: 'select',
    options: [
      { label: '🏢 Full Gym', value: 'full_gym' },
      { label: '🏋️ Dumbbells & Barbells only', value: 'dumbbells_barbells' },
      { label: '💪 Dumbbells only', value: 'dumbbells_only' },
      { label: '🔗 Resistance Bands', value: 'resistance_bands' },
      { label: '🧍 No equipment – bodyweight only', value: 'bodyweight' },
    ],
  },
  {
    title: 'Injuries & Limitations',
    subtitle: 'Do you have any injuries or physical limitations?',
    key: 'injuries',
    type: 'text',
  },
  {
    title: 'Cardio Preference',
    subtitle: 'How do you feel about cardio?',
    key: 'cardio_preference',
    type: 'select',
    options: [
      { label: '❤️ I enjoy it – include plenty', value: 'enjoy' },
      { label: '🤷 I tolerate it – include some', value: 'some' },
      { label: '🚫 I prefer to skip it', value: 'skip' },
    ],
  },
];

// ── Workout plan generation logic ──
function generateWorkoutPlan(data: OnboardingData) {
  const freq = data.training_frequency;
  let split = data.preferred_split;

  // Auto-recommend split based on frequency
  if (split === 'auto') {
    if (freq <= 3) split = 'full_body';
    else if (freq === 4) split = 'upper_lower';
    else split = 'push_pull_legs';
  }

  const splitName = {
    full_body: 'Full Body',
    upper_lower: 'Upper / Lower',
    push_pull_legs: 'Push / Pull / Legs',
    body_part_split: 'Body Part Split',
  }[split] || 'Full Body';

  const isBodyweight = data.equipment_access === 'bodyweight';
  const isBands = data.equipment_access === 'resistance_bands';
  const isDBOnly = data.equipment_access === 'dumbbells_only';
  const limited = isBodyweight || isBands || isDBOnly;

  // Exercise pools by category
  const exercises: Record<string, { name: string; sets: number; reps: string }[]> = {
    chest: limited
      ? [{ name: 'Push-Ups', sets: 3, reps: '10-15' }, { name: 'Incline Push-Ups', sets: 3, reps: '10-15' }]
      : [{ name: 'Barbell Bench Press', sets: 4, reps: '6-10' }, { name: 'Incline Dumbbell Press', sets: 3, reps: '8-12' }, { name: 'Cable Flyes', sets: 3, reps: '12-15' }],
    back: limited
      ? [{ name: 'Inverted Rows', sets: 3, reps: '8-12' }, { name: 'Dumbbell Rows', sets: 3, reps: '10-12' }]
      : [{ name: 'Barbell Rows', sets: 4, reps: '6-10' }, { name: 'Lat Pulldowns', sets: 3, reps: '8-12' }, { name: 'Seated Cable Rows', sets: 3, reps: '10-12' }],
    shoulders: limited
      ? [{ name: 'Pike Push-Ups', sets: 3, reps: '8-12' }, { name: 'Lateral Raises (DB)', sets: 3, reps: '12-15' }]
      : [{ name: 'Overhead Press', sets: 4, reps: '6-10' }, { name: 'Lateral Raises', sets: 3, reps: '12-15' }, { name: 'Face Pulls', sets: 3, reps: '15-20' }],
    legs: limited
      ? [{ name: 'Squats (Bodyweight/DB)', sets: 4, reps: '10-15' }, { name: 'Lunges', sets: 3, reps: '10-12 each' }, { name: 'Glute Bridges', sets: 3, reps: '12-15' }]
      : [{ name: 'Barbell Squats', sets: 4, reps: '6-10' }, { name: 'Romanian Deadlifts', sets: 3, reps: '8-12' }, { name: 'Leg Press', sets: 3, reps: '10-12' }, { name: 'Leg Curls', sets: 3, reps: '10-12' }],
    arms: limited
      ? [{ name: 'Diamond Push-Ups', sets: 3, reps: '10-15' }, { name: 'Dumbbell Curls', sets: 3, reps: '10-12' }]
      : [{ name: 'Barbell Curls', sets: 3, reps: '8-12' }, { name: 'Tricep Pushdowns', sets: 3, reps: '10-12' }],
    core: [{ name: 'Plank', sets: 3, reps: '30-60s' }, { name: 'Hanging Leg Raises', sets: 3, reps: '10-15' }],
  };

  type DayPlan = { name: string; exercises: { name: string; sets: number; reps: string }[] };
  const days: DayPlan[] = [];

  if (split === 'full_body') {
    for (let i = 0; i < Math.min(freq, 3); i++) {
      days.push({
        name: `Full Body ${String.fromCharCode(65 + i)}`,
        exercises: [exercises.legs[0], exercises.chest[0], exercises.back[0], exercises.shoulders[0], exercises.core[0]],
      });
    }
  } else if (split === 'upper_lower') {
    const count = Math.min(freq, 4);
    for (let i = 0; i < count; i++) {
      if (i % 2 === 0) {
        days.push({ name: 'Upper Body', exercises: [...exercises.chest, ...exercises.back.slice(0, 2), ...exercises.arms.slice(0, 1)] });
      } else {
        days.push({ name: 'Lower Body', exercises: [...exercises.legs, ...exercises.core] });
      }
    }
  } else if (split === 'push_pull_legs') {
    days.push({ name: 'Push', exercises: [...exercises.chest, ...exercises.shoulders.slice(0, 2), ...exercises.arms.filter(e => e.name.includes('Tricep') || e.name.includes('Diamond'))] });
    days.push({ name: 'Pull', exercises: [...exercises.back, ...exercises.arms.filter(e => e.name.includes('Curl'))] });
    days.push({ name: 'Legs', exercises: [...exercises.legs, ...exercises.core] });
    if (freq >= 5) {
      days.push({ name: 'Push B', exercises: [exercises.chest[0], exercises.shoulders[0], exercises.arms[0]] });
      days.push({ name: 'Pull B', exercises: [exercises.back[0], exercises.back[1] || exercises.back[0]] });
    }
    if (freq >= 6) {
      days.push({ name: 'Legs B', exercises: [exercises.legs[0], exercises.legs[1], exercises.core[0]] });
    }
  } else {
    // Body part split
    days.push({ name: 'Chest & Triceps', exercises: [...exercises.chest, ...exercises.arms.filter(e => e.name.includes('Tricep') || e.name.includes('Diamond'))] });
    days.push({ name: 'Back & Biceps', exercises: [...exercises.back, ...exercises.arms.filter(e => e.name.includes('Curl'))] });
    days.push({ name: 'Shoulders & Core', exercises: [...exercises.shoulders, ...exercises.core] });
    days.push({ name: 'Legs', exercises: [...exercises.legs] });
    if (freq >= 5) days.push({ name: 'Arms & Abs', exercises: [...exercises.arms, ...exercises.core] });
  }

  // Add cardio notes
  let cardioNote = '';
  if (data.cardio_preference === 'enjoy') cardioNote = 'Include 20-30 min of moderate cardio on rest days and 10 min post-workout.';
  else if (data.cardio_preference === 'some') cardioNote = 'Include 15-20 min of light cardio 2-3 times per week.';

  return { splitName, days: days.slice(0, freq), cardioNote, split };
}

export default function OnboardingView() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const [showPlan, setShowPlan] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const canProceed = step.type === 'text' || data[step.key] !== undefined;

  const handleSelect = (value: string | number) => {
    setData({ ...data, [step.key]: value });
  };

  const handleNext = () => {
    if (isLast) {
      setShowPlan(true);
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const plan = showPlan ? generateWorkoutPlan(data as OnboardingData) : null;

  const handleConfirm = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Determine training_focus from fitness_goal  
      const focusMap: Record<string, string> = {
        lose_fat: 'full_body',
        build_muscle: 'full_body',
        improve_endurance: 'full_body',
        increase_strength: 'upper_body',
        general_fitness: 'full_body',
      };

      const finalSplit = plan?.split || 'full_body';

      const { error } = await supabase.from('client_onboarding').insert({
        user_id: user.id,
        training_focus: focusMap[data.fitness_goal || 'general_fitness'] || 'full_body',
        training_frequency: (data.training_frequency as number) || 3,
        preferred_split: finalSplit,
        workout_duration: (data.workout_duration as number) || 60,
        injuries: (data.injuries as string) || null,
        fitness_goal: (data.fitness_goal as string) || 'general_fitness',
        experience_level: (data.experience_level as string) || 'beginner',
        equipment_access: (data.equipment_access as string) || 'full_gym',
        cardio_preference: (data.cardio_preference as string) || 'some',
        completed: true,
      });

      if (error) throw error;
      toast.success('Programme generated! Your trainer may customise it further.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save onboarding');
    } finally {
      setSaving(false);
    }
  };

  if (showPlan && plan) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="px-5 pt-6 pb-2">
          <button onClick={() => setShowPlan(false)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <ChevronLeft className="h-4 w-4" /> Back to questionnaire
          </button>
          <h1 className="text-2xl font-display font-bold">Your Programme</h1>
          <p className="text-muted-foreground text-sm mt-1">{plan.splitName} • {data.training_frequency} days/week</p>
        </div>

        <div className="flex-1 px-5 py-4 space-y-4 overflow-auto">
          {plan.days.map((day, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <h3 className="font-semibold text-sm mb-3">Day {i + 1}: {day.name}</h3>
              <div className="space-y-2">
                {day.exercises.map((ex, j) => (
                  <div key={j} className="flex justify-between items-center text-sm">
                    <span>{ex.name}</span>
                    <span className="text-muted-foreground text-xs">{ex.sets} × {ex.reps}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {plan.cardioNote && (
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <p className="text-sm text-foreground">🏃 <strong>Cardio:</strong> {plan.cardioNote}</p>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-muted border border-border">
            <p className="text-xs text-muted-foreground">
              ℹ️ This plan was auto-generated based on your answers. Your trainer may further customise it to suit your needs.
            </p>
          </div>
        </div>

        <div className="px-5 pb-8">
          <Button
            onClick={handleConfirm}
            disabled={saving}
            className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-semibold text-base"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-5 w-5 mr-2" /> Confirm & Start</>}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full flex-1 transition-colors",
                i <= currentStep ? "bg-primary" : "bg-secondary"
              )}
            />
          ))}
        </div>
      </div>

      {/* Back button */}
      {currentStep > 0 && (
        <div className="px-5 pt-2">
          <button onClick={handleBack} className="flex items-center gap-1 text-sm text-muted-foreground">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-5 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h1 className="text-2xl font-display font-bold">{step.title}</h1>
              <p className="text-muted-foreground">{step.subtitle}</p>
            </div>

            {step.type === 'select' && step.options && (
              <div className="space-y-3">
                {step.options.map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full p-4 rounded-2xl text-left font-medium transition-all border-2",
                      data[step.key] === opt.value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/30"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {step.type === 'text' && (
              <div className="space-y-3">
                <Textarea
                  placeholder="E.g., Bad left knee, shoulder impingement..."
                  value={(data.injuries as string) || ''}
                  onChange={(e) => setData({ ...data, injuries: e.target.value })}
                  className="min-h-[120px] rounded-2xl bg-card border-border resize-none"
                />
                <button
                  onClick={() => setData({ ...data, injuries: 'None' })}
                  className={cn(
                    "w-full p-4 rounded-2xl text-left font-medium transition-all border-2",
                    data.injuries === 'None'
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/30"
                  )}
                >
                  ✅ None
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-5 pb-8">
        <Button
          onClick={handleNext}
          disabled={!canProceed && step.type !== 'text'}
          className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-semibold text-base"
        >
          {isLast ? 'Generate My Programme' : 'Continue'}
          {!isLast && <ChevronRight className="h-5 w-5 ml-1" />}
        </Button>
      </div>
    </div>
  );
}
