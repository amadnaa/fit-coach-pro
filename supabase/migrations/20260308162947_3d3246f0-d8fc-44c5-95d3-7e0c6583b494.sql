-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'coach', 'client');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view client roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'coach'));

CREATE POLICY "Coaches can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'coach'));

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  user_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Coach-client relationship
CREATE TABLE public.coach_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coach_id, client_id)
);

ALTER TABLE public.coach_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own clients" ON public.coach_clients
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can add clients" ON public.coach_clients
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

-- Exercises table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  video_url TEXT,
  muscle_group TEXT NOT NULL,
  movement_type TEXT NOT NULL,
  rep_range_min INT NOT NULL DEFAULT 8,
  rep_range_max INT NOT NULL DEFAULT 12,
  difficulty_level TEXT NOT NULL DEFAULT 'intermediate',
  alternatives UUID[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exercises viewable by authenticated" ON public.exercises
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coaches can manage exercises" ON public.exercises
  FOR ALL USING (public.has_role(auth.uid(), 'coach'));

-- Workout plans
CREATE TABLE public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  split_type TEXT NOT NULL,
  frequency INT NOT NULL DEFAULT 3,
  cycle_week INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own plans" ON public.workout_plans
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Coaches manage client plans" ON public.workout_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.coach_clients WHERE coach_id = auth.uid() AND client_id = workout_plans.client_id)
  );

-- Workouts
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.workout_plans(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  day_number INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view workouts via plans" ON public.workouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.workout_plans WHERE id = workouts.plan_id AND client_id = auth.uid())
  );

-- Workout exercises
CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) NOT NULL,
  sets INT NOT NULL DEFAULT 3,
  rep_range_min INT NOT NULL DEFAULT 8,
  rep_range_max INT NOT NULL DEFAULT 12,
  target_weight DECIMAL,
  sort_order INT NOT NULL DEFAULT 0
);

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view workout exercises" ON public.workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workouts w
      JOIN public.workout_plans wp ON w.plan_id = wp.id
      WHERE w.id = workout_exercises.workout_id AND wp.client_id = auth.uid()
    )
  );

-- Workout logs
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_exercise_id UUID REFERENCES public.workout_exercises(id) NOT NULL,
  set_number INT NOT NULL,
  reps INT NOT NULL,
  weight DECIMAL NOT NULL,
  arrow_direction TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own logs" ON public.workout_logs
  FOR ALL USING (auth.uid() = user_id);

-- Check-ins
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_id UUID REFERENCES public.workouts(id),
  difficulty TEXT NOT NULL,
  completed_all_sets BOOLEAN NOT NULL DEFAULT true,
  recovery_level TEXT NOT NULL DEFAULT 'good',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own check-ins" ON public.check_ins
  FOR ALL USING (auth.uid() = user_id);

-- Body weight logs
CREATE TABLE public.bodyweight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight DECIMAL NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bodyweight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own weight logs" ON public.bodyweight_logs
  FOR ALL USING (auth.uid() = user_id);

-- Step logs
CREATE TABLE public.step_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  steps INT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.step_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own step logs" ON public.step_logs
  FOR ALL USING (auth.uid() = user_id);

-- Recipes
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  photo_url TEXT,
  ingredients TEXT[] DEFAULT '{}',
  instructions TEXT DEFAULT '',
  calories INT NOT NULL DEFAULT 0,
  protein INT NOT NULL DEFAULT 0,
  carbs INT NOT NULL DEFAULT 0,
  fat INT NOT NULL DEFAULT 0,
  diet_type TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipes viewable by authenticated" ON public.recipes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coaches can manage recipes" ON public.recipes
  FOR ALL USING (public.has_role(auth.uid(), 'coach'));

-- Food logs
CREATE TABLE public.food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_name TEXT NOT NULL,
  calories INT NOT NULL DEFAULT 0,
  protein INT NOT NULL DEFAULT 0,
  carbs INT NOT NULL DEFAULT 0,
  fat INT NOT NULL DEFAULT 0,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own food logs" ON public.food_logs
  FOR ALL USING (auth.uid() = user_id);

-- Cardio logs
CREATE TABLE public.cardio_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cardio_type TEXT NOT NULL,
  duration_minutes INT NOT NULL,
  calories_burned INT NOT NULL DEFAULT 0,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cardio_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cardio logs" ON public.cardio_logs
  FOR ALL USING (auth.uid() = user_id);

-- Feature flags per client
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  food_tracking_enabled BOOLEAN DEFAULT false,
  cardio_tracking_enabled BOOLEAN DEFAULT false,
  step_tracking_enabled BOOLEAN DEFAULT true
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own flags" ON public.feature_flags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Coaches manage client flags" ON public.feature_flags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.coach_clients WHERE coach_id = auth.uid() AND client_id = feature_flags.user_id)
  );

-- Onboarding data
CREATE TABLE public.client_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  training_focus TEXT NOT NULL,
  training_frequency INT NOT NULL,
  preferred_split TEXT NOT NULL,
  workout_duration INT NOT NULL,
  injuries TEXT,
  completed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own onboarding" ON public.client_onboarding
  FOR ALL USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, user_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();