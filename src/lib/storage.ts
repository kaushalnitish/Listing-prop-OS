import { PropertyListing } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import defaultListingsData from '../../data/listings.json';
import {
  SAMPLE_PROPERTY_LISTING,
  GLASSHOUSE_SANCTUARY_LISTING,
  SAMPLE_LISTINGS,
} from '../data/sampleListing';

export { SAMPLE_PROPERTY_LISTING, GLASSHOUSE_SANCTUARY_LISTING, SAMPLE_LISTINGS };

const defaultListings: PropertyListing[] = Array.isArray(defaultListingsData)
  ? (defaultListingsData as PropertyListing[])
  : [];

const LOCAL_STORAGE_KEY = 'internal_property_listings';

// Sample listings fallback for preview and demo purposes
export const sampleListings: PropertyListing[] = SAMPLE_LISTINGS;

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
    walkthrough_video_url: listing.walkthrough_video_url || listing.walkthroughVideoUrl || null,
    walkthrough_video_type: listing.walkthrough_video_type || listing.walkthroughVideoType || null,
    created_at: listing.createdAt || now,
    updated_at: listing.updatedAt || now,
  };
}

function fromDbRow(row: any): PropertyListing {
  const now = new Date().toISOString();
  const videoUrl = row.walkthrough_video_url || row.walkthroughVideoUrl || null;
  const videoType =
    row.walkthrough_video_type ||
    row.walkthroughVideoType ||
    (videoUrl
      ? videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')
        ? 'youtube'
        : videoUrl.includes('vimeo.com')
        ? 'vimeo'
        : 'direct'
      : null);
  const videoThumb = row.walkthrough_video_thumbnail || row.walkthroughVideoThumbnail || null;

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
    walkthrough_video_url: videoUrl,
    walkthrough_video_type: videoType,
    walkthrough_video_thumbnail: videoThumb,
    walkthroughVideoUrl: videoUrl,
    walkthroughVideoType: videoType,
    walkthroughVideoThumbnail: videoThumb,
    createdAt: row.createdAt || row.created_at || now,
    updatedAt: row.updatedAt || row.updated_at || now,
  };
}

export async function getListings(): Promise<PropertyListing[]> {
  // 1. Fetch from Authoritative Backend Server API
  try {
    const res = await fetch('/api/listings');
    const json = await res.json();
    if (res.ok && json.success && Array.isArray(json.data)) {
      const serverListings: PropertyListing[] = json.data;

      // Sort by updatedAt or createdAt descending
      serverListings.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      // Update LocalStorage cache to stay in sync with authoritative server state
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverListings));
      } catch (e) {
        console.warn('Failed to sync listings cache to localStorage:', e);
      }

      return serverListings;
    } else {
      console.warn('Backend API returned error:', json.error);
    }
  } catch (e) {
    console.warn('Failed to fetch listings from backend API:', e);
  }

  // 2. Direct Supabase fallback if client-side query is configured and API failed
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const dbListings = data.map(fromDbRow);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbListings));
        } catch {}
        return dbListings;
      }
    } catch (e) {
      console.warn('Supabase fetch error:', e);
    }
  }

  // 3. LocalStorage cache as offline fallback only when network/server is completely unreachable
  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData !== null) {
      return JSON.parse(localData);
    }
  } catch {
    return [];
  }

  return [];
}

