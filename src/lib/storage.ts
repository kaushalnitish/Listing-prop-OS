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
  let serverListings: PropertyListing[] = [];
  let serverSuccess = false;

  // 1. Fetch from Backend Server API
  try {
    const res = await fetch('/api/listings');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      serverListings = json.data;
      serverSuccess = true;
    }
  } catch (e) {
    console.warn('Failed to fetch listings from backend API:', e);
  }

  let dbListings: PropertyListing[] = [];

  // 2. Fetch from Supabase DB
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
      }
    } catch (e) {
      console.warn('Supabase fetch error:', e);
    }
  }

  // 3. Fetch from LocalStorage
  let localListings: PropertyListing[] = [];
  const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (localData !== null) {
    try {
      const parsed: PropertyListing[] = JSON.parse(localData);
      localListings = parsed.filter(
        (l) => l.id !== 'sample-villa-1' && l.slug !== 'the-grand-luminary-villa' && !l.id.startsWith('sample-')
      );
    } catch {
      localListings = [];
    }
  }

  let combined: PropertyListing[] = [];
  if (serverSuccess) {
    combined = [...serverListings];
    const existingIds = new Set(combined.map((l) => l.id));
    const existingSlugs = new Set(combined.map((l) => l.slug.toLowerCase()));

    for (const item of [...dbListings, ...localListings]) {
      if (!existingIds.has(item.id) && !existingSlugs.has(item.slug.toLowerCase())) {
        combined.push(item);
        existingIds.add(item.id);
        existingSlugs.add(item.slug.toLowerCase());
      }
    }
  } else {
    const map = new Map<string, PropertyListing>();
    localListings.forEach((l) => map.set(l.id, l));
    dbListings.forEach((l) => map.set(l.id, l));
    combined = Array.from(map.values());
  }

  // Sort by updatedAt or createdAt descending so newest is always at top
  combined.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  // Sync back to LocalStorage
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(combined));
  } catch (e) {
    console.warn('Failed to sync combined listings to localStorage:', e);
  }

  return combined;
}

export async function getListingBySlug(slug: string): Promise<PropertyListing | null> {
  if (!slug) return null;
  const normalizedSlug = slug.toLowerCase().trim();

  const findMatchingListing = (list: PropertyListing[]): PropertyListing | null => {
    // 1. Exact slug or ID match
    let match = list.find(
      (item) => item.slug.toLowerCase() === normalizedSlug || item.id === normalizedSlug
    );
    if (match) return match;

    // 2. Normalized comparison stripping optional noise words (e.g. "luxury", "premium")
    const stripNoise = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-(luxury|premium|featured|exclusive|prime)-/g, '-');

    const strippedTarget = stripNoise(normalizedSlug);
    match = list.find((item) => stripNoise(item.slug) === strippedTarget);
    if (match) return match;

    // 3. Core keywords subset match
    const keywords = normalizedSlug.split(/[^a-z0-9]+/).filter((k) => k.length > 0);
    if (keywords.length >= 3) {
      match = list.find((item) => {
        const itemSlug = item.slug.toLowerCase();
        const itemTitle = item.title.toLowerCase();
        return keywords.every((kw) => itemSlug.includes(kw) || itemTitle.includes(kw));
      });
      if (match) return match;
    }

    return null;
  };

  // 1. Try Backend Server API first
  try {
    const res = await fetch(`/api/listings/slug/${encodeURIComponent(normalizedSlug)}`);
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
  } catch (e) {
    console.warn('Server API getListingBySlug error:', e);
  }

  // 2. Direct Supabase fetch if configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .or(`slug.eq.${normalizedSlug},id.eq.${normalizedSlug}`)
        .maybeSingle();

      if (!error && data) {
        return fromDbRow(data);
      }
    } catch (e) {
      console.warn('Supabase getListingBySlug query error:', e);
    }
  }

  // 3. Fallback to combined getListings()
  const listings = await getListings();
  return findMatchingListing(listings);
}

export async function getListingById(id: string): Promise<PropertyListing | null> {
  if (!id) return null;

  // 1. Try Backend Server API first
  try {
    const res = await fetch(`/api/listings/${encodeURIComponent(id)}`);
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
  } catch (e) {
    console.warn('Server API getListingById error:', e);
  }

  // 2. Direct Supabase fetch if configured
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

  // 3. Fallback to combined getListings()
  const listings = await getListings();
  return listings.find((item) => item.id === id) || null;
}

