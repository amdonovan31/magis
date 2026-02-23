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
          role: "coach" | "client";
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: "coach" | "client";
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "coach" | "client";
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
          is_archived?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          muscle_group?: string | null;
          instructions?: string | null;
          video_url?: string | null;
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
          notes?: string | null;
        };
        Update: {
          status?: "in_progress" | "completed" | "skipped";
          completed_at?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_sessions_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
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
          logged_at?: string;
        };
        Update: {
          reps_completed?: number | null;
          weight_used?: string | null;
          rpe?: number | null;
          is_completed?: boolean;
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
