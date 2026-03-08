ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS accent_color_customized boolean NOT NULL DEFAULT false;

ALTER TABLE public.user_preferences
ALTER COLUMN accent_color SET DEFAULT '330 81% 60%';

UPDATE public.user_preferences
SET accent_color_customized = CASE
  WHEN accent_color IS NULL THEN false
  WHEN accent_color IN ('142 72% 50%', '142 72% 45%') THEN false
  ELSE true
END;

UPDATE public.user_preferences
SET accent_color = '330 81% 60%'
WHERE accent_color_customized = false;