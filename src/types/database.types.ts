// Auto-generated types matching the Supabase schema.
// Re-generate with: npx supabase gen types typescript --linked > src/types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "coach" | "client" | "solo";
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: "coach" | "client" | "solo";
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "coach" | "client" | "solo";
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      coach_client_relationships: {
        Row: {
          id: string;
          coach_id: string;
          client_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          client_id: string;
          created_at?: string;
        };
        Update: {
          coach_id?: string;
          client_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coach_client_relationships_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coach_client_relationships_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      exercises: {
        Row: {
          id: string;
          created_by: string;
          name: string;
          muscle_group: string | null;
          instructions: string | null;
          video_url: string | null;
          equipment: string | null;
          secondary_muscles: string[] | null;
          is_archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          name: string;
          muscle_group?: string | null;
          instructions?: string | null;
          video_url?: string | null;
          equipment?: string | null;
          secondary_muscles?: string[] | null;
          is_archived?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          muscle_group?: string | null;
          instructions?: string | null;
          video_url?: string | null;
          equipment?: string | null;
          secondary_muscles?: string[] | null;
          is_archived?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      programs: {
        Row: {
          id: string;
          coach_id: string;
          client_id: string | null;
          title: string;
          description: string | null;
          is_active: boolean;
          starts_on: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          client_id?: string | null;
          title: string;
          description?: string | null;
          is_active?: boolean;
          starts_on?: string | null;
          created_at?: string;
        };
        Update: {
          client_id?: string | null;
          title?: string;
          description?: string | null;
          is_active?: boolean;
          starts_on?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "programs_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programs_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      workout_templates: {
        Row: {
          id: string;
          program_id: string;
          title: string;
          day_number: number | null;
          notes: string | null;
          scheduled_days: number[] | null;
          scheduled_dates: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          title: string;
          day_number?: number | null;
          notes?: string | null;
          scheduled_days?: number[] | null;
          scheduled_dates?: string[] | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          day_number?: number | null;
          notes?: string | null;
          scheduled_days?: number[] | null;
          scheduled_dates?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_templates_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          }
        ];
      };
      workout_template_exercises: {
        Row: {
          id: string;
          workout_template_id: string;
          exercise_id: string;
          position: number;
          prescribed_sets: number | null;
          prescribed_reps: string | null;
          prescribed_weight: string | null;
          rest_seconds: number | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          workout_template_id: string;
          exercise_id: string;
          position?: number;
          prescribed_sets?: number | null;
          prescribed_reps?: string | null;
          prescribed_weight?: string | null;
          rest_seconds?: number | null;
          notes?: string | null;
        };
        Update: {
          position?: number;
          prescribed_sets?: number | null;
          prescribed_reps?: string | null;
          prescribed_weight?: string | null;
          rest_seconds?: number | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_template_exercises_workout_template_id_fkey";
            columns: ["workout_template_id"];
            isOneToOne: false;
            referencedRelation: "workout_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_template_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          }
        ];
      };
      workout_sessions: {
        Row: {
          id: string;
          client_id: string;
          workout_template_id: string | null;
          program_id: string | null;
          status: "in_progress" | "completed" | "skipped";
          started_at: string;
          completed_at: string | null;
          duration_seconds: number | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          workout_template_id?: string | null;
          program_id?: string | null;
          status?: "in_progress" | "completed" | "skipped";
          started_at?: string;
          completed_at?: string | null;
          duration_seconds?: number | null;
          notes?: string | null;
        };
        Update: {
          status?: "in_progress" | "completed" | "skipped";
          completed_at?: string | null;
          duration_seconds?: number | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_sessions_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_sessions_workout_template_id_fkey";
            columns: ["workout_template_id"];
            isOneToOne: false;
            referencedRelation: "workout_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_sessions_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          }
        ];
      };
      set_logs: {
        Row: {
          id: string;
          session_id: string;
          template_exercise_id: string | null;
          set_number: number;
          reps_completed: number | null;
          weight_used: string | null;
          rpe: number | null;
          is_completed: boolean;
          sync_status: "pending" | "synced" | "conflict";
          logged_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          template_exercise_id?: string | null;
          set_number: number;
          reps_completed?: number | null;
          weight_used?: string | null;
          rpe?: number | null;
          is_completed?: boolean;
          sync_status?: "pending" | "synced" | "conflict";
          logged_at?: string;
        };
        Update: {
          reps_completed?: number | null;
          weight_used?: string | null;
          rpe?: number | null;
          is_completed?: boolean;
          sync_status?: "pending" | "synced" | "conflict";
        };
        Relationships: [
          {
            foreignKeyName: "set_logs_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "workout_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      client_workout_schedules: {
        Row: {
          id: string;
          client_id: string;
          workout_template_id: string;
          scheduled_days: number[] | null;
          scheduled_dates: string[] | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          workout_template_id: string;
          scheduled_days?: number[] | null;
          scheduled_dates?: string[] | null;
          updated_at?: string;
        };
        Update: {
          scheduled_days?: number[] | null;
          scheduled_dates?: string[] | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_workout_schedules_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_workout_schedules_workout_template_id_fkey";
            columns: ["workout_template_id"];
            isOneToOne: false;
            referencedRelation: "workout_templates";
            referencedColumns: ["id"];
          }
        ];
      };
      personal_records: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          pr_type: "weight" | "volume" | "reps" | "estimated_1rm";
          value: number;
          unit: string;
          reps: number | null;
          set_log_id: string | null;
          session_id: string | null;
          achieved_at: string;
          previous_value: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_id: string;
          pr_type: "weight" | "volume" | "reps" | "estimated_1rm";
          value: number;
          unit?: string;
          reps?: number | null;
          set_log_id?: string | null;
          session_id?: string | null;
          achieved_at?: string;
          previous_value?: number | null;
          created_at?: string;
        };
        Update: {
          pr_type?: "weight" | "volume" | "reps" | "estimated_1rm";
          value?: number;
          unit?: string;
          reps?: number | null;
          set_log_id?: string | null;
          session_id?: string | null;
          achieved_at?: string;
          previous_value?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "personal_records_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "personal_records_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "personal_records_set_log_id_fkey";
            columns: ["set_log_id"];
            isOneToOne: false;
            referencedRelation: "set_logs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "personal_records_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "workout_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      body_measurements: {
        Row: {
          id: string;
          user_id: string;
          measured_at: string;
          metric_type: string;
          value: number;
          unit: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          measured_at?: string;
          metric_type: string;
          value: number;
          unit?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          measured_at?: string;
          metric_type?: string;
          value?: number;
          unit?: string;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "body_measurements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      agent_activity_log: {
        Row: {
          id: string;
          client_id: string;
          coach_id: string | null;
          session_id: string | null;
          action_type:
            | "exercise_swap"
            | "session_shorten"
            | "injury_route"
            | "load_adjustment"
            | "rep_adjustment"
            | "rest_adjustment"
            | "program_generation"
            | "check_in_draft"
            | "other";
          description: string;
          details: Json | null;
          ai_model: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          coach_id?: string | null;
          session_id?: string | null;
          action_type:
            | "exercise_swap"
            | "session_shorten"
            | "injury_route"
            | "load_adjustment"
            | "rep_adjustment"
            | "rest_adjustment"
            | "program_generation"
            | "check_in_draft"
            | "other";
          description: string;
          details?: Json | null;
          ai_model?: string | null;
          created_at?: string;
        };
        Update: {
          action_type?:
            | "exercise_swap"
            | "session_shorten"
            | "injury_route"
            | "load_adjustment"
            | "rep_adjustment"
            | "rest_adjustment"
            | "program_generation"
            | "check_in_draft"
            | "other";
          description?: string;
          details?: Json | null;
          ai_model?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agent_activity_log_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_activity_log_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_activity_log_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "workout_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      feed_groups: {
        Row: {
          id: string;
          created_by: string;
          name: string;
          description: string | null;
          group_type: "coach_clients" | "challenge";
          goal_metric: string | null;
          starts_at: string | null;
          ends_at: string | null;
          invite_code: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          name: string;
          description?: string | null;
          group_type: "coach_clients" | "challenge";
          goal_metric?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          invite_code?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          goal_metric?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          invite_code?: string | null;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "feed_groups_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      feed_group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
          joined_at?: string;
        };
        Update: {
          role?: "owner" | "admin" | "member";
        };
        Relationships: [
          {
            foreignKeyName: "feed_group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "feed_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feed_group_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      feed_posts: {
        Row: {
          id: string;
          author_id: string;
          visibility: "friends" | "group" | "global";
          group_id: string | null;
          session_id: string | null;
          body: string | null;
          media_urls: string[] | null;
          summary_card: Json | null;
          is_pr_celebration: boolean;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          visibility?: "friends" | "group" | "global";
          group_id?: string | null;
          session_id?: string | null;
          body?: string | null;
          media_urls?: string[] | null;
          summary_card?: Json | null;
          is_pr_celebration?: boolean;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          visibility?: "friends" | "group" | "global";
          body?: string | null;
          media_urls?: string[] | null;
          summary_card?: Json | null;
          is_pr_celebration?: boolean;
          is_deleted?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "feed_posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feed_posts_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "feed_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feed_posts_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "workout_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      feed_reactions: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          reaction_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          reaction_type: string;
          created_at?: string;
        };
        Update: {
          reaction_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "feed_reactions_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "feed_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feed_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      feed_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          body: string;
          is_deleted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          body: string;
          is_deleted?: boolean;
          created_at?: string;
        };
        Update: {
          body?: string;
          is_deleted?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "feed_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "feed_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feed_comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_role: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
