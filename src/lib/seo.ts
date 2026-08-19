export interface OpenGraphMetadata {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
  siteName?: string;
  price?: string;
  rawPrice?: number;
  currency?: string;
  imageWidth?: number | string;
  imageHeight?: number | string;
  imageType?: string;
  jsonLd?: Record<string, any>;
}

export const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?fm=jpg&fit=crop&w=800&h=800&q=80';

export const DEFAULT_PLATFORM_META: OpenGraphMetadata = {
  title: 'Listing OS — Modern Real Estate Showcase & Single-Property Platform',
  description:
    'Experience bespoke single-property showcases with immersive imagery, verified specifications, 4K floorplans, and direct contact with premier agents.',
  image: DEFAULT_FALLBACK_IMAGE,
  url: 'https://listingos.netlify.app',
  type: 'website',
  siteName: 'Listing OS',
  imageWidth: 800,
  imageHeight: 800,
  imageType: 'image/jpeg',
};

/**
 * Formats price for social media previews.
 * Examples:
 *   ₹63,90,000 -> "₹63.9 Lakh"
 *   ₹1,25,00,000 -> "₹12.5 Cr"
 *   $4,850,000 -> "$4.85M" or "$4,850,000"
 */
export function formatPriceForSocial(price?: number | string | null, currency: string = '₹'): string {
  if (price === undefined || price === null || price === '') return '';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num) || num <= 0) return '';

  const cleanCurrency = (currency || '₹').trim();

  // Indian Rupee formatting (Lakh / Crore)
  if (
    cleanCurrency === '₹' ||
    cleanCurrency.toUpperCase() === 'INR' ||
    cleanCurrency.toUpperCase() === 'RS' ||
    cleanCurrency === 'Rs.'
  ) {
    if (num >= 10000000) {
      const cr = (num / 10000000).toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      });
      return `₹${cr} Cr`;
    }
    if (num >= 100000) {
      const lakh = (num / 100000).toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      });
      return `₹${lakh} Lakh`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  }

  // US Dollars
  if (cleanCurrency === '$' || cleanCurrency.toUpperCase() === 'USD') {
    if (num >= 1000000) {
      const m = (num / 1000000).toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      });
      return `$${m}M`;
    }
    return `$${num.toLocaleString('en-US')}`;
  }

  // Euros
  if (cleanCurrency === '€' || cleanCurrency.toUpperCase() === 'EUR') {
    return `€${num.toLocaleString('de-DE')}`;
  }

  // British Pounds
  if (cleanCurrency === '£' || cleanCurrency.toUpperCase() === 'GBP') {
    return `£${num.toLocaleString('en-GB')}`;
  }

  // Generic fallback
  return `${cleanCurrency} ${num.toLocaleString()}`;
}

/**
 * Builds a concise, high-converting Open Graph description
 * tailored specifically for WhatsApp and social media link previews (approx 120-160 chars).
 *
 * Example target:
 * "Luxury 4 BHK Oceanfront Villa in Awas Beach, Alibaug. 5,400 sq ft · Private Infinity Pool · 270° Sea Panoramas."
 */
