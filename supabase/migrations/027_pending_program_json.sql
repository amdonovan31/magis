-- Store pending AI-generated program JSON on the programs table.
-- Set when AI generates the program; cleared when the coach saves/discards.
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS pending_json jsonb;
