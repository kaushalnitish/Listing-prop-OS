import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import defaultListingsData from "../../data/listings.json";
import {
  SAMPLE_PROPERTY_LISTING,
  GLASSHOUSE_SANCTUARY_LISTING,
  SAMPLE_LISTINGS,
} from "../../src/data/sampleListing";
import {
  generateListingOpenGraphMetadata,
  injectMetadataIntoHtml,
  DEFAULT_PLATFORM_META,
} from "../../src/lib/seo";

const defaultListings: any[] = Array.isArray(defaultListingsData) ? defaultListingsData : [];

// Supabase client initialization
const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseKey && !supabaseUrl.includes("placeholder")
);

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

function stripNoise(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^(luxury|premium|featured|exclusive|prime|sale|for)-+/g, "")
    .replace(/-(luxury|premium|featured|exclusive|prime|sale|for)-+/g, "-")
    .replace(/-(luxury|premium|featured|exclusive|prime|sale|for)$/g, "")
    .replace(/-\d+$/g, "")
    .replace(/(^-|-$)+/g, "");
}

function findMatchingListing(listings: any[], targetSlug: string): any | null {
  if (!targetSlug) return null;
  const normalized = targetSlug.toLowerCase().trim();

  // 1. Direct match by slug, id, or previousSlugs
  let match = listings.find(
    (l: any) =>
      (l.slug && l.slug.toLowerCase() === normalized) ||
      l.id === normalized ||
      (Array.isArray(l.previousSlugs) &&
        l.previousSlugs.some((ps: string) => ps && ps.toLowerCase() === normalized)) ||
      (Array.isArray(l.previous_slugs) &&
        l.previous_slugs.some((ps: string) => ps && ps.toLowerCase() === normalized))
  );
  if (match) return match;

  // 2. Fuzzy match stripping common slug noise
  const strippedTarget = stripNoise(normalized);
  if (strippedTarget) {
    match = listings.find(
      (l: any) =>
        (l.slug && stripNoise(l.slug) === strippedTarget) ||
        (Array.isArray(l.previousSlugs) &&
          l.previousSlugs.some((ps: string) => ps && stripNoise(ps) === strippedTarget)) ||
        (Array.isArray(l.previous_slugs) &&
          l.previous_slugs.some((ps: string) => ps && stripNoise(ps) === strippedTarget))
    );
    if (match) return match;
  }

  // 3. Fallback to sample listings if requested
  if (
    normalized === "the-glasshouse-sanctuary-luxury-villa" ||
    normalized === "listing-glasshouse-sanctuary-alibaug" ||
    normalized === "glasshouse"
  ) {
    return GLASSHOUSE_SANCTUARY_LISTING;
  }

  if (
    normalized === "the-grand-luminary-villa" ||
    normalized === "sample" ||
    normalized === "sample-preview" ||
    normalized === "sample-luxury-listing-1"
  ) {
    return SAMPLE_PROPERTY_LISTING;
  }

  return null;
}

function getHtmlTemplate(): string {
  const possiblePaths = [
    path.join(process.cwd(), "dist", "index.html"),
    path.join(__dirname, "..", "..", "dist", "index.html"),
    path.join(__dirname, "dist", "index.html"),
    path.join(process.cwd(), "index.html"),
    path.join(__dirname, "..", "..", "index.html"),
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, "utf-8");
        if (content && content.includes("<div id=\"root\">")) {
          return content;
        }
      }
    } catch {
      // ignore and try next path
    }
  }

  // Fallback base HTML shell if dist/index.html is not directly reachable
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Listing OS - Property Listing Platform</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
}

export const handler = async (event: any) => {
  try {
    const rawPath = event.path || "";
    // Extract slug from /p/:slug, /listing/:slug, /property/:slug, /sample, or query parameter
    let slug = event.queryStringParameters?.slug || event.queryStringParameters?.id || "";

    if (!slug) {
      const match = rawPath.match(/^\/(?:p|listing|property)\/([^/?#]+)/i);
      if (match) {
        slug = decodeURIComponent(match[1]);
      } else if (rawPath.startsWith("/sample")) {
        slug = "the-glasshouse-sanctuary-luxury-villa";
      }
    }

    // Clean any query string or hash contamination from the slug
    if (typeof slug === "string") {
      slug = slug.split("?")[0].split("#")[0].replace(/^\/+|\/+$/g, "").trim();
    }

    const rawHost =
      event.headers?.["x-forwarded-host"] ||
      event.headers?.["host"] ||
      "listingos.netlify.app";
    const proto = event.headers?.["x-forwarded-proto"] || "https";
    const cleanHost = rawHost.split(",")[0].trim();
    const baseUrl = `${proto}://${cleanHost}`.replace(/\/+$/, "");

    let listing: any = null;

    if (slug) {
      // 1. Try Supabase
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("listings")
            .select("*")
            .order("created_at", { ascending: false });
          if (!error && Array.isArray(data) && data.length > 0) {
            listing = findMatchingListing(data, slug);
          }
        } catch (e) {
          console.warn("Supabase lookup error in Netlify SSR handler:", e);
        }
      }

      // 2. Try defaultListings (data/listings.json)
      if (!listing) {
        listing = findMatchingListing(defaultListings, slug);
      }

      // 3. Try SAMPLE_LISTINGS
      if (!listing) {
        listing = findMatchingListing(SAMPLE_LISTINGS, slug);
      }
    }

    const metadata = generateListingOpenGraphMetadata(listing, baseUrl, slug);
    const baseHtml = getHtmlTemplate();
    const finalHtml = injectMetadataIntoHtml(baseHtml, metadata);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "Cache-Control": "public, max-age=0, must-revalidate",
        "X-Robots-Tag": "all",
      },
      body: finalHtml,
    };
  } catch (err: any) {
    console.error("Error in Netlify SSR handler:", err);
    // Even on error, return HTML so client SPA can still attempt to load
    const baseHtml = getHtmlTemplate();
    const metadata = DEFAULT_PLATFORM_META;
    const finalHtml = injectMetadataIntoHtml(baseHtml, metadata);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
      },
      body: finalHtml,
    };
  }
};
