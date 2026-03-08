
-- Add category column to exercises table
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other';

-- Create weekly check-ins table for client questionnaires
CREATE TABLE IF NOT EXISTS public.weekly_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  training_difficulty text NOT NULL DEFAULT 'moderate',
  recovery_level text NOT NULL DEFAULT 'good',
  energy_level text NOT NULL DEFAULT 'good',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.weekly_check_ins ENABLE ROW LEVEL SECURITY;

-- Clients manage own weekly check-ins
CREATE POLICY "Users manage own weekly check-ins" ON public.weekly_check_ins
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Coaches can view their clients' weekly check-ins
CREATE POLICY "Coaches view client weekly check-ins" ON public.weekly_check_ins
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM coach_clients
    WHERE coach_clients.coach_id = auth.uid()
    AND coach_clients.client_id = weekly_check_ins.user_id
  ));

-- Allow coaches to manage workout_exercises (insert/update/delete)
CREATE POLICY "Coaches manage workout exercises" ON public.workout_exercises
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM workouts w
    JOIN workout_plans wp ON w.plan_id = wp.id
    JOIN coach_clients cc ON cc.client_id = wp.client_id
    WHERE w.id = workout_exercises.workout_id AND cc.coach_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM workouts w
    JOIN workout_plans wp ON w.plan_id = wp.id
    JOIN coach_clients cc ON cc.client_id = wp.client_id
    WHERE w.id = workout_exercises.workout_id AND cc.coach_id = auth.uid()
  ));

-- Allow coaches to manage workouts
CREATE POLICY "Coaches manage workouts" ON public.workouts
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM workout_plans wp
    JOIN coach_clients cc ON cc.client_id = wp.client_id
    WHERE wp.id = workouts.plan_id AND cc.coach_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM workout_plans wp
    JOIN coach_clients cc ON cc.client_id = wp.client_id
    WHERE wp.id = workouts.plan_id AND cc.coach_id = auth.uid()
  ));

-- Coaches can view client workout logs
CREATE POLICY "Coaches view client workout logs" ON public.workout_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM coach_clients
    WHERE coach_clients.coach_id = auth.uid()
    AND coach_clients.client_id = workout_logs.user_id
  ));

-- Coaches can view client bodyweight logs
CREATE POLICY "Coaches view client bodyweight logs" ON public.bodyweight_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM coach_clients
    WHERE coach_clients.coach_id = auth.uid()
    AND coach_clients.client_id = bodyweight_logs.user_id
  ));

-- Coaches can view client step logs
CREATE POLICY "Coaches view client step logs" ON public.step_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM coach_clients
    WHERE coach_clients.coach_id = auth.uid()
    AND coach_clients.client_id = step_logs.user_id
  ));
