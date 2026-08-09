import { createClient } from "@supabase/supabase-js";
import defaultListingsData from "../../data/listings.json";

const defaultListings: any[] = Array.isArray(defaultListingsData) ? defaultListingsData : [];

// Initialize Supabase Client for Netlify Function
const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseKey && !supabaseUrl.includes("placeholder")
);

const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

function toDbRow(listing: any) {
  const now = new Date().toISOString();
  return {
    id: String(listing.id),
    slug: String(listing.slug || ''),
    title: String(listing.title || ''),
    tagline: listing.tagline ? String(listing.tagline) : null,
    price: Number(listing.price) || 0,
    currency: String(listing.currency || '₹'),
    specs: typeof listing.specs === 'object' && listing.specs ? listing.specs : {},
    location: typeof listing.location === 'object' && listing.location ? listing.location : {},
    description: String(listing.description || ''),
    highlights: Array.isArray(listing.highlights) ? listing.highlights : [],
    amenities: Array.isArray(listing.amenities) ? listing.amenities : [],
    images: Array.isArray(listing.images) ? listing.images : [],
    contact: typeof listing.contact === 'object' && listing.contact ? listing.contact : {},
    status: listing.status === 'draft' || listing.status === 'archived' ? listing.status : 'published',
    seo_title: listing.seoTitle || listing.seo_title || null,
    meta_description: listing.metaDescription || listing.meta_description || null,
    previous_slugs: Array.isArray(listing.previousSlugs) ? listing.previousSlugs : (Array.isArray(listing.previous_slugs) ? listing.previous_slugs : []),
    created_at: listing.createdAt || listing.created_at || now,
    updated_at: listing.updatedAt || listing.updated_at || now,
  };
}

function fromDbRow(row: any): any {
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
    seoTitle: row.seo_title || row.seoTitle || undefined,
    metaDescription: row.meta_description || row.metaDescription || undefined,
    previousSlugs: Array.isArray(row.previous_slugs) ? row.previous_slugs : (Array.isArray(row.previousSlugs) ? row.previousSlugs : []),
    createdAt: row.created_at || row.createdAt || now,
    updatedAt: row.updated_at || row.updatedAt || now,
  };
}

async function getStoredListings(): Promise<any[]> {
  if (!supabase) {
    throw new Error("Supabase database client is not configured.");
  }
  const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
  if (error) {
    throw new Error(`Database error fetching listings: ${error.message} (Code: ${error.code})`);
  }
  return (data || []).map(fromDbRow);
}

const stripNoise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^(luxury|premium|featured|exclusive|prime|sale|for)-+/g, '')
    .replace(/-(luxury|premium|featured|exclusive|prime|sale|for)-+/g, '-')
    .replace(/-(luxury|premium|featured|exclusive|prime|sale|for)$/g, '')
    .replace(/-\d+$/g, '')
    .replace(/(^-|-$)+/g, '');

function findMatchingListing(listings: any[], targetSlug: string): any | null {
  const normalized = targetSlug.toLowerCase().trim();

  // 1. Exact match on slug, ID, or previousSlugs alias
  let match = listings.find(
    (l: any) =>
      (l.slug && l.slug.toLowerCase() === normalized) ||
      l.id === normalized ||
      (Array.isArray(l.previousSlugs) && l.previousSlugs.some((ps: string) => ps.toLowerCase() === normalized))
  );
  if (match) return match;

  // 2. Normalized comparison stripping noise words
  const strippedTarget = stripNoise(normalized);
  if (strippedTarget) {
    match = listings.find(
      (l: any) =>
        (l.slug && stripNoise(l.slug) === strippedTarget) ||
        (Array.isArray(l.previousSlugs) && l.previousSlugs.some((ps: string) => stripNoise(ps) === strippedTarget))
    );
    if (match) return match;
  }

  // 3. Keyword subset matching
  const keywords = normalized.split(/[^a-z0-9]+/).filter((k) => k.length > 0);
  if (keywords.length >= 2) {
    match = listings.find((l: any) => {
      const itemSlug = (l.slug || '').toLowerCase();
      const itemTitle = (l.title || '').toLowerCase();
      const itemLocation = JSON.stringify(l.location || {}).toLowerCase();
      return keywords.every(
        (kw) => itemSlug.includes(kw) || itemTitle.includes(kw) || itemLocation.includes(kw)
      );
    });
    if (match) return match;
  }

  return null;
}

