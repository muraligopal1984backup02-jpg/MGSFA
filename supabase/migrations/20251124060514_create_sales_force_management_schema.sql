/*
  # Sales Force Management System - Complete Database Schema

  ## Overview
  Complete database schema for a sales force management application with CRM, order management, 
  collection tracking, and field staff location monitoring capabilities.

  ## New Tables
  
  ### 1. USER_MASTER_TBL
  User authentication and profile management
  - `id` (uuid, primary key)
  - `mobile_no` (text, unique) - Login credential
  - `password_hash` (text) - Encrypted password
  - `full_name` (text)
  - `email` (text)
  - `role` (text) - admin, sales_manager, field_staff
  - `is_active` (boolean)
  - `created_by` (uuid, references USER_MASTER_TBL)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. USER_LOCATION_TBL
  Real-time location tracking for field staff
  - `id` (uuid, primary key)
  - `user_id` (uuid, references USER_MASTER_TBL)
  - `latitude` (decimal)
  - `longitude` (decimal)
  - `accuracy` (decimal)
  - `recorded_at` (timestamptz)
  - `battery_level` (integer)

  ### 3. CUSTOMER_MASTER_TBL
  Customer information management
  - `id` (uuid, primary key)
  - `customer_code` (text, unique)
  - `customer_name` (text)
  - `contact_person` (text)
  - `mobile_no` (text)
  - `email` (text)
  - `gstin` (text)
  - `pan_no` (text)
  - `customer_type` (text) - retail, wholesale, distributor
  - `credit_limit` (decimal)
  - `credit_days` (integer)
  - `address_line1` (text)
  - `address_line2` (text)
  - `address_line3` (text)
  - `city` (text)
  - `state` (text)
  - `pincode` (text)
  - `owner_name` (text)
  - `assigned_to` (uuid, references USER_MASTER_TBL)
  - `is_active` (boolean)
  - `created_by` (uuid, references USER_MASTER_TBL)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. CUSTOMER_ADDRESS_TBL
  Customer address management (multiple addresses per customer)
  - `id` (uuid, primary key)
  - `customer_id` (uuid, references CUSTOMER_MASTER_TBL)
  - `address_type` (text) - billing, shipping, both
  - `address_line1` (text)
  - `address_line2` (text)
  - `city` (text)
  - `state` (text)
  - `pincode` (text)
  - `country` (text)
  - `is_primary` (boolean)
  - `latitude` (decimal)
  - `longitude` (decimal)
  - `created_at` (timestamptz)

  ### 5. LEAD_MASTER_TBL
  Lead management for potential customers
  - `id` (uuid, primary key)
  - `lead_code` (text, unique)
  - `company_name` (text)
  - `contact_person` (text)
  - `mobile_no` (text)
  - `email` (text)
  - `lead_source` (text) - cold_call, reference, website, exhibition
  - `lead_status` (text) - new, contacted, qualified, negotiation, won, lost
  - `lead_score` (integer)
  - `estimated_value` (decimal)
  - `expected_close_date` (date)
  - `assigned_to` (uuid, references USER_MASTER_TBL)
  - `notes` (text)
  - `created_by` (uuid, references USER_MASTER_TBL)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. LEAD_ADDRESS_TBL
  Lead address information
  - `id` (uuid, primary key)
  - `lead_id` (uuid, references LEAD_MASTER_TBL)
  - `address_line1` (text)
  - `address_line2` (text)
  - `city` (text)
  - `state` (text)
  - `pincode` (text)
  - `country` (text)
  - `latitude` (decimal)
  - `longitude` (decimal)
  - `created_at` (timestamptz)

  ### 7. BRAND_MASTER_TBL
  Brand catalog management
  - `id` (uuid, primary key)
  - `brand_code` (text, unique)
  - `brand_name` (text)
  - `category` (text)
  - `description` (text)
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### 8. PRODUCT_MASTER_TBL
  Product catalog management
  - `id` (uuid, primary key)
  - `product_code` (text, unique)
  - `product_name` (text)
  - `brand_id` (uuid, references BRAND_MASTER_TBL)
  - `category` (text)
  - `subcategory` (text)
  - `unit_of_measure` (text) - pcs, kg, ltr, box
  - `hsn_code` (text)
  - `gst_rate` (decimal)
  - `description` (text)
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 9. PRODUCT_PRICE_TBL
  Product pricing with customer type variations
  - `id` (uuid, primary key)
  - `product_id` (uuid, references PRODUCT_MASTER_TBL)
  - `customer_type` (text) - retail, wholesale, distributor
  - `price` (decimal)
  - `discount_percentage` (decimal)
  - `effective_from` (date)
  - `effective_to` (date)
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### 10. SALE_ORDER_HEADER_TBL
  Sales order header information
  - `id` (uuid, primary key)
  - `order_no` (text, unique)
  - `order_date` (date)
  - `customer_id` (uuid, references CUSTOMER_MASTER_TBL)
  - `billing_address_id` (uuid, references CUSTOMER_ADDRESS_TBL)
  - `shipping_address_id` (uuid, references CUSTOMER_ADDRESS_TBL)
  - `order_status` (text) - draft, confirmed, processing, dispatched, delivered, cancelled
  - `total_amount` (decimal)
  - `discount_amount` (decimal)
  - `tax_amount` (decimal)
  - `net_amount` (decimal)
  - `payment_terms` (text)
  - `delivery_date` (date)
  - `notes` (text)
  - `created_by` (uuid, references USER_MASTER_TBL)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 11. SALE_ORDER_DETAIL_TBL
  Sales order line items
  - `id` (uuid, primary key)
  - `order_id` (uuid, references SALE_ORDER_HEADER_TBL)
  - `line_no` (integer)
  - `product_id` (uuid, references PRODUCT_MASTER_TBL)
  - `quantity` (decimal)
  - `unit_price` (decimal)
  - `discount_percentage` (decimal)
  - `discount_amount` (decimal)
  - `tax_percentage` (decimal)
  - `tax_amount` (decimal)
  - `line_total` (decimal)
  - `notes` (text)
  - `created_at` (timestamptz)

  ### 12. COLLECTION_DETAIL_TBL
  Payment collection tracking
  - `id` (uuid, primary key)
  - `collection_no` (text, unique)
  - `collection_date` (date)
  - `customer_id` (uuid, references CUSTOMER_MASTER_TBL)
  - `order_id` (uuid, references SALE_ORDER_HEADER_TBL)
  - `amount` (decimal)
  - `payment_mode` (text) - cash, cheque, upi, neft, card
  - `payment_reference` (text)
  - `cheque_no` (text)
  - `cheque_date` (date)
  - `bank_name` (text)
  - `collection_status` (text) - pending, cleared, bounced
  - `notes` (text)
  - `collected_by` (uuid, references USER_MASTER_TBL)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies for authenticated users based on roles
  - Field staff can only access their assigned data
  - Admins have full access
*/

