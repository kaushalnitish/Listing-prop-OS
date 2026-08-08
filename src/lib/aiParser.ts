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
): Promise<{ success: boolean; data?: ExtractedListingData; error?: string }> {
  try {
    const res = await fetch('/api/parse-whatsapp-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      if (json.success && json.data) {
        return { success: true, data: json.data };
      }
      if (json.error) {
        return { success: false, error: json.error };
      }
    }

    if (!res.ok) {
      try {
        const errorJson = await res.json();
        if (errorJson.error) {
          return { success: false, error: errorJson.error };
        }
      } catch {
        // Fallthrough if not valid json error
      }
      return {
        success: false,
        error: `Server responded with status ${res.status}. Please ensure the server / Netlify function is properly deployed with GEMINI_API_KEY.`,
      };
    }

    return {
      success: false,
      error: 'Received unexpected response format from server.',
    };
  } catch (err: any) {
    console.error('Error fetching /api/parse-whatsapp-listing:', err);
    return {
      success: false,
      error: err?.message || 'Failed to process property details. Please check connection.',
    };
  }
}
