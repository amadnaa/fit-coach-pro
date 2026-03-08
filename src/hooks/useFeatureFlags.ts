import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FeatureFlags {
  food_tracking_enabled: boolean;
  step_tracking_enabled: boolean;
  cardio_tracking_enabled: boolean;
}

const defaultFlags: FeatureFlags = {
  food_tracking_enabled: false,
  step_tracking_enabled: true,
  cardio_tracking_enabled: false,
};

export function useFeatureFlags() {
  const { user } = useAuth();
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchFlags = async () => {
      const { data } = await supabase
        .from('feature_flags')
        .select('food_tracking_enabled, step_tracking_enabled, cardio_tracking_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setFlags({
          food_tracking_enabled: data.food_tracking_enabled ?? false,
          step_tracking_enabled: data.step_tracking_enabled ?? true,
          cardio_tracking_enabled: data.cardio_tracking_enabled ?? false,
        });
      }
      setLoading(false);
    };

    fetchFlags();

    // Listen for realtime changes
    const channel = supabase
      .channel('feature-flags-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feature_flags',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData) {
            setFlags({
              food_tracking_enabled: newData.food_tracking_enabled ?? false,
              step_tracking_enabled: newData.step_tracking_enabled ?? true,
              cardio_tracking_enabled: newData.cardio_tracking_enabled ?? false,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { flags, loading };
}
