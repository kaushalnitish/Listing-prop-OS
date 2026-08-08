import { GoogleGenAI, Type } from "@google/genai";

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { rawText } = JSON.parse(event.body || "{}");
    if (!rawText || !rawText.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Please provide property text to parse." }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: "GEMINI_API_KEY is missing." }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });

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

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, data: parsedData }),
    };
  } catch (err: any) {
    console.error("Error in Netlify function:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: err.message || "Failed to parse property text using AI." }),
    };
  }
};
