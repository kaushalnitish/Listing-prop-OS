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
    const { listing } = JSON.parse(event.body || "{}");
    if (!listing) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: "Listing data is required for research" }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: "GEMINI_API_KEY is not configured in Netlify environment variables.",
        }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    const address = listing.location?.address || "";
    const neighborhood = listing.location?.neighborhood || "";
    const city = listing.location?.city || "";
    const country = listing.location?.country || "India";
    const title = listing.title || "Property";
    const propertyType = listing.specs?.propertyType || "Residential";
    const bedrooms = listing.specs?.bedrooms || 3;
    const bathrooms = listing.specs?.bathrooms || 3;
    const squareFeet = listing.specs?.squareFeet || 1200;
    const price = listing.price || 0;
    const currency = listing.currency || "₹";
    const pricePerSqFt = squareFeet > 0 ? Math.round(price / squareFeet) : 0;
    const highlights = Array.isArray(listing.highlights) ? listing.highlights.join(", ") : "";

    const researchPrompt = `You are a Principal Real Estate Market Intelligence Analyst.
Conduct real, grounded market research for this property:

PROPERTY UNDER ANALYSIS:
- Title: ${title}
- Property Type: ${propertyType}
- Specific Location: ${address}, ${neighborhood}, ${city}, ${country}
- Configuration: ${bedrooms} BHK, ${bathrooms} Baths, ${squareFeet} Sq. Ft.
- Listed Price: ${currency} ${price.toLocaleString()} (${currency} ${pricePerSqFt.toLocaleString()}/sq.ft)
- Key Features: ${highlights}

SEARCH DIRECTIVES:
1. Search current active micro-market real estate listings, circle rates, and price per sq.ft. for ${propertyType} in ${neighborhood}, ${city}.
2. Search real comparable residential projects, societies, or builder floors within 1-3 km of ${neighborhood}, ${city}.
3. Search real rental yield benchmarks and typical monthly rent for ${bedrooms} BHK in ${neighborhood}, ${city}.
4. Search population profile, employment hubs, IT parks, and demographic drivers near ${neighborhood}, ${city}.
5. Search ongoing infrastructure, highway expansions, metro projects, or commercial hubs impacting ${neighborhood}, ${city}.`;

    let responseText = "";
    let webSearchQueries: string[] = [];
    let sources: Array<{ title: string; uri: string }> = [];

    try {
      // Phase 1: Attempt Gemini with Google Search Grounding
      const researchResponse = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: researchPrompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: "You are a professional real estate research intelligence engine. Research real web data using Google Search and provide accurate, grounded market insights.",
        },
      });

      responseText = researchResponse.text || "";
      const searchChunks = (researchResponse.candidates?.[0]?.groundingMetadata as any)?.groundingChunks || [];
      const queries = (researchResponse.candidates?.[0]?.groundingMetadata as any)?.webSearchQueries || [];

      webSearchQueries = Array.isArray(queries) ? queries : [];
      sources = searchChunks
        .filter((c: any) => c.web?.uri)
        .map((c: any) => ({
          title: c.web.title || c.web.uri,
          uri: c.web.uri,
        }));
    } catch (groundingError: any) {
      console.warn("Search Grounding attempt failed, falling back to direct analysis:", groundingError?.message);
      // Resilient fallback without tools if grounding fails or service unavailable
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: researchPrompt,
        config: {
          systemInstruction: "You are a professional real estate research intelligence engine. Provide deep, accurate market insights and estimations for the property micro-market.",
        },
      });
      responseText = fallbackResponse.text || "";
    }

    // Phase 2: Synthesize structured JSON intelligence
    const structuringPrompt = `
Transform the following real estate market research findings into a complete, high-fidelity JSON object adhering strictly to the schema.

RESEARCH TEXT FINDINGS:
${responseText}

PROPERTY SUMMARY:
- Title: ${title}
- Price: ${price} ${currency}
- Area: ${squareFeet} sq ft (${pricePerSqFt} / sq ft)
- Specs: ${bedrooms} bed, ${bathrooms} bath
- Location: ${neighborhood}, ${city}, ${country}

Ensure all metrics are realistic, localized, and mathematically consistent.
`;

    const structuredResult = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: structuringPrompt,
      config: {
        systemInstruction: "You are an analytical real estate intelligence engine. Convert research into strict, validated JSON matching the requested structure.",
        responseMimeType: "application/json",
      },
    });

    const parsedJson = JSON.parse(structuredResult.text || "{}");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: parsedJson,
        metadata: {
          queries: webSearchQueries,
          sources: sources.slice(0, 8),
          lastResearched: new Date().toISOString(),
        },
      }),
    };
  } catch (err: any) {
    console.error("Error in Netlify research-property-intelligence function:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: err?.message || "Failed to perform market intelligence research.",
      }),
    };
  }
};
