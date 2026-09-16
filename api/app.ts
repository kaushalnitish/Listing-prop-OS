import express from "express";
import path from "path";
import fs from "fs";
import dns from "dns/promises";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import {
  generateListingOpenGraphMetadata,
  DEFAULT_PLATFORM_META,
  formatPriceForSocial,
} from "../src/lib/seo.ts";

export const app = express();

// Persistence paths
const dataDir = path.join(process.cwd(), "data");
const listingsFilePath = path.join(dataDir, "listings.json");
const uploadsDir = path.join(process.cwd(), "public", "uploads");

// Enable universal CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Support large payloads for image uploads
app.use(express.json({ limit: "120mb" }));
app.use(express.urlencoded({ limit: "120mb", extended: true }));

// Serve static uploads
app.use("/uploads", express.static(uploadsDir));

// Resolve Supabase configuration securely across Vercel, Netlify, and local environments
export function getSupabaseConfig() {
  const rawUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ""
  ).trim().replace(/^["']|["']$/g, '');

  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ""
  ).trim().replace(/^["']|["']$/g, '');

  const isConfigured = Boolean(
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes("placeholder") &&
    supabaseKey !== "placeholder-anon-key"
  );

  return { supabaseUrl, supabaseKey, isConfigured };
}

// Reachability cache
let isSupabaseOnline: boolean | null = null;
let lastSupabaseCheckTime = 0;
const SUPABASE_CHECK_INTERVAL_MS = 30000;

export async function checkSupabaseReachability(): Promise<boolean> {
  const now = Date.now();
  if (isSupabaseOnline !== null && now - lastSupabaseCheckTime < SUPABASE_CHECK_INTERVAL_MS) {
    return isSupabaseOnline;
  }

  const { supabaseUrl, isConfigured } = getSupabaseConfig();
  if (!isConfigured || !supabaseUrl) {
    isSupabaseOnline = false;
    lastSupabaseCheckTime = now;
    return false;
  }

  try {
    const parsed = new URL(supabaseUrl);
    const host = parsed.hostname;
    await dns.lookup(host);
    isSupabaseOnline = true;
  } catch (dnsErr: any) {
    isSupabaseOnline = false;
  }

  lastSupabaseCheckTime = now;
  return isSupabaseOnline;
}

export function getSupabaseServerClient() {
  const { supabaseUrl, supabaseKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Upload buffer directly to Supabase Storage bucket 'property-images'
export async function uploadBufferToSupabase(
  buffer: Buffer,
  fileName: string,
  mimeType: string = "image/jpeg"
): Promise<string | null> {
  const online = await checkSupabaseReachability();
  if (!online) return null;

  const client = getSupabaseServerClient();
  if (!client) return null;

  try {
    const filePath = `listings/${fileName}`;
    const { error: uploadErr } = await client.storage
      .from("property-images")
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadErr) {
      if (uploadErr.message?.includes("not found") || uploadErr.message?.includes("Bucket")) {
        try {
          await client.storage.createBucket("property-images", { public: true });
          const { error: retryErr } = await client.storage
            .from("property-images")
            .upload(filePath, buffer, { contentType: mimeType, upsert: true });
          if (retryErr) console.warn("[Server] Supabase bucket retry upload warning:", retryErr.message);
        } catch (bErr) {
          console.warn("[Server] Supabase bucket creation warning:", bErr);
        }
      }
    }

    const { data } = client.storage
      .from("property-images")
      .getPublicUrl(filePath);

    if (data?.publicUrl) {
      return data.publicUrl;
    }
  } catch (err: any) {
    if (err?.message?.includes("fetch failed") || err?.code === "ENOTFOUND") {
      isSupabaseOnline = false;
      lastSupabaseCheckTime = Date.now();
    }
  }
  return null;
}

// Convert application property listing to database row format
export function toDbRow(listing: any) {
  const now = new Date().toISOString();
  return {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    tagline: listing.tagline || null,
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
    intelligence: listing.intelligence || null,
    walkthrough_video_url: listing.walkthroughVideoUrl || listing.walkthrough_video_url || null,
    walkthrough_video_type: listing.walkthroughVideoType || listing.walkthrough_video_type || null,
    walkthrough_video_thumbnail: listing.walkthroughVideoThumbnail || listing.walkthrough_video_thumbnail || null,
    previous_slugs: Array.isArray(listing.previousSlugs)
      ? listing.previousSlugs
      : Array.isArray(listing.previous_slugs)
      ? listing.previous_slugs
      : [],
    created_at: listing.createdAt || listing.created_at || now,
    updated_at: listing.updatedAt || listing.updated_at || now,
  };
}

// Convert database row to application property listing format
export function fromDbRow(row: any): any {
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
    walkthroughVideoUrl: row.walkthrough_video_url || row.walkthroughVideoUrl || undefined,
    walkthroughVideoType: row.walkthrough_video_type || row.walkthroughVideoType || undefined,
    walkthroughVideoThumbnail: row.walkthrough_video_thumbnail || row.walkthroughVideoThumbnail || undefined,
    intelligence:
      typeof row.intelligence === 'object' && row.intelligence
        ? row.intelligence
        : typeof row.intelligence === 'string'
        ? (() => {
            try {
              return JSON.parse(row.intelligence);
            } catch {
              return undefined;
            }
          })()
        : undefined,
    previousSlugs: Array.isArray(row.previous_slugs)
      ? row.previous_slugs
      : Array.isArray(row.previousSlugs)
      ? row.previousSlugs
      : [],
    createdAt: row.created_at || row.createdAt || now,
    updatedAt: row.updated_at || row.updatedAt || now,
  };
}

// Fallback demo listings from data/listings.json if database is initializing
export function getFallbackListings(): any[] {
  try {
    const listingsJsonPath = path.join(process.cwd(), "data", "listings.json");
    if (fs.existsSync(listingsJsonPath)) {
      const raw = fs.readFileSync(listingsJsonPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("[Server] Could not read fallback listings file:", e);
  }
  return [];
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

export function findMatchingListing(listings: any[], slugOrId: string) {
  if (!slugOrId) return null;
  const param = slugOrId.toLowerCase().trim();
  const cleanedParam = stripNoise(param);

  return (
    listings.find((l: any) => l.slug && l.slug.toLowerCase().trim() === param) ||
    listings.find((l: any) => l.id && String(l.id).toLowerCase().trim() === param) ||
    listings.find(
      (l: any) =>
        Array.isArray(l.previousSlugs) &&
        l.previousSlugs.some((s: string) => s.toLowerCase().trim() === param)
    ) ||
    listings.find((l: any) => l.slug && stripNoise(l.slug) === cleanedParam) ||
    listings.find((l: any) => l.slug && l.slug.toLowerCase().includes(param)) ||
    listings.find((l: any) => param.includes(l.slug.toLowerCase())) ||
    null
  );
}

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Router
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get("/health", async (req, res) => {
  const config = getSupabaseConfig();
  const reachable = await checkSupabaseReachability();
  res.json({
    status: "ok",
    supabaseConfigured: config.isConfigured,
    supabaseReachable: reachable,
    storageMode: reachable ? "supabase" : "local",
    timestamp: new Date().toISOString(),
  });
});

// Safe public configuration endpoint for frontend hydration
apiRouter.get("/config", async (req, res) => {
  const { supabaseUrl, isConfigured } = getSupabaseConfig();
  const anonKey = (
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  ).trim().replace(/^["']|["']$/g, '');

  const isOnline = await checkSupabaseReachability();

  res.json({
    success: true,
    supabaseUrl: isOnline ? supabaseUrl : null,
    supabaseAnonKey: isOnline ? anonKey : null,
    isConfigured: Boolean(supabaseUrl && anonKey && !supabaseUrl.includes("placeholder")),
    isOnline,
    storageMode: isOnline ? "supabase" : "local",
  });
});

// Image upload endpoint (saves to Supabase if reachable, otherwise saves locally)
apiRouter.post("/upload-image", async (req, res) => {
  try {
    const { image, name } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: "No image data provided" });
    }

    let buffer: Buffer;
    let ext = "jpg";
    let mimeType = "image/jpeg";

    if (image.startsWith("data:")) {
      const matches = image.match(/^data:(image\/[a-zA-Z0-9]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        ext = matches[1].split("/")[1] || "jpg";
        buffer = Buffer.from(matches[2], "base64");
      } else {
        const parts = image.split(",");
        buffer = Buffer.from(parts[1] || parts[0], "base64");
      }
    } else {
      buffer = Buffer.from(image, "base64");
    }

    const cleanExt = (ext || "jpg").replace(/[^a-zA-Z0-9]/g, "") || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;

    const isOnline = await checkSupabaseReachability();
    if (isOnline) {
      const supabaseUrl = await uploadBufferToSupabase(buffer, fileName, mimeType);
      if (supabaseUrl) {
        return res.json({ success: true, url: supabaseUrl, storage: "supabase" });
      }
    }

    // Local file fallback
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const localFilePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(localFilePath, buffer);

    const distUploadsDir = path.join(process.cwd(), "dist", "uploads");
    if (fs.existsSync(distUploadsDir)) {
      try {
        fs.writeFileSync(path.join(distUploadsDir, fileName), buffer);
      } catch {}
    }

    return res.json({
      success: true,
      url: `/uploads/${fileName}`,
      storage: "local",
    });
  } catch (err: any) {
    console.error("[Server] Error in /api/upload-image:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to upload image" });
  }
});

// GET all property listings
apiRouter.get("/listings", async (req, res) => {
  try {
    const isOnline = await checkSupabaseReachability();
    const fallback = getFallbackListings();

    if (!isOnline) {
      return res.json({ success: true, data: fallback, storage: "local", supabaseOnline: false });
    }

    const client = getSupabaseServerClient();
    if (!client) {
      return res.json({ success: true, data: fallback, storage: "local" });
    }

    try {
      const { data, error } = await client
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.message?.includes("fetch failed") || error.code === "ENOTFOUND") {
          isSupabaseOnline = false;
          lastSupabaseCheckTime = Date.now();
        }
        return res.json({ success: true, data: fallback, storage: "local", warning: error.message });
      }

      let listings = (data || []).map(fromDbRow);
      if (listings.length === 0) {
        listings = fallback;
      }

      return res.json({ success: true, data: listings, storage: "supabase" });
    } catch (dbErr: any) {
      isSupabaseOnline = false;
      lastSupabaseCheckTime = Date.now();
      return res.json({ success: true, data: fallback, storage: "local" });
    }
  } catch (err: any) {
    console.error("[Server] Exception in GET /api/listings:", err);
    const fallback = getFallbackListings();
    return res.json({ success: true, data: fallback, storage: "local" });
  }
});

// GET listing by slug
apiRouter.get("/listings/slug/:slug", async (req, res) => {
  try {
    const client = getSupabaseServerClient();
    const slugParam = req.params.slug.toLowerCase().trim();

    let allListings: any[] = [];
    if (client) {
      const { data, error } = await client
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        allListings = data.map(fromDbRow);
      }
    }

    if (allListings.length === 0) {
      allListings = getFallbackListings();
    }

    const match = findMatchingListing(allListings, slugParam);
    if (!match) {
      return res.status(404).json({ success: false, error: "Listing not found" });
    }
    return res.json({ success: true, data: match });
  } catch (err: any) {
    console.error("[Server] Error in GET /api/listings/slug/:slug:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to fetch listing by slug" });
  }
});

