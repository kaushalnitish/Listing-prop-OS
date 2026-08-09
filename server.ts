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

      // Try uploading to Supabase Storage first
      const supabaseUrl = await uploadBufferToSupabase(buffer, fileName, mimeType);
      if (supabaseUrl) {
        return res.json({ success: true, url: supabaseUrl });
      }

      // Fallback to local server uploads directory if Supabase is unconfigured
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${fileName}`;
      return res.json({ success: true, url: publicUrl });
    } catch (err: any) {
      console.error("Error in /api/upload-image:", err);
      return res.status(500).json({ success: false, error: "Failed to upload image" });
    }
  });

  // Get all listings
  app.get("/api/listings", (req, res) => {
    try {
      const listings = getStoredListings();
      return res.json({ success: true, data: listings });
    } catch (err: any) {
      console.error("Error in GET /api/listings:", err);
      return res.status(500).json({ success: false, error: "Failed to fetch listings" });
    }
  });

  // Get listing by slug
  app.get("/api/listings/slug/:slug", (req, res) => {
    try {
      const slug = req.params.slug.toLowerCase().trim();
      const listings = getStoredListings();

      // 1. Exact match on slug, ID, or previousSlugs aliases
      let match = listings.find(
        (l: any) =>
          (l.slug && l.slug.toLowerCase() === slug) ||
          l.id === slug ||
          (Array.isArray(l.previousSlugs) && l.previousSlugs.some((ps: string) => ps.toLowerCase() === slug))
      );

      // 2. Normalized comparison stripping optional noise words (e.g. "luxury", "premium")
      if (!match) {
        const stripNoise = (s: string) =>
          s
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-(luxury|premium|featured|exclusive|prime|sale|for)-/g, '-')
            .replace(/(^-|-$)+/g, '');

        const strippedTarget = stripNoise(slug);
        match = listings.find(
          (l: any) =>
            (l.slug && stripNoise(l.slug) === strippedTarget) ||
            (Array.isArray(l.previousSlugs) && l.previousSlugs.some((ps: string) => stripNoise(ps) === strippedTarget))
        );
      }

      // 3. Keyword subset matching (if requested slug keywords are all contained in stored slug/title)
      if (!match) {
        const keywords = slug.split(/[^a-z0-9]+/).filter((k) => k.length > 0);
        if (keywords.length >= 2) {
          match = listings.find((l: any) => {
            const itemSlug = (l.slug || '').toLowerCase();
            const itemTitle = (l.title || '').toLowerCase();
            const itemLocation = JSON.stringify(l.location || {}).toLowerCase();
            return keywords.every(
              (kw) => itemSlug.includes(kw) || itemTitle.includes(kw) || itemLocation.includes(kw)
            );
          });
        }
      }

      // 4. Fallback: Single published listing match if requested keywords overlap significantly
      if (!match) {
        const published = listings.filter((l: any) => l.status === 'published');
        if (published.length === 1) {
          const keywords = slug.split(/[^a-z0-9]+/).filter((k) => k.length > 1);
          const itemText = (published[0].slug + ' ' + published[0].title).toLowerCase();
          const matchesCount = keywords.filter((kw) => itemText.includes(kw)).length;
          if (matchesCount >= 2 || (keywords.length === 1 && matchesCount === 1)) {
            match = published[0];
          }
        }
      }

      if (!match) {
        return res.status(404).json({ success: false, error: "Listing not found" });
      }
      return res.json({ success: true, data: match });
    } catch (err: any) {
      console.error("Error in GET /api/listings/slug/:slug:", err);
      return res.status(500).json({ success: false, error: "Failed to fetch listing by slug" });
    }
  });

  // Get listing by ID
  app.get("/api/listings/:id", (req, res) => {
    try {
      const id = req.params.id;
      const listings = getStoredListings();
      const match = listings.find((l: any) => l.id === id);
      if (!match) {
        return res.status(404).json({ success: false, error: "Listing not found" });
      }
      return res.json({ success: true, data: match });
    } catch (err: any) {
      console.error("Error in GET /api/listings/:id:", err);
      return res.status(500).json({ success: false, error: "Failed to fetch listing by ID" });
    }
  });

  // Save or update listing
  app.post("/api/listings", async (req, res) => {
    try {
      const listing = req.body;
      if (!listing || !listing.id || !listing.slug) {
        return res.status(400).json({ success: false, error: "Invalid listing object" });
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
                } else {
                  const filePath = path.join(uploadsDir, fileName);
                  fs.writeFileSync(filePath, buffer);
                  listing.images[i] = { ...img, url: `/uploads/${fileName}` };
                }
              }
            } catch (e) {
              console.error("Failed to convert inline base64 image:", e);
            }
          }
        }
      }

      const listings = getStoredListings();
      // Match existing listing strictly by ID
      const existingIdx = listings.findIndex((l: any) => l.id === listing.id);
      if (existingIdx >= 0) {
        const oldListing = listings[existingIdx];
        const previousSlugs: string[] = Array.isArray(oldListing.previousSlugs)
          ? [...oldListing.previousSlugs]
          : [];
        if (oldListing.slug && oldListing.slug !== listing.slug && !previousSlugs.includes(oldListing.slug)) {
          previousSlugs.push(oldListing.slug);
        }
        const merged = {
          ...oldListing,
          ...listing,
          previousSlugs,
          updatedAt: new Date().toISOString(),
        };
        listings[existingIdx] = merged;
        saveStoredListings(listings);
        return res.json({ success: true, data: merged });
      } else {
        // Resolve slug collision if another listing shares the same slug
        let targetSlug = listing.slug;
        let counter = 1;
        while (listings.some((l: any) => l.slug === targetSlug && l.id !== listing.id)) {
          targetSlug = `${listing.slug}-${counter}`;
          counter++;
        }
        listing.slug = targetSlug;
        if (!listing.createdAt) listing.createdAt = new Date().toISOString();
        listing.updatedAt = new Date().toISOString();

        listings.unshift(listing);
        saveStoredListings(listings);
        return res.json({ success: true, data: listing });
      }
    } catch (err: any) {
      console.error("Error in POST /api/listings:", err);
      return res.status(500).json({ success: false, error: "Failed to save listing" });
    }
  });

  // Delete listing
  app.delete("/api/listings/:id", (req, res) => {
    try {
      const id = req.params.id;
      let listings = getStoredListings();

      const targets = listings.filter((l: any) => l.id === id || l.slug === id);
      for (const target of targets) {
        if (target && Array.isArray(target.images)) {
          for (const img of target.images) {
            if (img && typeof img.url === "string" && img.url.startsWith("/uploads/")) {
              try {
                const fileName = path.basename(img.url);
                const filePath = path.join(uploadsDir, fileName);
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                }
              } catch (e) {
                console.warn("Could not delete image file during listing cleanup:", e);
              }
            }
          }
        }
      }

      listings = listings.filter((l: any) => l.id !== id && l.slug !== id);
      saveStoredListings(listings);
      return res.json({ success: true });
    } catch (err: any) {
      console.error("Error in DELETE /api/listings/:id:", err);
      return res.status(500).json({ success: false, error: "Failed to delete listing" });
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
