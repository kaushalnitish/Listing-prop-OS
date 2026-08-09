import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

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

      const dbRow = toDbRow(listing);
      const { data, error } = await supabaseServer
        .from("listings")
        .upsert([dbRow])
        .select();

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

  // Global Error Handler Middleware (Sanitizes unhandled internal exceptions)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Global Server Error:", err);
    res.status(500).json({
      success: false,
      error: "Internal Server Error. Request could not be processed.",
    });
  });

  // Vite middleware for dev or static server for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
