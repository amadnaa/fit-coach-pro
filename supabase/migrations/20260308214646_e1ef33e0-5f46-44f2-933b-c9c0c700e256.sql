
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  workout_reminders_enabled boolean NOT NULL DEFAULT true,
  workout_reminder_minutes_before integer NOT NULL DEFAULT 60,
  default_morning_reminder_time time NOT NULL DEFAULT '08:00',
  nutrition_reminder_morning boolean NOT NULL DEFAULT true,
  nutrition_reminder_midday boolean NOT NULL DEFAULT true,
  nutrition_reminder_evening boolean NOT NULL DEFAULT true,
  push_notifications_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification preferences"
  ON public.notification_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches view client notification preferences"
  ON public.notification_preferences FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM coach_clients
    WHERE coach_clients.coach_id = auth.uid()
    AND coach_clients.client_id = notification_preferences.user_id
  ));

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