-- USER_MASTER_TBL
CREATE TABLE IF NOT EXISTS USER_MASTER_TBL (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_no text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'field_staff',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES USER_MASTER_TBL(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE USER_MASTER_TBL ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON USER_MASTER_TBL FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text OR auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can insert users"
  ON USER_MASTER_TBL FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can update users"
  ON USER_MASTER_TBL FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Users can update own profile"
  ON USER_MASTER_TBL FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- USER_LOCATION_TBL
CREATE TABLE IF NOT EXISTS USER_LOCATION_TBL (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES USER_MASTER_TBL(id) NOT NULL,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  accuracy decimal(10, 2),
  recorded_at timestamptz DEFAULT now(),
  battery_level integer
);

ALTER TABLE USER_LOCATION_TBL ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own location"
  ON USER_LOCATION_TBL FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Admins and managers can view all locations"
  ON USER_LOCATION_TBL FOR SELECT
  TO authenticated
  USING (
    auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
    auth.uid()::text = user_id::text
  );

-- CUSTOMER_MASTER_TBL
CREATE TABLE IF NOT EXISTS CUSTOMER_MASTER_TBL (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  contact_person text,
  mobile_no text NOT NULL,
  email text,
  gstin text,
  pan_no text,
  customer_type text DEFAULT 'retail',
  credit_limit decimal(15, 2) DEFAULT 0,
  credit_days integer DEFAULT 0,
  address_line1 text,
  address_line2 text,
  address_line3 text,
  city text,
  state text,
  pincode text,
  owner_name text,
  assigned_to uuid REFERENCES USER_MASTER_TBL(id),
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES USER_MASTER_TBL(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE CUSTOMER_MASTER_TBL ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assigned customers"
  ON CUSTOMER_MASTER_TBL FOR SELECT
  TO authenticated
  USING (
    auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
    auth.uid()::text = assigned_to::text
  );

CREATE POLICY "Users can insert customers"
  ON CUSTOMER_MASTER_TBL FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = created_by::text);

CREATE POLICY "Users can update assigned customers"
  ON CUSTOMER_MASTER_TBL FOR UPDATE
  TO authenticated
  USING (
    auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
    auth.uid()::text = assigned_to::text
  )
  WITH CHECK (
    auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
    auth.uid()::text = assigned_to::text
  );

-- CUSTOMER_ADDRESS_TBL
CREATE TABLE IF NOT EXISTS CUSTOMER_ADDRESS_TBL (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES CUSTOMER_MASTER_TBL(id) ON DELETE CASCADE NOT NULL,
  address_type text DEFAULT 'both',
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  country text DEFAULT 'India',
  is_primary boolean DEFAULT false,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE CUSTOMER_ADDRESS_TBL ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view addresses of assigned customers"
  ON CUSTOMER_ADDRESS_TBL FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM CUSTOMER_MASTER_TBL c
      WHERE c.id = customer_id
      AND (
        auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
        auth.uid()::text = c.assigned_to::text
      )
    )
  );

CREATE POLICY "Users can insert addresses for assigned customers"
  ON CUSTOMER_ADDRESS_TBL FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM CUSTOMER_MASTER_TBL c
      WHERE c.id = customer_id
      AND (
        auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
        auth.uid()::text = c.assigned_to::text
      )
    )
  );

