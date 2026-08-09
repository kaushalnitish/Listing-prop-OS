import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

function loadDefaultListings(): any[] {
  try {
    const jsonPath = path.resolve(process.cwd(), "data", "listings.json");
    if (fs.existsSync(jsonPath)) {
      return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    }
  } catch (e) {
    console.warn("Could not read data/listings.json in Netlify function:", e);
  }
  return [];
}

const defaultListings = loadDefaultListings();

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
    seoTitle: row.seoTitle || row.seo_title || undefined,
    metaDescription: row.metaDescription || row.meta_description || undefined,
    createdAt: row.createdAt || row.created_at || now,
    updatedAt: row.updatedAt || row.updated_at || now,
  };
}

async function getStoredListings(): Promise<any[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        const dbListings = data.map(fromDbRow);
        // Merge with defaults if not present
        const dbIds = new Set(dbListings.map((l: any) => l.id));
        const combined = [...dbListings];
        for (const def of defaultListings) {
          if (!dbIds.has(def.id)) {
            combined.push(def);
          }
        }
        return combined;
      }
    } catch (e) {
      console.warn("Netlify function Supabase fetch error:", e);
    }
  }
  return defaultListings as any[];
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

  // 2. Improved normalized comparison stripping noise words and trailing counter
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

  // 4. Fallback: single published listing match if overlapping keywords
  const published = listings.filter((l: any) => l.status === 'published');
  if (published.length === 1) {
    const keywords = normalized.split(/[^a-z0-9]+/).filter((k) => k.length > 1);
    const itemText = (published[0].slug + ' ' + published[0].title).toLowerCase();
    const matchesCount = keywords.filter((kw) => itemText.includes(kw)).length;
    if (matchesCount >= 2 || (keywords.length === 1 && matchesCount === 1)) {
      return published[0];
    }
  }

  return null;
}

export const handler = async (event: any) => {
  const httpMethod = event.httpMethod;
  const path = event.path || "";

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
    const listings = await getStoredListings();

    // Route: GET /api/listings/slug/:slug
    if (httpMethod === "GET" && path.includes("/slug/")) {
      const parts = path.split("/slug/");
      const slugParam = decodeURIComponent(parts[parts.length - 1] || "");
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
      const pathParts = path.split("/").filter(Boolean);
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
        try {
          await supabase.from("listings").upsert([listing]);
        } catch (e) {
          console.warn("Supabase upsert warning:", e);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: listing }),
      };
    }

    // Route: DELETE /api/listings/:id
    if (httpMethod === "DELETE") {
      const pathParts = path.split("/").filter(Boolean);
      const targetId = pathParts[pathParts.length - 1];

      if (supabase && targetId) {
        try {
          await supabase.from("listings").delete().eq("id", targetId);
        } catch (e) {
          console.warn("Supabase delete warning:", e);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
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
