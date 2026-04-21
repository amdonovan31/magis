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
      agent_activity_log: {
        Row: {
          action_type: string
          ai_model: string | null
          client_id: string
          coach_id: string | null
          created_at: string
          description: string
          details: Json | null
          id: string
          session_id: string | null
        }
        Insert: {
          action_type: string
          ai_model?: string | null
          client_id: string
          coach_id?: string | null
          created_at?: string
          description: string
          details?: Json | null
          id?: string
          session_id?: string | null
        }
        Update: {
          action_type?: string
          ai_model?: string | null
          client_id?: string
          coach_id?: string | null
          created_at?: string
          description?: string
          details?: Json | null
          id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_activity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_activity_log_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_activity_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      body_measurements: {
        Row: {
          created_at: string
          id: string
          measured_at: string
          metric_type: string
          notes: string | null
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          measured_at?: string
          metric_type: string
          notes?: string | null
          unit?: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          measured_at?: string
          metric_type?: string
          notes?: string | null
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cardio_logs: {
        Row: {
          avg_heart_rate: number | null
          distance_unit: string | null
          distance_value: number | null
          duration_seconds: number | null
          id: string
          logged_at: string
          notes: string | null
          rpe: number | null
          session_id: string
        }
        Insert: {
          avg_heart_rate?: number | null
          distance_unit?: string | null
          distance_value?: number | null
          duration_seconds?: number | null
          id?: string
          logged_at?: string
          notes?: string | null
          rpe?: number | null
          session_id: string
        }
        Update: {
          avg_heart_rate?: number | null
          distance_unit?: string | null
          distance_value?: number | null
          duration_seconds?: number | null
          id?: string
          logged_at?: string
          notes?: string | null
          rpe?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cardio_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      client_exercise_feedback: {
        Row: {
          client_id: string
          created_at: string
          exercise_name: string
          id: string
          note: string
          program_title: string | null
          session_date: string
          session_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          exercise_name: string
          id?: string
          note: string
          program_title?: string | null
          session_date: string
          session_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          exercise_name?: string
          id?: string
          note?: string
          program_title?: string | null
          session_date?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_exercise_feedback_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_exercise_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      client_intake: {
        Row: {
          additional_notes: string | null
          client_id: string
          coach_id: string | null
          created_at: string
          days_per_week: number | null
          equipment_available: string[] | null
          id: string
          injuries_limitations: string | null
          parq_blood_pressure_meds: boolean
          parq_bone_joint: boolean
          parq_chest_pain_activity: boolean
          parq_chest_pain_rest: boolean
          parq_dizziness: boolean
          parq_heart_condition: boolean
          parq_notes: string | null
          parq_other_reason: boolean
          primary_goal: string | null
          secondary_goal: string | null
          session_duration: number | null
          training_focus: string[] | null
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          client_id: string
          coach_id?: string | null
          created_at?: string
          days_per_week?: number | null
          equipment_available?: string[] | null
          id?: string
          injuries_limitations?: string | null
          parq_blood_pressure_meds?: boolean
          parq_bone_joint?: boolean
          parq_chest_pain_activity?: boolean
          parq_chest_pain_rest?: boolean
          parq_dizziness?: boolean
          parq_heart_condition?: boolean
          parq_notes?: string | null
          parq_other_reason?: boolean
          primary_goal?: string | null
          secondary_goal?: string | null
          session_duration?: number | null
          training_focus?: string[] | null
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          client_id?: string
          coach_id?: string | null
          created_at?: string
          days_per_week?: number | null
          equipment_available?: string[] | null
          id?: string
          injuries_limitations?: string | null
          parq_blood_pressure_meds?: boolean
          parq_bone_joint?: boolean
          parq_chest_pain_activity?: boolean
          parq_chest_pain_rest?: boolean
          parq_dizziness?: boolean
          parq_heart_condition?: boolean
          parq_notes?: string | null
          parq_other_reason?: boolean
          primary_goal?: string | null
          secondary_goal?: string | null
          session_duration?: number | null
          training_focus?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_intake_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_intake_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          client_id: string
          coach_id: string
          content: string
          created_at: string
          id: string
          note_type: string
          session_log_id: string | null
        }
        Insert: {
          client_id: string
          coach_id: string
          content: string
          created_at?: string
          id?: string
          note_type: string
          session_log_id?: string | null
        }
        Update: {
          client_id?: string
          coach_id?: string
          content?: string
          created_at?: string
          id?: string
          note_type?: string
          session_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_session_log_id_fkey"
            columns: ["session_log_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      client_workout_schedules: {
        Row: {
          client_id: string
          id: string
          scheduled_dates: string[] | null
          scheduled_days: number[] | null
          updated_at: string
          workout_template_id: string
        }
        Insert: {
          client_id: string
          id?: string
          scheduled_dates?: string[] | null
          scheduled_days?: number[] | null
          updated_at?: string
          workout_template_id: string
        }
        Update: {
          client_id?: string
          id?: string
          scheduled_dates?: string[] | null
          scheduled_days?: number[] | null
          updated_at?: string
          workout_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_workout_schedules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_workout_schedules_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_client_relationships: {
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
        Relationships: [
          {
            foreignKeyName: "coach_client_relationships_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_client_relationships_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_client_views: {
        Row: {
          client_id: string
          coach_id: string
          viewed_at: string
        }
        Insert: {
          client_id: string
          coach_id: string
          viewed_at?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_client_views_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_client_views_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_guidelines: {
        Row: {
          additional_notes: string | null
          cardio_days_per_week: number | null
          cardio_modalities: string[] | null
          cardio_notes: string | null
          cardio_zone_focus: number | null
          client_id: string
          coach_id: string
          created_at: string
          exercises_to_avoid: string[] | null
          exercises_to_include: string[] | null
          id: string
          include_cardio: boolean
          intensity_level: string
          periodization_style: string
          program_length_weeks: number
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          cardio_days_per_week?: number | null
          cardio_modalities?: string[] | null
          cardio_notes?: string | null
          cardio_zone_focus?: number | null
          client_id: string
          coach_id: string
          created_at?: string
          exercises_to_avoid?: string[] | null
          exercises_to_include?: string[] | null
          id?: string
          include_cardio?: boolean
          intensity_level: string
          periodization_style: string
          program_length_weeks: number
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          cardio_days_per_week?: number | null
          cardio_modalities?: string[] | null
          cardio_notes?: string | null
          cardio_zone_focus?: number | null
          client_id?: string
          coach_id?: string
          created_at?: string
          exercises_to_avoid?: string[] | null
          exercises_to_include?: string[] | null
          id?: string
          include_cardio?: boolean
          intensity_level?: string
          periodization_style?: string
          program_length_weeks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_guidelines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_guidelines_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          component: string | null
          created_at: string | null
          error_message: string
          error_stack: string | null
          id: string
          metadata: Json | null
          role: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          component?: string | null
          created_at?: string | null
          error_message: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          role?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          component?: string | null
          created_at?: string | null
          error_message?: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          role?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_substitutions: {
        Row: {
          created_at: string
          id: string
          original_exercise_id: string
          reason: string | null
          session_id: string
          substitute_exercise_id: string
          template_exercise_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_exercise_id: string
          reason?: string | null
          session_id: string
          substitute_exercise_id: string
          template_exercise_id: string
        }
        Update: {
          created_at?: string
          id?: string
          original_exercise_id?: string
          reason?: string | null
          session_id?: string
          substitute_exercise_id?: string
          template_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_substitutions_original_exercise_id_fkey"
            columns: ["original_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_substitutions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_substitutions_substitute_exercise_id_fkey"
            columns: ["substitute_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_substitutions_template_exercise_id_fkey"
            columns: ["template_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_template_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          created_by: string
          difficulty: string
          equipment: string | null
          id: string
          instructions: string | null
          is_archived: boolean
          is_custom: boolean
          movement_pattern: string | null
          muscle_group: string | null
          name: string
          secondary_muscles: string[] | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          difficulty?: string
          equipment?: string | null
          id?: string
          instructions?: string | null
          is_archived?: boolean
          is_custom?: boolean
          movement_pattern?: string | null
          muscle_group?: string | null
          name: string
          secondary_muscles?: string[] | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          difficulty?: string
          equipment?: string | null
          id?: string
          instructions?: string | null
          is_archived?: boolean
          is_custom?: boolean
          movement_pattern?: string | null
          muscle_group?: string | null
          name?: string
          secondary_muscles?: string[] | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_deleted: boolean
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "feed_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          goal_metric: string | null
          group_type: string
          id: string
          invite_code: string | null
          is_active: boolean
          name: string
          starts_at: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          ends_at?: string | null
          goal_metric?: string | null
          group_type: string
          id?: string
          invite_code?: string | null
          is_active?: boolean
          name: string
          starts_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string | null
          goal_metric?: string | null
          group_type?: string
          id?: string
          invite_code?: string | null
          is_active?: boolean
          name?: string
          starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          author_id: string
          body: string | null
          created_at: string
          group_id: string | null
          id: string
          is_deleted: boolean
          is_pr_celebration: boolean
          media_urls: string[] | null
          session_id: string | null
          summary_card: Json | null
          updated_at: string
          visibility: string
        }
        Insert: {
          author_id: string
          body?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          is_deleted?: boolean
          is_pr_celebration?: boolean
          media_urls?: string[] | null
          session_id?: string | null
          summary_card?: Json | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          author_id?: string
          body?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          is_deleted?: boolean
          is_pr_celebration?: boolean
          media_urls?: string[] | null
          session_id?: string | null
          summary_card?: Json | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "feed_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          app_version: string | null
          category: string
          created_at: string | null
          current_page: string | null
          id: string
          message: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          category: string
          created_at?: string | null
          current_page?: string | null
          id?: string
          message: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          category?: string
          created_at?: string | null
          current_page?: string | null
          id?: string
          message?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_records: {
        Row: {
          achieved_at: string
          created_at: string
          exercise_id: string
          id: string
          pr_type: string
          previous_value: number | null
          reps: number | null
          session_id: string | null
          set_log_id: string | null
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          achieved_at?: string
          created_at?: string
          exercise_id: string
          id?: string
          pr_type: string
          previous_value?: number | null
          reps?: number | null
          session_id?: string | null
          set_log_id?: string | null
          unit?: string
          user_id: string
          value: number
        }
        Update: {
          achieved_at?: string
          created_at?: string
          exercise_id?: string
          id?: string
          pr_type?: string
          previous_value?: number | null
          reps?: number | null
          session_id?: string | null
          set_log_id?: string | null
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_set_log_id_fkey"
            columns: ["set_log_id"]
            isOneToOne: false
            referencedRelation: "set_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthdate: string | null
          coach_code: string | null
          created_at: string
          disclaimer_accepted_at: string | null
          full_name: string | null
          gender: string | null
          height_cm: number | null
          id: string
          intake_requested: boolean
          onboarding_complete: boolean
          preferred_unit: string
          role: string
          roles: string[]
          training_age_years: number | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          birthdate?: string | null
          coach_code?: string | null
          created_at?: string
          disclaimer_accepted_at?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id: string
          intake_requested?: boolean
          onboarding_complete?: boolean
          preferred_unit?: string
          role: string
          roles?: string[]
          training_age_years?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          birthdate?: string | null
          coach_code?: string | null
          created_at?: string
          disclaimer_accepted_at?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          intake_requested?: boolean
          onboarding_complete?: boolean
          preferred_unit?: string
          role?: string
          roles?: string[]
          training_age_years?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      programs: {
        Row: {
          client_id: string | null
          coach_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          pending_json: Json | null
          starts_on: string | null
          status: string
          title: string
        }
        Insert: {
          client_id?: string | null
          coach_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          pending_json?: Json | null
          starts_on?: string | null
          status?: string
          title: string
        }
        Update: {
          client_id?: string | null
          coach_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          pending_json?: Json | null
          starts_on?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_workout_exercises: {
        Row: {
          default_reps: string | null
          default_sets: number
          default_weight: string | null
          exercise_id: string
          id: string
          notes: string | null
          position: number
          rest_seconds: number | null
          saved_workout_id: string
        }
        Insert: {
          default_reps?: string | null
          default_sets?: number
          default_weight?: string | null
          exercise_id: string
          id?: string
          notes?: string | null
          position: number
          rest_seconds?: number | null
          saved_workout_id: string
        }
        Update: {
          default_reps?: string | null
          default_sets?: number
          default_weight?: string | null
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          rest_seconds?: number | null
          saved_workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_workout_exercises_saved_workout_id_fkey"
            columns: ["saved_workout_id"]
            isOneToOne: false
            referencedRelation: "saved_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_workouts: {
        Row: {
          client_id: string
          created_at: string
          id: string
          last_used_at: string | null
          source: string
          source_program_title: string | null
          source_template_id: string | null
          title: string
          updated_at: string
          use_count: number
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          source?: string
          source_program_title?: string | null
          source_template_id?: string | null
          title: string
          updated_at?: string
          use_count?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          source?: string
          source_program_title?: string | null
          source_template_id?: string | null
          title?: string
          updated_at?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "saved_workouts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_workouts_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_workouts: {
        Row: {
          client_id: string
          created_at: string
          id: string
          program_id: string
          scheduled_date: string
          session_id: string | null
          status: string
          updated_at: string
          workout_template_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          program_id: string
          scheduled_date: string
          session_id?: string | null
          status?: string
          updated_at?: string
          workout_template_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          program_id?: string
          scheduled_date?: string
          session_id?: string | null
          status?: string
          updated_at?: string
          workout_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_workouts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_workouts_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_workouts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_workouts_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      session_exercise_notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          session_id: string
          template_exercise_id: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          session_id: string
          template_exercise_id: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          session_id?: string
          template_exercise_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_exercise_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercise_notes_template_exercise_id_fkey"
            columns: ["template_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_template_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      session_extra_work: {
        Row: {
          client_id: string
          exercise_name: string
          group_id: string
          id: string
          logged_at: string
          reps_completed: number | null
          session_id: string
          set_number: number
          weight_unit: string | null
          weight_value: number | null
        }
        Insert: {
          client_id: string
          exercise_name: string
          group_id: string
          id?: string
          logged_at?: string
          reps_completed?: number | null
          session_id: string
          set_number: number
          weight_unit?: string | null
          weight_value?: number | null
        }
        Update: {
          client_id?: string
          exercise_name?: string
          group_id?: string
          id?: string
          logged_at?: string
          reps_completed?: number | null
          session_id?: string
          set_number?: number
          weight_unit?: string | null
          weight_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_extra_work_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_extra_work_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      set_logs: {
        Row: {
          exercise_id: string | null
          id: string
          is_completed: boolean
          is_skipped: boolean
          logged_at: string
          reps_completed: number | null
          rpe: number | null
          session_id: string
          set_number: number
          sync_status: string
          template_exercise_id: string | null
          weight_unit: string | null
          weight_used: string | null
          weight_value: number | null
        }
        Insert: {
          exercise_id?: string | null
          id?: string
          is_completed?: boolean
          is_skipped?: boolean
          logged_at?: string
          reps_completed?: number | null
          rpe?: number | null
          session_id: string
          set_number: number
          sync_status?: string
          template_exercise_id?: string | null
          weight_unit?: string | null
          weight_used?: string | null
          weight_value?: number | null
        }
        Update: {
          exercise_id?: string | null
          id?: string
          is_completed?: boolean
          is_skipped?: boolean
          logged_at?: string
          reps_completed?: number | null
          rpe?: number | null
          session_id?: string
          set_number?: number
          sync_status?: string
          template_exercise_id?: string | null
          weight_unit?: string | null
          weight_used?: string | null
          weight_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_template_exercise_id_fkey"
            columns: ["template_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_template_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          client_id: string
          completed_at: string | null
          duration_seconds: number | null
          id: string
          notes: string | null
          program_id: string | null
          skipped_exercises: string[]
          started_at: string
          status: string
          workout_template_id: string | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          program_id?: string | null
          skipped_exercises?: string[]
          started_at?: string
          status?: string
          workout_template_id?: string | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          program_id?: string | null
          skipped_exercises?: string[]
          started_at?: string
          status?: string
          workout_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_template_exercises: {
        Row: {
          alternate_exercise_ids: Json | null
          exercise_id: string
          id: string
          notes: string | null
          position: number
          prescribed_reps: string | null
          prescribed_sets: number | null
          prescribed_weight: string | null
          rest_seconds: number | null
          workout_template_id: string
        }
        Insert: {
          alternate_exercise_ids?: Json | null
          exercise_id: string
          id?: string
          notes?: string | null
          position?: number
          prescribed_reps?: string | null
          prescribed_sets?: number | null
          prescribed_weight?: string | null
          rest_seconds?: number | null
          workout_template_id: string
        }
        Update: {
          alternate_exercise_ids?: Json | null
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          prescribed_reps?: string | null
          prescribed_sets?: number | null
          prescribed_weight?: string | null
          rest_seconds?: number | null
          workout_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_template_exercises_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          cardio_distance_target: number | null
          cardio_distance_unit: string | null
          cardio_duration_minutes: number | null
          cardio_hr_zone: number | null
          cardio_modality: string | null
          cardio_notes: string | null
          created_at: string
          day_number: number | null
          id: string
          is_deload: boolean
          notes: string | null
          program_id: string
          scheduled_dates: string[] | null
          scheduled_days: number[] | null
          title: string
          type: string
          week_number: number
        }
        Insert: {
          cardio_distance_target?: number | null
          cardio_distance_unit?: string | null
          cardio_duration_minutes?: number | null
          cardio_hr_zone?: number | null
          cardio_modality?: string | null
          cardio_notes?: string | null
          created_at?: string
          day_number?: number | null
          id?: string
          is_deload?: boolean
          notes?: string | null
          program_id: string
          scheduled_dates?: string[] | null
          scheduled_days?: number[] | null
          title: string
          type?: string
          week_number?: number
        }
        Update: {
          cardio_distance_target?: number | null
          cardio_distance_unit?: string | null
          cardio_duration_minutes?: number | null
          cardio_hr_zone?: number | null
          cardio_modality?: string | null
          cardio_notes?: string | null
          created_at?: string
          day_number?: number | null
          id?: string
          is_deload?: boolean
          notes?: string | null
          program_id?: string
          scheduled_dates?: string[] | null
          scheduled_days?: number[] | null
          title?: string
          type?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_templates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_program_edits: {
        Args: {
          p_date_changes?: Json
          p_exercise_adds?: Json
          p_exercise_removes?: Json
          p_exercise_swaps?: Json
          p_exercise_updates?: Json
          p_program_id: string
          p_template_updates?: Json
        }
        Returns: Json
      }
      ensure_coach_code: { Args: { target_id: string }; Returns: string }
      get_my_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