CREATE POLICY "Users can update addresses for assigned customers"
  ON CUSTOMER_ADDRESS_TBL FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM CUSTOMER_MASTER_TBL c
      WHERE c.id = customer_id
      AND (
        auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
        auth.uid()::text = c.assigned_to::text
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM CUSTOMER_MASTER_TBL c
      WHERE c.id = customer_id
      AND (
        auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
        auth.uid()::text = c.assigned_to::text
      )
    )
  );

-- LEAD_MASTER_TBL
CREATE TABLE IF NOT EXISTS LEAD_MASTER_TBL (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_code text UNIQUE NOT NULL,
  company_name text NOT NULL,
  contact_person text NOT NULL,
  mobile_no text NOT NULL,
  email text,
  lead_source text DEFAULT 'cold_call',
  lead_status text DEFAULT 'new',
  lead_score integer DEFAULT 0,
  estimated_value decimal(15, 2),
  expected_close_date date,
  assigned_to uuid REFERENCES USER_MASTER_TBL(id),
  notes text,
  created_by uuid REFERENCES USER_MASTER_TBL(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE LEAD_MASTER_TBL ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assigned leads"
  ON LEAD_MASTER_TBL FOR SELECT
  TO authenticated
  USING (
    auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
    auth.uid()::text = assigned_to::text OR
    auth.uid()::text = created_by::text
  );

CREATE POLICY "Users can insert leads"
  ON LEAD_MASTER_TBL FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = created_by::text);

CREATE POLICY "Users can update assigned leads"
  ON LEAD_MASTER_TBL FOR UPDATE
  TO authenticated
  USING (
    auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
    auth.uid()::text = assigned_to::text
  )
  WITH CHECK (
    auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
    auth.uid()::text = assigned_to::text
  );

-- LEAD_ADDRESS_TBL
CREATE TABLE IF NOT EXISTS LEAD_ADDRESS_TBL (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES LEAD_MASTER_TBL(id) ON DELETE CASCADE NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  country text DEFAULT 'India',
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE LEAD_ADDRESS_TBL ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view addresses of assigned leads"
  ON LEAD_ADDRESS_TBL FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM LEAD_MASTER_TBL l
      WHERE l.id = lead_id
      AND (
        auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
        auth.uid()::text = l.assigned_to::text OR
        auth.uid()::text = l.created_by::text
      )
    )
  );

CREATE POLICY "Users can insert addresses for assigned leads"
  ON LEAD_ADDRESS_TBL FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM LEAD_MASTER_TBL l
      WHERE l.id = lead_id
      AND (
        auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
        auth.uid()::text = l.assigned_to::text OR
        auth.uid()::text = l.created_by::text
      )
    )
  );

CREATE POLICY "Users can update addresses for assigned leads"
  ON LEAD_ADDRESS_TBL FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM LEAD_MASTER_TBL l
      WHERE l.id = lead_id
      AND (
        auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
        auth.uid()::text = l.assigned_to::text
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM LEAD_MASTER_TBL l
      WHERE l.id = lead_id
      AND (
        auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
        auth.uid()::text = l.assigned_to::text
      )
    )
  );

