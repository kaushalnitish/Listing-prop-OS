import { GoogleGenAI, Type } from "@google/genai";

export const handler = async (event: any) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: "Method Not Allowed" }),
    };
  }

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
    } = JSON.parse(event.body || "{}");

    const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim().replace(/^["']|["']$/g, "");
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: "GEMINI_API_KEY environment variable is missing on Netlify.",
        }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });

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
      model: "gemini-2.5-flash",
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: parsedData,
      }),
    };
  } catch (err: any) {
    console.error("Error in Netlify generate-listing-content function:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: err?.message || "Failed to generate listing content.",
      }),
    };
  }
};
