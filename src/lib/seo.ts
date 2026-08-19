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
  jsonLd?: Record<string, any>;
}

export const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80';

export const DEFAULT_PLATFORM_META: OpenGraphMetadata = {
  title: 'Listing OS — Modern Real Estate Showcase & Single-Property Platform',
  description:
    'Experience bespoke single-property showcases with immersive imagery, verified specifications, 4K floorplans, and direct contact with premier agents.',
  image: DEFAULT_FALLBACK_IMAGE,
  url: 'https://listingos.com',
  type: 'website',
  siteName: 'Listing OS',
};

/**
 * Formats price for social media previews.
 * Examples:
 *   ₹63,90,000 -> "₹63.9 Lakh"
 *   ₹1,50,00,000 -> "₹1.5 Cr"
 *   $4,850,000 -> "$4,850,000"
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
 * combining location, specifications, and property highlights.
 */
export function buildListingDescription(listing: any): string {
  if (!listing) return DEFAULT_PLATFORM_META.description;

  // 1. Location string
  const loc = listing.location || {};
  const locParts = [
    loc.neighborhood || loc.address,
    loc.city,
    loc.state,
    loc.country,
  ].filter(Boolean);
  const locationSummary = locParts.slice(0, 3).join(', ');

  // 2. Specs string (e.g., "3 BHK Residential Floor • 1,242 sq ft")
  const specs = listing.specs || {};
  const specParts: string[] = [];
  if (specs.bedrooms) {
    specParts.push(`${specs.bedrooms} BHK`);
  }
  if (specs.propertyType) {
    specParts.push(String(specs.propertyType));
  }
  if (specs.squareFeet) {
    specParts.push(`${Number(specs.squareFeet).toLocaleString()} sq ft`);
  }
  const specSummary = specParts.join(' ');

  // 3. Clean excerpt from metaDescription or description
  let rawText = listing.metaDescription || listing.description || '';
  // Strip markdown, newlines, and excess whitespace
  rawText = rawText
    .replace(/[#*_~`]/g, '')
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If metaDescription already exists and is descriptive, use it directly
  if (listing.metaDescription && listing.metaDescription.trim().length >= 25) {
    return truncateText(listing.metaDescription.trim(), 190);
  }

  // Construct structured description: "<Specs> in <Location>. <Excerpt>"
  let fullDesc = '';
  if (specSummary && locationSummary) {
    fullDesc = `${specSummary} in ${locationSummary}. `;
  } else if (locationSummary) {
    fullDesc = `Located in ${locationSummary}. `;
  } else if (specSummary) {
    fullDesc = `${specSummary}. `;
  }

  if (rawText) {
    fullDesc += rawText;
  } else if (Array.isArray(listing.highlights) && listing.highlights.length > 0) {
    fullDesc += listing.highlights.slice(0, 3).join(' • ');
  }

  return truncateText(fullDesc.trim() || DEFAULT_PLATFORM_META.description, 190);
}

/**
 * Builds the listing's Open Graph title:
 * "Listing Title — Formatted Price"
 * Example: "Luxury 3 BHK Independent Floor in Sector 115, Mohali — ₹63.9 Lakh"
 */
export function buildListingTitle(listing: any): string {
  if (!listing) return DEFAULT_PLATFORM_META.title;

  const baseTitle = (listing.title || 'Exclusive Property').trim();
  const formattedPrice = formatPriceForSocial(listing.price, listing.currency || '₹');

  // Check if title already includes price or currency symbol
  if (formattedPrice && !baseTitle.includes(formattedPrice) && !baseTitle.includes(listing.currency || '₹')) {
    return `${baseTitle} — ${formattedPrice}`;
  }

  if (listing.seoTitle && listing.seoTitle.trim().length > 10) {
    return listing.seoTitle.trim();
  }

  return baseTitle;
}

/**
 * Extracts the primary cover image as an absolute HTTPS URL.
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

  // 2. Look for the first image in array
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

  // Make sure it's an absolute URL
  chosenUrl = chosenUrl.trim();
  if (chosenUrl.startsWith('//')) {
    chosenUrl = `https:${chosenUrl}`;
  } else if (chosenUrl.startsWith('/')) {
    const cleanBase = baseUrl.replace(/\/$/, '');
    chosenUrl = `${cleanBase}${chosenUrl}`;
  }

  // Upgrade HTTP to HTTPS for social crawlers security rules
  if (chosenUrl.startsWith('http://')) {
    chosenUrl = chosenUrl.replace('http://', 'https://');
  }

  return chosenUrl;
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
  const canonicalUrl = `${cleanBase}/p/${encodeURIComponent(slug)}`;
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
    jsonLd,
  };
}

/**
 * Escapes HTML characters for safe attribute and text injection.
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
 * Truncates text cleanly at word boundaries.
 */
function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 0 && lastSpace > maxLength - 30) {
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
  // 1. Construct the metadata tags block
  const tags = [
    `<!-- Primary Page Meta -->`,
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.url)}" />`,
    ``,
    `<!-- Open Graph / Facebook / WhatsApp / LinkedIn / Telegram -->`,
    `<meta property="og:type" content="${escapeHtml(meta.type || 'website')}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.url)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:image" content="${escapeHtml(meta.image)}" />`,
    `<meta property="og:image:secure_url" content="${escapeHtml(meta.image)}" />`,
    `<meta property="og:image:type" content="image/jpeg" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(meta.siteName || 'Listing OS')}" />`,
    `<meta property="og:locale" content="en_US" />`,
    ``,
    `<!-- Twitter / X Card -->`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:url" content="${escapeHtml(meta.url)}" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(meta.title)}" />`,
  ];

  if (meta.jsonLd) {
    tags.push(``);
    tags.push(`<!-- Structured Data / JSON-LD -->`);
    tags.push(`<script type="application/ld+json">`);
    tags.push(JSON.stringify(meta.jsonLd, null, 2));
    tags.push(`</script>`);
  }

  const metaHtml = tags.join('\n    ');

  // 2. Remove existing <title>, <meta name="description">, and prior OG/Twitter tags
  let cleanedHtml = htmlTemplate
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+name=["']description["'][\s\S]*?>/gi, '')
    .replace(/<link\s+rel=["']canonical["'][\s\S]*?>/gi, '')
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
