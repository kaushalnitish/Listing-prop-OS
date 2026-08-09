-- Supabase Database Schema & RLS Architecture
-- Run this script in the Supabase SQL Editor

-- 1. Create Listings Table
CREATE TABLE IF NOT EXISTS public.listings (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  tagline TEXT,
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT '₹',
  specs JSONB DEFAULT '{}'::jsonb,
  location JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  highlights JSONB DEFAULT '[]'::jsonb,
  amenities JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  contact JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'published',
  seo_title TEXT,
  meta_description TEXT,
  previous_slugs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-performance lookups
CREATE INDEX IF NOT EXISTS idx_listings_slug ON public.listings(slug);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access for published listings" ON public.listings;
DROP POLICY IF EXISTS "Allow full access for authenticated admin users" ON public.listings;
DROP POLICY IF EXISTS "Allow public select for all listings" ON public.listings;
DROP POLICY IF EXISTS "Allow public insert for listings" ON public.listings;
DROP POLICY IF EXISTS "Allow public update for listings" ON public.listings;
DROP POLICY IF EXISTS "Allow public delete for listings" ON public.listings;

-- RLS Policies for Application Access
CREATE POLICY "Allow public select for all listings"
ON public.listings
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert for listings"
ON public.listings
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update for listings"
ON public.listings
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete for listings"
ON public.listings
FOR DELETE
USING (true);

-- 3. Storage Bucket for Property Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public Read Storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Storage" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Upload" ON storage.objects;

CREATE POLICY "Public Read Storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

CREATE POLICY "Public Storage Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-images');

-- 4. Seed Initial Listing (listing-1786193079827)
INSERT INTO public.listings (
  id,
  slug,
  title,
  tagline,
  price,
  currency,
  specs,
  location,
  description,
  highlights,
  amenities,
  images,
  contact,
  status,
  seo_title,
  meta_description,
  created_at,
  updated_at
) VALUES (
  'listing-1786193079827',
  'luxury-3-bhk-independent-floor-in-sector-115-mohali-1',
  'Luxury 3 BHK Independent Floor in Sector 115, Mohali',
  'Modern Architecture & Prime Location Near Chandigarh-Kharar Highway',
  6390000,
  '₹',
  '{"bedrooms": 3, "bathrooms": 3, "squareFeet": 1242, "propertyType": "Residential Floor", "yearBuilt": 2026, "parkingSpaces": 1}'::jsonb,
  '{"address": "Sector 115, Mohali, Near Chandigarh-Kharar Main Highway", "neighborhood": "Sector 115", "city": "Mohali", "country": "India"}'::jsonb,
  'Discover contemporary living with these modern 3 BHK independent floors located in the highly desirable Sector 115, Mohali. Situated just 10 minutes away from Chandigarh and in close proximity to the Chandigarh-Kharar Main Highway, this prime residential offering combines seamlessly connected urban living with serene suburban comfort. Nestled within a secure gated society featuring expansive 45-50 ft wide RCC roads, residents will enjoy peace of mind, premium infrastructure, and easy access to over 100 branded commercial outlets nearby. Each floor is crafted with attention to quality and durability, backed by an impressive 5-year warranty on wooden work and 1 year of dedicated after-sales service. With flexible floor choices including ground, first, and second floor options (with roof rights available), this project presents an unmatched value proposition for homeowners and investors seeking quality craftsmanship and prime location.',
  '["Prime Location in Sector 115, Mohali, 10 Minutes from Chandigarh", "Secure Gated Society with 45-50 ft Wide RCC Roads", "Close to 100+ Branded Commercial Outlets", "5 Years Wooden Work Warranty & 1 Year After-Sales Service", "Multiple Floor Options with Roof Rights Available"]'::jsonb,
  '["Gated Society", "45-50 ft Wide RCC Roads", "Near Commercial Outlets", "5 Years Wooden Work Warranty", "1 Year After-Sales Service"]'::jsonb,
  '[{"id": "img-1786193020517-gadq3", "url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80", "caption": "Exterior Elevation & Facade View", "category": "Exterior", "isCover": true, "order": 1}, {"id": "img-1786193021321-x2eni", "url": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80", "caption": "Living Area & Modular Layout", "category": "Interior", "isCover": false, "order": 2}, {"id": "img-1786193022107-ov1bk", "url": "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=80", "caption": "Master Bedroom Interior", "category": "Interior", "isCover": false, "order": 3}, {"id": "img-1786193023051-gfmol", "url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80", "caption": "Balcony & Society Road View", "category": "Exterior", "isCover": false, "order": 4}, {"id": "img-1786193023755-pptd3", "url": "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80", "caption": "Modern Bath Fittings & Finishings", "category": "Interior", "isCover": false, "order": 5}]'::jsonb,
  '{"agentName": "Premier Luxury Agent", "agentRole": "Senior Estate Consultant", "phone": "79733 18763", "whatsappNumber": "7973318763", "email": "contact@propertyestates.com", "agencyName": "Luxury Real Estate Group"}'::jsonb,
  'published',
  '3 BHK Independent Floor in Sector 115 Mohali | Near Chandigarh',
  'Explore luxury 3 BHK independent floors in Sector 115, Mohali, just 10 mins from Chandigarh. Features gated society, RCC roads, and wooden work warranty.',
  '2026-08-08T12:44:39.827Z',
  '2026-08-08T12:44:44.601Z'
) ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  tagline = EXCLUDED.tagline,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  specs = EXCLUDED.specs,
  location = EXCLUDED.location,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  contact = EXCLUDED.contact,
  status = EXCLUDED.status,
  seo_title = EXCLUDED.seo_title,
  meta_description = EXCLUDED.meta_description,
  updated_at = NOW();