export const handler = async (event: any) => {
  const httpMethod = event.httpMethod;

  // Extract true request path from query params, headers, rawUrl, or path
  let fullUrlPath = "";
  if (event.queryStringParameters && event.queryStringParameters.path) {
    fullUrlPath = "/api/listings/" + event.queryStringParameters.path;
  } else if (event.headers && event.headers["x-nf-original-pathname"]) {
    fullUrlPath = event.headers["x-nf-original-pathname"];
  } else if (event.headers && event.headers["x-original-url"]) {
    try {
      fullUrlPath = new URL(event.headers["x-original-url"], "https://example.com").pathname;
    } catch (e) {}
  } else if (event.rawUrl) {
    try {
      const parsedUrl = new URL(event.rawUrl);
      if (!parsedUrl.pathname.includes("/.netlify/functions")) {
        fullUrlPath = parsedUrl.pathname;
      }
    } catch (e) {}
  }

  if (!fullUrlPath) {
    fullUrlPath = event.path || "";
  }

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  };

  if (httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    // Route: GET /api/listings/slug/:slug
    if (httpMethod === "GET" && fullUrlPath.includes("/slug/")) {
      const parts = fullUrlPath.split("/slug/");
      const slugParam = decodeURIComponent(parts[parts.length - 1] || "");
      const listings = await getStoredListings();
      const match = findMatchingListing(listings, slugParam);

      if (!match) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, error: "Listing not found" }),
        };
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: match }),
      };
    }

    // Route: GET /api/listings/:id or GET /api/listings
    if (httpMethod === "GET") {
      const listings = await getStoredListings();
      const pathParts = fullUrlPath.split("/").filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1];

      if (lastPart && lastPart !== "listings" && lastPart !== "functions") {
        // Querying single listing by ID or slug
        const match = listings.find((l: any) => l.id === lastPart || l.slug === lastPart) || findMatchingListing(listings, lastPart);
        if (!match) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, error: "Listing not found" }),
          };
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, data: match }),
        };
      }

      // Return all listings
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: listings }),
      };
    }

    // Route: POST /api/listings
    if (httpMethod === "POST") {
      const listing = JSON.parse(event.body || "{}");
      if (!listing || !listing.id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: "Invalid listing data" }),
        };
      }

      if (supabase) {
        const dbRow = toDbRow(listing);
        const { data, error } = await supabase.from("listings").upsert([dbRow]).select();
        if (error) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: `Database error saving listing: ${error.message}` }),
          };
        }
        const savedListing = data && data.length > 0 ? fromDbRow(data[0]) : listing;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, data: savedListing }),
        };
      }

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: "Supabase database client is not configured." }),
      };
    }

    // Route: DELETE /api/listings/:id
    if (httpMethod === "DELETE") {
      const pathParts = fullUrlPath.split("/").filter(Boolean);
      const targetId = pathParts[pathParts.length - 1];

      if (!targetId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: "Missing listing ID" }),
        };
      }

      if (supabase) {
        // 1. Delete record
        const { error: delErr } = await supabase.from("listings").delete().eq("id", targetId);
        if (delErr) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: `Failed to delete from database: ${delErr.message}` }),
          };
        }

        // 2. Post-delete verification check
        const { data: checkData, error: checkErr } = await supabase.from("listings").select("id").eq("id", targetId);
        if (checkErr) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: `Failed to verify deletion: ${checkErr.message}` }),
          };
        }

        if (checkData && checkData.length > 0) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: "Record still exists in Supabase after DELETE operation." }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, deletedId: targetId, message: "Record confirmed deleted from Supabase" }),
        };
      }

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: "Supabase database client is not configured." }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  } catch (err: any) {
    console.error("Error in Netlify listings function:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: err.message || "Server Error" }),
    };
  }
};
