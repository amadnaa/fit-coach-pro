export type UserRole = 'coach' | 'client';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  user_code?: string;
  created_at: string;
}

export interface Client {
  id: string;
  profile: UserProfile;
  coach_id: string;
  last_workout_date?: string;
  body_weight?: number;
  adherence_percentage?: number;
  onboarding_completed: boolean;
}

export type ExerciseCategory = 'warmup' | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'glutes' | 'hamstrings' | 'quads' | 'core' | 'cardio' | 'stretching' | 'other';

export interface Exercise {
  id: string;
  name: string;
  description: string;
  video_url?: string;
  muscle_group: MuscleGroup;
  movement_type: MovementType;
  rep_range_min: number;
  rep_range_max: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  alternatives: string[];
  category: ExerciseCategory;
}

export type MuscleGroup = 'glutes' | 'quads' | 'hamstrings' | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'core';

export type MovementType = 'compound' | 'isolation' | 'machine' | 'bodyweight';

export interface WorkoutPlan {
  id: string;
  client_id: string;
  name: string;
  split_type: SplitType;
  frequency: number;
  cycle_week: number;
  created_at: string;
  is_active?: boolean;
}

export type SplitType = 'push_pull_legs' | 'upper_lower' | 'full_body';

export interface Workout {
  id: string;
  plan_id: string;
  name: string;
  day_number: number;
  exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise: Exercise;
  exercise_id: string;
  sets: number;
  rep_range_min: number;
  rep_range_max: number;
  target_weight?: number;
  sort_order: number;
}

export interface WorkoutLog {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  reps: number;
  weight: number;
  completed_at: string;
  arrow_direction?: 'up' | 'maintain' | 'down';
  user_id: string;
}

export interface CheckIn {
  id: string;
  client_id: string;
  workout_id: string;
  difficulty: 'easy' | 'normal' | 'hard';
  completed_all_sets: boolean;
  recovery_level: 'good' | 'medium' | 'poor';
  created_at: string;
}

export interface WeeklyCheckIn {
  id: string;
  user_id: string;
  week_start: string;
  training_difficulty: string;
  recovery_level: string;
  energy_level: string;
  notes?: string;
  created_at: string;
}

export interface OnboardingData {
  fitness_goal: string;
  training_frequency: number;
  experience_level: string;
  preferred_split: string;
  workout_duration: number;
  equipment_access: string;
  injuries?: string;
  cardio_preference: string;
  training_focus: string;
}

export interface Recipe {
  id: string;
  title: string;
  photo_url?: string;
  ingredients: string[];
  instructions: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  diet_type: string[];
  created_by: string;
}

export interface FeatureFlags {
  food_tracking_enabled: boolean;
  cardio_tracking_enabled: boolean;
  step_tracking_enabled: boolean;
}

export interface BodyWeightLog {
  id: string;
  client_id: string;
  weight: number;
  logged_at: string;
}

export interface StepLog {
  id: string;
  client_id: string;
  steps: number;
  logged_at: string;
}

export interface FoodLog {
  id: string;
  client_id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
}

export interface CardioLog {
  id: string;
  client_id: string;
  cardio_type: string;
  duration_minutes: number;
  calories_burned: number;
  logged_at: string;
}
