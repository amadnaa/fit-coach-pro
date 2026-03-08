import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
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
    title: 'Training Focus',
    subtitle: 'What do you want to prioritize?',
    key: 'training_focus',
    type: 'select',
    options: [
      { label: '💪 Upper Body', value: 'upper_body' },
      { label: '🦵 Lower Body', value: 'lower_body' },
      { label: '🏋️ Full Body', value: 'full_body' },
    ],
  },
  {
    title: 'Training Frequency',
    subtitle: 'How many days per week?',
    key: 'training_frequency',
    type: 'select',
    options: [
      { label: '2 days', value: 2 },
      { label: '3 days', value: 3 },
      { label: '4 days', value: 4 },
      { label: '5 days', value: 5 },
    ],
  },
  {
    title: 'Preferred Split',
    subtitle: 'Choose your workout structure',
    key: 'preferred_split',
    type: 'select',
    options: [
      { label: 'Push / Pull / Legs', value: 'push_pull_legs' },
      { label: 'Upper / Lower', value: 'upper_lower' },
      { label: 'Full Body', value: 'full_body' },
    ],
  },
  {
    title: 'Workout Duration',
    subtitle: 'How long per session?',
    key: 'workout_duration',
    type: 'select',
    options: [
      { label: '45 minutes', value: 45 },
      { label: '60 minutes', value: 60 },
      { label: '75 minutes', value: 75 },
    ],
  },
  {
    title: 'Injuries & Limitations',
    subtitle: 'Anything we should know about?',
    key: 'injuries',
    type: 'text',
  },
];

export default function OnboardingView() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<Partial<OnboardingData>>({});

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const canProceed = step.type === 'text' || data[step.key] !== undefined;

  const handleSelect = (value: string | number) => {
    setData({ ...data, [step.key]: value });
  };

  const handleNext = () => {
    if (isLast) {
      console.log('Onboarding complete:', data);
      return;
    }
    setCurrentStep(currentStep + 1);
  };

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
              <Textarea
                placeholder="E.g., Bad left knee, shoulder impingement..."
                value={(data.injuries as string) || ''}
                onChange={(e) => setData({ ...data, injuries: e.target.value })}
                className="min-h-[120px] rounded-2xl bg-card border-border resize-none"
              />
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
          {isLast ? 'Generate My Program' : 'Continue'}
          {!isLast && <ChevronRight className="h-5 w-5 ml-1" />}
        </Button>
      </div>
    </div>
  );
}