export async function getListingBySlug(slug: string): Promise<PropertyListing | null> {
  if (!slug) return null;
  const normalizedSlug = slug.toLowerCase().trim();

  // 1. Try Backend Server API first
  try {
    const res = await fetch(`/api/listings/slug/${encodeURIComponent(normalizedSlug)}`);
    const json = await res.json();
    if (res.ok && json.success && json.data) {
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

  // 3. Fallback to cached getListings()
  const listings = await getListings();
  const match = listings.find(
    (item) =>
      item.slug.toLowerCase() === normalizedSlug ||
      item.id === normalizedSlug ||
      (Array.isArray((item as any).previousSlugs) &&
        (item as any).previousSlugs.some((ps: string) => ps.toLowerCase() === normalizedSlug))
  );

  if (match) return match;

  // 4. Sample listing fallback
  if (
    normalizedSlug === 'the-grand-luminary-villa' ||
    normalizedSlug === 'sample' ||
    normalizedSlug === 'sample-preview' ||
    normalizedSlug === 'sample-listing' ||
    normalizedSlug === 'sample-property'
  ) {
    return SAMPLE_PROPERTY_LISTING;
  }

  return null;
}

export async function getListingById(id: string): Promise<PropertyListing | null> {
  if (!id) return null;

  if (id === 'sample-luxury-listing-1') {
    return SAMPLE_PROPERTY_LISTING;
  }

  // 1. Try Backend Server API first
  try {
    const res = await fetch(`/api/listings/${encodeURIComponent(id)}`);
    const json = await res.json();
    if (res.ok && json.success && json.data) {
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

  // 3. Fallback to cached getListings()
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

  // Process data:image/ and blob: URLs by uploading to Supabase Storage
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
          } catch (e: any) {
            console.error('Failed to convert image URL to permanent storage:', e);
            throw new Error(`Failed to upload photo "${img.caption || 'Property Image'}" to permanent Supabase Storage: ${e?.message || e}`);
          }
        }
        return img;
      })
    );
    listing.images = updatedImages;
  }

  // 1. Save to Backend Server API
  const apiRes = await fetch('/api/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(listing),
  });
  const apiJson = await apiRes.json();

  if (!apiRes.ok || !apiJson.success) {
    throw new Error(apiJson.error || `Failed to save listing (HTTP ${apiRes.status})`);
  }

  const savedListing: PropertyListing = apiJson.data || listing;

  // 2. Sync to Local Storage cache
  try {
    const cached = await getListings();
    const updated = [savedListing, ...cached.filter((l) => l.id !== savedListing.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('localStorage sync error:', err);
  }

  return savedListing;
}

export async function deleteListing(id: string): Promise<boolean> {
  if (!id) return false;

  // 1. Send DELETE request to Authoritative Backend Server API
  const apiRes = await fetch(`/api/listings/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const apiJson = await apiRes.json();

  if (!apiRes.ok || !apiJson.success) {
    throw new Error(apiJson.error || `Server failed to delete listing (HTTP ${apiRes.status})`);
  }

  const targetId = apiJson.deletedId || id;

  // 2. Clear deleted listing from LocalStorage cache
  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      const parsed: PropertyListing[] = JSON.parse(localData);
      const filtered = parsed.filter((l) => l.id !== targetId && l.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn('localStorage cache clear error during delete:', e);
  }

  return true;
}

export async function uploadImageToSupabaseStorage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `listings/${fileName}`;

  let clientErrorMsg = '';

  // 1. Client-side Supabase Storage upload if configured
  if (isSupabaseConfigured) {
    try {
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file, { upsert: true, contentType: file.type || 'image/jpeg' });

      if (!uploadError) {
        const { data } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        if (data?.publicUrl) {
          return data.publicUrl;
        }
      } else {
        clientErrorMsg = uploadError.message || JSON.stringify(uploadError);
        console.warn('Supabase client upload failed:', clientErrorMsg);
      }
    } catch (err: any) {
      clientErrorMsg = err?.message || String(err);
      console.warn('Supabase Storage client upload exception:', err);
    }
  }

  // 2. Delegate to server endpoint /api/upload-image which handles Supabase Storage server-side
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

    if (!res.ok) {
      const contentType = res.headers.get('content-type') || '';
      let serverErr = `HTTP ${res.status} ${res.statusText}`;
      if (contentType.includes('application/json')) {
        const errJson = await res.json().catch(() => ({}));
        if (errJson.error) serverErr = errJson.error;
      }
      throw new Error(`Server API unavailable or returned error (${serverErr})`);
    }

    const json = await res.json();
    if (json.success && json.url && (json.url.startsWith('https://') || json.url.startsWith('http://'))) {
      return json.url;
    }
    throw new Error(json.error || 'Server upload failed to return a permanent public HTTPS URL');
  } catch (err: any) {
    const detail = clientErrorMsg
      ? `Supabase Client: "${clientErrorMsg}". Server Backup: "${err.message || err}"`
      : isSupabaseConfigured
      ? `Upload failed: ${err.message || err}`
      : `Supabase credentials (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY) are missing in build environment, and server upload backup failed (${err.message || err}).`;
    console.error('Image upload failed:', detail);
    throw new Error(detail);
  }
}

export async function uploadWalkthroughVideoToSupabaseStorage(
  file: File,
  listingId?: string
): Promise<{ url: string; type: string }> {
  // Validate format
  const validMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const validExtensions = ['.mp4', '.webm', '.mov'];
  const fileExt = (file.name.split('.').pop() || 'mp4').toLowerCase();

  const isValidType =
    validMimes.includes(file.type) ||
    validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

  if (!isValidType) {
    throw new Error('Unsupported video format. Please upload an MP4, WebM, or MOV video.');
  }

  // Validate file size (100 MB max)
  const MAX_SIZE_BYTES = 100 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(`Video file size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 100 MB limit.`);
  }

  const mimeType = file.type || (fileExt === 'mov' ? 'video/quicktime' : fileExt === 'webm' ? 'video/webm' : 'video/mp4');
  const fileName = `walkthrough-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const folder = listingId ? `walkthroughs/${listingId}` : 'walkthroughs';
  const filePath = `${folder}/${fileName}`;

  let clientErrorMsg = '';

  // 1. Direct Client-side Supabase Storage upload
  if (isSupabaseConfigured) {
    try {
      const { error: uploadError } = await supabase.storage
        .from('property-walkthroughs')
        .upload(filePath, file, {
          upsert: true,
          contentType: mimeType,
        });

      if (!uploadError) {
        const { data } = supabase.storage
          .from('property-walkthroughs')
          .getPublicUrl(filePath);

        if (data?.publicUrl) {
          return { url: data.publicUrl, type: mimeType };
        }
      } else {
        clientErrorMsg = uploadError.message || JSON.stringify(uploadError);
        console.warn('Supabase client video upload failed:', clientErrorMsg);
      }
    } catch (err: any) {
      clientErrorMsg = err?.message || String(err);
      console.warn('Supabase Storage video client upload exception:', err);
    }
  }

  // 2. Delegate to server endpoint /api/upload-video
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/upload-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video: base64,
        name: file.name,
        mimeType,
        listingId,
      }),
    });

    if (!res.ok) {
      const contentType = res.headers.get('content-type') || '';
      let serverErr = `HTTP ${res.status} ${res.statusText}`;
      if (contentType.includes('application/json')) {
        const errJson = await res.json().catch(() => ({}));
        if (errJson.error) serverErr = errJson.error;
      }
      throw new Error(`Server API unavailable or returned error (${serverErr})`);
    }

    const json = await res.json();
    if (json.success && json.url && (json.url.startsWith('https://') || json.url.startsWith('http://'))) {
      return { url: json.url, type: json.type || mimeType };
    }
    throw new Error(json.error || 'Server upload failed to return a permanent public video URL');
  } catch (err: any) {
    const detail = clientErrorMsg
      ? `Supabase Client: "${clientErrorMsg}". Server Backup: "${err.message || err}"`
      : isSupabaseConfigured
      ? `Upload failed: ${err.message || err}`
      : `Supabase credentials missing or video upload failed (${err.message || err}).`;
    console.error('Video upload failed:', detail);
    throw new Error(detail);
  }
}

export async function deleteWalkthroughVideoFromStorage(url: string): Promise<boolean> {
  if (!url) return true;

  // 1. Client-side removal if configured
  if (isSupabaseConfigured) {
    try {
      const bucketIdentifier = '/property-walkthroughs/';
      if (url.includes(bucketIdentifier)) {
        const filePath = url.split(bucketIdentifier)[1];
        if (filePath) {
          await supabase.storage.from('property-walkthroughs').remove([filePath]);
          return true;
        }
      }
    } catch (e) {
      console.warn('Client-side video deletion error:', e);
    }
  }

  // 2. Server-side deletion endpoint
  try {
    await fetch('/api/delete-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return true;
  } catch (e) {
    console.warn('Server-side video deletion error:', e);
    return false;
  }
}

