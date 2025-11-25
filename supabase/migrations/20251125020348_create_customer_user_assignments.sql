/*
  # Create Customer-User Assignment Junction Table

  1. New Tables
    - `customer_user_assignments_tbl`
      - `id` (uuid, primary key) - Unique identifier
      - `customer_id` (uuid, foreign key) - References customer_master_tbl
      - `user_id` (uuid, foreign key) - References user_master_tbl
      - `assigned_at` (timestamptz) - When the assignment was made
      - `assigned_by` (uuid) - User who made the assignment
      - `created_at` (timestamptz) - Record creation timestamp
      
  2. Security
    - Enable RLS on `customer_user_assignments_tbl` table
    - Add policies for authenticated users to manage assignments
    
  3. Indexes
    - Add composite index on (customer_id, user_id) for fast lookups
    - Add index on customer_id for joins
    - Add index on user_id for joins
*/

-- Create customer-user assignments junction table
CREATE TABLE IF NOT EXISTS customer_user_assignments_tbl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customer_master_tbl(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_master_tbl(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES user_master_tbl(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customer_user_assignments_customer_id 
  ON customer_user_assignments_tbl(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_user_assignments_user_id 
  ON customer_user_assignments_tbl(user_id);

-- Enable RLS
ALTER TABLE customer_user_assignments_tbl ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view assignments for customers they're assigned to or if they're admin/manager
CREATE POLICY "Users can view customer assignments"
  ON customer_user_assignments_tbl
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_master_tbl
      WHERE user_master_tbl.id = auth.uid()
      AND (
        user_master_tbl.role IN ('admin', 'manager')
        OR user_master_tbl.id = customer_user_assignments_tbl.user_id
      )
    )
  );

-- Policy: Admins and managers can insert assignments
CREATE POLICY "Admins and managers can create assignments"
  ON customer_user_assignments_tbl
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_master_tbl
      WHERE user_master_tbl.id = auth.uid()
      AND user_master_tbl.role IN ('admin', 'manager')
    )
  );

-- Policy: Admins and managers can delete assignments
CREATE POLICY "Admins and managers can delete assignments"
  ON customer_user_assignments_tbl
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_master_tbl
      WHERE user_master_tbl.id = auth.uid()
      AND user_master_tbl.role IN ('admin', 'manager')
    )
  );

-- Migrate existing assigned_to data to the new junction table
DO $$
BEGIN
  INSERT INTO customer_user_assignments_tbl (customer_id, user_id, assigned_by)
  SELECT 
    id as customer_id,
    assigned_to as user_id,
    created_by as assigned_by
  FROM customer_master_tbl
  WHERE assigned_to IS NOT NULL
  ON CONFLICT (customer_id, user_id) DO NOTHING;
END $$;