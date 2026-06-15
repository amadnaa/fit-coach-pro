import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  key: keyof OnboardingData;
  type: 'select' | 'text';
  options?: { optKey: string; value: string | number }[];
}

const steps: Step[] = [
  {
    key: 'fitness_goal',
    type: 'select',
    options: [
      { optKey: 'lose_fat', value: 'lose_fat' },
      { optKey: 'build_muscle', value: 'build_muscle' },
      { optKey: 'improve_endurance', value: 'improve_endurance' },
      { optKey: 'increase_strength', value: 'increase_strength' },
      { optKey: 'general_fitness', value: 'general_fitness' },
    ],
  },
  {
    key: 'training_frequency',
    type: 'select',
    options: [
      { optKey: 'days_2', value: 2 },
      { optKey: 'days_3', value: 3 },
      { optKey: 'days_4', value: 4 },
      { optKey: 'days_5', value: 5 },
      { optKey: 'days_6', value: 6 },
    ],
  },
  {
    key: 'experience_level',
    type: 'select',
    options: [
      { optKey: 'beginner', value: 'beginner' },
      { optKey: 'intermediate', value: 'intermediate' },
      { optKey: 'advanced', value: 'advanced' },
    ],
  },
  {
    key: 'preferred_split',
    type: 'select',
    options: [
      { optKey: 'full_body', value: 'full_body' },
      { optKey: 'upper_lower', value: 'upper_lower' },
      { optKey: 'push_pull_legs', value: 'push_pull_legs' },
      { optKey: 'body_part_split', value: 'body_part_split' },
      { optKey: 'auto', value: 'auto' },
    ],
  },
  {
    key: 'workout_duration',
    type: 'select',
    options: [
      { optKey: 'min_30', value: 30 },
      { optKey: 'min_45', value: 45 },
      { optKey: 'min_60', value: 60 },
      { optKey: 'min_75', value: 75 },
    ],
  },
  {
    key: 'equipment_access',
    type: 'select',
    options: [
      { optKey: 'full_gym', value: 'full_gym' },
      { optKey: 'dumbbells_barbells', value: 'dumbbells_barbells' },
      { optKey: 'dumbbells_only', value: 'dumbbells_only' },
      { optKey: 'resistance_bands', value: 'resistance_bands' },
      { optKey: 'bodyweight', value: 'bodyweight' },
    ],
  },
  {
    key: 'injuries',
    type: 'text',
  },
  {
    key: 'cardio_preference',
    type: 'select',
    options: [
      { optKey: 'enjoy', value: 'enjoy' },
      { optKey: 'some', value: 'some' },
      { optKey: 'skip', value: 'skip' },
    ],
  },
];

// ── Workout plan generation logic ──
function generateWorkoutPlan(data: OnboardingData) {
  const freq = data.training_frequency;
  let split = data.preferred_split;

  if (split === 'auto') {
    if (freq <= 3) split = 'full_body';
    else if (freq === 4) split = 'upper_lower';
    else split = 'push_pull_legs';
  }

  const splitKey = (['full_body', 'upper_lower', 'push_pull_legs', 'body_part_split'].includes(split)
    ? split
    : 'full_body') as 'full_body' | 'upper_lower' | 'push_pull_legs' | 'body_part_split';

  const isBodyweight = data.equipment_access === 'bodyweight';
  const isBands = data.equipment_access === 'resistance_bands';
  const isDBOnly = data.equipment_access === 'dumbbells_only';
  const limited = isBodyweight || isBands || isDBOnly;

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

  type DayPlan = { nameKey: string; exercises: { name: string; sets: number; reps: string }[] };
  const days: DayPlan[] = [];

  if (splitKey === 'full_body') {
    const labels = ['full_body_a', 'full_body_b', 'full_body_c'];
    for (let i = 0; i < Math.min(freq, 3); i++) {
      days.push({
        nameKey: labels[i],
        exercises: [exercises.legs[0], exercises.chest[0], exercises.back[0], exercises.shoulders[0], exercises.core[0]],
      });
    }
  } else if (splitKey === 'upper_lower') {
    const count = Math.min(freq, 4);
    for (let i = 0; i < count; i++) {
      if (i % 2 === 0) {
        days.push({ nameKey: 'upper_body', exercises: [...exercises.chest, ...exercises.back.slice(0, 2), ...exercises.arms.slice(0, 1)] });
      } else {
        days.push({ nameKey: 'lower_body', exercises: [...exercises.legs, ...exercises.core] });
      }
    }
  } else if (splitKey === 'push_pull_legs') {
    days.push({ nameKey: 'push', exercises: [...exercises.chest, ...exercises.shoulders.slice(0, 2), ...exercises.arms.filter(e => e.name.includes('Tricep') || e.name.includes('Diamond'))] });
    days.push({ nameKey: 'pull', exercises: [...exercises.back, ...exercises.arms.filter(e => e.name.includes('Curl'))] });
    days.push({ nameKey: 'legs', exercises: [...exercises.legs, ...exercises.core] });
    if (freq >= 5) {
      days.push({ nameKey: 'push_b', exercises: [exercises.chest[0], exercises.shoulders[0], exercises.arms[0]] });
      days.push({ nameKey: 'pull_b', exercises: [exercises.back[0], exercises.back[1] || exercises.back[0]] });
    }
    if (freq >= 6) {
      days.push({ nameKey: 'legs_b', exercises: [exercises.legs[0], exercises.legs[1], exercises.core[0]] });
    }
  } else {
    days.push({ nameKey: 'chest_triceps', exercises: [...exercises.chest, ...exercises.arms.filter(e => e.name.includes('Tricep') || e.name.includes('Diamond'))] });
    days.push({ nameKey: 'back_biceps', exercises: [...exercises.back, ...exercises.arms.filter(e => e.name.includes('Curl'))] });
    days.push({ nameKey: 'shoulders_core', exercises: [...exercises.shoulders, ...exercises.core] });
    days.push({ nameKey: 'legs', exercises: [...exercises.legs] });
    if (freq >= 5) days.push({ nameKey: 'arms_abs', exercises: [...exercises.arms, ...exercises.core] });
  }

  let cardioNoteKey: 'enjoy' | 'some' | '' = '';
  if (data.cardio_preference === 'enjoy') cardioNoteKey = 'enjoy';
  else if (data.cardio_preference === 'some') cardioNoteKey = 'some';

  return { splitKey, days: days.slice(0, freq), cardioNoteKey, split: splitKey };
}

