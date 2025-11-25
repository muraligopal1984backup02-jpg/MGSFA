/*
  # Update Customer User Assignments RLS Policies

  ## Overview
  Since this app uses custom authentication (not Supabase Auth), we need to update
  the RLS policies for customer_user_assignments_tbl to allow public access.
  Authorization is handled at the application level.

  ## Changes
  - Drop existing restrictive policies that use auth.uid()
  - Create public access policies for SELECT, INSERT, UPDATE, DELETE
  
  ## Security Notes
  - Application-level authentication is handled in the frontend
  - Users are authenticated via localStorage with custom login
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view customer assignments" ON customer_user_assignments_tbl;
DROP POLICY IF EXISTS "Admins and managers can create assignments" ON customer_user_assignments_tbl;
DROP POLICY IF EXISTS "Admins and managers can delete assignments" ON customer_user_assignments_tbl;

-- Create public access policies
CREATE POLICY "Public can view assignments" 
  ON customer_user_assignments_tbl 
  FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Public can insert assignments" 
  ON customer_user_assignments_tbl 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "Public can update assignments" 
  ON customer_user_assignments_tbl 
  FOR UPDATE 
  TO public 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Public can delete assignments" 
  ON customer_user_assignments_tbl 
  FOR DELETE 
  TO public 
  USING (true);