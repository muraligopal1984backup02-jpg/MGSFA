/*
  # Create Beat Plan Infrastructure

  ## Overview
  Beat plan allows field staff to have fixed routes on fixed days. This migration creates
  the infrastructure for route management and day-wise beat planning.

  ## New Tables
  
  1. `route_master_tbl`
    - `id` (uuid, primary key) - Unique identifier
    - `route_code` (text, unique) - Unique route code
    - `route_name` (text) - Route name
    - `route_description` (text) - Route description
    - `is_active` (boolean) - Active status
    - `created_by` (uuid) - User who created the route
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  2. `user_route_mapping_tbl`
    - `id` (uuid, primary key) - Unique identifier
    - `user_id` (uuid, foreign key) - References user_master_tbl
    - `route_id` (uuid, foreign key) - References route_master_tbl
    - `day_monday` (boolean) - Active on Monday
    - `day_tuesday` (boolean) - Active on Tuesday
    - `day_wednesday` (boolean) - Active on Wednesday
    - `day_thursday` (boolean) - Active on Thursday
    - `day_friday` (boolean) - Active on Friday
    - `day_saturday` (boolean) - Active on Saturday
    - `day_sunday` (boolean) - Active on Sunday
    - `is_active` (boolean) - Active status
    - `assigned_by` (uuid) - User who made the assignment
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  3. `route_customer_mapping_tbl`
    - `id` (uuid, primary key) - Unique identifier
    - `route_id` (uuid, foreign key) - References route_master_tbl
    - `customer_id` (uuid, foreign key) - References customer_master_tbl
    - `visit_sequence` (integer) - Order of visit in the route
    - `is_active` (boolean) - Active status
    - `created_by` (uuid) - User who made the mapping
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on all tables
  - Public access policies (application handles authorization)

  ## Indexes
  - Indexes on foreign keys for better query performance
  - Unique constraints where appropriate
*/

-- Create route_master_tbl
CREATE TABLE IF NOT EXISTS route_master_tbl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_code text UNIQUE NOT NULL,
  route_name text NOT NULL,
  route_description text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES user_master_tbl(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for route_master_tbl
CREATE INDEX IF NOT EXISTS idx_route_master_route_code ON route_master_tbl(route_code);
CREATE INDEX IF NOT EXISTS idx_route_master_is_active ON route_master_tbl(is_active);

-- Enable RLS for route_master_tbl
ALTER TABLE route_master_tbl ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view routes" ON route_master_tbl FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert routes" ON route_master_tbl FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update routes" ON route_master_tbl FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete routes" ON route_master_tbl FOR DELETE TO public USING (true);

-- Create user_route_mapping_tbl
CREATE TABLE IF NOT EXISTS user_route_mapping_tbl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_master_tbl(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES route_master_tbl(id) ON DELETE CASCADE,
  day_monday boolean DEFAULT false,
  day_tuesday boolean DEFAULT false,
  day_wednesday boolean DEFAULT false,
  day_thursday boolean DEFAULT false,
  day_friday boolean DEFAULT false,
  day_saturday boolean DEFAULT false,
  day_sunday boolean DEFAULT false,
  is_active boolean DEFAULT true,
  assigned_by uuid REFERENCES user_master_tbl(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, route_id)
);

-- Create indexes for user_route_mapping_tbl
CREATE INDEX IF NOT EXISTS idx_user_route_mapping_user_id ON user_route_mapping_tbl(user_id);
CREATE INDEX IF NOT EXISTS idx_user_route_mapping_route_id ON user_route_mapping_tbl(route_id);
CREATE INDEX IF NOT EXISTS idx_user_route_mapping_is_active ON user_route_mapping_tbl(is_active);

-- Enable RLS for user_route_mapping_tbl
ALTER TABLE user_route_mapping_tbl ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view user route mappings" ON user_route_mapping_tbl FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert user route mappings" ON user_route_mapping_tbl FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update user route mappings" ON user_route_mapping_tbl FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete user route mappings" ON user_route_mapping_tbl FOR DELETE TO public USING (true);

-- Create route_customer_mapping_tbl
CREATE TABLE IF NOT EXISTS route_customer_mapping_tbl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES route_master_tbl(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customer_master_tbl(id) ON DELETE CASCADE,
  visit_sequence integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES user_master_tbl(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(route_id, customer_id)
);

-- Create indexes for route_customer_mapping_tbl
CREATE INDEX IF NOT EXISTS idx_route_customer_mapping_route_id ON route_customer_mapping_tbl(route_id);
CREATE INDEX IF NOT EXISTS idx_route_customer_mapping_customer_id ON route_customer_mapping_tbl(customer_id);
CREATE INDEX IF NOT EXISTS idx_route_customer_mapping_is_active ON route_customer_mapping_tbl(is_active);
CREATE INDEX IF NOT EXISTS idx_route_customer_mapping_sequence ON route_customer_mapping_tbl(route_id, visit_sequence);

-- Enable RLS for route_customer_mapping_tbl
ALTER TABLE route_customer_mapping_tbl ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view route customer mappings" ON route_customer_mapping_tbl FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert route customer mappings" ON route_customer_mapping_tbl FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update route customer mappings" ON route_customer_mapping_tbl FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete route customer mappings" ON route_customer_mapping_tbl FOR DELETE TO public USING (true);