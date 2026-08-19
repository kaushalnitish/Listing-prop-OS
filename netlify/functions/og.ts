import { createClient } from "@supabase/supabase-js";
import defaultListingsData from "../../data/listings.json";
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

const FALLBACK_SAMPLE_LISTING = {
  id: "sample-luxury-listing-1",
  slug: "the-grand-luminary-villa",
  title: "The Grand Luminary Villa",
  tagline: "Modern Architectural Masterpiece with Private Infinity Pool & Panoramic Coastal Views",
  price: 4850000,
  currency: "$",
  specs: {
    bedrooms: 5,
    bathrooms: 6,
    squareFeet: 6400,
    propertyType: "Villa",
  },
  location: {
    address: "428 Ocean Drive, Star Island",
    neighborhood: "Star Island",
    city: "Miami Beach",
    state: "FL",
    country: "United States",
  },
  description:
    "Rising above the sparkling shoreline of Star Island, The Grand Luminary Villa stands as a beacon of modern architectural refinement and bespoke luxury.",
  images: [
    {
      id: "sample-img-1",
      url: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1600&q=80",
      caption: "Main Architectural Elevation & Infinity Pool",
      isCover: true,
    },
  ],
};

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
  const normalized = targetSlug.toLowerCase().trim();

  let match = listings.find(
    (l: any) =>
      (l.slug && l.slug.toLowerCase() === normalized) ||
      l.id === normalized ||
      (Array.isArray(l.previousSlugs) && l.previousSlugs.some((ps: string) => ps.toLowerCase() === normalized))
  );
  if (match) return match;

  const strippedTarget = stripNoise(normalized);
  if (strippedTarget) {
    match = listings.find(
      (l: any) =>
        (l.slug && stripNoise(l.slug) === strippedTarget) ||
        (Array.isArray(l.previousSlugs) && l.previousSlugs.some((ps: string) => stripNoise(ps) === strippedTarget))
    );
    if (match) return match;
  }

  if (
    normalized === "the-grand-luminary-villa" ||
    normalized === "sample" ||
    normalized === "sample-preview" ||
    normalized === "sample-luxury-listing-1"
  ) {
    return FALLBACK_SAMPLE_LISTING;
  }

  return null;
}

export const handler = async (event: any) => {
  try {
    const slug = event.queryStringParameters?.slug || event.queryStringParameters?.id || "";
    const rawHost = event.headers?.["host"] || event.headers?.["x-forwarded-host"] || "localhost";
    const proto = event.headers?.["x-forwarded-proto"] || "https";
    const baseUrl = `${proto}://${rawHost}`;

    let listing: any = null;

    if (slug) {
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
          console.warn("Supabase lookup error in Netlify OG handler:", e);
        }
      }

      if (!listing) {
        listing = findMatchingListing(defaultListings, slug);
      }
    }

    const metadata = generateListingOpenGraphMetadata(listing, baseUrl, slug);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        slug,
        foundListing: Boolean(listing),
        metadata,
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
