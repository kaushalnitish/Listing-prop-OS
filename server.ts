import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import {
  generateListingOpenGraphMetadata,
  injectMetadataIntoHtml,
  DEFAULT_PLATFORM_META,
  formatPriceForSocial,
} from "./src/lib/seo";

// Initialize Supabase Client on Server
const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const isServerSupabaseConfigured = Boolean(
  supabaseUrl && supabaseKey && !supabaseUrl.includes("placeholder")
);

const supabaseServer = isServerSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

async function uploadBufferToSupabase(buffer: Buffer, fileName: string, mimeType: string = "image/jpeg"): Promise<string | null> {
  if (!supabaseServer) return null;
  try {
    const filePath = `listings/${fileName}`;
    const { error: uploadErr } = await supabaseServer.storage
      .from("property-images")
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadErr) {
      console.warn("Supabase Storage upload warning on server:", uploadErr.message);
      if (uploadErr.message?.includes("not found") || uploadErr.message?.includes("Bucket")) {
        try {
          await supabaseServer.storage.createBucket("property-images", { public: true });
          const { error: retryErr } = await supabaseServer.storage
            .from("property-images")
            .upload(filePath, buffer, { contentType: mimeType, upsert: true });
          if (retryErr) console.warn("Supabase retry upload error:", retryErr.message);
        } catch (bErr) {
          console.warn("Bucket creation error:", bErr);
        }
      }
    }

    const { data } = supabaseServer.storage
      .from("property-images")
      .getPublicUrl(filePath);

    if (data?.publicUrl) {
      return data.publicUrl;
    }
  } catch (err) {
    console.error("Error uploading buffer to Supabase Storage:", err);
  }
  return null;
}

