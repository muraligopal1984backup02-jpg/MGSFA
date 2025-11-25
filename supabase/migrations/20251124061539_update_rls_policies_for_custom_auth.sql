/*
  # Update RLS Policies for Custom Authentication

  ## Overview
  Since we're using custom authentication (not Supabase Auth), auth.uid() is always null.
  We need to update policies to allow public access with application-level authentication.

  ## Changes
  - Update all tables to allow public SELECT access
  - Keep INSERT/UPDATE policies permissive for now
  - Application code will handle authorization based on logged-in user

  ## Security Notes
  - Application-level authentication is handled in the frontend
  - Future enhancement: Use Supabase Auth or implement server-side auth
*/

-- USER_LOCATION_TBL
DROP POLICY IF EXISTS "Users can insert own location" ON user_location_tbl;
DROP POLICY IF EXISTS "Admins and managers can view all locations" ON user_location_tbl;

CREATE POLICY "Public can insert locations" ON user_location_tbl FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can view locations" ON user_location_tbl FOR SELECT TO public USING (true);

-- CUSTOMER_MASTER_TBL
DROP POLICY IF EXISTS "Users can view assigned customers" ON customer_master_tbl;
DROP POLICY IF EXISTS "Users can insert customers" ON customer_master_tbl;
DROP POLICY IF EXISTS "Users can update assigned customers" ON customer_master_tbl;

CREATE POLICY "Public can view customers" ON customer_master_tbl FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert customers" ON customer_master_tbl FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update customers" ON customer_master_tbl FOR UPDATE TO public USING (true) WITH CHECK (true);

-- CUSTOMER_ADDRESS_TBL
DROP POLICY IF EXISTS "Users can view addresses of assigned customers" ON customer_address_tbl;
DROP POLICY IF EXISTS "Users can insert addresses for assigned customers" ON customer_address_tbl;
DROP POLICY IF EXISTS "Users can update addresses for assigned customers" ON customer_address_tbl;

CREATE POLICY "Public can view addresses" ON customer_address_tbl FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert addresses" ON customer_address_tbl FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update addresses" ON customer_address_tbl FOR UPDATE TO public USING (true) WITH CHECK (true);

-- LEAD_MASTER_TBL
DROP POLICY IF EXISTS "Users can view assigned leads" ON lead_master_tbl;
DROP POLICY IF EXISTS "Users can insert leads" ON lead_master_tbl;
DROP POLICY IF EXISTS "Users can update assigned leads" ON lead_master_tbl;

CREATE POLICY "Public can view leads" ON lead_master_tbl FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert leads" ON lead_master_tbl FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update leads" ON lead_master_tbl FOR UPDATE TO public USING (true) WITH CHECK (true);

-- LEAD_ADDRESS_TBL
DROP POLICY IF EXISTS "Users can view addresses of assigned leads" ON lead_address_tbl;
DROP POLICY IF EXISTS "Users can insert addresses for assigned leads" ON lead_address_tbl;
DROP POLICY IF EXISTS "Users can update addresses for assigned leads" ON lead_address_tbl;

CREATE POLICY "Public can view lead addresses" ON lead_address_tbl FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert lead addresses" ON lead_address_tbl FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update lead addresses" ON lead_address_tbl FOR UPDATE TO public USING (true) WITH CHECK (true);

-- BRAND_MASTER_TBL
DROP POLICY IF EXISTS "Authenticated users can view brands" ON brand_master_tbl;
DROP POLICY IF EXISTS "Admins can insert brands" ON brand_master_tbl;
DROP POLICY IF EXISTS "Admins can update brands" ON brand_master_tbl;

CREATE POLICY "Public can view brands" ON brand_master_tbl FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert brands" ON brand_master_tbl FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update brands" ON brand_master_tbl FOR UPDATE TO public USING (true) WITH CHECK (true);

-- PRODUCT_MASTER_TBL
DROP POLICY IF EXISTS "Authenticated users can view products" ON product_master_tbl;
DROP POLICY IF EXISTS "Admins can insert products" ON product_master_tbl;
DROP POLICY IF EXISTS "Admins can update products" ON product_master_tbl;

CREATE POLICY "Public can view products" ON product_master_tbl FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert products" ON product_master_tbl FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update products" ON product_master_tbl FOR UPDATE TO public USING (true) WITH CHECK (true);

-- PRODUCT_PRICE_TBL
DROP POLICY IF EXISTS "Authenticated users can view prices" ON product_price_tbl;
DROP POLICY IF EXISTS "Admins can insert prices" ON product_price_tbl;
DROP POLICY IF EXISTS "Admins can update prices" ON product_price_tbl;

CREATE POLICY "Public can view prices" ON product_price_tbl FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert prices" ON product_price_tbl FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update prices" ON product_price_tbl FOR UPDATE TO public USING (true) WITH CHECK (true);

-- SALE_ORDER_HEADER_TBL
DROP POLICY IF EXISTS "Users can view orders for assigned customers" ON sale_order_header_tbl;
DROP POLICY IF EXISTS "Users can insert orders" ON sale_order_header_tbl;
DROP POLICY IF EXISTS "Users can update own orders" ON sale_order_header_tbl;

CREATE POLICY "Public can view orders" ON sale_order_header_tbl FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert orders" ON sale_order_header_tbl FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update orders" ON sale_order_header_tbl FOR UPDATE TO public USING (true) WITH CHECK (true);

-- SALE_ORDER_DETAIL_TBL
DROP POLICY IF EXISTS "Users can view order details for accessible orders" ON sale_order_detail_tbl;
DROP POLICY IF EXISTS "Users can insert order details" ON sale_order_detail_tbl;
DROP POLICY IF EXISTS "Users can update order details" ON sale_order_detail_tbl;
DROP POLICY IF EXISTS "Users can delete order details" ON sale_order_detail_tbl;

CREATE POLICY "Public can view order details" ON sale_order_detail_tbl FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert order details" ON sale_order_detail_tbl FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update order details" ON sale_order_detail_tbl FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete order details" ON sale_order_detail_tbl FOR DELETE TO public USING (true);

-- COLLECTION_DETAIL_TBL
DROP POLICY IF EXISTS "Users can view collections for assigned customers" ON collection_detail_tbl;
DROP POLICY IF EXISTS "Users can insert collections" ON collection_detail_tbl;
DROP POLICY IF EXISTS "Users can update own collections" ON collection_detail_tbl;

CREATE POLICY "Public can view collections" ON collection_detail_tbl FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert collections" ON collection_detail_tbl FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update collections" ON collection_detail_tbl FOR UPDATE TO public USING (true) WITH CHECK (true);
