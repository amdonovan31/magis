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
export type PersonalRecord =
  Database["public"]["Tables"]["personal_records"]["Row"];
export type BodyMeasurement =
  Database["public"]["Tables"]["body_measurements"]["Row"];
export type AgentActivityLog =
  Database["public"]["Tables"]["agent_activity_log"]["Row"];
export type FeedGroup = Database["public"]["Tables"]["feed_groups"]["Row"];
export type FeedGroupMember =
  Database["public"]["Tables"]["feed_group_members"]["Row"];
export type FeedPost = Database["public"]["Tables"]["feed_posts"]["Row"];
export type FeedReaction =
  Database["public"]["Tables"]["feed_reactions"]["Row"];
export type FeedComment =
  Database["public"]["Tables"]["feed_comments"]["Row"];
export type UserFollow = Database["public"]["Tables"]["user_follows"]["Row"];

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
  streak: number;
  unreadNotes: number;
  intakeComplete: boolean;
  intakeRequested: boolean;
};

export type CoachDashboardData = {
  coach: Profile;
  clients: ClientWithProgram[];
};

// Today's workout for a client
export type TodayWorkout = {
  template: WorkoutTemplateWithExercises;
  activeSession: WorkoutSession | null;
  completedSessionId: string | null;
  program: Program;
  coachName: string | null;
} | null;

// Session summary data
export type SessionSummary = {
  sessionId: string;
  templateTitle: string;
  programTitle: string;
  date: string;
  durationSeconds: number | null;
  exercisesCompleted: number;
  totalExercises: number;
  setsCompleted: number;
  totalSets: number;
  totalVolume: number;
  weightUnit: string;
  skippedExercises: { id: string; name: string }[];
  prs: {
    exerciseId: string;
    exerciseName: string;
    prType: string;
    value: number;
    previousValue: number | null;
  }[];
};

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

export type ProgramBuilderWeek = {
  weekNumber: number;
  isDeload: boolean;
  days: ProgramBuilderDay[];
};

export type ProgramBuilderState = {
  details: ProgramBuilderDetails;
  weeks: ProgramBuilderWeek[];
};

// PR summary for the list view (one entry per exercise)
export type PRSummary = {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string | null;
  currentBest: number;
  currentBestReps: number | null;
  estimated1RM: number;
  unit: string;
  achievedAt: string;
  recentPRs: { value: number; achievedAt: string }[];
};

// Single data point in a PR history chart
export type PRHistoryPoint = {
  date: string;
  weight: number;
  reps: number | null;
  estimated1RM: number;
  unit: string;
};

// Muscle groups for exercise filter
export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Core",
  "Calves",
  "Full Body",
  "Cardio",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

// Volume data point for weekly/monthly charts
export type VolumeDataPoint = {
  periodStart: string; // ISO date for week or month start
  muscleGroup: string;
  totalVolume: number;
  setCount: number;
};

// Consistent color mapping for muscle groups in charts
export const MUSCLE_GROUP_COLORS: Record<string, string> = {
  Chest: "#E07A5F",
  Back: "#3D405B",
  Shoulders: "#81B29A",
  Biceps: "#F2CC8F",
  Triceps: "#6B7B5E",
  Quads: "#2C4A2E",
  Hamstrings: "#577590",
  Glutes: "#C1666B",
  Calves: "#9B8EA4",
  Core: "#F4A261",
  "Full Body": "#264653",
  Cardio: "#E9C46A",
  Forearms: "#7B8D6A",
  Other: "#A0A0A0",
};

// Streak milestone thresholds
export const STREAK_MILESTONES = [1, 2, 4, 6, 8, 12, 16, 24, 52] as const;
export type StreakMilestone = (typeof STREAK_MILESTONES)[number];

export const STREAK_MILESTONE_LABELS: Record<StreakMilestone, string> = {
  1: "First week",
  2: "Building momentum",
  4: "One month strong",
  6: "Six week streak",
  8: "Two months",
  12: "Three months",
  16: "Four months",
  24: "Six months",
  52: "One full year",
};

export type WeekEntry = {
  weekStart: string; // ISO Monday date "YYYY-MM-DD"
  hasWorkout: boolean;
  isCurrentWeek: boolean;
};

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  currentWeekLogged: boolean;
  lastLoggedWeek: string | null;
  streakHistory: WeekEntry[]; // last 52 weeks, oldest first
  milestoneReached: StreakMilestone | null;
  isNewLongest: boolean; // true if current === longest && > 1
  weeksLoggedThisYear: number;
};

export type StreakSummary = {
  currentStreak: number;
  longestStreak: number;
  currentWeekLogged: boolean;
};

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