-- BRAND_MASTER_TBL
CREATE TABLE IF NOT EXISTS BRAND_MASTER_TBL (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_code text UNIQUE NOT NULL,
  brand_name text NOT NULL,
  category text,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE BRAND_MASTER_TBL ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view brands"
  ON BRAND_MASTER_TBL FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert brands"
  ON BRAND_MASTER_TBL FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can update brands"
  ON BRAND_MASTER_TBL FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- PRODUCT_MASTER_TBL
CREATE TABLE IF NOT EXISTS PRODUCT_MASTER_TBL (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code text UNIQUE NOT NULL,
  product_name text NOT NULL,
  brand_id uuid REFERENCES BRAND_MASTER_TBL(id),
  category text,
  subcategory text,
  unit_of_measure text DEFAULT 'pcs',
  hsn_code text,
  gst_rate decimal(5, 2) DEFAULT 0,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE PRODUCT_MASTER_TBL ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view products"
  ON PRODUCT_MASTER_TBL FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert products"
  ON PRODUCT_MASTER_TBL FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can update products"
  ON PRODUCT_MASTER_TBL FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- PRODUCT_PRICE_TBL
CREATE TABLE IF NOT EXISTS PRODUCT_PRICE_TBL (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES PRODUCT_MASTER_TBL(id) NOT NULL,
  customer_type text DEFAULT 'retail',
  price decimal(15, 2) NOT NULL,
  discount_percentage decimal(5, 2) DEFAULT 0,
  effective_from date DEFAULT CURRENT_DATE,
  effective_to date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE PRODUCT_PRICE_TBL ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view prices"
  ON PRODUCT_PRICE_TBL FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert prices"
  ON PRODUCT_PRICE_TBL FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can update prices"
  ON PRODUCT_PRICE_TBL FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- SALE_ORDER_HEADER_TBL
CREATE TABLE IF NOT EXISTS SALE_ORDER_HEADER_TBL (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no text UNIQUE NOT NULL,
  order_date date DEFAULT CURRENT_DATE,
  customer_id uuid REFERENCES CUSTOMER_MASTER_TBL(id) NOT NULL,
  billing_address_id uuid REFERENCES CUSTOMER_ADDRESS_TBL(id),
  shipping_address_id uuid REFERENCES CUSTOMER_ADDRESS_TBL(id),
  order_status text DEFAULT 'draft',
  total_amount decimal(15, 2) DEFAULT 0,
  discount_amount decimal(15, 2) DEFAULT 0,
  tax_amount decimal(15, 2) DEFAULT 0,
  net_amount decimal(15, 2) DEFAULT 0,
  payment_terms text,
  delivery_date date,
  notes text,
  created_by uuid REFERENCES USER_MASTER_TBL(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE SALE_ORDER_HEADER_TBL ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view orders for assigned customers"
  ON SALE_ORDER_HEADER_TBL FOR SELECT
  TO authenticated
  USING (
    auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
    auth.uid()::text = created_by::text OR
    EXISTS (
      SELECT 1 FROM CUSTOMER_MASTER_TBL c
      WHERE c.id = customer_id
      AND auth.uid()::text = c.assigned_to::text
    )
  );

CREATE POLICY "Users can insert orders"
  ON SALE_ORDER_HEADER_TBL FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = created_by::text);

CREATE POLICY "Users can update own orders"
  ON SALE_ORDER_HEADER_TBL FOR UPDATE
  TO authenticated
  USING (
    auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
    auth.uid()::text = created_by::text
  )
  WITH CHECK (
    auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
    auth.uid()::text = created_by::text
  );

-- SALE_ORDER_DETAIL_TBL
CREATE TABLE IF NOT EXISTS SALE_ORDER_DETAIL_TBL (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES SALE_ORDER_HEADER_TBL(id) ON DELETE CASCADE NOT NULL,
  line_no integer NOT NULL,
  product_id uuid REFERENCES PRODUCT_MASTER_TBL(id) NOT NULL,
  quantity decimal(15, 3) NOT NULL,
  unit_price decimal(15, 2) NOT NULL,
  discount_percentage decimal(5, 2) DEFAULT 0,
  discount_amount decimal(15, 2) DEFAULT 0,
  tax_percentage decimal(5, 2) DEFAULT 0,
  tax_amount decimal(15, 2) DEFAULT 0,
  line_total decimal(15, 2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE SALE_ORDER_DETAIL_TBL ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order details for accessible orders"
  ON SALE_ORDER_DETAIL_TBL FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM SALE_ORDER_HEADER_TBL o
      WHERE o.id = order_id
      AND (
        auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
        auth.uid()::text = o.created_by::text OR
        EXISTS (
          SELECT 1 FROM CUSTOMER_MASTER_TBL c
          WHERE c.id = o.customer_id
          AND auth.uid()::text = c.assigned_to::text
        )
      )
    )
  );

CREATE POLICY "Users can insert order details"
  ON SALE_ORDER_DETAIL_TBL FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM SALE_ORDER_HEADER_TBL o
      WHERE o.id = order_id
      AND auth.uid()::text = o.created_by::text
    )
  );

CREATE POLICY "Users can update order details"
  ON SALE_ORDER_DETAIL_TBL FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM SALE_ORDER_HEADER_TBL o
      WHERE o.id = order_id
      AND (
        auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
        auth.uid()::text = o.created_by::text
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM SALE_ORDER_HEADER_TBL o
      WHERE o.id = order_id
      AND (
        auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
        auth.uid()::text = o.created_by::text
      )
    )
  );

CREATE POLICY "Users can delete order details"
  ON SALE_ORDER_DETAIL_TBL FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM SALE_ORDER_HEADER_TBL o
      WHERE o.id = order_id
      AND (
        auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
        auth.uid()::text = o.created_by::text
      )
    )
  );

