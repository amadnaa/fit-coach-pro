export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bodyweight_logs: {
        Row: {
          id: string
          logged_at: string
          user_id: string
          weight: number
        }
        Insert: {
          id?: string
          logged_at?: string
          user_id: string
          weight: number
        }
        Update: {
          id?: string
          logged_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      cardio_logs: {
        Row: {
          calories_burned: number
          cardio_type: string
          duration_minutes: number
          id: string
          logged_at: string
          user_id: string
        }
        Insert: {
          calories_burned?: number
          cardio_type: string
          duration_minutes: number
          id?: string
          logged_at?: string
          user_id: string
        }
        Update: {
          calories_burned?: number
          cardio_type?: string
          duration_minutes?: number
          id?: string
          logged_at?: string
          user_id?: string
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          completed_all_sets: boolean
          created_at: string
          difficulty: string
          id: string
          recovery_level: string
          user_id: string
          workout_id: string | null
        }
        Insert: {
          completed_all_sets?: boolean
          created_at?: string
          difficulty: string
          id?: string
          recovery_level?: string
          user_id: string
          workout_id?: string | null
        }
        Update: {
          completed_all_sets?: boolean
          created_at?: string
          difficulty?: string
          id?: string
          recovery_level?: string
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_onboarding: {
        Row: {
          cardio_preference: string
          completed: boolean | null
          created_at: string
          equipment_access: string
          experience_level: string
          fitness_goal: string
          id: string
          injuries: string | null
          preferred_split: string
          training_focus: string
          training_frequency: number
          user_id: string
          workout_duration: number
        }
        Insert: {
          cardio_preference?: string
          completed?: boolean | null
          created_at?: string
          equipment_access?: string
          experience_level?: string
          fitness_goal?: string
          id?: string
          injuries?: string | null
          preferred_split: string
          training_focus: string
          training_frequency: number
          user_id: string
          workout_duration: number
        }
        Update: {
          cardio_preference?: string
          completed?: boolean | null
          created_at?: string
          equipment_access?: string
          experience_level?: string
          fitness_goal?: string
          id?: string
          injuries?: string | null
          preferred_split?: string
          training_focus?: string
          training_frequency?: number
          user_id?: string
          workout_duration?: number
        }
        Relationships: []
      }
      coach_clients: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          id: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          id?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          alternatives: string[] | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          difficulty_level: string
          id: string
          movement_type: string
          muscle_group: string
          name: string
          rep_range_max: number
          rep_range_min: number
          video_url: string | null
        }
        Insert: {
          alternatives?: string[] | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string
          id?: string
          movement_type: string
          muscle_group: string
          name: string
          rep_range_max?: number
          rep_range_min?: number
          video_url?: string | null
        }
        Update: {
          alternatives?: string[] | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string
          id?: string
          movement_type?: string
          muscle_group?: string
          name?: string
          rep_range_max?: number
          rep_range_min?: number
          video_url?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          cardio_tracking_enabled: boolean | null
          food_tracking_enabled: boolean | null
          id: string
          sleep_tracking_enabled: boolean | null
          user_id: string
        }
        Insert: {
          cardio_tracking_enabled?: boolean | null
          food_tracking_enabled?: boolean | null
          id?: string
          sleep_tracking_enabled?: boolean | null
          user_id: string
        }
        Update: {
          cardio_tracking_enabled?: boolean | null
          food_tracking_enabled?: boolean | null
          id?: string
          sleep_tracking_enabled?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      food_logs: {
        Row: {
          calories: number
          carbs: number
          fat: number
          food_name: string
          id: string
          logged_at: string
          protein: number
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number
          fat?: number
          food_name: string
          id?: string
          logged_at?: string
          protein?: number
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          fat?: number
          food_name?: string
          id?: string
          logged_at?: string
          protein?: number
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          default_morning_reminder_time: string
          id: string
          nutrition_reminder_evening: boolean
          nutrition_reminder_midday: boolean
          nutrition_reminder_morning: boolean
          push_notifications_enabled: boolean
          updated_at: string
          user_id: string
          workout_reminder_minutes_before: number
          workout_reminders_enabled: boolean
        }
        Insert: {
          created_at?: string
          default_morning_reminder_time?: string
          id?: string
          nutrition_reminder_evening?: boolean
          nutrition_reminder_midday?: boolean
          nutrition_reminder_morning?: boolean
          push_notifications_enabled?: boolean
          updated_at?: string
          user_id: string
          workout_reminder_minutes_before?: number
          workout_reminders_enabled?: boolean
        }
        Update: {
          created_at?: string
          default_morning_reminder_time?: string
          id?: string
          nutrition_reminder_evening?: boolean
          nutrition_reminder_midday?: boolean
          nutrition_reminder_morning?: boolean
          push_notifications_enabled?: boolean
          updated_at?: string
          user_id?: string
          workout_reminder_minutes_before?: number
          workout_reminders_enabled?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_broadcast: boolean | null
          read: boolean | null
          recipient_id: string | null
          sender_id: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_broadcast?: boolean | null
          read?: boolean | null
          recipient_id?: string | null
          sender_id?: string | null
          title?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_broadcast?: boolean | null
          read?: boolean | null
          recipient_id?: string | null
          sender_id?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_code: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_code?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_code?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          created_by: string | null
          diet_type: string[] | null
          fat: number
          id: string
          ingredients: string[] | null
          instructions: string | null
          photo_url: string | null
          protein: number
          title: string
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string
          created_by?: string | null
          diet_type?: string[] | null
          fat?: number
          id?: string
          ingredients?: string[] | null
          instructions?: string | null
          photo_url?: string | null
          protein?: number
          title: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          created_by?: string | null
          diet_type?: string[] | null
          fat?: number
          id?: string
          ingredients?: string[] | null
          instructions?: string | null
          photo_url?: string | null
          protein?: number
          title?: string
        }
        Relationships: []
      }
      scheduled_sessions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          session_date: string
          title: string
          user_id: string
          workout_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          session_date: string
          title?: string
          user_id: string
          workout_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          session_date?: string
          title?: string
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_logs: {
        Row: {
          hours: number
          id: string
          logged_at: string
          user_id: string
        }
        Insert: {
          hours: number
          id?: string
          logged_at?: string
          user_id: string
        }
        Update: {
          hours?: number
          id?: string
          logged_at?: string
          user_id?: string
        }
        Relationships: []
      }
      step_logs: {
        Row: {
          id: string
          logged_at: string
          steps: number
          user_id: string
        }
        Insert: {
          id?: string
          logged_at?: string
          steps: number
          user_id: string
        }
        Update: {
          id?: string
          logged_at?: string
          steps?: number
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          accent_color: string | null
          accent_color_customized: boolean
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          accent_color_customized?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          accent_color_customized?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_check_ins: {
        Row: {
          created_at: string
          energy_level: string
          id: string
          notes: string | null
          recovery_level: string
          training_difficulty: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          energy_level?: string
          id?: string
          notes?: string | null
          recovery_level?: string
          training_difficulty?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          energy_level?: string
          id?: string
          notes?: string | null
          recovery_level?: string
          training_difficulty?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          exercise_id: string
          id: string
          rep_range_max: number
          rep_range_min: number
          sets: number
          sort_order: number
          target_weight: number | null
          workout_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          rep_range_max?: number
          rep_range_min?: number
          sets?: number
          sort_order?: number
          target_weight?: number | null
          workout_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          rep_range_max?: number
          rep_range_min?: number
          sets?: number
          sort_order?: number
          target_weight?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          arrow_direction: string | null
          completed_at: string
          id: string
          reps: number
          set_number: number
          user_id: string
          weight: number
          workout_exercise_id: string
        }
        Insert: {
          arrow_direction?: string | null
          completed_at?: string
          id?: string
          reps: number
          set_number: number
          user_id: string
          weight: number
          workout_exercise_id: string
        }
        Update: {
          arrow_direction?: string | null
          completed_at?: string
          id?: string
          reps?: number
          set_number?: number
          user_id?: string
          weight?: number
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          client_id: string
          created_at: string
          cycle_week: number
          frequency: number
          id: string
          is_active: boolean | null
          name: string
          split_type: string
        }
        Insert: {
          client_id: string
          created_at?: string
          cycle_week?: number
          frequency?: number
          id?: string
          is_active?: boolean | null
          name: string
          split_type: string
        }
        Update: {
          client_id?: string
          created_at?: string
          cycle_week?: number
          frequency?: number
          id?: string
          is_active?: boolean | null
          name?: string
          split_type?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          completed: boolean | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          exercises_completed: number | null
          id: string
          notes: string | null
          started_at: string
          total_exercises: number | null
          total_reps: number | null
          total_sets_completed: number | null
          user_id: string
          workout_id: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          exercises_completed?: number | null
          id?: string
          notes?: string | null
          started_at?: string
          total_exercises?: number | null
          total_reps?: number | null
          total_sets_completed?: number | null
          user_id: string
          workout_id?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          exercises_completed?: number | null
          id?: string
          notes?: string | null
          started_at?: string
          total_exercises?: number | null
          total_reps?: number | null
          total_sets_completed?: number | null
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          day_number: number
          id: string
          name: string
          plan_id: string
        }
        Insert: {
          created_at?: string
          day_number: number
          id?: string
          name: string
          plan_id: string
        }
        Update: {
          created_at?: string
          day_number?: number
          id?: string
          name?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_onboarding_workout_plan: {
        Args: {
          _days: Json
          _frequency: number
          _plan_name: string
          _split_type: string
          _user_id: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "coach" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "coach", "client"],
    },
  },
} as const
