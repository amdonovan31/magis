-- Add skipped_exercises array to workout_sessions
alter table workout_sessions
  add column skipped_exercises text[] not null default '{}';