export default function OnboardingView() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const [showPlan, setShowPlan] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user, setOnboardingCompleted } = useAuth();
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

  const parseReps = (reps: string): { min: number; max: number } => {
    const match = reps.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) };
    const single = parseInt(reps);
    if (!isNaN(single)) return { min: single, max: single };
    return { min: 8, max: 12 };
  };

  const handleConfirm = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const focusMap: Record<string, string> = {
        lose_fat: 'full_body',
        build_muscle: 'full_body',
        improve_endurance: 'full_body',
        increase_strength: 'upper_body',
        general_fitness: 'full_body',
      };

      const finalSplit = plan?.split || 'full_body';

      const { error } = await supabase.from('client_onboarding').upsert({
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
      }, { onConflict: 'user_id' });

      if (error) throw error;

      if (plan) {
        const splitName = t(`onboardingExtra.splitNames.${plan.splitKey}`);
        const daysPayload = plan.days.map(day => ({
          name: t(`onboardingExtra.dayNames.${day.nameKey}`),
          exercises: day.exercises.map(ex => {
            const { min, max } = parseReps(ex.reps);
            return {
              name: ex.name,
              sets: ex.sets,
              rep_range_min: min,
              rep_range_max: max,
              muscle_group: 'other',
            };
          }),
        }));

        const { error: planError } = await supabase.rpc('create_onboarding_workout_plan', {
          _user_id: user.id,
          _plan_name: `${splitName} Plan`,
          _split_type: finalSplit,
          _frequency: (data.training_frequency as number) || 3,
          _days: daysPayload,
        });

        if (planError) {
          console.error('Failed to save workout plan:', planError);
          toast.error(t('onboarding.planFailed'));
        }
      }

      setOnboardingCompleted(true);
      toast.success(t('onboarding.programmeGenerated'));
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || t('errors.failedSaveOnboarding'));
    } finally {
      setSaving(false);
    }
  };

  if (showPlan && plan) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="px-5 pt-6 pb-2">
          <button onClick={() => setShowPlan(false)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <ChevronLeft className="h-4 w-4" /> {t('onboarding.backToQuestionnaire')}
          </button>
          <h1 className="text-2xl font-display font-bold">{t('onboarding.yourProgramme')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t(`onboardingExtra.splitNames.${plan.splitKey}`)} • {t('onboarding.daysPerWeek', { n: data.training_frequency })}
          </p>
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
              <h3 className="font-semibold text-sm mb-3">
                {t('onboardingExtra.dayLabel', { n: i + 1, name: t(`onboardingExtra.dayNames.${day.nameKey}`) })}
              </h3>
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

          {plan.cardioNoteKey && (
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <p className="text-sm text-foreground">
                🏃 <strong>{t('onboarding.cardio')}</strong> {t(`onboardingExtra.cardio.${plan.cardioNoteKey}`)}
              </p>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-muted border border-border">
            <p className="text-xs text-muted-foreground">{t('onboarding.autoGenerated')}</p>
          </div>
        </div>

        <div className="px-5 pb-8">
          <Button
            onClick={handleConfirm}
            disabled={saving}
            className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-semibold text-base"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-5 w-5 mr-2" /> {t('onboarding.confirmStart')}</>}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

      {currentStep > 0 && (
        <div className="px-5 pt-2">
          <button onClick={handleBack} className="flex items-center gap-1 text-sm text-muted-foreground">
            <ChevronLeft className="h-4 w-4" /> {t('common.back')}
          </button>
        </div>
      )}

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
              <h1 className="text-2xl font-display font-bold">{t(`onboarding.steps.${step.key}.title`)}</h1>
              <p className="text-muted-foreground">{t(`onboarding.steps.${step.key}.subtitle`)}</p>
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
                    {t(`onboarding.options.${opt.optKey}`)}
                  </button>
                ))}
              </div>
            )}

            {step.type === 'text' && (
              <div className="space-y-3">
                <Textarea
                  placeholder={t('onboarding.injuriesPlaceholder')}
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
                  {t('onboardingExtra.none')}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-5 pb-8">
        <Button
          onClick={handleNext}
          disabled={!canProceed && step.type !== 'text'}
          className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-semibold text-base"
        >
          {isLast ? t('onboardingExtra.generateProgramme') : t('onboardingExtra.continue')}
          {!isLast && <ChevronRight className="h-5 w-5 ml-1" />}
        </Button>
      </div>
    </div>
  );
}
