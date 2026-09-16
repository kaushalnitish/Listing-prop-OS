import { CreatorProfile } from '../types';

export interface CreatorExtractionResult {
  success: boolean;
  data?: Partial<CreatorProfile>;
  error?: string;
}

export async function parseCreatorInfoWithAi(
  rawText: string,
  images?: string[]
): Promise<CreatorExtractionResult> {
  try {
    const res = await fetch('/api/parse-creator-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText, images }),
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
        const errJson = await res.json();
        if (errJson.error) {
          return { success: false, error: errJson.error };
        }
      } catch {}
      return {
        success: false,
        error: `Server responded with status ${res.status}.`,
      };
    }

    return {
      success: false,
      error: 'Unexpected server response format.',
    };
  } catch (err: any) {
    console.error('Error in parseCreatorInfoWithAi:', err);
    return {
      success: false,
      error: err?.message || 'Failed to extract creator information via AI.',
    };
  }
}

export const extractCreatorProfileWithAi = parseCreatorInfoWithAi;

