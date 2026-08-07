import { PropertyListing } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const LOCAL_STORAGE_KEY = 'internal_property_listings';

// Initial sample data for development and instant demonstration
export const sampleListings: PropertyListing[] = [
  {
    id: 'sample-villa-1',
    slug: 'the-grand-luminary-villa',
    title: 'The Grand Luminary Villa',
    tagline: 'Architectural Mastery Overlooking Coral Bay',
    price: 4850000,
    currency: '$',
    specs: {
      bedrooms: 5,
      bathrooms: 6,
      squareFeet: 7200,
      propertyType: 'Estate Villa',
      yearBuilt: 2024,
      parkingSpaces: 4,
    },
    location: {
      address: '1048 Ocean Horizon Way',
      neighborhood: 'Coral Ridge Heights',
      city: 'Miami',
      state: 'FL',
      country: 'United States',
      nearbyHighlights: ['Private Marina - 3 mins', 'Ocean Drive - 10 mins', 'International Airport - 20 mins'],
    },
    description: 'A masterpiece of contemporary luxury architecture featuring expansive floor-to-ceiling double-glazed glass walls, imported Italian travertine surfaces, a temperature-controlled wine cellar, and an infinity pool floating over lush botanical gardens.',
    highlights: [
      'Panoramic Oceanfront Views',
      'Private Heated Infinity Edge Pool',
      'Smart Automation & Climate Control',
      'Private Elevator & Rooftop Terrace'
    ],
    amenities: [
      'Infinity Pool',
      'Spa & Sauna',
      'Wine Cellar',
      'Private Elevator',
      'Home Cinema',
      'Smart Home Security',
      'Chef Kitchen',
      '3-Car Garage'
    ],
    images: [
      {
        id: 'img-1',
        url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
        caption: 'Front Exterior Facade',
        category: 'Exterior',
        isCover: true,
        order: 1,
      },
      {
        id: 'img-2',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
        caption: 'Infinity Pool & Lounge Terrace',
        category: 'Exterior',
        isCover: false,
        order: 2,
      },
      {
        id: 'img-3',
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80',
        caption: 'Open Concept Great Room',
        category: 'Living Room',
        isCover: false,
        order: 3,
      }
    ],
    contact: {
      agentName: 'Alexander Vance',
      agentRole: 'Principal Director, Luxury Estates',
      phone: '+1 (305) 890-4421',
      whatsappNumber: '13058904421',
      email: 'alexander@luminaryestates.com',
      agencyName: 'Luminary Real Estate Group',
    },
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export async function ensureUniqueSlug(rawSlug: string, currentId?: string): Promise<string> {
  const listings = await getListings();
  const baseSlug =
    rawSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `listing-${Date.now()}`;

  let uniqueSlug = baseSlug;
  let counter = 1;

  while (listings.some((item) => item.slug === uniqueSlug && item.id !== currentId)) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

function toDbRow(listing: PropertyListing) {
  const now = new Date().toISOString();
  return {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    tagline: listing.tagline || null,
    price: listing.price || 0,
    currency: listing.currency || '₹',
    specs: listing.specs || {},
    location: listing.location || {},
    description: listing.description || '',
    highlights: listing.highlights || [],
    amenities: listing.amenities || [],
    images: listing.images || [],
    contact: listing.contact || {},
    status: listing.status || 'published',
    seo_title: listing.seoTitle || null,
    meta_description: listing.metaDescription || null,
    created_at: listing.createdAt || now,
    updated_at: listing.updatedAt || now,
  };
}

function fromDbRow(row: any): PropertyListing {
  const now = new Date().toISOString();
  return {
    id: String(row.id),
    slug: String(row.slug || ''),
    title: String(row.title || ''),
    tagline: row.tagline ? String(row.tagline) : undefined,
    price: Number(row.price) || 0,
    currency: String(row.currency || '₹'),
    specs: typeof row.specs === 'object' && row.specs ? row.specs : {},
    location: typeof row.location === 'object' && row.location ? row.location : {},
    description: String(row.description || ''),
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    images: Array.isArray(row.images) ? row.images : [],
    contact: typeof row.contact === 'object' && row.contact ? row.contact : {},
    status: row.status === 'draft' || row.status === 'archived' ? row.status : 'published',
    seoTitle: row.seoTitle || row.seo_title || undefined,
    metaDescription: row.metaDescription || row.meta_description || undefined,
    createdAt: row.createdAt || row.created_at || now,
    updatedAt: row.updatedAt || row.updated_at || now,
  };
}

export async function getListings(): Promise<PropertyListing[]> {
  let dbListings: PropertyListing[] = [];
  let dbSuccess = false;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbListings = data.map(fromDbRow);
        dbSuccess = true;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to local storage', e);
    }
  }

  // Local storage
  let localListings: PropertyListing[] = [];
  const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (localData !== null) {
    try {
      localListings = JSON.parse(localData);
    } catch {
      localListings = [];
    }
  } else {
    // Initial setup if key is entirely absent from localStorage
    localListings = sampleListings;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sampleListings));
    } catch {}
  }

  if (dbSuccess && dbListings.length > 0) {
    const dbIds = new Set(dbListings.map((l) => l.id));
    const dbSlugs = new Set(dbListings.map((l) => l.slug));

    const missingLocal = localListings.filter(
      (l) => !dbIds.has(l.id) && !dbSlugs.has(l.slug)
    );

    return [...dbListings, ...missingLocal];
  }

  return localListings;
}