// GET listing by ID
apiRouter.get("/listings/:id", async (req, res) => {
  try {
    const client = getSupabaseServerClient();
    const id = req.params.id;

    if (client) {
      const { data, error } = await client
        .from("listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        return res.json({ success: true, data: fromDbRow(data) });
      }
    }

    const fallbacks = getFallbackListings();
    const match = fallbacks.find((l: any) => String(l.id) === id || l.slug === id);
    if (match) {
      return res.json({ success: true, data: match });
    }

    return res.status(404).json({ success: false, error: "Listing not found" });
  } catch (err: any) {
    console.error("[Server] Error in GET /api/listings/:id:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to fetch listing by ID" });
  }
});

// POST save or update listing (upsert)
apiRouter.post("/listings", async (req, res) => {
  try {
    const client = getSupabaseServerClient();
    const listing = req.body;
    if (!listing || !listing.id || !listing.slug) {
      return res.status(400).json({ success: false, error: "Invalid listing object. Required: id, slug" });
    }

    // Process any inline base64 images to permanent Supabase storage
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

              const supabaseUrl = await uploadBufferToSupabase(buffer, fileName, mimeType);
              if (supabaseUrl) {
                listing.images[i] = { ...img, url: supabaseUrl };
              }
            }
          } catch (e) {
            console.error("[Server] Failed to convert inline base64 image:", e);
          }
        }
      }
    }

    let savedListing = listing;

    if (client) {
      const dbRow = toDbRow(listing);
      let { data, error } = await client
        .from("listings")
        .upsert([dbRow])
        .select();

      // Gracefully retry without optional metadata columns if schema cache mismatch
      if (
        error &&
        error.message &&
        (error.message.includes("walkthrough_video") ||
          error.message.includes("intelligence") ||
          error.code === "PGRST204" ||
          error.code === "42703")
      ) {
        console.warn("[Server] Supabase schema cache missing optional columns, retrying with core fields:", error.message);
        const safeDbRow = { ...dbRow };
        delete (safeDbRow as any).walkthrough_video_url;
        delete (safeDbRow as any).walkthrough_video_type;
        delete (safeDbRow as any).walkthrough_video_thumbnail;
        delete (safeDbRow as any).intelligence;
        const retryResult = await client.from("listings").upsert([safeDbRow]).select();
        data = retryResult.data;
        error = retryResult.error;
      }

      if (error) {
        console.error("[Server] Supabase upsert error in POST /api/listings:", error);
        return res.status(500).json({
          success: false,
          error: `Failed to save listing to Supabase: ${error.message} (Code: ${error.code})`,
        });
      }

      if (data && data.length > 0) {
        savedListing = fromDbRow(data[0]);
      }
    }

    return res.json({ success: true, data: savedListing });
  } catch (err: any) {
    console.error("[Server] Error in POST /api/listings:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to save listing" });
  }
});

