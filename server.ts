import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

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
Please generate complete, high-converting luxury copy for a ${propertyType} listing.
- Location: ${location}
${price ? `- Price: $${price}` : ""}
${bedrooms ? `- Bedrooms: ${bedrooms}` : ""}
${bathrooms ? `- Bathrooms: ${bathrooms}` : ""}
${squareFeet ? `- Square Feet: ${squareFeet} sq ft` : ""}
${existingTitle ? `- Current Title Draft: "${existingTitle}"` : ""}
${prompt ? `- Specific Notes / Vision: ${prompt}` : ""}

Craft evocative, world-class real estate copy in the style of Architectural Digest and Sotheby's International Realty.
Include:
1. Title: Bold, iconic name for the estate.
2. Subtitle / Tagline: Poetic, evocative headline.
3. Description: 2-3 immersive paragraphs highlighting natural light, master craftsmanship, finishes, indoor-outdoor flow, and private sanctuary lifestyle.
4. Highlights: 4-6 bullet points of top standout architectural / vista features.
5. Amenities: 6-10 premium amenities (e.g., Infinity Pool, Wine Cellar, Smart Home Automation, Spa & Sauna, Private Elevator).
6. SEO Title: High-intent search title under 60 chars.
7. Meta Description: High-converting search summary under 155 chars.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: userInstructions,
        config: {
          systemInstruction:
            "You are an elite luxury real estate copywriter for global UHNW properties. Return structured JSON with high-converting, refined prose.",
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
5. Create a catchy, high-end Title (e.g., "Luxury 3 BHK Independent Floor in Gated Society").
6. Create an evocative Tagline (e.g., "Modern Architecture Near Chandigarh Kharar Highway").
7. Extract all amenities (e.g., ["Gated Society", "45ft RCC Roads", "5 Years Wooden Work Warranty", "1 Year After Sales Service"]).
8. Extract key highlights (3-6 bullet points highlighting standout features).
9. Write a polished 2-paragraph narrative story description highlighting quality, location, warranty, and layout.
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
  app.post("/api/upload-image", (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, error: "No image data provided" });
      }

      let buffer: Buffer;
      let ext = "jpg";

      if (image.startsWith("data:")) {
        const matches = image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          ext = matches[1];
          buffer = Buffer.from(matches[2], "base64");
        } else {
          const parts = image.split(",");
          buffer = Buffer.from(parts[1] || parts[0], "base64");
        }
      } else {
        buffer = Buffer.from(image, "base64");
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
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
      const match = listings.find((l: any) => l.slug.toLowerCase() === slug);
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
  app.post("/api/listings", (req, res) => {
    try {
      const listing = req.body;
      if (!listing || !listing.id || !listing.slug) {
        return res.status(400).json({ success: false, error: "Invalid listing object" });
      }

      // Process any inline base64 images
      if (Array.isArray(listing.images)) {
        listing.images = listing.images.map((img: any) => {
          if (img.url && img.url.startsWith("data:image/")) {
            try {
              const matches = img.url.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
              if (matches) {
                const ext = matches[1];
                const buffer = Buffer.from(matches[2], "base64");
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
                const filePath = path.join(uploadsDir, fileName);
                fs.writeFileSync(filePath, buffer);
                return { ...img, url: `/uploads/${fileName}` };
              }
            } catch (e) {
              console.error("Failed to convert inline base64 image:", e);
            }
          }
          return img;
        });
      }

      const listings = getStoredListings();
      const existingIdx = listings.findIndex((l: any) => l.id === listing.id || l.slug === listing.slug);
      if (existingIdx >= 0) {
        listings[existingIdx] = { ...listings[existingIdx], ...listing, updatedAt: new Date().toISOString() };
      } else {
        listings.unshift(listing);
      }

      saveStoredListings(listings);
      return res.json({ success: true, data: listing });
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
      listings = listings.filter((l: any) => l.id !== id);
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
