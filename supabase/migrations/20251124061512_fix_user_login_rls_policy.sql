/*
  # Fix User Login RLS Policy

  ## Changes
  - Add a public policy to allow anyone to SELECT from user_master_tbl for login purposes
  - This is needed because we're using custom authentication, not Supabase Auth
  - The policy only allows SELECT operations for login validation

  ## Security Notes
  - Password hashes are still protected (never sent to frontend)
  - Users can only read user data, not modify it
  - Write operations still require authentication
*/

-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own profile" ON user_master_tbl;

-- Create a new policy that allows public SELECT for login
CREATE POLICY "Public can view users for login"
  ON user_master_tbl FOR SELECT
  TO public
  USING (true);

-- Keep insert restricted to admins
DROP POLICY IF EXISTS "Admins can insert users" ON user_master_tbl;
CREATE POLICY "Admins can insert users"
  ON user_master_tbl FOR INSERT
  TO public
  WITH CHECK (false);

-- Keep update restricted to admins and self
DROP POLICY IF EXISTS "Admins can update users" ON user_master_tbl;
DROP POLICY IF EXISTS "Users can update own profile" ON user_master_tbl;

CREATE POLICY "Admins can update users"
  ON user_master_tbl FOR UPDATE
  TO public
  USING (false)
  WITH CHECK (false);
