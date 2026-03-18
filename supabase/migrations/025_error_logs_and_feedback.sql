-- Beta infrastructure: error logging + user feedback

-- error_logs — captures unhandled errors from the app
CREATE TABLE IF NOT EXISTS error_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  role text,
  error_message text NOT NULL,
  error_stack text,
  component text,
  url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Write-only: authenticated users can insert, nobody can read
CREATE POLICY "Authenticated users can insert error_logs"
  ON error_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- feedback — user-submitted bug reports, suggestions, praise
CREATE TABLE IF NOT EXISTS feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  role text,
  category text NOT NULL CHECK (category IN ('bug', 'confusion', 'suggestion', 'praise')),
  message text NOT NULL,
  current_page text,
  app_version text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Write-only: authenticated users can insert their own feedback
CREATE POLICY "Authenticated users can insert feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);