export function buildListingDescription(listing: any): string {
  if (!listing) return DEFAULT_PLATFORM_META.description;

  // 1. If custom metaDescription is provided and punchy (up to 180 chars), use it directly
  if (listing.metaDescription && typeof listing.metaDescription === 'string') {
    const cleanMeta = listing.metaDescription.trim().replace(/\s+/g, ' ');
    if (cleanMeta.length >= 25 && cleanMeta.length <= 185) {
      return truncateText(cleanMeta, 160);
    }
  }

  // 2. Structured specs line (e.g., "4 BHK · 5,400 sq ft")
  const specs = listing.specs || {};
  const specParts: string[] = [];
  if (specs.bedrooms) {
    specParts.push(`${specs.bedrooms} BHK`);
  }
  if (specs.squareFeet) {
    specParts.push(`${Number(specs.squareFeet).toLocaleString()} sq ft`);
  }
  if (specs.lotSize) {
    specParts.push(String(specs.lotSize));
  }
  const specLine = specParts.join(' · ');

  // 3. Location line (e.g., "Awas Beach, Alibaug")
  const loc = listing.location || {};
  const locParts = [
    loc.neighborhood || loc.address,
    loc.city,
    loc.state,
  ].filter(Boolean);
  const locationLine = locParts.slice(0, 2).join(', ');

  // 4. Feature highlight (e.g., "Private Infinity Pool & 270° Ocean Views")
  let featureLine = '';
  if (Array.isArray(listing.highlights) && listing.highlights.length > 0) {
    const cleanHighlights = listing.highlights
      .map((h: any) => String(h).replace(/^[0-9]+-?(Ft|Foot)\s*/i, '').trim())
      .filter((h: string) => h.length > 5 && h.length < 45);
    if (cleanHighlights.length > 0) {
      featureLine = cleanHighlights.slice(0, 2).join(' · ');
    }
  } else if (Array.isArray(listing.amenities) && listing.amenities.length > 0) {
    featureLine = listing.amenities.slice(0, 3).join(' · ');
  } else if (listing.tagline && typeof listing.tagline === 'string') {
    featureLine = truncateText(listing.tagline.trim(), 50);
  }

  // 5. Assemble structured description: "<Specs> in <Location>. <Features>."
  let structured = '';
  if (specLine && locationLine) {
    structured = `${specLine} in ${locationLine}.`;
  } else if (locationLine) {
    structured = `Located in ${locationLine}.`;
  } else if (specLine) {
    structured = `${specLine}.`;
  }

  if (featureLine) {
    structured = structured ? `${structured} ${featureLine}.` : `${featureLine}.`;
  }

  // Fallback to cleaned description excerpt if structured is empty
  if (!structured || structured.length < 20) {
    let rawText = listing.description || '';
    rawText = rawText
      .replace(/[#*_~`]/g, '')
      .replace(/\r?\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    structured = rawText;
  }

  return truncateText(structured.trim() || DEFAULT_PLATFORM_META.description, 160);
}

/**
 * Builds the listing's Open Graph title:
 * "Listing Title — Formatted Price"
 * Example: "The Glasshouse Sanctuary — Luxury 4 BHK Oceanfront Villa — ₹12.5 Cr"
 */
export function buildListingTitle(listing: any): string {
  if (!listing) return DEFAULT_PLATFORM_META.title;

  const baseTitle = (listing.title || 'Exclusive Property').trim();
  const formattedPrice = formatPriceForSocial(listing.price, listing.currency || '₹');

  // Check if title already includes formatted price
  if (formattedPrice && !baseTitle.includes(formattedPrice) && !baseTitle.includes(listing.currency || '₹')) {
    return `${baseTitle} — ${formattedPrice}`;
  }

  if (listing.seoTitle && listing.seoTitle.trim().length > 10) {
    return listing.seoTitle.trim();
  }

  return baseTitle;
}

/**
 * Extracts the primary cover image as an absolute HTTPS URL,
 * applying square 1:1 cropping parameters (800x800) when available
 * to trigger the WhatsApp left-hand thumbnail preview layout.
 */
export function extractCoverImageUrl(listing: any, baseUrl: string): string {
  if (!listing) return DEFAULT_FALLBACK_IMAGE;

  let chosenUrl = '';
  const images = Array.isArray(listing.images) ? listing.images : [];

  // 1. Look for image explicitly marked isCover
  const coverImg = images.find((img: any) => img && (img.isCover === true || img.is_cover === true));
  if (coverImg?.url) {
    chosenUrl = coverImg.url;
  }

  // 2. Look for the first image in gallery array
  if (!chosenUrl && images.length > 0 && images[0]?.url) {
    chosenUrl = images[0].url;
  }

  // 3. Check for walkthrough video thumbnail or direct thumbnail property
  if (!chosenUrl && (listing.walkthrough_video_thumbnail || listing.walkthroughVideoThumbnail)) {
    chosenUrl = listing.walkthrough_video_thumbnail || listing.walkthroughVideoThumbnail;
  }

  // 4. Default fallback
  if (!chosenUrl || typeof chosenUrl !== 'string' || chosenUrl.trim() === '') {
    chosenUrl = DEFAULT_FALLBACK_IMAGE;
  }

  chosenUrl = chosenUrl.trim();

  // Ensure absolute URL
  if (chosenUrl.startsWith('//')) {
    chosenUrl = `https:${chosenUrl}`;
  } else if (chosenUrl.startsWith('/')) {
    const cleanBase = baseUrl.replace(/\/$/, '');
    chosenUrl = `${cleanBase}${chosenUrl}`;
  }

  // Upgrade HTTP to HTTPS for WhatsApp / social scraper compliance
  if (chosenUrl.startsWith('http://')) {
    chosenUrl = chosenUrl.replace('http://', 'https://');
  }

  // Optimize Unsplash images for WhatsApp (800x800 square, forced baseline JPEG, quality 80, fast loading <100KB)
  if (chosenUrl.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(chosenUrl);
      urlObj.searchParams.delete('auto');
      urlObj.searchParams.set('fm', 'jpg');
      urlObj.searchParams.set('fit', 'crop');
      urlObj.searchParams.set('w', '800');
      urlObj.searchParams.set('h', '800');
      urlObj.searchParams.set('q', '80');
      return urlObj.toString();
    } catch {
      // If URL parsing fails, return as-is
    }
  }

  return chosenUrl;
}

/**
 * Constructs a pristine canonical listing URL without any query strings,
 * hash fragments, or third-party tracking parameters (e.g. utm_source, chatgpt.com, etc.).
 * Example: "https://listingos.netlify.app/p/the-glasshouse-sanctuary-luxury-villa"
 */
export function buildCanonicalListingUrl(rawBaseUrl: string, slugOrId?: string): string {
  let cleanOrigin = 'https://listingos.netlify.app';
  if (rawBaseUrl && typeof rawBaseUrl === 'string') {
    try {
      const parsed = new URL(rawBaseUrl.startsWith('http') ? rawBaseUrl : `https://${rawBaseUrl}`);
      cleanOrigin = `${parsed.protocol}//${parsed.host}`;
    } catch {
      cleanOrigin = rawBaseUrl.split('?')[0].split('#')[0].replace(/\/+$/, '');
    }
  }

  const cleanSlug = (slugOrId || 'property')
    .toString()
    .split('?')[0]
    .split('#')[0]
    .replace(/^\/+|\/+$/g, '')
    .trim();

  return `${cleanOrigin}/p/${encodeURIComponent(cleanSlug)}`;
}

/**
 * Builds the complete OpenGraph metadata object for a property listing.
 */
export function generateListingOpenGraphMetadata(
  listing: any,
  reqBaseUrl: string,
  targetSlug?: string
): OpenGraphMetadata {
  if (!listing) {
    return {
      ...DEFAULT_PLATFORM_META,
      url: `${reqBaseUrl.replace(/\/$/, '')}/`,
    };
  }

  const cleanBase = reqBaseUrl.replace(/\/$/, '');
  const slug = listing.slug || targetSlug || listing.id || 'property';
  const canonicalUrl = buildCanonicalListingUrl(cleanBase, slug);
  const title = buildListingTitle(listing);
  const description = buildListingDescription(listing);
  const imageUrl = extractCoverImageUrl(listing, cleanBase);
  const formattedPrice = formatPriceForSocial(listing.price, listing.currency || '₹');

  // JSON-LD structured data for Google RealEstateListing / SingleFamilyResidence
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.title,
    description: description,
    url: canonicalUrl,
    image: [imageUrl],
  };

  if (listing.price && Number(listing.price) > 0) {
    jsonLd.offers = {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: listing.currency === '₹' ? 'INR' : listing.currency === '$' ? 'USD' : 'INR',
      availability: 'https://schema.org/InStock',
    };
  }

  if (listing.location) {
    jsonLd.contentLocation = {
      '@type': 'Place',
      name: listing.location.neighborhood || listing.location.address || listing.title,
      address: {
        '@type': 'PostalAddress',
        streetAddress: listing.location.address || undefined,
        addressLocality: listing.location.city || undefined,
        addressRegion: listing.location.state || undefined,
        addressCountry: listing.location.country || 'India',
      },
    };
  }

  return {
    title,
    description,
    image: imageUrl,
    url: canonicalUrl,
    type: 'website',
    siteName: 'Listing OS',
    price: formattedPrice,
    rawPrice: listing.price ? Number(listing.price) : undefined,
    currency: listing.currency || '₹',
    imageWidth: 800,
    imageHeight: 800,
    imageType: 'image/jpeg',
    jsonLd,
  };
}

/**
 * Escapes HTML characters for safe text content.
 */
export function escapeHtml(str: string = ''): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escapes URLs for meta attribute values without breaking query parameters (preserving &).
 */
export function escapeUrl(str: string = ''): string {
  return String(str)
    .replace(/"/g, '%22')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .trim();
}

/**
 * Truncates text cleanly at word boundaries.
 */
function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 0 && lastSpace > maxLength - 20) {
    return `${truncated.substring(0, lastSpace)}...`;
  }
  return `${truncated}...`;
}