// DELETE listing
apiRouter.delete("/listings/:id", async (req, res) => {
  try {
    const client = getSupabaseServerClient();
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, error: "Missing listing ID" });
    }

    if (client) {
      const { error: delError } = await client
        .from("listings")
        .delete()
        .eq("id", id);

      if (delError) {
        console.error("[Server] Supabase delete error:", delError);
        return res.status(500).json({
          success: false,
          error: `Failed to delete record from Supabase: ${delError.message}`,
        });
      }
    }

    return res.json({
      success: true,
      deletedId: id,
      message: "Listing deleted successfully",
    });
  } catch (err: any) {
    console.error("[Server] Error in DELETE /api/listings/:id:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to delete listing" });
  }
});

// =========================================================================
// CREATOR PORTFOLIOS API ROUTES
// =========================================================================

const portfoliosJsonPath = path.join(process.cwd(), "data", "portfolios.json");

function getLocalPortfolios(): any[] {
  try {
    if (fs.existsSync(portfoliosJsonPath)) {
      const parsed = JSON.parse(fs.readFileSync(portfoliosJsonPath, "utf-8"));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

function saveLocalPortfolios(portfolios: any[]) {
  try {
    fs.writeFileSync(portfoliosJsonPath, JSON.stringify(portfolios, null, 2), "utf-8");
  } catch (e) {
    console.error("[Server] Failed to write portfolios JSON:", e);
  }
}

apiRouter.get("/portfolios", async (req, res) => {
  try {
    const list = getLocalPortfolios();
    return res.json({ success: true, data: list, count: list.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get("/portfolios/slug/:slug", async (req, res) => {
  try {
    const slug = (req.params.slug || "").toLowerCase().trim();
    const list = getLocalPortfolios();
    const match = list.find((p) => p.slug === slug || p.id === slug);
    if (match) return res.json({ success: true, data: match });
    return res.status(404).json({ success: false, error: "Portfolio not found" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get("/portfolios/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const list = getLocalPortfolios();
    const match = list.find((p) => p.id === id || p.slug === id);
    if (match) return res.json({ success: true, data: match });
    return res.status(404).json({ success: false, error: "Portfolio not found" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post("/portfolios", async (req, res) => {
  try {
    const portfolio = req.body;
    if (!portfolio || !portfolio.id || !portfolio.slug) {
      return res.status(400).json({ success: false, error: "Missing required fields id and slug" });
    }
    const list = getLocalPortfolios();
    const idx = list.findIndex((p) => p.id === portfolio.id || p.slug === portfolio.slug);
    const updated = {
      ...portfolio,
      slug: portfolio.slug.toLowerCase().trim(),
      updatedAt: new Date().toISOString(),
      createdAt: portfolio.createdAt || new Date().toISOString(),
    };
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.unshift(updated);
    }
    saveLocalPortfolios(list);
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete("/portfolios/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const list = getLocalPortfolios();
    const filtered = list.filter((p) => p.id !== id && p.slug !== id);
    saveLocalPortfolios(filtered);
    return res.json({ success: true, deletedId: id });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post("/parse-creator-info", async (req, res) => {
  try {
    const { rawText = "" } = req.body;
    const text = String(rawText || "").trim();

    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,9}/);
    const instaMatch = text.match(/(?:instagram\.com\/|@)([a-zA-Z0-9._]+)/i);
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let detectedName = "Creative Professional";
    if (lines.length > 0) {
      const firstLine = lines[0].replace(/^(hi|hello|i am|i'm|name:?)\s+/i, "").trim();
      if (firstLine.length > 1 && firstLine.length < 50 && !firstLine.includes("@")) {
        detectedName = firstLine;
      }
    }

    return res.json({
      success: true,
      data: {
        identity: {
          name: detectedName,
          tagline: lines[1] && lines[1].length < 100 ? lines[1] : "Creative Director & Visual Storyteller",
          niche: "Creative & Design",
          bio: text.slice(0, 320),
          location: "Global / Remote",
        },
        contact: {
          email: emailMatch ? emailMatch[1] : "",
          phone: phoneMatch ? phoneMatch[0] : "",
          whatsappNumber: phoneMatch ? phoneMatch[0].replace(/[^0-9]/g, "") : "",
          website: "",
          bookingUrl: "",
        },
        socialLinks: {
          instagram: instaMatch ? `https://instagram.com/${instaMatch[1].replace('@', '')}` : "",
        },
        content: {
          about: text.length > 100 ? text : "Bespoke creative direction and visual design.",
          services: [
            {
              id: "srv-1",
              title: "Creative Direction & Production",
              description: "End-to-end concept design and project execution.",
              price: "Custom Quote",
              deliveryTime: "2 Weeks",
              tags: ["Creative", "Direction"],
            },
          ],
          skills: ["Art Direction", "Visual Storytelling", "Brand Strategy"],
          projects: [],
          experience: [],
          testimonials: [],
          process: [
            { id: "step-1", step: 1, title: "Discovery & Scope", description: "Aligning on creative ambitions and technical requirements." },
            { id: "step-2", step: 2, title: "Production & Direction", description: "Crafting bespoke assets and visual narratives." },
            { id: "step-3", step: 3, title: "Final Polish & Delivery", description: "Delivering cross-platform assets ready for launch." },
          ],
        },
      },
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Gemini AI Generator Route
apiRouter.post("/generate-listing-content", async (req, res) => {
  try {
    const {
      prompt,
      propertyType = "Villa",
      location = "Miami, FL",
      price,
      bedrooms,
      bathrooms,
      squareFeet,
      existingTitle,
    } = req.body;

    const ai = getGeminiClient();

    const userInstructions = `
Please generate complete, well-written real estate copy for a ${propertyType} listing.
- Location: ${location}
${price ? `- Price: $${price}` : ""}
${bedrooms ? `- Bedrooms: ${bedrooms}` : ""}
${bathrooms ? `- Bathrooms: ${bathrooms}` : ""}
${squareFeet ? `- Square Feet: ${squareFeet} sq ft` : ""}
${existingTitle ? `- Current Title Draft: "${existingTitle}"` : ""}
${prompt ? `- Specific Notes / Vision: ${prompt}` : ""}

Craft natural, authentic, professional real estate copy as an experienced human agent would write.
CRITICAL TONE & COPYWRITING INSTRUCTIONS:
- Do NOT use generic AI real-estate cliches or marketing fluff (avoid "unparalleled luxury", "world-class", "curated for discerning buyers", "epitome of", "extraordinary masterpiece", "sophisticated lifestyle").
- Keep descriptions specific, clear, natural, and grounded in real property details (light, room flow, materials, storage, neighborhood accessibility).

Include:
1. Title: Clear, descriptive property title.
2. Subtitle / Tagline: Informative, concise subhead.
3. Description: 2-3 clean, engaging paragraphs highlighting spatial flow, natural lighting, finishes, outdoor integration, and location convenience.
4. Highlights: 4-6 bullet points of top standout property features.
5. Amenities: 6-10 key amenities.
6. SEO Title: High-intent search title under 60 chars.
7. Meta Description: High-converting search summary under 155 chars.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userInstructions,
      config: {
        systemInstruction:
          "You are an experienced professional real estate copywriter. Write clear, natural, and human property descriptions. Return structured JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            tagline: { type: Type.STRING },
            description: { type: Type.STRING },
            highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
            amenities: { type: Type.ARRAY, items: { type: Type.STRING } },
            seoTitle: { type: Type.STRING },
            metaDescription: { type: Type.STRING },
          },
          required: [
            "title",
            "tagline",
            "description",
            "highlights",
            "amenities",
            "seoTitle",
            "metaDescription",
          ],
        },
      },
    });

    const rawText = response.text || "{}";
    const parsedData = JSON.parse(rawText);

    return res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error("[Server] Error in /api/generate-listing-content:", err);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred while generating copy. Please try again later.",
    });
  }
});

// WhatsApp Description Intelligent Parser Route
apiRouter.post("/parse-whatsapp-listing", async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ success: false, error: "Please provide property text to parse." });
    }

    const ai = getGeminiClient();

    const prompt = `
Analyze the following raw WhatsApp / client property description message and extract all property details accurately:

---
${rawText}
---

INSTRUCTIONS & CONVERSIONS:
1. Parse numbers, specifications, prices, locations, amenities, warranty details, and contact numbers.
2. Property Type Category MUST be strictly one of: "Residential Floor", "Apartment", "Villa", "Plot", "Commercial", "Office", "Warehouse", "Retail Shop", "Industrial", "Farm House", "Other".
3. If price is expressed in Indian Lakhs (e.g. "65.90" or "65.90 Lakhs"), convert 65.90 Lakhs = 65,90,000 INR (number: 6590000, currency: "₹", priceFormatted: "₹65.90 Lakhs"). If price is in USD or unspecified currency, detect appropriately. If no price is mentioned, set price to null and add "price" to missingFields.
4. If area is given in "Gaj" or "Sq Yards" (e.g. "138 Gaj"), calculate squareFeet = 138 * 9 = 1242, and set areaText to "138 Gaj (1,242 Sq. Ft.)". If in Sq Ft, use directly.
5. "3 BHK" -> bedrooms: 3. If bathrooms are not explicitly mentioned, estimate or set bathrooms to null and add "bathrooms" to missingFields.
6. Create a clear, specific Title (e.g., "3 BHK Independent Floor in Gated Society").
7. Create an informative Tagline (e.g., "Modern Construction Near Chandigarh Kharar Highway").
8. Extract all amenities (e.g., ["Gated Society", "45ft RCC Roads", "5 Years Wooden Work Warranty", "1 Year After Sales Service"]).
9. Extract key highlights (3-6 bullet points highlighting standout features).
10. Write a polished 2-paragraph narrative story description highlighting quality, location, warranty, and layout in natural human tone without cliché AI hype.
11. Extract any phone/WhatsApp numbers (e.g. "7973318763").
12. Generate an SEO Title and Meta Description.
13. List all missing or low-confidence fields in missingFields array.
    `;

    let parsed: any = null;
    const modelsToTry = ["gemini-2.5-flash", "gemini-3.1-flash-lite"];

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction:
              "You are an expert real estate data extraction AI. Accurately parse raw WhatsApp property messages into structured JSON.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                tagline: { type: Type.STRING },
                propertyType: { type: Type.STRING },
                price: { type: Type.NUMBER },
                priceFormatted: { type: Type.STRING },
                currency: { type: Type.STRING },
                bedrooms: { type: Type.NUMBER },
                bathrooms: { type: Type.NUMBER },
                squareFeet: { type: Type.NUMBER },
                areaText: { type: Type.STRING },
                address: { type: Type.STRING },
                city: { type: Type.STRING },
                neighborhood: { type: Type.STRING },
                description: { type: Type.STRING },
                highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                amenities: { type: Type.ARRAY, items: { type: Type.STRING } },
                seoTitle: { type: Type.STRING },
                metaDescription: { type: Type.STRING },
                contactPhone: { type: Type.STRING },
                missingFields: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                "title",
                "tagline",
                "propertyType",
                "description",
                "highlights",
                "amenities",
                "missingFields",
              ],
            },
          },
        });
        parsed = JSON.parse(response.text || "{}");
        if (parsed && parsed.title) break;
      } catch (modelErr: any) {
        console.warn(`[api/app.ts] Model ${model} failed with:`, modelErr?.message || modelErr);
      }
    }

    if (parsed && parsed.title) {
      return res.json({ success: true, data: parsed });
    }

    // Heuristic fallback if models return 503 or fail
    const fallbackTitle = rawText.split("\n")[0]?.replace(/^[-*•]\s*/, "").slice(0, 80) || "Modern Property";
    return res.json({
      success: true,
      data: {
        title: fallbackTitle,
        tagline: "Prime Property with Scenic Surroundings",
        propertyType: /villa/i.test(rawText) ? "Villa" : "Residential Floor",
        currency: "₹",
        description: rawText.slice(0, 500),
        highlights: ["Prime Location", "Dedicated Parking", "Scenic Views"],
        amenities: ["Parking", "Security", "Water Supply"],
        missingFields: [],
      },
    });
  } catch (err: any) {
    console.error("[Server] Error in /api/parse-whatsapp-listing:", err);
    return res.json({
      success: true,
      data: {
        title: "Modern Property",
        tagline: "Prime Residential Opportunity",
        propertyType: "Residential Floor",
        currency: "₹",
        description: req.body?.rawText || "",
        highlights: ["Peaceful Neighborhood", "Great Accessibility"],
        amenities: ["Parking", "Security"],
        missingFields: [],
      },
    });
  }
});

// Property Intelligence Researcher Route
apiRouter.post("/research-property-intelligence", async (req, res) => {
  try {
    const { listing } = req.body;
    if (!listing) {
      return res.status(400).json({ success: false, error: "Listing data required" });
    }

    const ai = getGeminiClient();
    const prompt = `
Provide deep real estate market research, investment metrics, and neighborhood intelligence for:
Title: ${listing.title}
Property Type: ${listing.specs?.propertyType || "Residential"}
Price: ${listing.currency || "₹"}${listing.price || "N/A"}
Location: ${listing.location?.address || ""}, ${listing.location?.city || ""}

Generate factual, high-value real estate intelligence structured as JSON:
- marketTrend: Summary of local capital appreciation and demand
- rentalYieldEstimated: e.g. "4.2% - 5.1%"
- capitalAppreciation5Year: e.g. "8.5% YoY"
- connectivityScore: 1-100 score
- infrastructureDevelopments: Array of upcoming transport/civic projects
- investorVerdict: Professional summary of investment viability
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || "{}");
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error("[Server] Error in /api/research-property-intelligence:", err);
    return res.status(500).json({ success: false, error: "Failed to generate market intelligence." });
  }
});

// Inspection / Debugging API endpoint for Open Graph metadata
apiRouter.get("/og-metadata", async (req, res) => {
  try {
    const slug = (req.query.slug as string) || (req.query.id as string) || '';
    const fallbacks = getFallbackListings();
    const listing = slug ? findMatchingListing(fallbacks, slug) : null;
    const baseUrl = process.env.APP_URL || 'https://listingos.app';
    const metadata = generateListingOpenGraphMetadata(listing, baseUrl, slug);
    return res.json({
      success: true,
      slug,
      foundListing: Boolean(listing),
      metadata,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Mount the API Router under BOTH /api and /
// This ensures that Vercel rewrites to /api/index work seamlessly whether
// the path is forwarded as /api/listings or /listings!
app.use("/api", apiRouter);
app.use("/", apiRouter);

export default app;
