import { PropertyListing } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const LOCAL_STORAGE_KEY = 'internal_property_listings';

// Sample data removed - using real database & user-created property data only
export const sampleListings: PropertyListing[] = [];

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
      let { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        const fallback = await supabase.from('listings').select('*');
        data = fallback.data;
        error = fallback.error;
      }

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
      const parsed: PropertyListing[] = JSON.parse(localData);
      // Filter out legacy sample listings from prior sessions
      localListings = parsed.filter(
        (l) => l.id !== 'sample-villa-1' && l.slug !== 'the-grand-luminary-villa' && !l.id.startsWith('sample-')
      );
    } catch {
      localListings = [];
    }
  }

  if (dbSuccess) {
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
  if (!slug) return null;
  const normalizedSlug = slug.toLowerCase().trim();

  // Direct Supabase fetch if configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('slug', normalizedSlug)
        .maybeSingle();

      if (error) {
        console.error('Supabase query error during fetch:', error);
      }

      if (!error && data) {
        return fromDbRow(data);
      }
    } catch (e) {
      console.warn('Supabase getListingBySlug query error:', e);
    }
  }

  // Fetch all listings (combines DB + LocalStorage)
  const listings = await getListings();
  const match = listings.find((item) => item.slug.toLowerCase() === normalizedSlug);

  if (match) {
    return match;
  }

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
  if (!listing.status) {
    listing.status = 'published';
  }

  // Ensure slug uniqueness across all listings
  listing.slug = await ensureUniqueSlug(listing.slug, listing.id);

  const now = new Date().toISOString();
  if (!listing.createdAt) listing.createdAt = now;
  listing.updatedAt = now;

  // 1. Try saving to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const dbRow = toDbRow(listing);

      let { error } = await supabase
        .from('listings')
        .upsert([dbRow]);

      if (error) {
        // Fallback 1: Try without optional SEO columns if schema lacks them
        const basicRow = {
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
          created_at: listing.createdAt || now,
          updated_at: listing.updatedAt || now,
        };

        const res2 = await supabase.from('listings').upsert([basicRow]);
        error = res2.error;
      }

      if (error) {
        // Fallback 2: Try camelCase field names if table schema uses camelCase
        const camelRow = {
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
          createdAt: listing.createdAt || now,
          updatedAt: listing.updatedAt || now,
        };

        const res3 = await supabase.from('listings').upsert([camelRow]);
        error = res3.error;
      }

      if (error) {
        console.warn('Supabase write notice:', error.message || error);
      }
    } catch (e) {
      console.warn('Exception while writing to Supabase:', e);
    }
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
  } catch (err) {
    console.warn('localStorage quota exceeded:', err);
  }

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
