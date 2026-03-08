
-- 1. Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid,
  sender_id uuid,
  title text NOT NULL DEFAULT '',
  body text NOT NULL,
  is_broadcast boolean DEFAULT false,
  read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications or broadcasts
CREATE POLICY "Users view own notifications" ON public.notifications
FOR SELECT TO authenticated USING (
  recipient_id = auth.uid() OR is_broadcast = true
);

-- Users can update (mark read) their own
CREATE POLICY "Users update own notifications" ON public.notifications
FOR UPDATE TO authenticated USING (recipient_id = auth.uid() OR is_broadcast = true);

-- Coaches can send notifications
CREATE POLICY "Coaches send notifications" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (
  has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'admin')
);

-- 2. Scheduled sessions table
CREATE TABLE public.scheduled_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_date date NOT NULL,
  title text NOT NULL DEFAULT 'Training Session',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions" ON public.scheduled_sessions
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches view client sessions" ON public.scheduled_sessions
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = auth.uid() AND coach_clients.client_id = scheduled_sessions.user_id)
);

-- 3. User preferences table for theme color
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  accent_color text DEFAULT '142 72% 50%',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences" ON public.user_preferences
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Users upload own avatar" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Avatars publicly readable" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'avatars');

CREATE POLICY "Users delete own avatar" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'avatars');
