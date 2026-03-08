
-- Create sleep_logs table
CREATE TABLE public.sleep_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  hours numeric NOT NULL,
  logged_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

-- Users manage own sleep logs
CREATE POLICY "Users manage own sleep logs" ON public.sleep_logs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Coaches view client sleep logs
CREATE POLICY "Coaches view client sleep logs" ON public.sleep_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM coach_clients
    WHERE coach_clients.coach_id = auth.uid()
      AND coach_clients.client_id = sleep_logs.user_id
  ));

-- Add sleep_tracking_enabled to feature_flags, replace step_tracking
ALTER TABLE public.feature_flags ADD COLUMN sleep_tracking_enabled boolean DEFAULT true;

-- Migrate existing step_tracking values to sleep_tracking
UPDATE public.feature_flags SET sleep_tracking_enabled = step_tracking_enabled;

-- Drop old step_tracking column
ALTER TABLE public.feature_flags DROP COLUMN step_tracking_enabled;