async function uploadVideoBufferToSupabase(
  buffer: Buffer,
  fileName: string,
  mimeType: string = "video/mp4",
  listingId?: string
): Promise<string | null> {
  if (!supabaseServer) return null;
  try {
    const folder = listingId ? `walkthroughs/${listingId}` : "walkthroughs";
    const filePath = `${folder}/${fileName}`;
    const { error: uploadErr } = await supabaseServer.storage
      .from("property-walkthroughs")
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadErr) {
      console.warn("Supabase Walkthrough Storage upload warning on server:", uploadErr.message);
      if (uploadErr.message?.includes("not found") || uploadErr.message?.includes("Bucket")) {
        try {
          await supabaseServer.storage.createBucket("property-walkthroughs", { public: true });
          const { error: retryErr } = await supabaseServer.storage
            .from("property-walkthroughs")
            .upload(filePath, buffer, { contentType: mimeType, upsert: true });
          if (retryErr) console.warn("Supabase retry video upload error:", retryErr.message);
        } catch (bErr) {
          console.warn("Bucket creation error:", bErr);
        }
      }
    }

    const { data } = supabaseServer.storage
      .from("property-walkthroughs")
      .getPublicUrl(filePath);

    if (data?.publicUrl) {
      return data.publicUrl;
    }
  } catch (err) {
    console.error("Error uploading video buffer to Supabase Storage:", err);
  }
  return null;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "120mb" }));
  app.use(express.urlencoded({ limit: "120mb", extended: true }));

  const PORT = 3000;

  // Serve static uploads folder
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  // File persistence for listings
  const dataDir = path.join(process.cwd(), "data");
  const listingsFilePath = path.join(dataDir, "listings.json");

  function getStoredListings(): any[] {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (fs.existsSync(listingsFilePath)) {
        const content = fs.readFileSync(listingsFilePath, "utf-8");
        return JSON.parse(content);
      }
    } catch (e) {
      console.error("Error reading listings file:", e);
    }
    return [];
  }

  function saveStoredListings(listings: any[]) {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(listingsFilePath, JSON.stringify(listings, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing listings file:", e);
    }
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

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Module 7: Gemini AI Generator API Route
  app.post("/api/generate-listing-content", async (req, res) => {
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
- Do NOT use generic AI real-estate cliches or marketing fluff (e.g., avoid "unparalleled luxury", "world-class", "curated for discerning buyers", "epitome of", "extraordinary masterpiece", "sophisticated lifestyle").
- Keep descriptions specific, clear, natural, and grounded in real property details (light, room flow, materials, storage, neighborhood accessibility).

Include:
1. Title: Clear, descriptive property title.
2. Subtitle / Tagline: Informative, concise subhead.
3. Description: 2-3 clean, engaging paragraphs highlighting spatial flow, natural lighting, finishes, outdoor integration, and location convenience.
4. Highlights: 4-6 bullet points of top standout property features.
5. Amenities: 6-10 key amenities (e.g., Gated Community, Covered Parking, Modular Kitchen, Private Balcony, High-Speed Elevators).
6. SEO Title: High-intent search title under 60 chars.
7. Meta Description: High-converting search summary under 155 chars.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: userInstructions,
        config: {
          systemInstruction:
            "You are an experienced professional real estate copywriter. Write clear, natural, and human property descriptions. Avoid AI cliché hype phrases like 'unparalleled luxury', 'world-class', 'curated for discerning buyers', or 'epitome of luxury'. Return structured JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "Luxury property title",
              },
              tagline: {
                type: Type.STRING,
                description: "Subhead or tagline",
              },
              description: {
                type: Type.STRING,
                description: "Detailed narrative description",
              },
              highlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Standout highlights",
              },
              amenities: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Luxury amenities list",
              },
              seoTitle: {
                type: Type.STRING,
                description: "SEO title tag",
              },
              metaDescription: {
                type: Type.STRING,
                description: "SEO meta description tag",
              },
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

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error("Internal Error in /api/generate-listing-content:", err);
      return res.status(500).json({
        success: false,
        error: "An unexpected error occurred while generating copy. Please try again later.",
      });
    }
  });

  // WhatsApp Description Intelligent Parser Route
  app.post("/api/parse-whatsapp-listing", async (req, res) => {
    try {
      const { rawText } = req.body;

      if (!rawText || !rawText.trim()) {
        return res.status(400).json({
          success: false,
          error: "Please provide property text to parse.",
        });
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
3. If area is given in "Gaj" or "Sq Yards" (e.g. "138 Gaj"), calculate squareFeet = 138 * 9 = 1242, and set areaText to "138 Gaj (1,242 Sq. Ft.)". If in Sq Ft, use directly.
4. "3 BHK" -> bedrooms: 3. If bathrooms are not explicitly mentioned, estimate or set bathrooms to null and add "bathrooms" to missingFields.
5. Create a clear, specific Title (e.g., "3 BHK Independent Floor in Gated Society").
6. Create an informative Tagline (e.g., "Modern Construction Near Chandigarh Kharar Highway").
7. Extract all amenities (e.g., ["Gated Society", "45ft RCC Roads", "5 Years Wooden Work Warranty", "1 Year After Sales Service"]).
8. Extract key highlights (3-6 bullet points highlighting standout features).
9. Write a polished 2-paragraph narrative story description highlighting quality, location, warranty, and layout in natural human tone without cliché AI hype (avoid "unparalleled luxury", "world-class", "curated for discerning buyers", etc.).
10. Extract any phone/WhatsApp numbers (e.g. "7973318763").
11. Generate an SEO Title and Meta Description.
12. List all missing or low-confidence fields in missingFields array (e.g., "price", "bathrooms", "city").
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
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
              price: { type: Type.NUMBER, nullable: true },
              priceFormatted: { type: Type.STRING },
              currency: { type: Type.STRING },
              bedrooms: { type: Type.NUMBER, nullable: true },
              bathrooms: { type: Type.NUMBER, nullable: true },
              squareFeet: { type: Type.NUMBER, nullable: true },
              areaText: { type: Type.STRING },
              address: { type: Type.STRING },
              city: { type: Type.STRING },
              neighborhood: { type: Type.STRING },
              description: { type: Type.STRING },
              highlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              amenities: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              seoTitle: { type: Type.STRING },
              metaDescription: { type: Type.STRING },
              contactPhone: { type: Type.STRING },
              missingFields: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              "title",
              "tagline",
              "propertyType",
              "currency",
              "description",
              "highlights",
              "amenities",
              "seoTitle",
              "metaDescription",
              "missingFields",
            ],
          },
        },
      });

      const rawJson = response.text || "{}";
      const parsedData = JSON.parse(rawJson);

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error("Error in /api/parse-whatsapp-listing:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to parse property text using AI.",
      });
    }
  });

  // Image Upload API Route
  app.post("/api/upload-image", async (req, res) => {
    try {
      const { image } = req.body;
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

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      // Upload to Supabase Storage
      const supabaseUrl = await uploadBufferToSupabase(buffer, fileName, mimeType);
      if (supabaseUrl) {
        return res.json({ success: true, url: supabaseUrl });
      }

      // Permanent storage requirement: Do NOT fall back to local /uploads/ directory.
      return res.status(500).json({
        success: false,
        error: "Supabase Storage upload failed or is not configured. Images must be stored in permanent cloud storage.",
      });
    } catch (err: any) {
      console.error("Error in /api/upload-image:", err);
      return res.status(500).json({ success: false, error: "Failed to upload image" });
    }
  });

  // Walkthrough Video Upload API Route
  app.post("/api/upload-video", async (req, res) => {
    try {
      const { video, name, mimeType = "video/mp4", listingId } = req.body;
      if (!video) {
        return res.status(400).json({ success: false, error: "No video data provided" });
      }

      let buffer: Buffer;
      let resolvedMime = mimeType;
      let ext = "mp4";

      if (video.startsWith("data:")) {
        const matches = video.match(/^data:(video\/[a-zA-Z0-9.\-_+]+);base64,(.+)$/);
        if (matches) {
          resolvedMime = matches[1];
          const subType = resolvedMime.split("/")[1] || "mp4";
          ext = subType === "quicktime" ? "mov" : subType;
          buffer = Buffer.from(matches[2], "base64");
        } else {
          const parts = video.split(",");
          buffer = Buffer.from(parts[1] || parts[0], "base64");
        }
      } else {
        buffer = Buffer.from(video, "base64");
      }

      // Size limit verification: 100 MB max
      const MAX_SIZE_BYTES = 100 * 1024 * 1024;
      if (buffer.length > MAX_SIZE_BYTES) {
        return res.status(400).json({
          success: false,
          error: "Video file size exceeds maximum limit of 100MB.",
        });
      }

      if (name && name.includes(".")) {
        const parsedExt = name.split(".").pop()?.toLowerCase();
        if (parsedExt) ext = parsedExt;
      }

      const fileName = `walkthrough-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      // Upload to Supabase Storage property-walkthroughs bucket
      const supabaseUrl = await uploadVideoBufferToSupabase(buffer, fileName, resolvedMime, listingId);
      if (supabaseUrl) {
        return res.json({
          success: true,
          url: supabaseUrl,
          type: resolvedMime,
          fileName,
        });
      }

      return res.status(500).json({
        success: false,
        error: "Supabase Storage upload failed for walkthrough video. Please ensure Supabase credentials and property-walkthroughs bucket are configured.",
      });
    } catch (err: any) {
      console.error("Error in /api/upload-video:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to upload video" });
    }
  });

  // Walkthrough Video Delete API Route
  app.post("/api/delete-video", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || !supabaseServer) {
        return res.json({ success: true, message: "No action required" });
      }

      // Extract file path from Supabase public URL
      const bucketIdentifier = "/property-walkthroughs/";
      if (url.includes(bucketIdentifier)) {
        const filePath = url.split(bucketIdentifier)[1];
        if (filePath) {
          await supabaseServer.storage.from("property-walkthroughs").remove([filePath]);
        }
      }
      return res.json({ success: true });
    } catch (err: any) {
      console.warn("Warning deleting video from Supabase:", err);
      return res.json({ success: false, error: err?.message });
    }
  });

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

const FALLBACK_SAMPLE_LISTING = {
  id: 'sample-luxury-listing-1',
  slug: 'the-grand-luminary-villa',
  title: 'The Grand Luminary Villa',
  tagline: 'Modern Architectural Masterpiece with Private Infinity Pool & Panoramic Coastal Views',
  price: 4850000,
  currency: '$',
  specs: {
    bedrooms: 5,
    bathrooms: 6,
    squareFeet: 6400,
    lotSize: '0.75 Acres',
    yearBuilt: 2025,
    propertyType: 'Villa',
    parkingSpaces: 3,
  },
  location: {
    address: '428 Ocean Drive, Star Island',
    neighborhood: 'Star Island',
    city: 'Miami Beach',
    state: 'FL',
    zipCode: '33139',
    country: 'United States',
    coordinates: {
      lat: 25.7781,
      lng: -80.1506,
    },
    nearbyHighlights: [
      'Private Marina & Yacht Club (3 mins)',
      'South Beach Oceanfront Promenade (5 mins)',
      'Lincoln Road Cultural Arts District (8 mins)',
      'Miami International Airport (15 mins)',
    ],
  },
  description: `Rising above the sparkling shoreline of Star Island, The Grand Luminary Villa stands as a beacon of modern architectural refinement and bespoke luxury. Conceived by award-winning architectural visionaries, the estate seamlessly dissolves the barrier between indoor tranquility and outdoor serenity through soaring 14-foot floor-to-ceiling glass apertures, museum-grade concrete finishes, and warm natural walnut accents.\n\nEvery facet of the residence is curated for effortless entertaining and private sanctuary. The expansive open-concept great room flows directly onto a travertine-clad terrace featuring a 60-foot heated infinity pool, private wellness cabana, and outdoor summer kitchen. Upstairs, the primary penthouse wing commands sweeping 270-degree sunset ocean panoramas with a private spa bath, custom Poliform dressing rooms, and secluded sun decks.`,
  highlights: [
    '60-Foot Heated Saltwater Infinity Pool & Private Sun Deck',
    'Custom Poliform Kitchen with Sub-Zero & Wolf Commercial Suite',
    'Floor-to-Ceiling 14ft Acoustic Low-E Impact Glass Walls',
    'Private Primary Wing with Oceanfront Balcony & Marble Spa',
    'Smart Home Crestron Automation, Climate & Security Control',
    '3-Car Temperature-Controlled Showroom Garage',
  ],
  amenities: [
    'Private Infinity Pool',
    'Ocean View',
    'Gated Society',
    'Smart Home Automation',
    'Spa & Sauna',
    'Covered Parking',
    'Chef\'s Kitchen',
    'Private Elevator',
    'Wine Cellar',
    '24/7 Concierge & Security',
  ],
  images: [
    {
      id: 'sample-img-1',
      url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1600&q=80',
      caption: 'Main Architectural Elevation & Infinity Pool',
      category: 'Exterior',
      isCover: true,
      order: 1,
    },
    {
      id: 'sample-img-2',
      url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80',
      caption: 'Grand Open-Concept Living Salon with 14ft Ceilings',
      category: 'Living Room',
      isCover: false,
      order: 2,
    },
    {
      id: 'sample-img-3',
      url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80',
      caption: 'Custom Chef\'s Kitchen with Calacatta Gold Marble Island',
      category: 'Kitchen',
      isCover: false,
      order: 3,
    },
    {
      id: 'sample-img-4',
      url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=80',
      caption: 'Primary Penthouse Suite with Ocean View Terrace',
      category: 'Bedroom',
      isCover: false,
      order: 4,
    },
    {
      id: 'sample-img-5',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
      caption: 'Sunset Outdoor Lounge & Firepit Patio',
      category: 'Exterior',
      isCover: false,
      order: 5,
    },
    {
      id: 'sample-img-6',
      url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1600&q=80',
      caption: 'Spa-Inspired Primary Bathroom with Freestanding Soaking Tub',
      category: 'Bathroom',
      isCover: false,
      order: 6,
    },
  ],
  contact: {
    agentName: 'Alexander Vance',
    agentRole: 'Principal Director',
    phone: '+1 (305) 890-4421',
    whatsappNumber: '13058904421',
    email: 'alexander@listingos.internal',
    agencyName: 'Listing OS Estates',
  },
  status: 'published',
  seoTitle: 'The Grand Luminary Villa | Luxury Real Estate Showcase',
  metaDescription: 'Experience The Grand Luminary Villa, a 6,400 sq ft modern architectural estate on Star Island with infinity pool and panoramic ocean vistas.',
  createdAt: '2026-08-01T12:00:00.000Z',
  updatedAt: '2026-08-01T12:00:00.000Z',
};

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

  // 4. Sample listing fallback
  if (
    normalized === 'the-grand-luminary-villa' ||
    normalized === 'sample' ||
    normalized === 'sample-preview' ||
    normalized === 'sample-listing' ||
    normalized === 'sample-property'
  ) {
    return FALLBACK_SAMPLE_LISTING;
  }

  return null;
}

  // Get all listings
  app.get("/api/listings", async (req, res) => {
    try {
      if (!supabaseServer) {
        return res.status(500).json({
          success: false,
          error: "Supabase database client is not configured on the server.",
        });
      }

      const { data, error } = await supabaseServer
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error in GET /api/listings:", error);
        return res.status(500).json({
          success: false,
          error: `Database error: ${error.message} (Code: ${error.code})`,
        });
      }

      const listings = (data || []).map(fromDbRow);
      return res.json({ success: true, data: listings });
    } catch (err: any) {
      console.error("Error in GET /api/listings:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to fetch listings" });
    }
  });

  // Get listing by slug
  app.get("/api/listings/slug/:slug", async (req, res) => {
    try {
      if (!supabaseServer) {
        return res.status(500).json({
          success: false,
          error: "Supabase database client is not configured on the server.",
        });
      }

      const slugParam = req.params.slug.toLowerCase().trim();
      const { data, error } = await supabaseServer
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error in GET /api/listings/slug:", error);
        return res.status(500).json({
          success: false,
          error: `Database error: ${error.message} (Code: ${error.code})`,
        });
      }

      const listings = (data || []).map(fromDbRow);
      const match = findMatchingListing(listings, slugParam);
      if (!match) {
        return res.status(404).json({ success: false, error: "Listing not found" });
      }
      return res.json({ success: true, data: match });
    } catch (err: any) {
      console.error("Error in GET /api/listings/slug/:slug:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to fetch listing by slug" });
    }
  });

  // Get listing by ID
  app.get("/api/listings/:id", async (req, res) => {
    try {
      if (!supabaseServer) {
        return res.status(500).json({
          success: false,
          error: "Supabase database client is not configured on the server.",
        });
      }

      const id = req.params.id;
      const { data, error } = await supabaseServer
        .from("listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Supabase error in GET /api/listings/:id:", error);
        return res.status(500).json({
          success: false,
          error: `Database error: ${error.message} (Code: ${error.code})`,
        });
      }

      if (!data) {
        if (id === 'sample-luxury-listing-1') {
          return res.json({ success: true, data: FALLBACK_SAMPLE_LISTING });
        }
        return res.status(404).json({ success: false, error: "Listing not found" });
      }
      return res.json({ success: true, data: fromDbRow(data) });
    } catch (err: any) {
      console.error("Error in GET /api/listings/:id:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to fetch listing by ID" });
    }
  });

  // Save or update listing
  app.post("/api/listings", async (req, res) => {
    try {
      if (!supabaseServer) {
        return res.status(500).json({
          success: false,
          error: "Supabase database client is not configured on the server.",
        });
      }

      const listing = req.body;
      if (!listing || !listing.id || !listing.slug) {
        return res.status(400).json({ success: false, error: "Invalid listing object. Required: id, slug" });
      }

      // Process any inline base64 images
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
              console.error("Failed to convert inline base64 image:", e);
            }
          }
        }
      }

      let dbRow = toDbRow(listing);
      let { data, error } = await supabaseServer
        .from("listings")
        .upsert([dbRow])
        .select();

      if (error && error.message && (error.message.includes("walkthrough_video") || error.code === "PGRST204")) {
        console.warn("Supabase schema cache missing video columns, retrying with core fields:", error.message);
        const safeDbRow = { ...dbRow };
        delete (safeDbRow as any).walkthrough_video_url;
        delete (safeDbRow as any).walkthrough_video_type;
        delete (safeDbRow as any).walkthrough_video_thumbnail;
        const retryResult = await supabaseServer
          .from("listings")
          .upsert([safeDbRow])
          .select();
        data = retryResult.data;
        error = retryResult.error;
      }

      if (error) {
        console.error("Supabase upsert error in POST /api/listings:", error);
        return res.status(500).json({
          success: false,
          error: `Failed to save listing to Supabase: ${error.message} (Code: ${error.code})`,
        });
      }

      const savedListing = data && data.length > 0 ? fromDbRow(data[0]) : listing;
      return res.json({ success: true, data: savedListing });
    } catch (err: any) {
      console.error("Error in POST /api/listings:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to save listing" });
    }
  });

  // Delete listing
  app.delete("/api/listings/:id", async (req, res) => {
    try {
      if (!supabaseServer) {
        return res.status(500).json({
          success: false,
          error: "Supabase database client is not configured on the server.",
        });
      }

      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ success: false, error: "Missing listing ID" });
      }

      // 1. Delete record from Supabase
      const { error: delError } = await supabaseServer
        .from("listings")
        .delete()
        .eq("id", id);

      if (delError) {
        console.error("Supabase delete error in DELETE /api/listings/:id:", delError);
        return res.status(500).json({
          success: false,
          error: `Failed to delete record from Supabase: ${delError.message} (Code: ${delError.code})`,
        });
      }

      // 2. Perform POST-DELETE VERIFICATION: check that row no longer exists in Supabase
      const { data: checkData, error: checkError } = await supabaseServer
        .from("listings")
        .select("id")
        .eq("id", id);

      if (checkError) {
        console.error("Supabase post-delete check error:", checkError);
        return res.status(500).json({
          success: false,
          error: `Failed to verify deletion in Supabase: ${checkError.message}`,
        });
      }

      if (checkData && checkData.length > 0) {
        return res.status(500).json({
          success: false,
          error: "Deletion failed: record still exists in Supabase after DELETE operation.",
        });
      }

      return res.json({
        success: true,
        deletedId: id,
        message: "Record confirmed deleted from Supabase",
      });
    } catch (err: any) {
      console.error("Error in DELETE /api/listings/:id:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to delete listing" });
    }
  });

  // Safe helper to load default fallback listings
  let defaultListings: any[] = [];
  try {
    const listingsJsonPath = path.join(process.cwd(), "data", "listings.json");
    if (fs.existsSync(listingsJsonPath)) {
      const raw = fs.readFileSync(listingsJsonPath, "utf-8");
      defaultListings = JSON.parse(raw);
    }
  } catch (e) {
    defaultListings = [FALLBACK_SAMPLE_LISTING];
  }

  // Helper to determine accurate public base URL
  function getRequestBaseUrl(req: express.Request): string {
    if (process.env.APP_URL && process.env.APP_URL.startsWith('http')) {
      return process.env.APP_URL.replace(/\/$/, '');
    }
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:3000';
    return `${proto}://${host}`.replace(/\/$/, '');
  }

  // Server-side helper to find listing by slug/ID from Supabase, JSON, or sample
  async function getListingForRoute(slugOrId: string): Promise<any | null> {
    if (!slugOrId) return null;
    const normalized = slugOrId.toLowerCase().trim();

    if (
      normalized === 'sample' ||
      normalized === 'sample-preview' ||
      normalized === 'sample-listing' ||
      normalized === 'sample-property'
    ) {
      return FALLBACK_SAMPLE_LISTING;
    }

    if (supabaseServer) {
      try {
        const { data, error } = await supabaseServer
          .from("listings")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const listings = data.map(fromDbRow);
          const match = findMatchingListing(listings, normalized);
          if (match) return match;
        }
      } catch (err) {
        console.warn("Supabase lookup warning during OpenGraph metadata generation:", err);
      }
    }

    const fallbackMatch = findMatchingListing(defaultListings, normalized);
    if (fallbackMatch) return fallbackMatch;

    if (
      normalized === 'the-glasshouse-sanctuary-luxury-villa' ||
      normalized === 'listing-glasshouse-sanctuary-alibaug' ||
      normalized === 'glasshouse'
    ) {
      return defaultListings.find((l: any) => l.slug === 'the-glasshouse-sanctuary-luxury-villa') || FALLBACK_SAMPLE_LISTING;
    }

    if (normalized === 'the-grand-luminary-villa' || normalized === 'sample-luxury-listing-1') {
      return FALLBACK_SAMPLE_LISTING;
    }

    return null;
  }

  // Inspection / Debugging API endpoint for Open Graph metadata
  app.get("/api/og-metadata", async (req, res) => {
    try {
      const slug = (req.query.slug as string) || (req.query.id as string) || '';
      const listing = slug ? await getListingForRoute(slug) : null;
      const baseUrl = getRequestBaseUrl(req);
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

  // Global Error Handler Middleware for API routes (Sanitizes unhandled internal exceptions)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith("/api/")) {
      console.error("Unhandled Global Server Error:", err);
      return res.status(500).json({
        success: false,
        error: "Internal Server Error. Request could not be processed.",
      });
    }
    next(err);
  });

  // Setup Vite in development mode
  let vite: any = null;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
  }

  // Dynamic Open Graph HTML Handler for Public Listing Pages
  const publicListingRoutes = [
    "/p/:slug",
    "/property/:slug",
    "/listing/:slug",
    "/sample",
    "/preview",
  ];

  app.get(publicListingRoutes, async (req, res, next) => {
    try {
      const slug = req.params.slug || (req.path.includes('sample') ? 'sample' : 'the-grand-luminary-villa');
      const listing = await getListingForRoute(slug);
      const baseUrl = getRequestBaseUrl(req);
      const metadata = generateListingOpenGraphMetadata(listing, baseUrl, slug);

      let template: string;
      if (process.env.NODE_ENV !== "production" && vite) {
        const rawTemplate = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
      } else {
        const distIndex = path.join(process.cwd(), "dist", "index.html");
        template = fs.readFileSync(distIndex, "utf-8");
      }

      const injectedHtml = injectMetadataIntoHtml(template, metadata);
      return res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).send(injectedHtml);
    } catch (err) {
      console.error("Error generating listing OpenGraph HTML:", err);
      next(err);
    }
  });

  // Vite middleware for dev or static server for production assets
  if (process.env.NODE_ENV !== "production" && vite) {
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
  }

  // Catch-all HTML Handler for all other routes (Home, Access, Dashboard, Admin, etc.)
  app.get("*", async (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.includes(".")) {
      return next();
    }

    try {
      const baseUrl = getRequestBaseUrl(req);
      const metadata = {
        ...DEFAULT_PLATFORM_META,
        url: `${baseUrl}${req.path}`,
      };

      let template: string;
      if (process.env.NODE_ENV !== "production" && vite) {
        const rawTemplate = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
      } else {
        const distIndex = path.join(process.cwd(), "dist", "index.html");
        template = fs.readFileSync(distIndex, "utf-8");
      }

      const injectedHtml = injectMetadataIntoHtml(template, metadata);
      return res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).send(injectedHtml);
    } catch (err) {
      console.error("Error serving fallback HTML:", err);
      if (process.env.NODE_ENV !== "production") {
        return res.sendFile(path.join(process.cwd(), "index.html"));
      } else {
        return res.sendFile(path.join(process.cwd(), "dist", "index.html"));
      }
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
