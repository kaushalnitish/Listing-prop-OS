import { createClient } from "@supabase/supabase-js";
import defaultListingsData from "../../data/listings.json";

const defaultListings: any[] = Array.isArray(defaultListingsData) ? defaultListingsData : [];

function getSupabaseReadClient() {
  const rawUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ""
  ).trim();
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ""
  ).trim();

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
    return null;
  }
  return createClient(supabaseUrl, supabaseKey);
}

function getSupabaseAdminClient(): { client: any; error?: { status: number; code: string; message: string } } {
  const rawUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ""
  ).trim();
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    return {
      client: null,
      error: {
        status: 500,
        code: "MISSING_SUPABASE_URL",
        message: "Server configuration error: SUPABASE_URL environment variable is missing on Netlify.",
      },
    };
  }

  if (!serviceRoleKey) {
    return {
      client: null,
      error: {
        status: 500,
        code: "MISSING_SERVICE_ROLE_KEY",
        message: "Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required for privileged database operations on Netlify.",
      },
    };
  }

  return { client: createClient(supabaseUrl, serviceRoleKey) };
}

async function uploadBufferToSupabase(
  supabase: any,
  buffer: Buffer,
  fileName: string,
  mimeType: string = "image/jpeg"
): Promise<string | null> {
  if (!supabase) return null;
  try {
    const filePath = `listings/${fileName}`;
    const { error: uploadErr } = await supabase.storage
      .from("property-images")
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadErr) {
      console.warn("Supabase Storage upload warning on Netlify function:", uploadErr.message);
      if (uploadErr.message?.includes("not found") || uploadErr.message?.includes("Bucket")) {
        try {
          await supabase.storage.createBucket("property-images", { public: true });
          await supabase.storage
            .from("property-images")
            .upload(filePath, buffer, { contentType: mimeType, upsert: true });
        } catch (bErr) {
          console.warn("Bucket creation warning:", bErr);
        }
      }
    }

    const { data } = supabase.storage
      .from("property-images")
      .getPublicUrl(filePath);

    if (data?.publicUrl) {
      return data.publicUrl;
    }
  } catch (err) {
    console.error("Error uploading buffer to Supabase Storage in Netlify function:", err);
  }
  return null;
}

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
    walkthrough_video_url: listing.walkthrough_video_url || listing.walkthroughVideoUrl || null,
    walkthrough_video_type: listing.walkthrough_video_type || listing.walkthroughVideoType || null,
    walkthrough_video_thumbnail: listing.walkthrough_video_thumbnail || listing.walkthroughVideoThumbnail || null,
    intelligence: listing.intelligence ? (typeof listing.intelligence === 'object' ? listing.intelligence : (() => { try { return JSON.parse(listing.intelligence); } catch { return null; } })()) : null,
    previous_slugs: Array.isArray(listing.previousSlugs) ? listing.previousSlugs : (Array.isArray(listing.previous_slugs) ? listing.previous_slugs : []),
    created_at: listing.createdAt || listing.created_at || now,
    updated_at: listing.updatedAt || listing.updated_at || now,
  };
}

