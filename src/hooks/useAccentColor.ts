import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_COLOR = '330 81% 60%';

export function applyAccentColor(color: string) {
  const parts = color.split(' ').map(s => parseFloat(s));
  const h = parts[0], s = parts[1], l = parts[2];
  const darkL = Math.max(l - 10, 15);
  const lightL = Math.min(l + 10, 85);
  const lightH = (h + 18) % 360;

  document.documentElement.style.setProperty('--primary', color);
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--ring', color);
  document.documentElement.style.setProperty('--sidebar-primary', color);
  document.documentElement.style.setProperty('--sidebar-ring', color);
  document.documentElement.style.setProperty('--primary-dark', `${h} ${s}% ${darkL}%`);
  document.documentElement.style.setProperty('--primary-light', `${lightH} ${Math.min(s + 8, 100)}% ${lightL}%`);
}

export function useAccentColor(userId: string | undefined) {
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('user_preferences')
      .select('accent_color, accent_color_customized')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        const pref = data as { accent_color?: string | null; accent_color_customized?: boolean } | null;
        const isCustomized = pref?.accent_color_customized ?? false;
        const color = isCustomized ? (pref?.accent_color || DEFAULT_COLOR) : DEFAULT_COLOR;
        setSelectedColor(color);
        applyAccentColor(color);
        setLoaded(true);
      });
  }, [userId]);

  const updateColor = async (hslStr: string) => {
    setSelectedColor(hslStr);
    applyAccentColor(hslStr);
    if (!userId) return;
    await supabase.from('user_preferences').upsert({
      user_id: userId,
      accent_color: hslStr,
      accent_color_customized: true,
    } as any, { onConflict: 'user_id' });
  };

  return { selectedColor, updateColor, loaded, DEFAULT_COLOR };
}