export async function getListingBySlug(slug: string): Promise<PropertyListing | null> {
  console.log(`[DEBUG PIPELINE 6] getListingBySlug() called with slug: "${slug}"`);
  if (!slug) return null;
  const normalizedSlug = slug.toLowerCase().trim();

  // Direct Supabase fetch if configured
  if (isSupabaseConfigured) {
    try {
      console.log(`[DEBUG PIPELINE 7a] Querying Supabase: SELECT * FROM listings WHERE slug = "${normalizedSlug}"`);
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('slug', normalizedSlug)
        .maybeSingle();

      console.log(`[DEBUG PIPELINE 7b] Supabase response for slug "${normalizedSlug}":`, {
        error,
        returnedData: data,
        rowCount: data ? 1 : 0,
        status: data?.status
      });

      if (error) {
        console.error('[DEBUG PIPELINE 9] Supabase query / RLS error during fetch:', error);
      }

      if (!error && data) {
        const parsed = fromDbRow(data);
        console.log(`[DEBUG PIPELINE 6b] Found listing via direct Supabase query. Status: "${parsed.status}"`);
        return parsed;
      }
    } catch (e) {
      console.warn('Supabase getListingBySlug query error:', e);
    }
  }

  // Fetch all listings (combines DB + LocalStorage)
  console.log('[DEBUG PIPELINE 7c] Checking combined getListings()...');
  const listings = await getListings();
  const match = listings.find((item) => item.slug.toLowerCase() === normalizedSlug);

  if (match) {
    console.log(`[DEBUG PIPELINE 6c] Found match in combined listings array. Status: "${match.status}"`);
    return match;
  }

  console.warn(`[DEBUG PIPELINE 7d] Zero rows found for slug "${normalizedSlug}".`);
  return null;
}

export async function getListingById(id: string): Promise<PropertyListing | null> {
  if (!id) return null;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return fromDbRow(data);
      }
    } catch (e) {
      console.warn('Supabase getListingById query error:', e);
    }
  }

  const listings = await getListings();
  return listings.find((item) => item.id === id) || null;
}

export async function saveListing(listing: PropertyListing): Promise<PropertyListing> {
  console.log('[DEBUG PIPELINE 1] Exact listing object BEFORE publish:', JSON.parse(JSON.stringify(listing)));

  if (!listing.status) {
    listing.status = 'published';
  }

  // Ensure slug uniqueness across all listings
  const rawSlug = listing.slug;
  listing.slug = await ensureUniqueSlug(listing.slug, listing.id);
  console.log(`[DEBUG PIPELINE 4] Final Generated Slug: "${listing.slug}" (raw input was: "${rawSlug}")`);

  const now = new Date().toISOString();
  if (!listing.createdAt) listing.createdAt = now;
  listing.updatedAt = now;

  // 1. Try saving to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const dbRow = toDbRow(listing);
      console.log('[DEBUG PIPELINE 3a] Writing row to Supabase table "listings":', dbRow);

      const { data, error } = await supabase
        .from('listings')
        .upsert([dbRow])
        .select('*');

      if (error) {
        console.error('[DEBUG PIPELINE 3b & 9] Supabase write ERROR or RLS permission failure:', error);
      } else {
        console.log('[DEBUG PIPELINE 3c] Row successfully written to Supabase! Returned row:', data);
      }
    } catch (e) {
      console.error('[DEBUG PIPELINE 3d] Exception while writing to Supabase:', e);
    }
  } else {
    console.warn('[DEBUG PIPELINE 3e] Supabase NOT configured. Saving only to LocalStorage.');
  }

  // 2. Always sync to Local Storage for instant local resolution
  let localListings: PropertyListing[] = [];
  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      localListings = JSON.parse(localData);
    }
  } catch {
    localListings = [];
  }

  const existingIndex = localListings.findIndex((item) => item.id === listing.id);

  if (existingIndex >= 0) {
    localListings[existingIndex] = listing;
  } else {
    localListings.unshift(listing);
  }

  // Clean images to prevent Base64 bloat in localStorage
  const sanitizedListings = localListings.map((l) => ({
    ...l,
    images: (l.images || []).map((img) => ({
      ...img,
      url: img.url.startsWith('data:image/') && img.url.length > 100000
        ? 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80'
        : img.url
    }))
  }));

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitizedListings));
    console.log('[DEBUG PIPELINE 3f] LocalStorage updated successfully. Count:', sanitizedListings.length);
  } catch (err) {
    console.warn('localStorage quota exceeded:', err);
  }

  console.log('[DEBUG PIPELINE 2] Result returned from saveListing():', JSON.parse(JSON.stringify(listing)));
  return listing;
}

export async function deleteListing(id: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('listings').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete error:', e);
    }
  }

  const listings = await getListings();
  const filtered = listings.filter((item) => item.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export async function uploadImageToSupabaseStorage(file: File): Promise<string> {
  if (isSupabaseConfigured) {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `listings/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file);

      if (!uploadError) {
        const { data } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        if (data?.publicUrl) {
          return data.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Supabase Storage upload error:', err);
    }
  }

  // Lightweight Blob URL for session preview (Prevents 5MB+ Base64 strings from crashing localStorage)
  return URL.createObjectURL(file);
}
