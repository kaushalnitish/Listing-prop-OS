// Client-side instant heuristic parser for WhatsApp / raw property text
// Ensures zero-blocking, zero-error UX even if AI network is delayed or offline

import { ExtractedListingData } from './aiParser';

export function parseWhatsappListingHeuristic(rawText: string): ExtractedListingData {
  const text = (rawText || '').trim();

  // 1. Bedrooms / BHK
  let bedrooms: number | null = null;
  const bhkMatch = text.match(/(\d+)\s*(?:bhk|b\.h\.k|bedroom|bed|bds)\b/i);
  if (bhkMatch) {
    bedrooms = parseInt(bhkMatch[1], 10);
  }

  // 2. Bathrooms
  let bathrooms: number | null = null;
  const bathMatch = text.match(/(\d+)\s*(?:bath|bathroom|washroom|toilet|tb)\b/i);
  if (bathMatch) {
    bathrooms = parseInt(bathMatch[1], 10);
  } else if (bedrooms) {
    bathrooms = bedrooms;
  }

  // 3. Price & Currency detection
  let price: number | null = null;
  let priceFormatted = '';
  let currency = '₹';

  const croreMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)\b/i);
  const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lac|lacs|lakh|lakhs|l)\b/i);
  const inrSymbolMatch = text.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)/i);
  const usdMatch = text.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(m|million|k)?\b/i);

  if (croreMatch) {
    const val = parseFloat(croreMatch[1]);
    price = Math.round(val * 10000000);
    priceFormatted = `₹${val} Cr`;
    currency = '₹';
  } else if (lakhMatch) {
    const val = parseFloat(lakhMatch[1]);
    price = Math.round(val * 100000);
    priceFormatted = `₹${val} Lakhs`;
    currency = '₹';
  } else if (inrSymbolMatch) {
    const cleaned = inrSymbolMatch[1].replace(/,/g, '');
    const val = parseFloat(cleaned);
    if (!isNaN(val)) {
      price = val;
      if (val >= 10000000) {
        priceFormatted = `₹${(val / 10000000).toFixed(2)} Cr`;
      } else if (val >= 100000) {
        priceFormatted = `₹${(val / 100000).toFixed(2)} Lakhs`;
      } else {
        priceFormatted = `₹${val.toLocaleString('en-IN')}`;
      }
      currency = '₹';
    }
  } else if (usdMatch) {
    let val = parseFloat(usdMatch[1].replace(/,/g, ''));
    const unit = (usdMatch[2] || '').toLowerCase();
    if (unit.startsWith('m')) val *= 1000000;
    else if (unit === 'k') val *= 1000;
    price = val;
    priceFormatted = `$${val.toLocaleString()}`;
    currency = '$';
  } else {
    const standaloneMatch = text.match(/(?:price|demand|rate|cost)[:\s]*(\d+(?:\.\d+)?)/i);
    if (standaloneMatch) {
      const val = parseFloat(standaloneMatch[1]);
      if (val < 1000) {
        price = Math.round(val * 100000);
        priceFormatted = `₹${val} Lakhs`;
        currency = '₹';
      } else {
        price = val;
        priceFormatted = `₹${val.toLocaleString('en-IN')}`;
        currency = '₹';
      }
    }
  }

  // 4. Area / Square Feet & Gaj
  let squareFeet: number | null = null;
  let areaText = '';
  const gajMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:gaj|gaz|sq\.?\s*yard|sq\s*yds?|yards?)\b/i);
  const sqftMatch = text.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:sq\.?\s*ft|sqft|square\s*feet|sq\s*feet)\b/i);

  if (gajMatch) {
    const gajVal = parseFloat(gajMatch[1]);
    squareFeet = Math.round(gajVal * 9);
    areaText = `${gajVal} Gaj (${squareFeet.toLocaleString()} Sq. Ft.)`;
  } else if (sqftMatch) {
    const val = parseFloat(sqftMatch[1].replace(/,/g, ''));
    squareFeet = Math.round(val);
    areaText = `${val.toLocaleString()} Sq. Ft.`;
  }

  // 5. Property Type
  let propertyType = 'Residential Floor';
  if (/independent floor|builder floor|floor/i.test(text)) {
    propertyType = 'Residential Floor';
  } else if (/villa|kothi|bungalow|duplex|independent house/i.test(text)) {
    propertyType = 'Villa';
  } else if (/apartment|flat|condo|society flat|penthouse/i.test(text)) {
    propertyType = 'Apartment';
  } else if (/plot|land|killa/i.test(text)) {
    propertyType = 'Plot';
  } else if (/office|workspace|commercial floor/i.test(text)) {
    propertyType = 'Office';
  } else if (/shop|showroom|booth|retail/i.test(text)) {
    propertyType = 'Retail Shop';
  } else if (/warehouse|godown/i.test(text)) {
    propertyType = 'Warehouse';
  } else if (/commercial/i.test(text)) {
    propertyType = 'Commercial';
  } else if (/industrial|shed|factory/i.test(text)) {
    propertyType = 'Industrial';
  } else if (/farm\s*house/i.test(text)) {
    propertyType = 'Farm House';
  }

  // 6. Contact Phone / WhatsApp
  let contactPhone = '';
  const phoneMatch =
    text.match(/(?:\+91[\s-]?)?([6-9]\d{9})\b/) ||
    text.match(/(?:\+?1[\s-]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/);
  if (phoneMatch) {
    contactPhone = phoneMatch[0].trim();
  }

  // 7. Location heuristics
  const cities = [
    'Mohali',
    'Chandigarh',
    'Kharar',
    'Zirakpur',
    'Panchkula',
    'Gurugram',
    'Gurgaon',
    'Delhi',
    'Noida',
    'Mumbai',
    'Bangalore',
    'Pune',
    'Miami',
    'New York',
  ];
  let city = '';
  for (const c of cities) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(text)) {
      city = c;
      break;
    }
  }

  let neighborhood = '';
  const sectorMatch = text.match(/(?:sector|sec[-.\s]*)\s*(\d+[a-z]?)/i);
  if (sectorMatch) {
    neighborhood = `Sector ${sectorMatch[1].toUpperCase()}`;
  } else {
    const areaKeywords = [
      'Sunny Enclave',
      'Star Island',
      'Aerocity',
      'IT City',
      'Model Town',
      'Green Enclave',
      'Kharar Highway',
      'South Beach',
    ];
    for (const kw of areaKeywords) {
      if (new RegExp(kw, 'i').test(text)) {
        neighborhood = kw;
        break;
      }
    }
  }

  let address = [neighborhood, city].filter(Boolean).join(', ');
  if (!address) address = 'Prime Residential Location';

  // 8. Amenities & Highlights detection
  const detectedAmenities: string[] = [];
  const detectedHighlights: string[] = [];

  const checks: Array<{ regex: RegExp; name: string; isHighlight?: boolean }> = [
    { regex: /garden|private garden|outdoor seating/i, name: 'Private Garden & Outdoor Seating', isHighlight: true },
    { regex: /modern kitchen|modular kitchen/i, name: 'Modern Kitchen with Premium Fittings', isHighlight: true },
    { regex: /dedicated parking|parking space|car parking/i, name: 'Dedicated Parking Space', isHighlight: true },
    { regex: /peaceful|scenic/i, name: 'Peaceful & Scenic Surroundings', isHighlight: true },
    { regex: /gated (?:society|community)/i, name: 'Gated Society Security', isHighlight: true },
    { regex: /(?:rcc|wide|45ft|60ft|30ft)\s*roads?/i, name: 'Wide RCC Internal Roads', isHighlight: true },
    { regex: /wooden work.*warranty|warranty.*wooden/i, name: '5-Year Wooden Work Warranty', isHighlight: true },
    { regex: /after sales service/i, name: '1-Year After Sales Service Support', isHighlight: true },
    { regex: /cctv|24x7 security|security/i, name: '24/7 Security & CCTV Surveillance' },
    { regex: /park facing|near park|park/i, name: 'Park Facing / Green Belt Access' },
    { regex: /power backup/i, name: 'Power Backup Provision' },
    { regex: /water supply|24hr water/i, name: '24-Hour Clean Water Supply' },
    { regex: /lift|elevator/i, name: 'High-Speed Passenger Elevator' },
    { regex: /balcony|balconies/i, name: 'Spacious Private Balconies' },
    { regex: /pool|swimming pool/i, name: 'Swimming Pool' },
  ];

  for (const item of checks) {
    if (item.regex.test(text)) {
      detectedAmenities.push(item.name);
      if (item.isHighlight && detectedHighlights.length < 5) {
        detectedHighlights.push(item.name);
      }
    }
  }

  // Also parse line by line bullet points from user input if any
  const lines = text.split('\n').map((l) => l.trim().replace(/^[-*•]\s*/, '')).filter((l) => l.length > 4 && l.length < 80);
  for (const line of lines) {
    if (!detectedHighlights.includes(line) && detectedHighlights.length < 6) {
      if (!/^(price|call|contact|bhk|sqft)/i.test(line)) {
        detectedHighlights.push(line);
      }
    }
  }

  if (detectedAmenities.length === 0) {
    detectedAmenities.push('Gated Society', 'Dedicated Parking Space', 'Modern Kitchen', 'Peaceful Location', 'Wide Access Roads');
  }
  if (detectedHighlights.length === 0) {
    detectedHighlights.push(
      `${bedrooms ? `${bedrooms} BHK ` : ''}${propertyType} with Modern Architecture`,
      areaText ? `Spacious Area of ${areaText}` : 'Thoughtfully Designed Living Spaces',
      priceFormatted ? `Offered at ${priceFormatted}` : 'Attractive Value Pricing',
      'Scenic Surroundings with Clear Legal Documentation'
    );
  }

  // 9. Narrative & SEO metadata
  const title = `${bedrooms ? `${bedrooms} BHK ` : ''}${propertyType}${neighborhood ? ` in ${neighborhood}` : ''}${city ? `, ${city}` : ''}`.trim() || 'Modern Luxury Property';
  const tagline = `Modern ${bedrooms ? `${bedrooms} BHK ` : ''}${propertyType} with Scenic Surroundings & Dedicated Parking`;

  const description = `Discover this thoughtfully constructed ${bedrooms ? `${bedrooms} BHK ` : ''}${propertyType} located in ${address}. Designed with an emphasis on natural lighting, efficient room flow, and peaceful scenic surroundings, this residence presents an ideal balance of privacy and lifestyle comfort.\n\nThe property features modern kitchen spaces, dedicated parking, outdoor garden seating, and convenient access to local transit and daily conveniences. Ideal for luxury living, holiday retreat, or long-term high-yield investment.`;

  const seoTitle = `${title} | For Sale ${priceFormatted ? `- ${priceFormatted}` : ''}`.slice(0, 60);
  const metaDescription = `Explore this property in ${address}. ${areaText ? `Featuring ${areaText}.` : ''} ${priceFormatted ? `Price: ${priceFormatted}.` : ''} Contact for site visit.`.slice(0, 155);

  const missingFields: string[] = [];
  if (!price) missingFields.push('price');
  if (!bedrooms) missingFields.push('bedrooms');
  if (!bathrooms) missingFields.push('bathrooms');
  if (!squareFeet) missingFields.push('squareFeet');
  if (!city) missingFields.push('city');

  return {
    title,
    tagline,
    propertyType,
    price,
    priceFormatted: priceFormatted || (price ? `₹${price.toLocaleString('en-IN')}` : ''),
    currency,
    bedrooms,
    bathrooms,
    squareFeet,
    areaText: areaText || (squareFeet ? `${squareFeet.toLocaleString()} Sq. Ft.` : ''),
    address,
    city: city || 'Prime Location',
    neighborhood: neighborhood || 'Scenic Sector',
    description,
    highlights: detectedHighlights.slice(0, 6),
    amenities: detectedAmenities.slice(0, 12),
    seoTitle,
    metaDescription,
    contactPhone,
    missingFields,
  };
}
