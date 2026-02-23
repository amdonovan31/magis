import type { Database } from "./database.types";

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
export type Program = Database["public"]["Tables"]["programs"]["Row"];
export type WorkoutTemplate =
  Database["public"]["Tables"]["workout_templates"]["Row"];
export type WorkoutTemplateExercise =
  Database["public"]["Tables"]["workout_template_exercises"]["Row"];
export type WorkoutSession =
  Database["public"]["Tables"]["workout_sessions"]["Row"];
export type SetLog = Database["public"]["Tables"]["set_logs"]["Row"];
export type CoachClientRelationship =
  Database["public"]["Tables"]["coach_client_relationships"]["Row"];
export type ClientWorkoutSchedule =
  Database["public"]["Tables"]["client_workout_schedules"]["Row"];

// Composite types used throughout the app
export type ExerciseWithCreator = Exercise & {
  creator: Pick<Profile, "id" | "full_name"> | null;
};

export type WorkoutTemplateExerciseWithExercise = WorkoutTemplateExercise & {
  exercise: Exercise;
};

export type WorkoutTemplateWithExercises = WorkoutTemplate & {
  exercises: WorkoutTemplateExerciseWithExercise[];
};

export type ProgramWithTemplates = Program & {
  workout_templates: WorkoutTemplateWithExercises[];
};

export type WorkoutSessionWithTemplate = WorkoutSession & {
  workout_template: WorkoutTemplateWithExercises | null;
};

export type SetLogWithExercise = SetLog & {
  template_exercise: WorkoutTemplateExerciseWithExercise | null;
};

// Coach dashboard data
export type ClientWithProgram = {
  profile: Profile;
  activeProgram: Program | null;
  lastSessionDate: string | null;
};

export type CoachDashboardData = {
  coach: Profile;
  clients: ClientWithProgram[];
};

// Today's workout for a client
export type TodayWorkout = {
  template: WorkoutTemplateWithExercises;
  activeSession: WorkoutSession | null;
  program: Program;
} | null;

// Program builder form state
export type ProgramBuilderStep = 1 | 2 | 3 | 4;

export type ProgramBuilderDetails = {
  title: string;
  description: string;
  clientId: string;
  startsOn: string;
};

export type ProgramBuilderDay = {
  title: string;
  dayNumber: number;
  notes: string;
  scheduledDays: number[];
  exercises: ProgramBuilderExercise[];
};

export type ProgramBuilderExercise = {
  exerciseId: string;
  exerciseName: string;
  position: number;
  prescribedSets: number;
  prescribedReps: string;
  prescribedWeight: string;
  restSeconds: number;
  notes: string;
};

export type ProgramBuilderState = {
  details: ProgramBuilderDetails;
  days: ProgramBuilderDay[];
};

// Muscle groups for exercise filter
export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Hamstrings",
  "Glutes",
  "Core",
  "Calves",
  "Full Body",
  "Cardio",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

// Days of week for scheduling
export const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const;
