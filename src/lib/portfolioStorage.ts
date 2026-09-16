import { CreatorProfile } from '../types';
import { SAMPLE_CREATOR_PORTFOLIO, SAMPLE_PORTFOLIOS } from '../data/samplePortfolio';

export { SAMPLE_CREATOR_PORTFOLIO, SAMPLE_PORTFOLIOS };

const LOCAL_STORAGE_PORTFOLIOS_KEY = 'listing_os_creator_portfolios_v1';

export async function ensureUniquePortfolioSlug(rawSlug: string, currentId?: string): Promise<string> {
  const portfolios = await getPortfolios();
  const baseSlug =
    rawSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `creator-${Date.now()}`;

  let uniqueSlug = baseSlug;
  let counter = 1;

  while (portfolios.some((item) => item.slug === uniqueSlug && item.id !== currentId)) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

export async function getPortfolios(): Promise<CreatorProfile[]> {
  // 1. Fetch from authoritative backend API
  try {
    const res = await fetch('/api/portfolios');
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data) && json.data.length > 0) {
        const serverPortfolios: CreatorProfile[] = json.data;

        // Sort by updatedAt descending
        serverPortfolios.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        // Sync to local storage
        try {
          localStorage.setItem(LOCAL_STORAGE_PORTFOLIOS_KEY, JSON.stringify(serverPortfolios));
        } catch {}

        return serverPortfolios;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch portfolios from backend API:', e);
  }

  // 2. LocalStorage cache fallback
  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_PORTFOLIOS_KEY);
    if (localData !== null) {
      const parsed = JSON.parse(localData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  // 3. Fallback sample data
  return SAMPLE_PORTFOLIOS;
}

export async function getPortfolioById(id: string): Promise<CreatorProfile | null> {
  if (!id) return null;

  try {
    const res = await fetch(`/api/portfolios/${encodeURIComponent(id)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch portfolio id ${id} from server:`, e);
  }

  // Local fallback
  const portfolios = await getPortfolios();
  return (
    portfolios.find((p) => p.id === id || p.slug === id) ||
    (id === 'rishika-kapoor' || id === 'sample' ? SAMPLE_CREATOR_PORTFOLIO : null)
  );
}

export async function getPortfolioBySlug(slug: string): Promise<CreatorProfile | null> {
  if (!slug) return null;
  const normalized = slug.toLowerCase().trim();

  if (normalized === 'rishika-kapoor' || normalized === 'sample' || normalized === 'sample-creator') {
    return SAMPLE_CREATOR_PORTFOLIO;
  }

  try {
    const res = await fetch(`/api/portfolios/slug/${encodeURIComponent(normalized)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch portfolio slug ${slug} from server:`, e);
  }

  const portfolios = await getPortfolios();
  return (
    portfolios.find((p) => p.slug.toLowerCase() === normalized || p.id === normalized) ||
    (normalized === 'rishika-kapoor' ? SAMPLE_CREATOR_PORTFOLIO : null)
  );
}

export async function savePortfolio(portfolio: CreatorProfile): Promise<CreatorProfile> {
  const cleanPortfolio: CreatorProfile = {
    ...portfolio,
    slug: portfolio.slug.toLowerCase().trim(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Save to authoritative API
  try {
    const res = await fetch('/api/portfolios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPortfolio),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const saved = json.data;
        updateLocalPortfolioCache(saved);
        return saved;
      }
    }
  } catch (e) {
    console.warn('Failed to save portfolio via backend API, falling back to local storage:', e);
  }

  // 2. Save locally if API unreachable
  updateLocalPortfolioCache(cleanPortfolio);
  return cleanPortfolio;
}

function updateLocalPortfolioCache(portfolio: CreatorProfile) {
  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_PORTFOLIOS_KEY);
    let items: CreatorProfile[] = localData ? JSON.parse(localData) : [...SAMPLE_PORTFOLIOS];
    const existingIndex = items.findIndex((i) => i.id === portfolio.id || i.slug === portfolio.slug);
    if (existingIndex >= 0) {
      items[existingIndex] = portfolio;
    } else {
      items.unshift(portfolio);
    }
    localStorage.setItem(LOCAL_STORAGE_PORTFOLIOS_KEY, JSON.stringify(items));
  } catch {}
}

export async function deletePortfolio(id: string): Promise<boolean> {
  // 1. Delete on server API
  try {
    const res = await fetch(`/api/portfolios/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        removeLocalPortfolio(id);
        return true;
      }
    }
  } catch (e) {
    console.warn(`Failed to delete portfolio ${id} from server:`, e);
  }

  // 2. Delete locally
  removeLocalPortfolio(id);
  return true;
}

function removeLocalPortfolio(id: string) {
  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_PORTFOLIOS_KEY);
    if (localData) {
      const items: CreatorProfile[] = JSON.parse(localData);
      const filtered = items.filter((i) => i.id !== id && i.slug !== id);
      localStorage.setItem(LOCAL_STORAGE_PORTFOLIOS_KEY, JSON.stringify(filtered));
    }
  } catch {}
}
