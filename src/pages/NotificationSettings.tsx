import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Bell, Dumbbell, UtensilsCrossed, Clock } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotificationPrefs {
  push_notifications_enabled: boolean;
  workout_reminders_enabled: boolean;
  workout_reminder_minutes_before: number;
  default_morning_reminder_time: string;
  nutrition_reminder_morning: boolean;
  nutrition_reminder_midday: boolean;
  nutrition_reminder_evening: boolean;
}

const defaultPrefs: NotificationPrefs = {
  push_notifications_enabled: true,
  workout_reminders_enabled: true,
  workout_reminder_minutes_before: 60,
  default_morning_reminder_time: '08:00',
  nutrition_reminder_morning: true,
  nutrition_reminder_midday: true,
  nutrition_reminder_evening: true,
};

export default function NotificationSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadPrefs();
  }, [user]);

  const loadPrefs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setPrefs({
        push_notifications_enabled: data.push_notifications_enabled,
        workout_reminders_enabled: data.workout_reminders_enabled,
        workout_reminder_minutes_before: data.workout_reminder_minutes_before,
        default_morning_reminder_time: data.default_morning_reminder_time,
        nutrition_reminder_morning: data.nutrition_reminder_morning,
        nutrition_reminder_midday: data.nutrition_reminder_midday,
        nutrition_reminder_evening: data.nutrition_reminder_evening,
      });
    }
    setLoading(false);
  };

  const updatePref = async (key: keyof NotificationPrefs, value: boolean | number | string) => {
    if (!user) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        ...updated,
      }, { onConflict: 'user_id' });

    if (error) {
      toast.error('Failed to save preference');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-5 pb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-display font-bold">Notification Settings</h1>
        </motion.div>

        {/* Master Toggle */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Push Notifications</p>
                <p className="text-xs text-muted-foreground">Enable or disable all notifications</p>
              </div>
            </div>
            <Switch
              checked={prefs.push_notifications_enabled}
              onCheckedChange={(v) => updatePref('push_notifications_enabled', v)}
            />
          </div>
        </motion.div>

        {/* Workout Reminders */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Workout Reminders</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Remind before workouts</p>
              <p className="text-xs text-muted-foreground">Get notified before scheduled sessions</p>
            </div>
            <Switch
              checked={prefs.workout_reminders_enabled}
              disabled={!prefs.push_notifications_enabled}
              onCheckedChange={(v) => updatePref('workout_reminders_enabled', v)}
            />
          </div>

          {prefs.workout_reminders_enabled && prefs.push_notifications_enabled && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm">Remind me</p>
                </div>
                <Select
                  value={String(prefs.workout_reminder_minutes_before)}
                  onValueChange={(v) => updatePref('workout_reminder_minutes_before', parseInt(v))}
                >
                  <SelectTrigger className="w-32 h-8 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min before</SelectItem>
                    <SelectItem value="30">30 min before</SelectItem>
                    <SelectItem value="60">1 hour before</SelectItem>
                    <SelectItem value="120">2 hours before</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm">Default morning reminder</p>
                </div>
                <Select
                  value={prefs.default_morning_reminder_time}
                  onValueChange={(v) => updatePref('default_morning_reminder_time', v)}
                >
                  <SelectTrigger className="w-24 h-8 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="07:00">7:00 AM</SelectItem>
                    <SelectItem value="07:30">7:30 AM</SelectItem>
                    <SelectItem value="08:00">8:00 AM</SelectItem>
                    <SelectItem value="08:30">8:30 AM</SelectItem>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </motion.div>

        {/* Nutrition Reminders */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="p-4 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Nutrition Logging Reminders</h2>
          </div>

          <p className="text-xs text-muted-foreground">
            Get reminded to log your meals at different times of the day. Reminders only fire if you haven't logged anything yet.
          </p>

          {[
            { key: 'nutrition_reminder_morning' as const, label: 'Morning (8:00 AM)', desc: 'Breakfast reminder' },
            { key: 'nutrition_reminder_midday' as const, label: 'Midday (1:00 PM)', desc: 'Lunch reminder' },
            { key: 'nutrition_reminder_evening' as const, label: 'Evening (7:00 PM)', desc: 'Dinner / end-of-day reminder' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={prefs[key]}
                disabled={!prefs.push_notifications_enabled}
                onCheckedChange={(v) => updatePref(key, v)}
              />
            </div>
          ))}
        </motion.div>

        <p className="text-xs text-muted-foreground text-center px-4">
          Push notifications require device permission. You may need to allow notifications in your device settings.
        </p>
      </div>
    </MobileLayout>
  );
}
