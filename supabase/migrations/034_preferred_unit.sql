-- Add preferred_unit column to profiles
alter table profiles
  add column preferred_unit text not null default 'lbs'
  constraint preferred_unit_check check (preferred_unit in ('kg', 'lbs'));