function fromDbRow(row: any): any {
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
    seoTitle: row.seo_title || row.seoTitle || undefined,
    metaDescription: row.meta_description || row.metaDescription || undefined,
    walkthrough_video_url: videoUrl,
    walkthrough_video_type: videoType,
    walkthrough_video_thumbnail: videoThumb,
    walkthroughVideoUrl: videoUrl,
    walkthroughVideoType: videoType,
    walkthroughVideoThumbnail: videoThumb,
    intelligence: row.intelligence || undefined,
    previousSlugs: Array.isArray(row.previous_slugs) ? row.previous_slugs : (Array.isArray(row.previousSlugs) ? row.previousSlugs : []),
    createdAt: row.created_at || row.createdAt || now,
    updatedAt: row.updated_at || row.updatedAt || now,
  };
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
      (Array.isArray(l.previousSlugs) && l.previousSlugs.some((ps: string) => ps && ps.toLowerCase() === normalized))
  );
  if (match) return match;

  // 2. Normalized comparison stripping noise words
  const strippedTarget = stripNoise(normalized);
  if (strippedTarget) {
    match = listings.find(
      (l: any) =>
        (l.slug && stripNoise(l.slug) === strippedTarget) ||
        (Array.isArray(l.previousSlugs) && l.previousSlugs.some((ps: string) => ps && stripNoise(ps) === strippedTarget))
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
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
      const readClient = getSupabaseReadClient();

      if (readClient) {
        const { data, error } = await readClient.from("listings").select("*").order("created_at", { ascending: false });
        if (!error && data) {
          const listings = data.map(fromDbRow);
          const match = findMatchingListing(listings, slugParam);
          if (match) {
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ success: true, operation: "database_read", data: match }),
            };
          }
        }
      }

      // Check fallback default listings
      const fallbackMatch = findMatchingListing(defaultListings, slugParam);
      if (fallbackMatch) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, operation: "database_read", data: fallbackMatch }),
        };
      }

      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          operation: "database_read",
          status: 404,
          code: "LISTING_NOT_FOUND",
          message: `Listing with identifier "${slugParam}" could not be found.`,
        }),
      };
    }

    // Route: GET /api/listings/:id or GET /api/listings
    if (httpMethod === "GET") {
      const pathParts = fullUrlPath.split("/").filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1];
      const readClient = getSupabaseReadClient();

      let listings: any[] = [];
      if (readClient) {
        const { data, error } = await readClient.from("listings").select("*").order("created_at", { ascending: false });
        if (error) {
          console.warn("Supabase GET error on Netlify function:", error.message);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              success: false,
              operation: "database_read",
              status: 500,
              code: error.code || "DB_READ_ERROR",
              message: `Database query failed: ${error.message}. Please verify the 'listings' table in Supabase.`,
            }),
          };
        }
        listings = (data || []).map(fromDbRow);
      } else {
        listings = defaultListings;
      }

      if (lastPart && lastPart !== "listings" && lastPart !== "functions") {
        const match = listings.find((l: any) => l.id === lastPart || l.slug === lastPart) || findMatchingListing(listings, lastPart);
        if (!match) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
              success: false,
              operation: "database_read",
              status: 404,
              code: "LISTING_NOT_FOUND",
              message: `Listing with identifier "${lastPart}" not found.`,
            }),
          };
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, operation: "database_read", data: match }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, operation: "database_read", data: listings }),
      };
    }

    // Route: POST /api/listings (Privileged Create or Update listing)
    if (httpMethod === "POST") {
      const listing = JSON.parse(event.body || "{}");

      // Payload Validation
      if (!listing || typeof listing !== "object") {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            operation: "validation",
            status: 400,
            code: "INVALID_BODY",
            message: "Request body must be a valid JSON object.",
          }),
        };
      }

      if (!listing.id || !listing.slug || !listing.title) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            operation: "validation",
            status: 400,
            code: "MISSING_REQUIRED_FIELDS",
            message: "Listing payload is missing required fields: 'id', 'slug', or 'title'.",
          }),
        };
      }

      // Privileged mutations REQUIRE Supabase Service Role Key
      const { client: adminClient, error: adminErr } = getSupabaseAdminClient();
      if (adminErr || !adminClient) {
        return {
          statusCode: adminErr?.status || 500,
          headers,
          body: JSON.stringify({
            success: false,
            operation: "server_configuration",
            status: adminErr?.status || 500,
            code: adminErr?.code || "MISSING_SERVICE_ROLE_KEY",
            message: adminErr?.message || "Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required for listing mutations.",
          }),
        };
      }

      // Convert any inline base64 images if present
      if (Array.isArray(listing.images)) {
        for (let i = 0; i < listing.images.length; i++) {
          const img = listing.images[i];
          if (img && typeof img.url === "string" && img.url.startsWith("data:image/")) {
            try {
              const matches = img.url.match(/^data:(image\/[a-zA-Z0-9]+);base64,(.+)$/);
              if (matches) {
                const mimeType = matches[1];
                const ext = matches[1].split("/")[1] || "jpg";
                const buffer = Buffer.from(matches[2], "base64");
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

                const supabaseUrl = await uploadBufferToSupabase(adminClient, buffer, fileName, mimeType);
                if (supabaseUrl) {
                  listing.images[i] = { ...img, url: supabaseUrl };
                }
              }
            } catch (e) {
              console.error("Failed to convert inline base64 image on Netlify:", e);
            }
          }
        }
      }

      let dbRow = toDbRow(listing);
      let { data, error } = await adminClient
        .from("listings")
        .upsert([dbRow])
        .select();

      // Schema mismatch resilience: If newly added columns are missing in Supabase, retry with core fields
      if (error && (error.message?.includes("walkthrough_video") || error.message?.includes("intelligence") || error.code === "PGRST204" || error.code === "42703")) {
        console.warn("Supabase schema column mismatch, retrying with core fields:", error.message);
        const safeDbRow = { ...dbRow };
        delete (safeDbRow as any).walkthrough_video_url;
        delete (safeDbRow as any).walkthrough_video_type;
        delete (safeDbRow as any).walkthrough_video_thumbnail;
        delete (safeDbRow as any).intelligence;

        const retryResult = await adminClient
          .from("listings")
          .upsert([safeDbRow])
          .select();
        data = retryResult.data;
        error = retryResult.error;
      }

      if (error) {
        console.error("Supabase upsert error on Netlify function:", error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            operation: "database_save",
            status: 500,
            code: error.code || "DB_UPSERT_ERROR",
            message: `Database save failed: ${error.message} (Code: ${error.code}).`,
            details: "Please ensure the Supabase 'listings' table matches the schema in supabase-schema.sql.",
          }),
        };
      }

      const savedListing = data && data.length > 0 ? fromDbRow(data[0]) : listing;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          operation: "database_save",
          data: savedListing,
          id: savedListing.id,
          slug: savedListing.slug,
        }),
      };
    }

    // Route: DELETE /api/listings/:id (Privileged deletion)
    if (httpMethod === "DELETE") {
      const pathParts = fullUrlPath.split("/").filter(Boolean);
      const targetId = pathParts[pathParts.length - 1];

      if (!targetId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            operation: "validation",
            status: 400,
            code: "MISSING_ID",
            message: "Missing listing ID for deletion.",
          }),
        };
      }

      const { client: adminClient, error: adminErr } = getSupabaseAdminClient();
      if (adminErr || !adminClient) {
        return {
          statusCode: adminErr?.status || 500,
          headers,
          body: JSON.stringify({
            success: false,
            operation: "server_configuration",
            status: adminErr?.status || 500,
            code: adminErr?.code || "MISSING_SERVICE_ROLE_KEY",
            message: adminErr?.message || "Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required for deletion.",
          }),
        };
      }

      const { error: delErr } = await adminClient.from("listings").delete().eq("id", targetId);
      if (delErr) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            operation: "database_delete",
            status: 500,
            code: delErr.code || "DB_DELETE_ERROR",
            message: `Failed to delete listing from Supabase: ${delErr.message}`,
          }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          operation: "database_delete",
          deletedId: targetId,
          message: "Listing deleted from Supabase",
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        operation: "unknown",
        status: 405,
        code: "METHOD_NOT_ALLOWED",
        message: `HTTP Method ${httpMethod} Not Allowed`,
      }),
    };
  } catch (err: any) {
    console.error("Error in Netlify listings function:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        operation: "unknown",
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "Internal Server Error in listings function.",
      }),
    };
  }
};
