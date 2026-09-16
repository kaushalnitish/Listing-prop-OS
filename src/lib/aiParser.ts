import { parseWhatsappListingHeuristic } from './heuristicParser';

export interface ExtractedListingData {
  title?: string;
  tagline?: string;
  propertyType?: string;
  price?: number | null;
  priceFormatted?: string;
  currency?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFeet?: number | null;
  areaText?: string;
  address?: string;
  city?: string;
  neighborhood?: string;
  description?: string;
  highlights?: string[];
  amenities?: string[];
  seoTitle?: string;
  metaDescription?: string;
  contactPhone?: string;
  missingFields?: string[];
}

export async function parsePropertyDetailsWithAi(
  rawText: string
): Promise<{ success: boolean; data?: ExtractedListingData; error?: string; source?: string }> {
  // If no text provided, return immediately
  if (!rawText || !rawText.trim()) {
    return { success: false, error: 'Please provide property text to parse.' };
  }

  try {
    // Attempt Netlify or Express backend parse endpoint with an 8.5s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8500);

    const res = await fetch('/api/parse-whatsapp-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      if (json.success && json.data) {
        return { success: true, data: json.data, source: json.engine || 'gemini' };
      }
    }

    // If server returned non-200 (like 504 Gateway Timeout or 500), fall back gracefully to local heuristic parser
    console.warn(`[AI Parser] Server returned status ${res.status}. Falling back to instant offline parser.`);
    const fallbackData = parseWhatsappListingHeuristic(rawText);
    return { success: true, data: fallbackData, source: 'smart-parser' };
  } catch (err: any) {
    console.warn('[AI Parser] Network or timeout error during AI parsing. Using instant smart parser fallback:', err?.message || err);
    // Graceful fallback to client-side smart parser - NEVER block the user with an alert!
    const fallbackData = parseWhatsappListingHeuristic(rawText);
    return {
      success: true,
      data: fallbackData,
      source: 'smart-parser',
    };
  }
}

export async function researchPropertyIntelligenceWithAi(
  listing: any
): Promise<{ success: boolean; data?: any; error?: string; metadata?: any }> {
  try {
    const res = await fetch('/api/research-property-intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return { success: true, data: json.data, metadata: json.metadata };
      }
      return { success: false, error: json.error || 'Failed to research property intelligence' };
    }

    const errText = await res.text();
    return { success: false, error: `Research server error: ${res.status} ${errText}` };
  } catch (err: any) {
    console.error('Error fetching /api/research-property-intelligence:', err);
    return {
      success: false,
      error: err?.message || 'Failed to perform external market research.',
    };
  }
}