/**
 * Injects Open Graph, Twitter Cards, Canonical URL, and JSON-LD schema into raw HTML template.
 */
export function injectMetadataIntoHtml(
  htmlTemplate: string,
  meta: OpenGraphMetadata
): string {
  const safeTitle = escapeHtml(meta.title);
  const safeDesc = escapeHtml(meta.description);
  const safeUrl = escapeUrl(meta.url);
  const safeImg = escapeUrl(meta.image);
  const safeSite = escapeHtml(meta.siteName || 'Listing OS');

  // 1. Construct the metadata tags block
  const tags = [
    `<!-- Primary Page Meta -->`,
    `<title>${safeTitle}</title>`,
    `<meta name="description" content="${safeDesc}" />`,
    `<link rel="canonical" href="${safeUrl}" />`,
    ``,
    `<!-- Schema.org Microdata for WhatsApp & Crawler Fallbacks -->`,
    `<meta itemprop="name" content="${safeTitle}" />`,
    `<meta itemprop="description" content="${safeDesc}" />`,
    `<meta itemprop="image" content="${safeImg}" />`,
    ``,
    `<!-- Open Graph / WhatsApp / Facebook / LinkedIn / Telegram -->`,
    `<meta property="og:site_name" content="${safeSite}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.type || 'website')}" />`,
    `<meta property="og:url" content="${safeUrl}" />`,
    `<meta property="og:title" content="${safeTitle}" />`,
    `<meta property="og:description" content="${safeDesc}" />`,
    `<meta property="og:image" content="${safeImg}" />`,
    `<meta property="og:image:secure_url" content="${safeImg}" />`,
    `<meta property="og:image:type" content="${escapeHtml(meta.imageType || 'image/jpeg')}" />`,
    `<meta property="og:image:width" content="${meta.imageWidth || '800'}" />`,
    `<meta property="og:image:height" content="${meta.imageHeight || '800'}" />`,
    `<meta property="og:image:alt" content="${safeTitle}" />`,
    `<meta property="og:locale" content="en_US" />`,
    ``,
    `<!-- Twitter / X Card (summary triggers the compact side-by-side preview layout) -->`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:url" content="${safeUrl}" />`,
    `<meta name="twitter:title" content="${safeTitle}" />`,
    `<meta name="twitter:description" content="${safeDesc}" />`,
    `<meta name="twitter:image" content="${safeImg}" />`,
    `<meta name="twitter:image:alt" content="${safeTitle}" />`,
  ];

  if (meta.jsonLd) {
    tags.push(``);
    tags.push(`<!-- Structured Data / JSON-LD -->`);
    tags.push(`<script type="application/ld+json">`);
    tags.push(JSON.stringify(meta.jsonLd, null, 2));
    tags.push(`</script>`);
  }

  const metaHtml = tags.join('\n    ');

  // 2. Remove existing <title>, <meta name="description">, and prior OG/Twitter/itemprop tags
  let cleanedHtml = htmlTemplate
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+name=["']description["'][\s\S]*?>/gi, '')
    .replace(/<link\s+rel=["']canonical["'][\s\S]*?>/gi, '')
    .replace(/<meta\s+itemprop=["'][\s\S]*?>/gi, '')
    .replace(/<meta\s+property=["']og:[\s\S]*?>/gi, '')
    .replace(/<meta\s+name=["']twitter:[\s\S]*?>/gi, '');

  // 3. Inject new tags right after `<head>` or before `</head>`
  if (cleanedHtml.includes('<head>')) {
    return cleanedHtml.replace('<head>', `<head>\n    ${metaHtml}`);
  } else if (cleanedHtml.includes('</head>')) {
    return cleanedHtml.replace('</head>', `    ${metaHtml}\n  </head>`);
  }

  // Fallback if no head tag found
  return `${metaHtml}\n${cleanedHtml}`;
}