-- COLLECTION_DETAIL_TBL
CREATE TABLE IF NOT EXISTS COLLECTION_DETAIL_TBL (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_no text UNIQUE NOT NULL,
  collection_date date DEFAULT CURRENT_DATE,
  customer_id uuid REFERENCES CUSTOMER_MASTER_TBL(id) NOT NULL,
  order_id uuid REFERENCES SALE_ORDER_HEADER_TBL(id),
  amount decimal(15, 2) NOT NULL,
  payment_mode text DEFAULT 'cash',
  payment_reference text,
  cheque_no text,
  cheque_date date,
  bank_name text,
  collection_status text DEFAULT 'pending',
  notes text,
  collected_by uuid REFERENCES USER_MASTER_TBL(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE COLLECTION_DETAIL_TBL ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view collections for assigned customers"
  ON COLLECTION_DETAIL_TBL FOR SELECT
  TO authenticated
  USING (
    auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
    auth.uid()::text = collected_by::text OR
    EXISTS (
      SELECT 1 FROM CUSTOMER_MASTER_TBL c
      WHERE c.id = customer_id
      AND auth.uid()::text = c.assigned_to::text
    )
  );

CREATE POLICY "Users can insert collections"
  ON COLLECTION_DETAIL_TBL FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = collected_by::text);

CREATE POLICY "Users can update own collections"
  ON COLLECTION_DETAIL_TBL FOR UPDATE
  TO authenticated
  USING (
    auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
    auth.uid()::text = collected_by::text
  )
  WITH CHECK (
    auth.jwt()->>'role' IN ('admin', 'sales_manager') OR 
    auth.uid()::text = collected_by::text
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_mobile ON USER_MASTER_TBL(mobile_no);
CREATE INDEX IF NOT EXISTS idx_user_location_user_id ON USER_LOCATION_TBL(user_id);
CREATE INDEX IF NOT EXISTS idx_user_location_recorded_at ON USER_LOCATION_TBL(recorded_at);
CREATE INDEX IF NOT EXISTS idx_customer_assigned_to ON CUSTOMER_MASTER_TBL(assigned_to);
CREATE INDEX IF NOT EXISTS idx_customer_address_customer_id ON CUSTOMER_ADDRESS_TBL(customer_id);
CREATE INDEX IF NOT EXISTS idx_lead_assigned_to ON LEAD_MASTER_TBL(assigned_to);
CREATE INDEX IF NOT EXISTS idx_lead_address_lead_id ON LEAD_ADDRESS_TBL(lead_id);
CREATE INDEX IF NOT EXISTS idx_product_brand_id ON PRODUCT_MASTER_TBL(brand_id);
CREATE INDEX IF NOT EXISTS idx_product_price_product_id ON PRODUCT_PRICE_TBL(product_id);
CREATE INDEX IF NOT EXISTS idx_order_customer_id ON SALE_ORDER_HEADER_TBL(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_created_by ON SALE_ORDER_HEADER_TBL(created_by);
CREATE INDEX IF NOT EXISTS idx_order_detail_order_id ON SALE_ORDER_DETAIL_TBL(order_id);
CREATE INDEX IF NOT EXISTS idx_collection_customer_id ON COLLECTION_DETAIL_TBL(customer_id);
CREATE INDEX IF NOT EXISTS idx_collection_collected_by ON COLLECTION_DETAIL_TBL(collected_by);
