/*
  # Fix Call Log and Follow-up Table Constraints

  ## Changes
  1. Make recorded_by and created_by columns nullable to handle cases where user doesn't exist
  2. Add RLS policies for call_log_tbl and follow_up_tbl for public access
  
  ## Security
  - Allow public access for INSERT/UPDATE/SELECT operations
  - Application handles authorization
*/

-- Make recorded_by nullable in call_log_tbl
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'call_log_tbl' 
    AND column_name = 'recorded_by'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE call_log_tbl ALTER COLUMN recorded_by DROP NOT NULL;
  END IF;
END $$;

-- Make created_by nullable in follow_up_tbl
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'follow_up_tbl' 
    AND column_name = 'created_by'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE follow_up_tbl ALTER COLUMN created_by DROP NOT NULL;
  END IF;
END $$;

-- Make assigned_to nullable in follow_up_tbl
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'follow_up_tbl' 
    AND column_name = 'assigned_to'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE follow_up_tbl ALTER COLUMN assigned_to DROP NOT NULL;
  END IF;
END $$;

-- Add RLS policies for call_log_tbl
DROP POLICY IF EXISTS "Public can view call logs" ON call_log_tbl;
DROP POLICY IF EXISTS "Public can insert call logs" ON call_log_tbl;
DROP POLICY IF EXISTS "Public can update call logs" ON call_log_tbl;

CREATE POLICY "Public can view call logs" ON call_log_tbl FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert call logs" ON call_log_tbl FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update call logs" ON call_log_tbl FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Add RLS policies for follow_up_tbl
DROP POLICY IF EXISTS "Public can view follow-ups" ON follow_up_tbl;
DROP POLICY IF EXISTS "Public can insert follow-ups" ON follow_up_tbl;
DROP POLICY IF EXISTS "Public can update follow-ups" ON follow_up_tbl;

CREATE POLICY "Public can view follow-ups" ON follow_up_tbl FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert follow-ups" ON follow_up_tbl FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update follow-ups" ON follow_up_tbl FOR UPDATE TO public USING (true) WITH CHECK (true);
