
-- Function to notify coach when client logs something
CREATE OR REPLACE FUNCTION public.notify_coach_on_client_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _coach_id uuid;
  _client_name text;
  _activity_type text;
BEGIN
  -- Find the coach for this client
  SELECT cc.coach_id INTO _coach_id
  FROM coach_clients cc
  WHERE cc.client_id = NEW.user_id
  LIMIT 1;

  IF _coach_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get client name
  SELECT full_name INTO _client_name
  FROM profiles
  WHERE user_id = NEW.user_id
  LIMIT 1;

  _client_name := COALESCE(_client_name, 'A client');

  -- Determine activity type from table name
  _activity_type := TG_ARGV[0];

  INSERT INTO notifications (sender_id, recipient_id, title, body, is_broadcast)
  VALUES (
    NEW.user_id,
    _coach_id,
    _activity_type,
    _client_name || ' ' || CASE _activity_type
      WHEN 'Workout Logged' THEN 'logged a workout set'
      WHEN 'Meal Logged' THEN 'logged a meal'
      WHEN 'Weight Logged' THEN 'logged their body weight'
      WHEN 'Steps Logged' THEN 'logged their steps'
      WHEN 'Cardio Logged' THEN 'logged a cardio session'
      WHEN 'Check-in Submitted' THEN 'submitted a check-in'
      ELSE 'logged an activity'
    END,
    false
  );

  RETURN NEW;
END;
$$;

-- Trigger for workout session completion (not every set)
CREATE TRIGGER notify_coach_workout_session
  AFTER UPDATE OF completed ON workout_sessions
  FOR EACH ROW
  WHEN (NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false))
  EXECUTE FUNCTION notify_coach_on_client_activity('Workout Logged');

-- Trigger for food logs
CREATE TRIGGER notify_coach_food_log
  AFTER INSERT ON food_logs
  FOR EACH ROW
  EXECUTE FUNCTION notify_coach_on_client_activity('Meal Logged');

-- Trigger for bodyweight logs
CREATE TRIGGER notify_coach_bodyweight_log
  AFTER INSERT ON bodyweight_logs
  FOR EACH ROW
  EXECUTE FUNCTION notify_coach_on_client_activity('Weight Logged');

-- Trigger for step logs
CREATE TRIGGER notify_coach_step_log
  AFTER INSERT ON step_logs
  FOR EACH ROW
  EXECUTE FUNCTION notify_coach_on_client_activity('Steps Logged');

-- Trigger for cardio logs
CREATE TRIGGER notify_coach_cardio_log
  AFTER INSERT ON cardio_logs
  FOR EACH ROW
  EXECUTE FUNCTION notify_coach_on_client_activity('Cardio Logged');

-- Trigger for weekly check-ins
CREATE TRIGGER notify_coach_weekly_checkin
  AFTER INSERT ON weekly_check_ins
  FOR EACH ROW
  EXECUTE FUNCTION notify_coach_on_client_activity('Check-in Submitted');

-- Enable realtime on notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