function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
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

  // Process data:image/ and blob: URLs by uploading to server/Supabase
  if (listing.images && listing.images.length > 0) {
    const updatedImages = await Promise.all(
      listing.images.map(async (img) => {
        if (img.url && (img.url.startsWith('data:image/') || img.url.startsWith('blob:'))) {
          try {
            if (img.url.startsWith('data:image/')) {
              const extMatch = img.url.match(/^data:image\/([a-zA-Z0-9]+);/);
              const ext = extMatch ? extMatch[1] : 'jpeg';
              const file = dataURLtoFile(img.url, `image-${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`);
              const uploadedUrl = await uploadImageToSupabaseStorage(file);
              return { ...img, url: uploadedUrl };
            } else if (img.url.startsWith('blob:')) {
              const blobRes = await fetch(img.url);
              const blob = await blobRes.blob();
              const file = new File([blob], `image-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
              const uploadedUrl = await uploadImageToSupabaseStorage(file);
              return { ...img, url: uploadedUrl };
            }
          } catch (e) {
            console.warn('Failed to convert image URL:', e);
            return img;
          }
        }
        return img;
      })
    );
    listing.images = updatedImages;
  }

  // 1. Save to Backend Server API
  try {
    const apiRes = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listing),
    });
    const apiJson = await apiRes.json();
    if (apiJson.success && apiJson.data) {
      listing = apiJson.data;
    }
  } catch (e) {
    console.warn('Backend API save warning:', e);
  }

  // 2. Save to Supabase DB if configured
  if (isSupabaseConfigured) {
    try {
      const dbRow = toDbRow(listing);

      let { error } = await supabase
        .from('listings')
        .upsert([dbRow]);

      if (error) {
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
        console.warn('Supabase write notice:', error.message || error);
      }
    } catch (e) {
      console.warn('Exception while writing to Supabase:', e);
    }
  }

  // 3. Sync to Local Storage as fast client cache
  let localListings: PropertyListing[] = [];
  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      localListings = JSON.parse(localData);
    }
  } catch {
    localListings = [];
  }

  localListings = localListings.filter(
    (item) => item.id !== listing.id && item.slug.toLowerCase() !== listing.slug.toLowerCase()
  );
  localListings.unshift(listing);

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localListings));
  } catch (err) {
    console.warn('localStorage quota warning:', err);
  }

  return listing;
}

export async function deleteListing(id: string): Promise<boolean> {
  let targetId = id;
  let targetSlug = id;

  // 1. Identify target listing details if available in local state, server API, or cache
  try {
    let found: PropertyListing | undefined;
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      const parsed: PropertyListing[] = JSON.parse(localData);
      found = parsed.find((l) => l.id === id || l.slug === id);
    }
    if (!found) {
      const serverRes = await fetch(`/api/listings/${encodeURIComponent(id)}`);
      const serverJson = await serverRes.json();
      if (serverJson.success && serverJson.data) {
        found = serverJson.data;
      }
    }
    if (!found) {
      const slugRes = await fetch(`/api/listings/slug/${encodeURIComponent(id)}`);
      const slugJson = await slugRes.json();
      if (slugJson.success && slugJson.data) {
        found = slugJson.data;
      }
    }

    if (found) {
      targetId = found.id;
      targetSlug = found.slug;
    }
  } catch (e) {
    console.warn('Listing lookup error before delete:', e);
  }

  // 2. Delete from LocalStorage immediately
  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      const parsed: PropertyListing[] = JSON.parse(localData);
      const filtered = parsed.filter(
        (l) => l.id !== targetId && l.slug !== targetSlug && l.id !== id && l.slug !== id
      );
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn('localStorage set error during delete:', e);
  }

  // 3. Delete from Backend Server API
  try {
    await fetch(`/api/listings/${encodeURIComponent(targetId)}`, { method: 'DELETE' });
    if (targetSlug && targetSlug !== targetId) {
      await fetch(`/api/listings/${encodeURIComponent(targetSlug)}`, { method: 'DELETE' });
    }
  } catch (e) {
    console.warn('Server API delete error:', e);
  }

  // 4. Delete from Supabase DB if configured
  if (isSupabaseConfigured) {
    try {
      await supabase.from('listings').delete().or(`id.eq.${targetId},slug.eq.${targetSlug}`);
      await supabase.from('listings').delete().eq('id', targetId);
      if (targetSlug) {
        await supabase.from('listings').delete().eq('slug', targetSlug);
      }
    } catch (e) {
      console.warn('Supabase delete error:', e);
    }
  }

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

  // Upload to backend server endpoint for permanent storage URL
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, name: file.name }),
    });

    const json = await res.json();
    if (json.success && json.url) {
      return json.url;
    }
  } catch (err) {
    console.error('Server upload failed:', err);
  }

  return URL.createObjectURL(file);
}
