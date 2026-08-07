-- Supabase Database Schema & RLS Architecture
-- Run this script in the Supabase SQL Editor

-- 1. Create Listings Table
CREATE TABLE IF NOT EXISTS public.listings (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  tagline TEXT,
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT '$',
  specs JSONB DEFAULT '{}'::jsonb,
  location JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  highlights JSONB DEFAULT '[]'::jsonb,
  amenities JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  contact JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft',
  seo_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for high-performance slug lookups
CREATE INDEX IF NOT EXISTS idx_listings_slug ON public.listings(slug);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public Read Access for Published Listings
CREATE POLICY "Allow public read access for published listings"
ON public.listings
FOR SELECT
USING (status = 'published');

-- Policy 2: Admin Full Access for Authenticated Users
CREATE POLICY "Allow full access for authenticated admin users"
ON public.listings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Storage Bucket for Property Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Public Read Storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

CREATE POLICY "Admin Upload Storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');
