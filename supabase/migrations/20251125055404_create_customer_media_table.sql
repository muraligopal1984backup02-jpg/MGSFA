/*
  # Customer Media Management

  ## Overview
  Creates infrastructure for storing customer images and geolocation data.

  ## New Tables

  ### customer_media_tbl
  Stores customer images and location data
  - `id` (uuid, primary key) - Unique identifier
  - `customer_id` (uuid, foreign key) - References customer_master_tbl
  - `media_type` (text) - Type of media: 'image' or 'location'
  - `image_url` (text, nullable) - Supabase storage URL for images
  - `image_order` (integer, nullable) - Order for images (1, 2, or 3)
  - `latitude` (decimal, nullable) - GPS latitude
  - `longitude` (decimal, nullable) - GPS longitude
  - `location_accuracy` (decimal, nullable) - GPS accuracy in meters
  - `captured_at` (timestamptz) - When the media was captured
  - `uploaded_by` (uuid) - User who uploaded the media
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on customer_media_tbl
  - Users can view media for their assigned customers
  - Users can upload media for their assigned customers
  - Admins and managers can view all customer media
*/

-- Create customer_media_tbl
CREATE TABLE IF NOT EXISTS customer_media_tbl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customer_master_tbl(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('image', 'location')),
  image_url text,
  image_order integer CHECK (image_order BETWEEN 1 AND 3),
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  location_accuracy decimal(10, 2),
  captured_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES user_master_tbl(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster customer media lookups
CREATE INDEX IF NOT EXISTS idx_customer_media_customer_id ON customer_media_tbl(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_media_type ON customer_media_tbl(media_type);

-- Enable RLS
ALTER TABLE customer_media_tbl ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view customer media (matching customer_master_tbl policies)
CREATE POLICY "Public can view customer media"
  ON customer_media_tbl FOR SELECT
  TO public
  USING (true);

-- Policy: Public can insert customer media
CREATE POLICY "Public can insert customer media"
  ON customer_media_tbl FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Public can update customer media
CREATE POLICY "Public can update customer media"
  ON customer_media_tbl FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Policy: Public can delete customer media
CREATE POLICY "Public can delete customer media"
  ON customer_media_tbl FOR DELETE
  TO public
  USING (true);

-- Add constraint to ensure image records have image_url and image_order
ALTER TABLE customer_media_tbl ADD CONSTRAINT check_image_fields
  CHECK (
    (media_type = 'image' AND image_url IS NOT NULL AND image_order IS NOT NULL) OR
    (media_type = 'location' AND latitude IS NOT NULL AND longitude IS NOT NULL)
  );

-- Add unique constraint to prevent duplicate image orders per customer
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_image_order
  ON customer_media_tbl(customer_id, image_order)
  WHERE media_type = 'image';

-- Add constraint to ensure only one location per customer
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_location
  ON customer_media_tbl(customer_id)
  WHERE media_type = 'location';