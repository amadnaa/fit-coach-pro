
CREATE OR REPLACE FUNCTION public.create_onboarding_workout_plan(
  _user_id uuid,
  _plan_name text,
  _split_type text,
  _frequency int,
  _days jsonb -- array of { name: text, exercises: [{ name, sets, rep_range_min, rep_range_max }] }
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _plan_id uuid;
  _workout_id uuid;
  _exercise_id uuid;
  _day jsonb;
  _ex jsonb;
  _day_num int := 1;
  _sort int;
BEGIN
  -- Create the workout plan
  INSERT INTO public.workout_plans (client_id, name, split_type, frequency, cycle_week, is_active)
  VALUES (_user_id, _plan_name, _split_type, _frequency, 1, true)
  RETURNING id INTO _plan_id;

  -- Loop through days
  FOR _day IN SELECT * FROM jsonb_array_elements(_days)
  LOOP
    INSERT INTO public.workouts (plan_id, name, day_number)
    VALUES (_plan_id, _day->>'name', _day_num)
    RETURNING id INTO _workout_id;

    _sort := 0;

    -- Loop through exercises in this day
    FOR _ex IN SELECT * FROM jsonb_array_elements(_day->'exercises')
    LOOP
      -- Find or create exercise
      SELECT id INTO _exercise_id FROM public.exercises WHERE name = _ex->>'name' LIMIT 1;

      IF _exercise_id IS NULL THEN
        INSERT INTO public.exercises (name, muscle_group, movement_type, rep_range_min, rep_range_max, created_by)
        VALUES (
          _ex->>'name',
          COALESCE(_ex->>'muscle_group', 'other'),
          'compound',
          COALESCE((_ex->>'rep_range_min')::int, 8),
          COALESCE((_ex->>'rep_range_max')::int, 12),
          _user_id
        )
        RETURNING id INTO _exercise_id;
      END IF;

      INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, rep_range_min, rep_range_max, sort_order)
      VALUES (
        _workout_id,
        _exercise_id,
        COALESCE((_ex->>'sets')::int, 3),
        COALESCE((_ex->>'rep_range_min')::int, 8),
        COALESCE((_ex->>'rep_range_max')::int, 12),
        _sort
      );

      _sort := _sort + 1;
    END LOOP;

    _day_num := _day_num + 1;
  END LOOP;

  RETURN _plan_id;
END;
$$;
