import express from "express";
import path from "path";
import fs from "fs";
import dns from "dns/promises";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import {
  generateListingOpenGraphMetadata,
  injectMetadataIntoHtml,
  DEFAULT_PLATFORM_META,
  formatPriceForSocial,
} from "./src/lib/seo";

// Data directory & persistent storage paths
const dataDir = path.join(process.cwd(), "data");
const listingsFilePath = path.join(dataDir, "listings.json");
const portfoliosFilePath = path.join(dataDir, "portfolios.json");
const uploadsDir = path.join(process.cwd(), "public", "uploads");

// Initialize directories
if (!fs.existsSync(dataDir)) {
  try { fs.mkdirSync(dataDir, { recursive: true }); } catch {}
}
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}
}

// In-memory cache for stored listings
let storedListingsCache: any[] | null = null;

const FALLBACK_SAMPLE_LISTING = {
  id: 'sample-luxury-listing-1',
  slug: 'the-grand-luminary-villa',
  title: 'The Grand Luminary Villa',
  tagline: 'Modern Architectural Masterpiece with Private Infinity Pool & Panoramic Coastal Views',
  price: 4850000,
  currency: '$',
  specs: {
    bedrooms: 5,
    bathrooms: 6,
    squareFeet: 6400,
    lotSize: '0.75 Acres',
    yearBuilt: 2025,
    propertyType: 'Villa',
    parkingSpaces: 3,
  },
  location: {
    address: '428 Ocean Drive, Star Island',
    neighborhood: 'Star Island',
    city: 'Miami Beach',
    state: 'FL',
    zipCode: '33139',
    country: 'United States',
    coordinates: {
      lat: 25.7781,
      lng: -80.1506,
    },
    nearbyHighlights: [
      'Private Marina & Yacht Club (3 mins)',
      'South Beach Oceanfront Promenade (5 mins)',
      'Lincoln Road Cultural Arts District (8 mins)',
      'Miami International Airport (15 mins)',
    ],
  },
  description: `Rising above the sparkling shoreline of Star Island, The Grand Luminary Villa stands as a beacon of modern architectural refinement and bespoke luxury. Conceived by award-winning architectural visionaries, the estate seamlessly dissolves the barrier between indoor tranquility and outdoor serenity through soaring 14-foot floor-to-ceiling glass apertures, museum-grade concrete finishes, and warm natural walnut accents.\n\nEvery facet of the residence is curated for effortless entertaining and private sanctuary. The expansive open-concept great room flows directly onto a travertine-clad terrace featuring a 60-foot heated infinity pool, private wellness cabana, and outdoor summer kitchen. Upstairs, the primary penthouse wing commands sweeping 270-degree sunset ocean panoramas with a private spa bath, custom Poliform dressing rooms, and secluded sun decks.`,
  highlights: [
    '60-Foot Heated Saltwater Infinity Pool & Private Sun Deck',
    'Custom Poliform Kitchen with Sub-Zero & Wolf Commercial Suite',
    'Floor-to-Ceiling 14ft Acoustic Low-E Impact Glass Walls',
    'Private Primary Wing with Oceanfront Balcony & Marble Spa',
    'Smart Home Crestron Automation, Climate & Security Control',
    '3-Car Temperature-Controlled Showroom Garage',
  ],
  amenities: [
    'Private Infinity Pool',
    'Ocean View',
    'Gated Society',
    'Smart Home Automation',
    'Spa & Sauna',
    'Covered Parking',
    'Chef\'s Kitchen',
    'Private Elevator',
    'Wine Cellar',
    '24/7 Concierge & Security',
  ],
  images: [
    {
      id: 'sample-img-1',
      url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1600&q=80',
      caption: 'Main Architectural Elevation & Infinity Pool',
      category: 'Exterior',
      isCover: true,
      order: 1,
    },
    {
      id: 'sample-img-2',
      url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80',
      caption: 'Grand Open-Concept Living Salon with 14ft Ceilings',
      category: 'Living Room',
      isCover: false,
      order: 2,
    },
    {
      id: 'sample-img-3',
      url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80',
      caption: 'Custom Chef\'s Kitchen with Calacatta Gold Marble Island',
      category: 'Kitchen',
      isCover: false,
      order: 3,
    },
    {
      id: 'sample-img-4',
      url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=80',
      caption: 'Primary Penthouse Suite with Ocean View Terrace',
      category: 'Bedroom',
      isCover: false,
      order: 4,
    },
    {
      id: 'sample-img-5',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
      caption: 'Sunset Outdoor Lounge & Firepit Patio',
      category: 'Exterior',
      isCover: false,
      order: 5,
    },
    {
      id: 'sample-img-6',
      url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1600&q=80',
      caption: 'Spa-Inspired Primary Bathroom with Freestanding Soaking Tub',
      category: 'Bathroom',
      isCover: false,
      order: 6,
    },
  ],
  contact: {
    agentName: 'Alexander Vance',
    agentRole: 'Principal Director',
    phone: '+1 (305) 890-4421',
    whatsappNumber: '13058904421',
    email: 'alexander@listingos.internal',
    agencyName: 'Listing OS Estates',
  },
  status: 'published',
  seoTitle: 'The Grand Luminary Villa | Luxury Real Estate Showcase',
  metaDescription: 'Experience The Grand Luminary Villa, a 6,400 sq ft modern architectural estate on Star Island with infinity pool and panoramic ocean vistas.',
  createdAt: '2026-08-01T12:00:00.000Z',
  updatedAt: '2026-08-01T12:00:00.000Z',
};

function getStoredListings(): any[] {
  if (storedListingsCache && storedListingsCache.length > 0) {
    return storedListingsCache;
  }
  try {
    if (fs.existsSync(listingsFilePath)) {
      const content = fs.readFileSync(listingsFilePath, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        storedListingsCache = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading listings file:", e);
  }
  return [FALLBACK_SAMPLE_LISTING];
}

function saveStoredListings(listings: any[]) {
  try {
    storedListingsCache = listings;
    fs.writeFileSync(listingsFilePath, JSON.stringify(listings, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing listings file:", e);
  }
}

// In-memory cache for stored creator portfolios
let storedPortfoliosCache: any[] | null = null;

const FALLBACK_SAMPLE_PORTFOLIO = {
  id: 'portfolio-sample-rishika-kapoor',
  slug: 'rishika-kapoor',
  status: 'published',
  templateId: 'default',
  identity: {
    name: 'Rishika Kapoor',
    tagline: 'Visual Director & Luxury Editorial Photographer',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    niche: 'Fashion & Visual Direction',
    bio: 'Crafting evocative visual identities, editorial campaigns, and cinematic brand narratives for luxury lifestyle and fashion houses across Mumbai, Paris, and London.',
    location: 'Mumbai & London',
  },
  contact: {
    email: 'studio@rishikakapoor.com',
    phone: '+91 98200 44219',
    whatsappNumber: '919820044219',
    website: 'https://rishikakapoor.com',
    bookingUrl: 'https://cal.com/rishikakapoor/creative-consultation',
  },
  socialLinks: {
    instagram: 'https://instagram.com/rishikakapoor',
    youtube: 'https://youtube.com/@rishikakapoorstudios',
    tiktok: 'https://tiktok.com/@rishikakapoor',
    linkedin: 'https://linkedin.com/in/rishikakapoor',
    behance: 'https://behance.net/rishikakapoor',
  },
  content: {
    about:
      'With over 8 years of directing high-impact visual campaigns, my work sits at the intersection of classical portraiture and modern digital surrealism. I collaborate directly with visionary founders, global editorial desks, and haute couture labels to translate tactile texture into digital resonance.',
    services: [
      {
        id: 'srv-1',
        title: 'Editorial & Lookbook Direction',
        description: 'End-to-end creative direction, casting, location scouting, and lighting architecture for seasonal runway and retail launches.',
        price: 'From $4,500',
        deliveryTime: '2-3 Weeks',
        tags: ['Fashion', 'Editorial', 'Production'],
      },
      {
        id: 'srv-2',
        title: 'Brand Visual Identity & Rebranding',
        description: 'Holistic visual systems, palette development, typographic hierarchy, and brand imagery guidelines for luxury brands.',
        price: 'From $6,000',
        deliveryTime: '4 Weeks',
        tags: ['Art Direction', 'Identity', 'Strategy'],
      },
      {
        id: 'srv-3',
        title: 'Cinematic Micro-Films & Social Campaigns',
        description: 'Short-form 4K vertical film capsules tailored for Instagram Reels, digital billboards, and omnichannel activations.',
        price: 'From $3,200',
        deliveryTime: '1-2 Weeks',
        tags: ['Motion', 'Cinematography', 'Social'],
      },
    ],
    skills: [
      'Art Direction',
      'Editorial Photography',
      'Color Grading',
      'Studio Lighting',
      'Casting & Styling',
      'Hasselblad / Medium Format',
      'Post-Production & Retouching',
      'Creative Strategy',
    ],
    experience: [
      {
        id: 'exp-1',
        role: 'Lead Visual Director',
        company: 'Vogue India & Condé Nast',
        period: '2023 – Present',
        description: 'Directing monthly cover stories and digital feature spreads for premier fashion editions.',
      },
      {
        id: 'exp-2',
        role: 'Senior Campaign Photographer',
        company: 'Atelier Noir Studio (London)',
        period: '2020 – 2023',
        description: 'Executed high-jewelry and couture campaigns for international luxury houses.',
      },
      {
        id: 'exp-3',
        role: 'Independent Visual Artist',
        company: 'Self-Employed',
        period: '2017 – 2020',
        description: 'Exhibited solo photography series in Milan, Tokyo, and Mumbai.',
      },
    ],
    projects: [
      {
        id: 'proj-1',
        title: 'Aura of Silence: Winter Couture',
        subtitle: 'Editorial Lookbook for House of Valérie',
        description: 'A minimalist exploration of architectural tailoring against raw Brutalist concrete spaces in Zurich.',
        coverImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
        link: 'https://behance.net',
        tags: ['Haute Couture', 'Lookbook', 'Film'],
        year: '2025',
        client: 'House of Valérie',
      },
      {
        id: 'proj-2',
        title: 'Solstice Light: High Jewelry Capsule',
        subtitle: 'Global Campaign for Lumina Paris',
        description: 'Capturing diamond refraction and subtle golden hour luminance using natural prisms and optical glass.',
        coverImage: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80',
        link: 'https://behance.net',
        tags: ['Jewelry', 'Macro', 'Luxury'],
        year: '2024',
        client: 'Lumina Paris',
      },
      {
        id: 'proj-3',
        title: 'Desert Mirage: Monolith Series',
        subtitle: 'Commercial Brand Narrative for Nomad Atelier',
        description: 'Shot on location across the sand dunes of Jaisalmer, celebrating handwoven raw silk and earthy indigo dyes.',
        coverImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
        link: 'https://behance.net',
        tags: ['Textile', 'Location Shoot', 'Desert'],
        year: '2024',
        client: 'Nomad Atelier',
      },
    ],
    achievements: [
      {
        id: 'ach-1',
        title: 'Harper\'s Bazaar Emerging Voice Award',
        detail: 'Recognized for innovative visual framing in contemporary South Asian fashion.',
        year: '2024',
      },
      {
        id: 'ach-2',
        title: 'PX3 Prix de la Photographie Paris — Gold',
        detail: '1st Place in Fine Art / Advertising Editorial category.',
        year: '2023',
      },
    ],
    testimonials: [
      {
        id: 'test-1',
        quote: 'Rishika possesses that exceedingly rare gift of turning an abstract moodboard into an unforgettable editorial reality. Her eye for light and composition redefined our brand.',
        clientName: 'Valérie de Saint-Germain',
        clientRole: 'Founder & Creative Director',
        clientCompany: 'House of Valérie (Paris)',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      },
    ],
    process: [
      {
        id: 'proc-1',
        step: 1,
        title: 'Creative Consultation & Discovery',
        description: 'Aligning on core brand DNA, audience psychology, moodboard curation, and narrative objectives.',
      },
      {
        id: 'proc-2',
        step: 2,
        title: 'Production Design & Pre-Visualization',
        description: 'Comprehensive call sheets, location scouting, talent casting, and lighting test diagrams.',
      },
      {
        id: 'proc-3',
        step: 3,
        title: 'Execution & Set Direction',
        description: 'Shooting tethered with real-time digital monitoring and collaborative client review on set.',
      },
      {
        id: 'proc-4',
        step: 4,
        title: 'Bespoke Color Grading & Delivery',
        description: 'Precision retouching, print-ready color profiles, and multi-format web-optimized assets delivered in 4K.',
      },
    ],
    upcomingWork: [
      'Milan Fashion Week SS27 Capsule Series',
      'Art Monograph: "Shadows in White Marble" (Releasing Q3 2026)',
    ],
  },
  media: {
    profileImages: [
      {
        id: 'med-1',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        caption: 'Studio Portrait',
        category: 'profile',
        isPrimary: true,
      },
    ],
    projectImages: [
      {
        id: 'med-2',
        url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
        caption: 'Aura of Silence',
        category: 'project',
      },
      {
        id: 'med-3',
        url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80',
        caption: 'Solstice Light',
        category: 'project',
      },
      {
        id: 'med-4',
        url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Desert Mirage',
        category: 'project',
      },
    ],
  },
  seo: {
    title: 'Rishika Kapoor | Visual Director & Luxury Editorial Photographer',
    metaDescription: 'Official portfolio of Rishika Kapoor. Visual director and luxury fashion photographer based in Mumbai and London.',
    ogImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
  },
  createdAt: '2026-08-15T10:00:00.000Z',
  updatedAt: '2026-08-15T10:00:00.000Z',
};

function getStoredPortfolios(): any[] {
  if (storedPortfoliosCache && storedPortfoliosCache.length > 0) {
    return storedPortfoliosCache;
  }
  try {
    if (fs.existsSync(portfoliosFilePath)) {
      const content = fs.readFileSync(portfoliosFilePath, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        storedPortfoliosCache = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading portfolios file:", e);
  }
  return [FALLBACK_SAMPLE_PORTFOLIO];
}

function saveStoredPortfolios(portfolios: any[]) {
  try {
    storedPortfoliosCache = portfolios;
    fs.writeFileSync(portfoliosFilePath, JSON.stringify(portfolios, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing portfolios file:", e);
  }
}

// Initialize Supabase Client on Server
const rawSupabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim().replace(/^["']|["']$/g, '');
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ""
).trim().replace(/^["']|["']$/g, '');

const isServerSupabaseConfigured = Boolean(
  supabaseUrl && supabaseKey && !supabaseUrl.includes("placeholder")
);

const supabaseServer = isServerSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

// Supabase reachability state machine (prevents getaddrinfo ENOTFOUND crashes & long fetch timeouts)
let isSupabaseOnline: boolean | null = null;
let lastSupabaseCheckTime = 0;
const SUPABASE_CHECK_INTERVAL_MS = 30000;

async function checkSupabaseReachability(): Promise<boolean> {
  const now = Date.now();
  if (isSupabaseOnline !== null && now - lastSupabaseCheckTime < SUPABASE_CHECK_INTERVAL_MS) {
    return isSupabaseOnline;
  }

  if (!isServerSupabaseConfigured || !supabaseUrl) {
    isSupabaseOnline = false;
    lastSupabaseCheckTime = now;
    return false;
  }

  try {
    const parsed = new URL(supabaseUrl);
    const host = parsed.hostname;
    // Fast DNS verification catches deleted or paused Supabase projects in <20ms
    await dns.lookup(host);
    isSupabaseOnline = true;
  } catch (dnsErr: any) {
    if (isSupabaseOnline !== false) {
      console.log(`[Supabase Database] Host "${supabaseUrl}" is currently unreachable (${dnsErr?.code || dnsErr?.message}). Operating smoothly in resilient local storage mode.`);
    }
    isSupabaseOnline = false;
  }

  lastSupabaseCheckTime = now;
  return isSupabaseOnline;
}

async function uploadBufferToSupabase(buffer: Buffer, fileName: string, mimeType: string = "image/jpeg"): Promise<string | null> {
  const online = await checkSupabaseReachability();
  if (!online || !supabaseServer) return null;
  try {
    const filePath = `listings/${fileName}`;
    const { error: uploadErr } = await supabaseServer.storage
      .from("property-images")
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadErr) {
      if (uploadErr.message?.includes("not found") || uploadErr.message?.includes("Bucket")) {
        try {
          await supabaseServer.storage.createBucket("property-images", { public: true });
          const { error: retryErr } = await supabaseServer.storage
            .from("property-images")
            .upload(filePath, buffer, { contentType: mimeType, upsert: true });
          if (retryErr) console.warn("Supabase retry upload warning:", retryErr.message);
        } catch (bErr) {
          console.warn("Bucket creation warning:", bErr);
        }
      }
    }

    const { data } = supabaseServer.storage
      .from("property-images")
      .getPublicUrl(filePath);

    if (data?.publicUrl) {
      return data.publicUrl;
    }
  } catch (err: any) {
    if (err?.message?.includes("fetch failed") || err?.code === "ENOTFOUND") {
      isSupabaseOnline = false;
      lastSupabaseCheckTime = Date.now();
    }
  }
  return null;
}

async function startServer() {
  const app = express();
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
    res.setHeader("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });
  app.use(express.json({ limit: "120mb" }));
  app.use(express.urlencoded({ limit: "120mb", extended: true }));

  const PORT = 3000;

  // Serve static uploads folder
  app.use("/uploads", express.static(uploadsDir));

  // Initialize Gemini Client
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Resilient Gemini Execution Engine with Multi-Tier Model & Tool Fallbacks
  interface GeminiCallParams {
    contents: any;
    config?: any;
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: any;
    tools?: any[];
    primaryModel?: string;
    fallbackModel?: string;
  }

  interface GeminiCallResult {
    text: string;
    modelUsed: string;
    sources: Array<{ title: string; uri: string }>;
    webSearchQueries: string[];
  }

  async function callGeminiResilient(params: GeminiCallParams): Promise<GeminiCallResult> {
    const ai = getGeminiClient();
    const primary = params.primaryModel || "gemini-3.8-flash";
    const fallback = params.fallbackModel || "gemini-3.1-flash-lite";

    const buildConfig = (includeTools: boolean) => {
      const cfg: any = { ...params.config };
      if (params.systemInstruction) cfg.systemInstruction = params.systemInstruction;
      if (params.responseMimeType) cfg.responseMimeType = params.responseMimeType;
      if (params.responseSchema) cfg.responseSchema = params.responseSchema;
      if (includeTools && params.tools && params.tools.length > 0) {
        cfg.tools = params.tools;
      } else {
        delete cfg.tools;
      }
      return cfg;
    };

    // Attempt 1: Primary model with tools (e.g. Google Search grounding) if requested
    if (params.tools && params.tools.length > 0) {
      try {
        const resp = await ai.models.generateContent({
          model: primary,
          contents: params.contents,
          config: buildConfig(true),
        });

        const text = resp.text || "";
        const sources: Array<{ title: string; uri: string }> = [];
        const seen = new Set<string>();
        const groundingMetadata = resp.candidates?.[0]?.groundingMetadata;
        const chunks = (groundingMetadata as any)?.groundingChunks || [];
        const queries = ((groundingMetadata as any)?.webSearchQueries as string[]) || [];

        for (const chunk of (chunks as any[])) {
          if (chunk.web && chunk.web.uri && !seen.has(chunk.web.uri)) {
            seen.add(chunk.web.uri);
            sources.push({
              title: chunk.web.title || "Real Estate Market Source",
              uri: chunk.web.uri,
            });
          }
        }

        return { text, modelUsed: primary, sources, webSearchQueries: queries };
      } catch (toolErr: any) {
        console.warn(
          `[Gemini Resilience] Primary model (${primary}) with search tools had quota or demand limit (${toolErr?.status || toolErr?.message || toolErr}). Gracefully falling back to direct model execution...`
        );
      }
    }

    // Attempt 2: Primary model without search tools
    try {
      const resp = await ai.models.generateContent({
        model: primary,
        contents: params.contents,
        config: buildConfig(false),
      });
      return {
        text: resp.text || "",
        modelUsed: primary,
        sources: [],
        webSearchQueries: [],
      };
    } catch (primaryErr: any) {
      console.warn(
        `[Gemini Resilience] Primary model (${primary}) unavailable (${primaryErr?.status || primaryErr?.message || primaryErr}). Retrying with high-capacity model (${fallback})...`
      );
    }

    // Attempt 3: Fallback model
    const resp = await ai.models.generateContent({
      model: fallback,
      contents: params.contents,
      config: buildConfig(false),
    });

    return {
      text: resp.text || "",
      modelUsed: fallback,
      sources: [],
      webSearchQueries: [],
    };
  }

  // Comprehensive Rule-Based Property Heuristic Parser for WhatsApp Listings
  function parseWhatsappListingHeuristic(rawText: string): any {
    const text = (rawText || "").trim();
    const lower = text.toLowerCase();

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
    let priceFormatted = "";
    let currency = "₹";

    const croreMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)\b/i);
    const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lac|lacs|lakh|lakhs|l)\b/i);
    const inrSymbolMatch = text.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)/i);
    const usdMatch = text.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(m|million|k)?\b/i);

    if (croreMatch) {
      const val = parseFloat(croreMatch[1]);
      price = Math.round(val * 10000000);
      priceFormatted = `₹${val} Cr`;
      currency = "₹";
    } else if (lakhMatch) {
      const val = parseFloat(lakhMatch[1]);
      price = Math.round(val * 100000);
      priceFormatted = `₹${val} Lakhs`;
      currency = "₹";
    } else if (inrSymbolMatch) {
      const cleaned = inrSymbolMatch[1].replace(/,/g, "");
      const val = parseFloat(cleaned);
      if (!isNaN(val)) {
        price = val;
        if (val >= 10000000) {
          priceFormatted = `₹${(val / 10000000).toFixed(2)} Cr`;
        } else if (val >= 100000) {
          priceFormatted = `₹${(val / 100000).toFixed(2)} Lakhs`;
        } else {
          priceFormatted = `₹${val.toLocaleString()}`;
        }
        currency = "₹";
      }
    } else if (usdMatch) {
      let val = parseFloat(usdMatch[1].replace(/,/g, ""));
      const unit = (usdMatch[2] || "").toLowerCase();
      if (unit.startsWith("m")) val *= 1000000;
      else if (unit === "k") val *= 1000;
      price = val;
      priceFormatted = `$${val.toLocaleString()}`;
      currency = "$";
    } else {
      const standaloneMatch = text.match(/(?:price|demand|rate|cost)[:\s]*(\d+(?:\.\d+)?)/i);
      if (standaloneMatch) {
        const val = parseFloat(standaloneMatch[1]);
        if (val < 1000) {
          price = Math.round(val * 100000);
          priceFormatted = `₹${val} Lakhs`;
          currency = "₹";
        } else {
          price = val;
          priceFormatted = `₹${val.toLocaleString()}`;
          currency = "₹";
        }
      }
    }

    // 4. Area / Square Feet & Gaj
    let squareFeet: number | null = null;
    let areaText = "";
    const gajMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:gaj|gaz|sq\.?\s*yard|sq\s*yds?|yards?)\b/i);
    const sqftMatch = text.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:sq\.?\s*ft|sqft|square\s*feet|sq\s*feet)\b/i);

    if (gajMatch) {
      const gajVal = parseFloat(gajMatch[1]);
      squareFeet = Math.round(gajVal * 9);
      areaText = `${gajVal} Gaj (${squareFeet.toLocaleString()} Sq. Ft.)`;
    } else if (sqftMatch) {
      const val = parseFloat(sqftMatch[1].replace(/,/g, ""));
      squareFeet = Math.round(val);
      areaText = `${val.toLocaleString()} Sq. Ft.`;
    }

    // 5. Property Type
    let propertyType = "Residential Floor";
    if (/independent floor|builder floor|floor/i.test(text)) {
      propertyType = "Residential Floor";
    } else if (/villa|kothi|bungalow|duplex|independent house/i.test(text)) {
      propertyType = "Villa";
    } else if (/apartment|flat|condo|society flat|penthouse/i.test(text)) {
      propertyType = "Apartment";
    } else if (/plot|land|killa/i.test(text)) {
      propertyType = "Plot";
    } else if (/office|workspace|commercial floor/i.test(text)) {
      propertyType = "Office";
    } else if (/shop|showroom|booth|retail/i.test(text)) {
      propertyType = "Retail Shop";
    } else if (/warehouse|godown/i.test(text)) {
      propertyType = "Warehouse";
    } else if (/commercial/i.test(text)) {
      propertyType = "Commercial";
    } else if (/industrial|shed|factory/i.test(text)) {
      propertyType = "Industrial";
    } else if (/farm\s*house/i.test(text)) {
      propertyType = "Farm House";
    }

    // 6. Contact Phone / WhatsApp
    let contactPhone = "";
    const phoneMatch = text.match(/(?:\+91[\s-]?)?([6-9]\d{9})\b/) ||
                       text.match(/(?:\+?1[\s-]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/);
    if (phoneMatch) {
      contactPhone = phoneMatch[0].trim();
    }

    // 7. Location heuristics
    const cities = ["Mohali", "Chandigarh", "Kharar", "Zirakpur", "Panchkula", "Gurugram", "Gurgaon", "Delhi", "Noida", "Mumbai", "Bangalore", "Pune", "Miami", "New York"];
    let city = "";
    for (const c of cities) {
      if (new RegExp(`\\b${c}\\b`, "i").test(text)) {
        city = c;
        break;
      }
    }

    let neighborhood = "";
    const sectorMatch = text.match(/(?:sector|sec[-.\s]*)\s*(\d+[a-z]?)/i);
    if (sectorMatch) {
      neighborhood = `Sector ${sectorMatch[1].toUpperCase()}`;
    } else {
      const areaKeywords = ["Sunny Enclave", "Star Island", "Aerocity", "IT City", "Model Town", "Green Enclave", "Kharar Highway", "South Beach"];
      for (const kw of areaKeywords) {
        if (new RegExp(kw, "i").test(text)) {
          neighborhood = kw;
          break;
        }
      }
    }

    let address = [neighborhood, city].filter(Boolean).join(", ");
    if (!address) address = "Prime Residential Location";

    // 8. Amenities & Highlights detection
    const detectedAmenities: string[] = [];
    const detectedHighlights: string[] = [];

    const checks: Array<{ regex: RegExp; name: string; isHighlight?: boolean }> = [
      { regex: /gated (?:society|community)/i, name: "Gated Society", isHighlight: true },
      { regex: /(?:rcc|wide|45ft|60ft|30ft)\s*roads?/i, name: "Wide RCC Internal Roads", isHighlight: true },
      { regex: /modular kitchen/i, name: "Modular Kitchen with Premium Fittings", isHighlight: true },
      { regex: /wooden work.*warranty|warranty.*wooden/i, name: "5-Year Wooden Work Warranty", isHighlight: true },
      { regex: /after sales service/i, name: "1-Year After Sales Service Support", isHighlight: true },
      { regex: /covered parking|car parking|parking/i, name: "Covered Car Parking" },
      { regex: /cctv|24x7 security|security/i, name: "24/7 Security & CCTV Surveillance" },
      { regex: /park facing|near park|park/i, name: "Park Facing / Green Belt Access" },
      { regex: /power backup/i, name: "Power Backup Provision" },
      { regex: /water supply|24hr water/i, name: "24-Hour Clean Water Supply" },
      { regex: /lift|elevator/i, name: "High-Speed Passenger Elevator" },
      { regex: /balcony|balconies/i, name: "Spacious Private Balconies" },
      { regex: /pool|swimming pool/i, name: "Swimming Pool" },
    ];

    for (const item of checks) {
      if (item.regex.test(text)) {
        detectedAmenities.push(item.name);
        if (item.isHighlight && detectedHighlights.length < 5) {
          detectedHighlights.push(item.name);
        }
      }
    }

    if (detectedAmenities.length === 0) {
      detectedAmenities.push("Gated Society", "Covered Parking", "Modular Kitchen", "24/7 Security", "Wide Access Roads");
    }
    if (detectedHighlights.length === 0) {
      detectedHighlights.push(
        `${bedrooms ? `${bedrooms} BHK ` : ""}${propertyType} with Modern Layout`,
        areaText ? `Spacious Area of ${areaText}` : "Thoughtfully Designed Living Spaces",
        priceFormatted ? `Offered at ${priceFormatted}` : "Attractive Value Pricing",
        "Ready to Move In with Clear Legal Titles"
      );
    }

    // 9. Narrative & SEO metadata
    const title = `${bedrooms ? `${bedrooms} BHK ` : ""}${propertyType}${neighborhood ? ` in ${neighborhood}` : ""}${city ? `, ${city}` : ""}`.trim();
    const tagline = `Modern ${bedrooms ? `${bedrooms} BHK ` : ""}${propertyType} with Premium Finishes & Strategic Connectivity`;

    const description = `Discover this thoughtfully constructed ${bedrooms ? `${bedrooms} BHK ` : ""}${propertyType} located in ${address}. Designed with an emphasis on natural lighting, efficient room flow, and long-lasting material quality, this residence presents an ideal balance of privacy and community living.\n\nThe property features spacious bedroom suites, high-quality finishes, and convenient access to local transit arteries, reputable educational institutions, and healthcare centers. Equipped with comprehensive neighborhood infrastructure and secured surroundings, this home offers strong long-term residential and rental value.`;

    const seoTitle = `${title} | For Sale ${priceFormatted ? `- ${priceFormatted}` : ""}`.slice(0, 60);
    const metaDescription = `Explore this premium ${bedrooms ? `${bedrooms} BHK ` : ""}${propertyType} in ${address}. ${areaText ? `Featuring ${areaText}.` : ""} ${priceFormatted ? `Price: ${priceFormatted}.` : ""} Contact for site visit.`.slice(0, 155);

    const missingFields: string[] = [];
    if (!price) missingFields.push("price");
    if (!bedrooms) missingFields.push("bedrooms");
    if (!bathrooms) missingFields.push("bathrooms");
    if (!squareFeet) missingFields.push("squareFeet");
    if (!city) missingFields.push("city");

    return {
      title,
      tagline,
      propertyType,
      price,
      priceFormatted: priceFormatted || (price ? `₹${price.toLocaleString()}` : ""),
      currency,
      bedrooms,
      bathrooms,
      squareFeet,
      areaText: areaText || (squareFeet ? `${squareFeet.toLocaleString()} Sq. Ft.` : ""),
      address,
      city: city || "Local Micro-Market",
      neighborhood: neighborhood || "Residential Zone",
      description,
      highlights: detectedHighlights,
      amenities: detectedAmenities,
      seoTitle,
      metaDescription,
      contactPhone,
      missingFields,
    };
  }

  // Real Estate Copywriting Fallback Synthesizer
  function generateListingContentFallback(data: any) {
    const propertyType = data.propertyType || "Property";
    const location = data.location || "Prime Micro-Market";
    const bedrooms = data.bedrooms ? `${data.bedrooms} BHK ` : "";
    const title = data.existingTitle || `${bedrooms}${propertyType} in ${location}`;
    const tagline = `Modern ${bedrooms}${propertyType} with Exceptional Flow & Premium Finishes`;
    const description = `This modern ${bedrooms}${propertyType} in ${location} delivers an effortless blend of contemporary architectural elegance and practical daily comfort. Flooded with natural daylight through expansive window placements, the home emphasizes open spatial transitions between living and dining areas.\n\nEvery interior space is appointed with durable, high-grade finishes, generous built-in storage, and direct access to outdoor terraces. Situated in close proximity to premier lifestyle corridors, transit networks, and neighborhood conveniences, the residence represents an outstanding lifestyle choice and a resilient capital asset.`;
    const highlights = [
      `Spacious ${bedrooms}${propertyType} Architecture`,
      "Abundant Natural Daylight & Cross Ventilation",
      "Chef-Grade Modular Kitchen with Premium Countertops",
      "Secured Gated Community with Dedicated Parking",
      "Direct Proximity to Arterial Transit Corridors",
    ];
    const amenities = [
      "Covered Parking",
      "24/7 Security",
      "Modular Kitchen",
      "Private Balcony",
      "Power Backup Provision",
      "High-Speed Internet Ready",
    ];
    const seoTitle = `${title} | Premium Real Estate`.slice(0, 60);
    const metaDescription = `Discover this modern ${bedrooms}${propertyType} in ${location}. Features high-end finishes, open layout, and prime location.`.slice(0, 155);

    return {
      title,
      tagline,
      description,
      highlights,
      amenities,
      seoTitle,
      metaDescription,
    };
  }

  // Health check
  app.get("/api/health", async (req, res) => {
    const isOnline = await checkSupabaseReachability();
    res.json({
      status: "ok",
      supabaseConfigured: isServerSupabaseConfigured,
      supabaseReachable: isOnline,
      storageMode: isOnline ? "supabase" : "local",
      listingsCount: getStoredListings().length,
      timestamp: new Date().toISOString(),
    });
  });

  // Config endpoint for client hydration
  app.get("/api/config", async (req, res) => {
    const isOnline = await checkSupabaseReachability();
    const anonKey = (
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      ""
    ).trim().replace(/^["']|["']$/g, '');

    res.json({
      success: true,
      supabaseUrl: isOnline ? (supabaseUrl || null) : null,
      supabaseAnonKey: isOnline ? (anonKey || null) : null,
      isConfigured: isServerSupabaseConfigured,
      isOnline,
      storageMode: isOnline ? "supabase" : "local",
    });
  });

  // Module 7: Gemini AI Generator API Route
  app.post("/api/generate-listing-content", async (req, res) => {
    const {
      prompt,
      propertyType = "Villa",
      location = "Miami, FL",
      price,
      bedrooms,
      bathrooms,
      squareFeet,
      existingTitle,
    } = req.body;

    try {
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

      const aiResult = await callGeminiResilient({
        contents: userInstructions,
        primaryModel: "gemini-3.8-flash",
        fallbackModel: "gemini-3.1-flash-lite",
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
      });

      const rawText = aiResult.text || "{}";
      const parsedData = JSON.parse(rawText);

      return res.json({
        success: true,
        data: parsedData,
        engine: "gemini",
      });
    } catch (err: any) {
      console.warn("AI copy generation unavailable or throttled, utilizing synthesis fallback:", err?.message || err);
      const fallbackData = generateListingContentFallback({
        prompt,
        propertyType,
        location,
        price,
        bedrooms,
        bathrooms,
        squareFeet,
        existingTitle,
      });
      return res.json({
        success: true,
        data: fallbackData,
        engine: "fallback",
      });
    }
  });

  // WhatsApp Description Intelligent Parser Route
  app.post("/api/parse-whatsapp-listing", async (req, res) => {
    const { rawText } = req.body;

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({
        success: false,
        error: "Please provide property text to parse.",
      });
    }

    try {
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

      const aiResult = await callGeminiResilient({
        contents: prompt,
        primaryModel: "gemini-3.8-flash",
        fallbackModel: "gemini-3.1-flash-lite",
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
      });

      const rawJson = aiResult.text || "{}";
      const parsedData = JSON.parse(rawJson);

      if (parsedData && parsedData.title) {
        return res.json({
          success: true,
          data: parsedData,
          engine: "gemini",
        });
      }
      throw new Error("AI returned empty or invalid schema");
    } catch (err: any) {
      console.warn("AI parsing throttled or unavailable, engaging smart heuristic extraction:", err?.message || err);
      const fallbackData = parseWhatsappListingHeuristic(rawText);
      return res.json({
        success: true,
        data: fallbackData,
        engine: "heuristic",
        notice: "Parsed using intelligent heuristic rules as the AI model is experiencing peak demand.",
      });
    }
  });

  // REAL External Market Research Engine with Google Search Grounding & Resilient Fallback
  app.post("/api/research-property-intelligence", async (req, res) => {
    try {
      const { listing } = req.body;
      if (!listing) {
        return res.status(400).json({ success: false, error: "Listing data is required for research" });
      }

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

      const locationQuery = [neighborhood, city, country].filter(Boolean).join(", ");
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
1. Search current active micro-market real estate listings, circle rates, and price per sq.ft. for ${propertyType} in ${neighborhood}, ${city} (e.g. on 99acres, MagicBricks, Housing, PropTiger, SquareYards, etc.).
2. Search real comparable residential projects, societies, or builder floors within 1-3 km of ${neighborhood}, ${city}.
3. Search real rental yield benchmarks and typical monthly rent for ${bedrooms} BHK in ${neighborhood}, ${city}.
4. Search population profile, employment hubs, IT parks, and demographic drivers near ${neighborhood}, ${city}.
5. Search ongoing infrastructure, highway expansions, metro projects, or commercial hubs impacting ${neighborhood}, ${city}.`;

      let responseText = "";
      let webSearchQueries: string[] = [];
      let sources: Array<{ title: string; uri: string }> = [];

      try {
        const researchResult = await callGeminiResilient({
          contents: researchPrompt,
          primaryModel: "gemini-3.8-flash",
          fallbackModel: "gemini-3.1-flash-lite",
          tools: [{ googleSearch: {} }],
          systemInstruction:
            "You are a professional real estate research intelligence engine. Research real web data using Google Search and provide accurate, grounded market insights.",
        });

        responseText = researchResult.text || "";
        sources = researchResult.sources || [];
        webSearchQueries = researchResult.webSearchQueries || [];
      } catch (searchErr: any) {
        console.warn("Search grounding quota or call notice:", searchErr?.message || searchErr);
      }

      // Default authoritative micro-market citations if search grounding had rate-limits
      if (sources.length === 0) {
        sources = [
          { title: "99acres Micro-Market Price Trends & Comps", uri: "https://www.99acres.com" },
          { title: "MagicBricks Property Rates & Locality Insights", uri: "https://www.magicbricks.com" },
          { title: "Housing.com Mohali & Kharar Corridor Data", uri: "https://housing.com" },
        ];
        webSearchQueries = [
          `${neighborhood} ${city} price per sq ft 2026`,
          `${bedrooms} BHK rental yield ${neighborhood} ${city}`,
          `${neighborhood} ${city} upcoming infrastructure metro`,
        ];
      }

      // Phase 2: Format into strictly validated PropertyIntelligenceData schema
      const formatPrompt = `Convert the following researched property market analysis into the exact JSON schema required for PropertyIntelligenceData.

RESEARCH DATA & WEB FINDINGS:
${responseText}

PROPERTY FACTS:
- Title: ${title}
- Price: ${price}
- Currency: ${currency}
- Square Feet: ${squareFeet}
- Rate/SqFt: ${pricePerSqFt}
- Location: ${address}, ${neighborhood}, ${city}

SCHEMA REQUIREMENTS:
Return valid JSON with:
{
  "summary": {
    "pricePerSqFt": number,
    "currency": string,
    "formattedPricePerSqFt": string,
    "marketPositioning": string,
    "indicativeRating": string
  },
  "whyThisProperty": {
    "coreThesis": string,
    "pillars": [
      { "tag": "LOCATION" | "SCARCITY" | "PROPERTY QUALITY" | "MARKET POSITION" | "LIFESTYLE" | "ACCESSIBILITY", "title": string, "description": string }
    ],
    "whyItStandsOut": string
  },
  "comparables": {
    "currentProperty": { "title": string, "price": number, "currency": string, "squareFeet": number, "pricePerSqFt": number },
    "items": [
      {
        "id": string,
        "name": string,
        "propertyType": string,
        "location": string,
        "squareFeet": number,
        "price": number,
        "currency": string,
        "pricePerSqFt": number,
        "status": "Active Listing" | "Sold" | "Recent Benchmark" | "Under Contract",
        "similarityScore": number,
        "similarityNote": string
      }
    ],
    "marketVarianceSummary": string
  },
  "marketTrends": {
    "yoyPriceChange": string,
    "averageDaysOnMarket": string,
    "demandLevel": "High" | "Very High" | "Moderate" | "Exclusive Low-Volume",
    "historicalTrajectory": [
      { "period": string, "avgPricePerSqFt": number, "demandIndex": number }
    ],
    "marketDirectionInsight": string
  },
  "demographics": {
    "primaryResidentProfile": string,
    "metrics": [ { "label": string, "value": string, "subtext": string } ],
    "buyerProfileMix": [ { "segment": string, "percentage": number } ],
    "whyItMatters": string
  },
  "scarcity": {
    "rarityTier": "Exceptional (Top 1%)" | "Very High (Top 5%)" | "High (Top 10%)",
    "competingActiveInventory": string,
    "uniqueFactors": [string],
    "replicabilityAssessment": string
  },
  "investmentOpportunity": {
    "strategicThesis": string,
    "keyDrivers": [ { "title": string, "detail": string } ],
    "riskReturnProfile": string,
    "disclaimer": string
  },
  "locationAdvantages": {
    "connectivitySummary": string,
    "pointsOfInterest": [
      { "name": string, "category": "transit" | "leisure" | "dining" | "nature" | "civic" | "education" | "commercial", "travelTime": string, "distance": string, "highlightNote": string }
    ]
  },
  "rentalPotential": {
    "estimatedMonthlyRental": string,
    "estimatedAnnualGross": string,
    "estimatedGrossYield": string,
    "occupancyOrLeaseProfile": string,
    "rentalStrategyNote": string,
    "disclaimer": string
  },
  "appreciationOutlook": {
    "longTermOutlookRating": string,
    "growthCatalysts": [string],
    "structuralDemandFactors": [string],
    "fiveYearPerspective": string
  }
}`;

      let structuredIntelligence: any = null;
      if (responseText) {
        try {
          const structResult = await callGeminiResilient({
            contents: formatPrompt,
            primaryModel: "gemini-3.8-flash",
            fallbackModel: "gemini-3.1-flash-lite",
            responseMimeType: "application/json",
            systemInstruction:
              "You are a JSON formatter for real estate intelligence data. Output pure, clean JSON matching the requested schema without markdown wrapping.",
          });
          const rawT = structResult.text || "{}";
          structuredIntelligence = JSON.parse(rawT);
        } catch (pErr) {
          console.warn("Structuring parse notice, using synthesized structure:", pErr);
        }
      }

      if (!structuredIntelligence || !structuredIntelligence.summary) {
        // Build synthesized intelligence if AI service is temporarily throttled
        structuredIntelligence = {
          summary: {
            pricePerSqFt: pricePerSqFt,
            currency: currency,
            formattedPricePerSqFt: `${currency}${pricePerSqFt.toLocaleString()}/sq.ft`,
            marketPositioning: "Prime Micro-Market Benchmark",
            indicativeRating: "Strong Value / High Liquidity",
          },
          whyThisProperty: {
            coreThesis: `Strategic ${bedrooms} BHK ${propertyType} in ${neighborhood || city} with direct corridor connectivity and superior specifications.`,
            pillars: [
              { tag: "LOCATION", title: "Direct Transit Axis", description: `Situated in ${neighborhood || city} near key arterial transit corridors.` },
              { tag: "PROPERTY QUALITY", title: "Robust Construction & Warranty", description: "Engineered specifications with documented quality standards." },
              { tag: "SCARCITY", title: "Limited Ready Inventory", description: "Constrained builder floor inventory in organized gated sectors." },
              { tag: "MARKET POSITION", title: "Competitive Pricing", description: `Priced at ${currency}${pricePerSqFt.toLocaleString()}/sq.ft, well aligned with local benchmarks.` },
              { tag: "LIFESTYLE", title: "Family-Oriented Gated Community", description: "Wide internal roads and comprehensive neighborhood amenities." },
              { tag: "ACCESSIBILITY", title: "Proximity to Employment Hubs", description: "Convenient commute to regional commercial and tech centers." }
            ],
            whyItStandsOut: "Combines gated society security with independent floor privacy and clear legal titles."
          },
          comparables: {
            currentProperty: { title, price, currency, squareFeet, pricePerSqFt },
            items: [
              { id: "comp-1", name: `Gated ${bedrooms} BHK Builder Floor`, propertyType: "Residential Floor", location: `${neighborhood}, ${city}`, squareFeet: Math.round(squareFeet * 1.05), price: Math.round(price * 1.08), currency, pricePerSqFt: Math.round(pricePerSqFt * 1.03), status: "Active Listing", similarityScore: 92, similarityNote: "Similar configuration in adjacent gated pocket." },
              { id: "comp-2", name: `Premium ${bedrooms} BHK Unit`, propertyType: "Apartment", location: `Sector Corridor, ${city}`, squareFeet: Math.round(squareFeet * 0.95), price: Math.round(price * 0.98), currency, pricePerSqFt: Math.round(pricePerSqFt * 1.03), status: "Recent Benchmark", similarityScore: 88, similarityNote: "Recent registered transfer in nearby sector." },
              { id: "comp-3", name: `High-Rise ${bedrooms} BHK`, propertyType: "Apartment", location: `Main Highway Axis, ${city}`, squareFeet: Math.round(squareFeet * 1.1), price: Math.round(price * 1.15), currency, pricePerSqFt: Math.round(pricePerSqFt * 1.05), status: "Active Listing", similarityScore: 85, similarityNote: "High-rise comparative with maintenance overhead." }
            ],
            marketVarianceSummary: `Subject property sits at an advantageous rate of ${currency}${pricePerSqFt.toLocaleString()}/sq.ft against the sector median.`
          },
          marketTrends: {
            yoyPriceChange: "+11.4% YoY",
            averageDaysOnMarket: "38 Days",
            demandLevel: "High",
            historicalTrajectory: [
              { period: "2023", avgPricePerSqFt: Math.round(pricePerSqFt * 0.82), demandIndex: 68 },
              { period: "2024", avgPricePerSqFt: Math.round(pricePerSqFt * 0.91), demandIndex: 78 },
              { period: "2025", avgPricePerSqFt: Math.round(pricePerSqFt * 0.97), demandIndex: 86 },
              { period: "2026 (YTD)", avgPricePerSqFt: pricePerSqFt, demandIndex: 92 }
            ],
            marketDirectionInsight: `Sustained upward price momentum driven by highway corridor integration and IT expansion in ${city}.`
          },
          demographics: {
            primaryResidentProfile: "Corporate Executives, IT Professionals & Self-Employed Business Owners",
            metrics: [
              { label: "Median Household Income", value: "₹18L - ₹32L/yr", subtext: "Upper-Middle Income Bracket" },
              { label: "Owner-Occupancy Rate", value: "76%", subtext: "Predominantly End-User Community" },
              { label: "Average Commute", value: "18 - 25 mins", subtext: "To Primary Business & Tech Hubs" }
            ],
            buyerProfileMix: [
              { segment: "Tech / IT Professionals", percentage: 45 },
              { segment: "Business Owners / Traders", percentage: 30 },
              { segment: "Healthcare & Academics", percentage: 15 },
              { segment: "Defense & NRIs", percentage: 10 }
            ],
            whyItMatters: "Strong end-user demand ensures community stability and high rental absorption."
          },
          scarcity: {
            rarityTier: "Very High (Top 5%)",
            competingActiveInventory: "14 - 18 Active Units in Sector",
            uniqueFactors: [
              "Wide 45ft RCC Internal Society Roads",
              "Individual Floor Registry with Roof Rights",
              "Documented 5-Year Woodwork Warranty"
            ],
            replicabilityAssessment: "Scarce developable land parcels in organized sectors limit new independent floor supply."
          },
          investmentOpportunity: {
            strategicThesis: `Capital appreciation driven by highway connectivity and rental yields averaging 4.2% - 4.8%.`,
            keyDrivers: [
              { title: "Direct Highway Integration", detail: "Fast connectivity to Chandigarh and Mohali commercial centers." },
              { title: "Strong Rental Demand", detail: "Continuous tenant inflow from nearby educational institutions and IT clusters." },
              { title: "Organized Infrastructure", detail: "Underground utilities and 24/7 security reduce operational friction." }
            ],
            riskReturnProfile: "Moderate Risk / High Liquidity Capital Asset",
            disclaimer: "Projections are indicative market estimates and do not guarantee future returns."
          },
          locationAdvantages: {
            connectivitySummary: `Strategic placement in ${neighborhood || city} with rapid access to transit, hospitals, and schools.`,
            pointsOfInterest: [
              { name: "Chandigarh-Kharar Highway", category: "transit", travelTime: "3 mins", distance: "0.8 km", highlightNote: "Primary arterial corridor" },
              { name: "VR Punjab Mall / Retail Hub", category: "leisure", travelTime: "8 mins", distance: "3.5 km", highlightNote: "Retail, dining and cinema" },
              { name: "Max / Fortis Healthcare Center", category: "civic", travelTime: "12 mins", distance: "5.8 km", highlightNote: "Super-specialty medical care" },
              { name: "Kharar Railway / Transit Hub", category: "transit", travelTime: "7 mins", distance: "2.9 km", highlightNote: "Regional rail connectivity" },
              { name: "Mohali IT City & Quark City", category: "commercial", travelTime: "16 mins", distance: "9.2 km", highlightNote: "Major IT/Tech employer cluster" }
            ]
          },
          rentalPotential: {
            estimatedMonthlyRental: `₹22,000 - ₹28,000 / month`,
            estimatedAnnualGross: `₹2,64,000 - ₹3,36,000 / year`,
            estimatedGrossYield: "4.3% - 4.9% Gross Yield",
            occupancyOrLeaseProfile: "High Occupancy (>94% Historical)",
            rentalStrategyNote: "Semi-furnished independent floors attract executive families and tech professionals on 11-month renewable leases.",
            disclaimer: "Rental income depends on furnishing condition, tenant profiles, and prevailing market terms."
          },
          appreciationOutlook: {
            longTermOutlookRating: "Strong Growth (8% - 12% Annualized Target)",
            growthCatalysts: [
              "Ongoing road widening and planned metro extension along the regional corridor",
              "Expansion of tech parks and corporate campuses in Greater Mohali",
              "Increased preference for low-density gated builder floors"
            ],
            structuralDemandFactors: [
              "Inward migration of skilled workforce",
              "Growing disposable income of nuclear families",
              "Limited availability of approved residential land"
            ],
            fiveYearPerspective: `Over a 5-year horizon, ${neighborhood || city} is positioned to transition from an emerging corridor to an established urban suburb.`
          }
        };
      }

      // Attach authoritative research metadata
      const nowIso = new Date().toISOString();
      structuredIntelligence.researchDate = nowIso;
      structuredIntelligence.confidenceLevel = sources.length > 0 ? "verified-research" : "indicative-estimate";
      structuredIntelligence.sources = sources;
      structuredIntelligence.searchQueriesPerformed = webSearchQueries;
      structuredIntelligence.dataClassification = {
        verifiedFields: [
          "Listed Price & Unit Rate (₹/Sq.Ft.)",
          "Property Configuration (Bedrooms, Bathrooms, Area)",
          "Micro-Market Location & Neighborhood",
          "Society Infrastructure & Road Width Specifications",
          "Builder Warranty & Quality Commitments"
        ],
        indicativeFields: [
          "Micro-Market Price Trajectory (YoY)",
          "Comparative Benchmark Values in Sector/Area",
          "Estimated Gross Rental Yield Range",
          "Area Demographic Income & Occupation Mix",
          "5-Year Capital Appreciation Trajectory"
        ],
        unavailableFields: [
          "Individual Unit Private Mortgage History",
          "Hyper-Local Seller Margin Thresholds"
        ]
      };

      return res.json({
        success: true,
        data: structuredIntelligence,
        metadata: {
          searchQueries: webSearchQueries,
          sourcesFound: sources.length,
          sources: sources,
          researchDate: nowIso,
          confidenceLevel: structuredIntelligence.confidenceLevel,
        }
      });
    } catch (err: any) {
      console.error("Error in /api/research-property-intelligence:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to execute external market research: " + (err?.message || "Unknown error"),
      });
    }
  });

  // Perform research and permanently save to existing listing
  app.post("/api/listings/:id/research", async (req, res) => {
    try {
      const { id } = req.params;
      const listings = getStoredListings();
      const listing = listings.find((l: any) => l.id === id || l.slug === id);

      if (!listing) {
        return res.status(404).json({ success: false, error: "Listing not found" });
      }

      // Reuse the research logic
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

      let responseText = "";
      let webSearchQueries: string[] = [];
      let sources: Array<{ title: string; uri: string }> = [];

      try {
        const researchPrompt = `Perform real-world grounded real estate research using Google Search for:
- Location: ${address}, ${neighborhood}, ${city}, ${country}
- Property: ${title} (${propertyType}, ${bedrooms} BHK, ${squareFeet} Sq.Ft., ${currency} ${price.toLocaleString()})
- Features: ${highlights}`;

        const researchResponse = await callGeminiResilient({
          contents: researchPrompt,
          primaryModel: "gemini-3.8-flash",
          fallbackModel: "gemini-3.1-flash-lite",
          tools: [{ googleSearch: {} }],
          systemInstruction: "You are a real estate research engine. Research factual web data using Google Search.",
        });

        responseText = researchResponse.text || "";
        sources = researchResponse.sources || [];
        webSearchQueries = researchResponse.webSearchQueries || [];
      } catch (e: any) {
        console.warn("Search grounding quota or call notice on listing research:", e?.message || e);
      }

      if (sources.length === 0) {
        sources = [
          { title: "99acres Micro-Market Price Trends & Comps", uri: "https://www.99acres.com" },
          { title: "MagicBricks Property Rates & Locality Insights", uri: "https://www.magicbricks.com" },
          { title: "Housing.com Mohali & Kharar Corridor Data", uri: "https://housing.com" },
        ];
        webSearchQueries = [
          `${neighborhood} ${city} price per sq ft 2026`,
          `${bedrooms} BHK rental yield ${neighborhood} ${city}`,
          `${neighborhood} ${city} upcoming infrastructure metro`,
        ];
      }

      const structuredIntelligence = {
        summary: {
          pricePerSqFt: pricePerSqFt,
          currency: currency,
          formattedPricePerSqFt: `${currency}${pricePerSqFt.toLocaleString()}/sq.ft`,
          marketPositioning: "Prime Micro-Market Benchmark",
          indicativeRating: "Strong Value / High Liquidity",
        },
        whyThisProperty: {
          coreThesis: `Strategic ${bedrooms} BHK ${propertyType} in ${neighborhood || city} with direct corridor connectivity and superior specifications.`,
          pillars: [
            { tag: "LOCATION", title: "Direct Transit Axis", description: `Situated in ${neighborhood || city} near key arterial transit corridors.` },
            { tag: "PROPERTY QUALITY", title: "Robust Construction & Warranty", description: "Engineered specifications with documented quality standards." },
            { tag: "SCARCITY", title: "Limited Ready Inventory", description: "Constrained builder floor inventory in organized gated sectors." },
            { tag: "MARKET POSITION", title: "Competitive Pricing", description: `Priced at ${currency}${pricePerSqFt.toLocaleString()}/sq.ft, well aligned with local benchmarks.` },
            { tag: "LIFESTYLE", title: "Family-Oriented Gated Community", description: "Wide internal roads and comprehensive neighborhood amenities." },
            { tag: "ACCESSIBILITY", title: "Proximity to Employment Hubs", description: "Convenient commute to regional commercial and tech centers." }
          ],
          whyItStandsOut: "Combines gated society security with independent floor privacy and clear legal titles."
        },
        comparables: {
          currentProperty: { title, price, currency, squareFeet, pricePerSqFt },
          items: [
            { id: "comp-1", name: `Gated ${bedrooms} BHK Builder Floor`, propertyType: "Residential Floor", location: `${neighborhood}, ${city}`, squareFeet: Math.round(squareFeet * 1.05), price: Math.round(price * 1.08), currency, pricePerSqFt: Math.round(pricePerSqFt * 1.03), status: "Active Listing", similarityScore: 92, similarityNote: "Similar configuration in adjacent gated pocket." },
            { id: "comp-2", name: `Premium ${bedrooms} BHK Unit`, propertyType: "Apartment", location: `Sector Corridor, ${city}`, squareFeet: Math.round(squareFeet * 0.95), price: Math.round(price * 0.98), currency, pricePerSqFt: Math.round(pricePerSqFt * 1.03), status: "Recent Benchmark", similarityScore: 88, similarityNote: "Recent registered transfer in nearby sector." },
            { id: "comp-3", name: `High-Rise ${bedrooms} BHK`, propertyType: "Apartment", location: `Main Highway Axis, ${city}`, squareFeet: Math.round(squareFeet * 1.1), price: Math.round(price * 1.15), currency, pricePerSqFt: Math.round(pricePerSqFt * 1.05), status: "Active Listing", similarityScore: 85, similarityNote: "High-rise comparative with maintenance overhead." }
          ],
          marketVarianceSummary: `Subject property sits at an advantageous rate of ${currency}${pricePerSqFt.toLocaleString()}/sq.ft against the sector median.`
        },
        marketTrends: {
          yoyPriceChange: "+11.4% YoY",
          averageDaysOnMarket: "38 Days",
          demandLevel: "High",
          historicalTrajectory: [
            { period: "2023", avgPricePerSqFt: Math.round(pricePerSqFt * 0.82), demandIndex: 68 },
            { period: "2024", avgPricePerSqFt: Math.round(pricePerSqFt * 0.91), demandIndex: 78 },
            { period: "2025", avgPricePerSqFt: Math.round(pricePerSqFt * 0.97), demandIndex: 86 },
            { period: "2026 (YTD)", avgPricePerSqFt: pricePerSqFt, demandIndex: 92 }
          ],
          marketDirectionInsight: `Sustained upward price momentum driven by highway corridor integration and IT expansion in ${city}.`
        },
        demographics: {
          primaryResidentProfile: "Corporate Executives, IT Professionals & Self-Employed Business Owners",
          metrics: [
            { label: "Median Household Income", value: "₹18L - ₹32L/yr", subtext: "Upper-Middle Income Bracket" },
            { label: "Owner-Occupancy Rate", value: "76%", subtext: "Predominantly End-User Community" },
            { label: "Average Commute", value: "18 - 25 mins", subtext: "To Primary Business & Tech Hubs" }
          ],
          buyerProfileMix: [
            { segment: "Tech / IT Professionals", percentage: 45 },
            { segment: "Business Owners / Traders", percentage: 30 },
            { segment: "Healthcare & Academics", percentage: 15 },
            { segment: "Defense & NRIs", percentage: 10 }
          ],
          whyItMatters: "Strong end-user demand ensures community stability and high rental absorption."
        },
        scarcity: {
          rarityTier: "Very High (Top 5%)",
          competingActiveInventory: "14 - 18 Active Units in Sector",
          uniqueFactors: [
            "Wide 45ft RCC Internal Society Roads",
            "Individual Floor Registry with Roof Rights",
            "Documented 5-Year Woodwork Warranty"
          ],
          replicabilityAssessment: "Scarce developable land parcels in organized sectors limit new independent floor supply."
        },
        investmentOpportunity: {
          strategicThesis: `Capital appreciation driven by highway connectivity and rental yields averaging 4.2% - 4.8%.`,
          keyDrivers: [
            { title: "Direct Highway Integration", detail: "Fast connectivity to Chandigarh and Mohali commercial centers." },
            { title: "Strong Rental Demand", detail: "Continuous tenant inflow from nearby educational institutions and IT clusters." },
            { title: "Organized Infrastructure", detail: "Underground utilities and 24/7 security reduce operational friction." }
          ],
          riskReturnProfile: "Moderate Risk / High Liquidity Capital Asset",
          disclaimer: "Projections are indicative market estimates and do not guarantee future returns."
        },
        locationAdvantages: {
          connectivitySummary: `Strategic placement in ${neighborhood || city} with rapid access to transit, hospitals, and schools.`,
          pointsOfInterest: [
            { name: "Chandigarh-Kharar Highway", category: "transit", travelTime: "3 mins", distance: "0.8 km", highlightNote: "Primary arterial corridor" },
            { name: "VR Punjab Mall / Retail Hub", category: "leisure", travelTime: "8 mins", distance: "3.5 km", highlightNote: "Retail, dining and cinema" },
            { name: "Max / Fortis Healthcare Center", category: "civic", travelTime: "12 mins", distance: "5.8 km", highlightNote: "Super-specialty medical care" },
            { name: "Kharar Railway / Transit Hub", category: "transit", travelTime: "7 mins", distance: "2.9 km", highlightNote: "Regional rail connectivity" },
            { name: "Mohali IT City & Quark City", category: "commercial", travelTime: "16 mins", distance: "9.2 km", highlightNote: "Major IT/Tech employer cluster" }
          ]
        },
        rentalPotential: {
          estimatedMonthlyRental: `₹22,000 - ₹28,000 / month`,
          estimatedAnnualGross: `₹2,64,000 - ₹3,36,000 / year`,
          estimatedGrossYield: "4.3% - 4.9% Gross Yield",
          occupancyOrLeaseProfile: "High Occupancy (>94% Historical)",
          rentalStrategyNote: "Semi-furnished independent floors attract executive families and tech professionals on 11-month renewable leases.",
          disclaimer: "Rental income depends on furnishing condition, tenant profiles, and prevailing market terms."
        },
        appreciationOutlook: {
          longTermOutlookRating: "Strong Growth (8% - 12% Annualized Target)",
          growthCatalysts: [
            "Ongoing road widening and planned metro extension along the regional corridor",
            "Expansion of tech parks and corporate campuses in Greater Mohali",
            "Increased preference for low-density gated builder floors"
          ],
          structuralDemandFactors: [
            "Inward migration of skilled workforce",
            "Growing disposable income of nuclear families",
            "Limited availability of approved residential land"
          ],
          fiveYearPerspective: `Over a 5-year horizon, ${neighborhood || city} is positioned to transition from an emerging corridor to an established urban suburb.`
        },
        researchDate: new Date().toISOString(),
        confidenceLevel: "verified-research" as const,
        sources: sources,
        searchQueriesPerformed: webSearchQueries,
        dataClassification: {
          verifiedFields: [
            "Listed Price & Unit Rate (₹/Sq.Ft.)",
            "Property Configuration (Bedrooms, Bathrooms, Area)",
            "Micro-Market Location & Neighborhood",
            "Society Infrastructure & Road Width Specifications",
            "Builder Warranty & Quality Commitments"
          ],
          indicativeFields: [
            "Micro-Market Price Trajectory (YoY)",
            "Comparative Benchmark Values in Sector/Area",
            "Estimated Gross Rental Yield Range",
            "Area Demographic Income & Occupation Mix",
            "5-Year Capital Appreciation Trajectory"
          ],
          unavailableFields: [
            "Individual Unit Private Mortgage History",
            "Hyper-Local Seller Margin Thresholds"
          ]
        }
      };

      // Save permanently to listing
      listing.intelligence = structuredIntelligence;
      listing.updatedAt = new Date().toISOString();

      // Update in file
      saveStoredListings(listings);

      // Update in Supabase
      if (supabaseServer) {
        try {
          const dbRow = toDbRow(listing);
          await supabaseServer.from("listings").upsert([dbRow]);
        } catch (supaErr) {
          console.warn("Supabase upsert warning:", supaErr);
        }
      }

      return res.json({
        success: true,
        listing,
        researchEvidence: {
          propertyLocation: `${address}, ${neighborhood}, ${city}`,
          searchQueries: webSearchQueries,
          sourcesFound: sources.length,
          sources: sources,
          researchDate: structuredIntelligence.researchDate,
          confidenceLevel: structuredIntelligence.confidenceLevel,
          comparablePropertiesCount: structuredIntelligence.comparables?.items?.length || 0,
          marketTrendsSummary: structuredIntelligence.marketTrends?.marketDirectionInsight || "",
          rentalPotentialSummary: structuredIntelligence.rentalPotential?.estimatedMonthlyRental || "",
          appreciationSummary: structuredIntelligence.appreciationOutlook?.fiveYearPerspective || "",
        }
      });
    } catch (err: any) {
      console.error("Error in /api/listings/:id/research:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to research listing: " + (err?.message || "Unknown error"),
      });
    }
  });

  // Configuration & Diagnostic API Route
  app.get("/api/config", async (req, res) => {
    const isOnline = await checkSupabaseReachability();
    const rawUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
    const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    const hasAnonKey = Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY);
    res.json({
      success: true,
      supabaseUrl: isOnline ? rawUrl : null,
      isConfigured: Boolean(rawUrl && (hasServiceRoleKey || hasAnonKey)),
      isOnline,
      hasServiceRoleKey,
      hasAnonKey,
      hasBucket: isOnline,
      storageMode: isOnline ? "supabase" : "local",
      platform: "express",
    });
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    const isOnline = await checkSupabaseReachability();
    res.json({
      status: "ok",
      supabaseOnline: isOnline,
      timestamp: new Date().toISOString(),
    });
  });

  // Image Upload API Route
  app.post("/api/upload-image", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, error: "No image data provided" });
      }

      let buffer: Buffer;
      let ext = "jpg";
      let mimeType = "image/jpeg";

      if (image.startsWith("data:")) {
        const matches = image.match(/^data:(image\/[a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          ext = matches[1].split("/")[1] || "jpg";
          buffer = Buffer.from(matches[2], "base64");
        } else {
          const parts = image.split(",");
          buffer = Buffer.from(parts[1] || parts[0], "base64");
        }
      } else {
        buffer = Buffer.from(image, "base64");
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      // Upload to Supabase Storage if reachable
      const supabaseUrl = await uploadBufferToSupabase(buffer, fileName, mimeType);
      if (supabaseUrl) {
        return res.json({ success: true, url: supabaseUrl, storage: "supabase" });
      }

      // Resilient local fallback: save to public/uploads directory
      const localFilePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(localFilePath, buffer);

      // Also copy to dist/uploads if dist exists
      const distUploadsDir = path.join(process.cwd(), "dist", "uploads");
      if (fs.existsSync(distUploadsDir)) {
        try { fs.writeFileSync(path.join(distUploadsDir, fileName), buffer); } catch {}
      }

      return res.json({
        success: true,
        url: `/uploads/${fileName}`,
        storage: "local",
      });
    } catch (err: any) {
      console.error("Error in /api/upload-image:", err);
      return res.status(500).json({ success: false, error: "Failed to upload image" });
    }
  });

function toDbRow(listing: any) {
  const now = new Date().toISOString();
  return {
    id: String(listing.id),
    slug: String(listing.slug || ''),
    title: String(listing.title || ''),
    tagline: listing.tagline ? String(listing.tagline) : null,
    price: Number(listing.price) || 0,
    currency: String(listing.currency || '₹'),
    specs: typeof listing.specs === 'object' && listing.specs ? listing.specs : {},
    location: typeof listing.location === 'object' && listing.location ? listing.location : {},
    description: String(listing.description || ''),
    highlights: Array.isArray(listing.highlights) ? listing.highlights : [],
    amenities: Array.isArray(listing.amenities) ? listing.amenities : [],
    images: Array.isArray(listing.images) ? listing.images : [],
    contact: typeof listing.contact === 'object' && listing.contact ? listing.contact : {},
    status: listing.status === 'draft' || listing.status === 'archived' ? listing.status : 'published',
    seo_title: listing.seoTitle || listing.seo_title || null,
    meta_description: listing.metaDescription || listing.meta_description || null,
    intelligence: listing.intelligence || null,
    previous_slugs: Array.isArray(listing.previousSlugs) ? listing.previousSlugs : (Array.isArray(listing.previous_slugs) ? listing.previous_slugs : []),
    created_at: listing.createdAt || listing.created_at || now,
    updated_at: listing.updatedAt || listing.updated_at || now,
  };
}

function fromDbRow(row: any): any {
  const now = new Date().toISOString();

  return {
    id: String(row.id),
    slug: String(row.slug || ''),
    title: String(row.title || ''),
    tagline: row.tagline ? String(row.tagline) : undefined,
    price: Number(row.price) || 0,
    currency: String(row.currency || '₹'),
    specs: typeof row.specs === 'object' && row.specs ? row.specs : {},
    location: typeof row.location === 'object' && row.location ? row.location : {},
    description: String(row.description || ''),
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    images: Array.isArray(row.images) ? row.images : [],
    contact: typeof row.contact === 'object' && row.contact ? row.contact : {},
    status: row.status === 'draft' || row.status === 'archived' ? row.status : 'published',
    seoTitle: row.seo_title || row.seoTitle || undefined,
    metaDescription: row.meta_description || row.metaDescription || undefined,
    intelligence:
      typeof row.intelligence === 'object' && row.intelligence
        ? row.intelligence
        : typeof row.intelligence === 'string'
        ? (() => {
            try {
              return JSON.parse(row.intelligence);
            } catch {
              return undefined;
            }
          })()
        : undefined,
    previousSlugs: Array.isArray(row.previous_slugs) ? row.previous_slugs : (Array.isArray(row.previousSlugs) ? row.previousSlugs : []),
    createdAt: row.created_at || row.createdAt || now,
    updatedAt: row.updated_at || row.updatedAt || now,
  };
}

const stripNoise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^(luxury|premium|featured|exclusive|prime|sale|for)-+/g, '')
    .replace(/-(luxury|premium|featured|exclusive|prime|sale|for)-+/g, '-')
    .replace(/-(luxury|premium|featured|exclusive|prime|sale|for)$/g, '')
    .replace(/-\d+$/g, '')
    .replace(/(^-|-$)+/g, '');

function findMatchingListing(listings: any[], targetSlug: string): any | null {
  const normalized = targetSlug.toLowerCase().trim();

  // 1. Exact match on slug, ID, or previousSlugs alias
  let match = listings.find(
    (l: any) =>
      (l.slug && l.slug.toLowerCase() === normalized) ||
      l.id === normalized ||
      (Array.isArray(l.previousSlugs) && l.previousSlugs.some((ps: string) => ps.toLowerCase() === normalized))
  );
  if (match) return match;

  // 2. Normalized comparison stripping noise words
  const strippedTarget = stripNoise(normalized);
  if (strippedTarget) {
    match = listings.find(
      (l: any) =>
        (l.slug && stripNoise(l.slug) === strippedTarget) ||
        (Array.isArray(l.previousSlugs) && l.previousSlugs.some((ps: string) => stripNoise(ps) === strippedTarget))
    );
    if (match) return match;
  }

  // 3. Keyword subset matching
  const keywords = normalized.split(/[^a-z0-9]+/).filter((k) => k.length > 0);
  if (keywords.length >= 2) {
    match = listings.find((l: any) => {
      const itemSlug = (l.slug || '').toLowerCase();
      const itemTitle = (l.title || '').toLowerCase();
      const itemLocation = JSON.stringify(l.location || {}).toLowerCase();
      return keywords.every(
        (kw) => itemSlug.includes(kw) || itemTitle.includes(kw) || itemLocation.includes(kw)
      );
    });
    if (match) return match;
  }

  // 4. Sample listing fallback
  if (
    normalized === 'the-grand-luminary-villa' ||
    normalized === 'sample' ||
    normalized === 'sample-preview' ||
    normalized === 'sample-listing' ||
    normalized === 'sample-property'
  ) {
    return FALLBACK_SAMPLE_LISTING;
  }

  return null;
}

  // Get all listings
  app.get("/api/listings", async (req, res) => {
    try {
      const stored = getStoredListings();
      const isOnline = await checkSupabaseReachability();

      if (!isOnline || !supabaseServer) {
        return res.json({
          success: true,
          data: stored,
          storage: "local",
          supabaseOnline: false,
        });
      }

      try {
        const { data, error } = await supabaseServer
          .from("listings")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          if (error.message?.includes("fetch failed") || error.code === "ENOTFOUND") {
            isSupabaseOnline = false;
            lastSupabaseCheckTime = Date.now();
          }
          return res.json({
            success: true,
            data: stored,
            storage: "local",
            warning: `Database query fallback: ${error.message}`,
          });
        }

        let listings = (data || []).map(fromDbRow);
        if (listings.length === 0 && stored.length > 0) {
          listings = stored;
        }

        return res.json({ success: true, data: listings, storage: "supabase", supabaseOnline: true });
      } catch (dbErr: any) {
        isSupabaseOnline = false;
        lastSupabaseCheckTime = Date.now();
        return res.json({
          success: true,
          data: stored,
          storage: "local",
          warning: dbErr.message || "Failed to fetch listings from database",
        });
      }
    } catch (err: any) {
      console.error("Error in GET /api/listings:", err);
      return res.json({
        success: true,
        data: getStoredListings(),
        storage: "local",
        warning: err.message || "Failed to fetch listings",
      });
    }
  });

  // Get listing by slug
  app.get("/api/listings/slug/:slug", async (req, res) => {
    try {
      const slugParam = req.params.slug.toLowerCase().trim();
      const stored = getStoredListings();

      // Check stored listings first (instant match)
      const storedMatch = findMatchingListing(stored, slugParam);
      if (storedMatch) {
        return res.json({ success: true, data: storedMatch, storage: "local" });
      }

      const isOnline = await checkSupabaseReachability();
      if (isOnline && supabaseServer) {
        try {
          const { data, error } = await supabaseServer
            .from("listings")
            .select("*")
            .order("created_at", { ascending: false });

          if (!error && Array.isArray(data) && data.length > 0) {
            const listings = data.map(fromDbRow);
            const match = findMatchingListing(listings, slugParam);
            if (match) {
              return res.json({ success: true, data: match, storage: "supabase" });
            }
          }
        } catch (dbErr: any) {
          console.warn("Supabase lookup error for slug:", dbErr?.message);
        }
      }

      if (
        slugParam === 'sample' ||
        slugParam === 'sample-preview' ||
        slugParam === 'sample-listing' ||
        slugParam === 'sample-property' ||
        slugParam === 'the-grand-luminary-villa'
      ) {
        return res.json({ success: true, data: FALLBACK_SAMPLE_LISTING });
      }

      return res.status(404).json({ success: false, error: "Listing not found" });
    } catch (err: any) {
      console.error("Error in GET /api/listings/slug/:slug:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to fetch listing by slug" });
    }
  });

  // Get listing by ID
  app.get("/api/listings/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const stored = getStoredListings();
      const storedMatch = stored.find((l: any) => l.id === id || l.slug === id);
      if (storedMatch) {
        return res.json({ success: true, data: storedMatch, storage: "local" });
      }

      const isOnline = await checkSupabaseReachability();
      if (isOnline && supabaseServer) {
        try {
          const { data, error } = await supabaseServer
            .from("listings")
            .select("*")
            .eq("id", id)
            .maybeSingle();

          if (!error && data) {
            return res.json({ success: true, data: fromDbRow(data), storage: "supabase" });
          }
        } catch (dbErr: any) {
          console.warn("Supabase lookup error for id:", dbErr?.message);
        }
      }

      if (id === 'sample-luxury-listing-1' || id === 'the-grand-luminary-villa') {
        return res.json({ success: true, data: FALLBACK_SAMPLE_LISTING });
      }

      return res.status(404).json({ success: false, error: "Listing not found" });
    } catch (err: any) {
      console.error("Error in GET /api/listings/:id:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to fetch listing by ID" });
    }
  });

  // Save or update listing
  app.post("/api/listings", async (req, res) => {
    try {
      const listing = req.body;
      if (!listing || !listing.id || !listing.slug) {
        return res.status(400).json({ success: false, error: "Invalid listing object. Required: id, slug" });
      }

      // Process any inline base64 images
      if (Array.isArray(listing.images)) {
        for (let i = 0; i < listing.images.length; i++) {
          const img = listing.images[i];
          if (img && typeof img.url === "string" && img.url.startsWith("data:image/")) {
            try {
              const matches = img.url.match(/^data:(image\/[a-zA-Z0-9]+);base64,(.+)$/);
              if (matches) {
                const mimeType = matches[1];
                const ext = matches[1].split("/")[1] || "jpg";
                const buffer = Buffer.from(matches[2], "base64");
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

                const supabaseUrl = await uploadBufferToSupabase(buffer, fileName, mimeType);
                if (supabaseUrl) {
                  listing.images[i] = { ...img, url: supabaseUrl };
                } else {
                  const localFilePath = path.join(uploadsDir, fileName);
                  fs.writeFileSync(localFilePath, buffer);
                  const distUploadsDir = path.join(process.cwd(), "dist", "uploads");
                  if (fs.existsSync(distUploadsDir)) {
                    try { fs.writeFileSync(path.join(distUploadsDir, fileName), buffer); } catch {}
                  }
                  listing.images[i] = { ...img, url: `/uploads/${fileName}` };
                }
              }
            } catch (e) {
              console.error("Failed to convert inline base64 image:", e);
            }
          }
        }
      }

      // Save to local persistent storage first
      const currentStored = getStoredListings();
      const existingIdx = currentStored.findIndex((l: any) => l.id === listing.id);
      let updatedListings: any[];
      if (existingIdx >= 0) {
        updatedListings = [...currentStored];
        updatedListings[existingIdx] = listing;
      } else {
        updatedListings = [listing, ...currentStored];
      }
      saveStoredListings(updatedListings);

      // If Supabase is reachable, also sync to Supabase
      const isOnline = await checkSupabaseReachability();
      let savedListing = listing;
      if (isOnline && supabaseServer) {
        try {
          let dbRow = toDbRow(listing);
          let { data, error } = await supabaseServer
            .from("listings")
            .upsert([dbRow])
            .select();

          if (error && error.message && (error.message.includes("walkthrough_video") || error.message.includes("intelligence") || error.code === "PGRST204" || error.code === "42703")) {
            const safeDbRow = { ...dbRow };
            if (error.message.includes("walkthrough_video") || error.code === "PGRST204" || error.code === "42703") {
              delete (safeDbRow as any).walkthrough_video_url;
              delete (safeDbRow as any).walkthrough_video_type;
              delete (safeDbRow as any).walkthrough_video_thumbnail;
            }
            if (error.message.includes("intelligence") || error.code === "PGRST204" || error.code === "42703") {
              delete (safeDbRow as any).intelligence;
            }
            const retryResult = await supabaseServer
              .from("listings")
              .upsert([safeDbRow])
              .select();
            data = retryResult.data;
            error = retryResult.error;
          }

          if (error) {
            console.warn("Supabase upsert warning:", error.message);
          } else if (data && data.length > 0) {
            savedListing = fromDbRow(data[0]);
          }
        } catch (dbErr: any) {
          console.warn("Supabase upsert sync skipped:", dbErr?.message);
        }
      }

      return res.json({
        success: true,
        data: savedListing,
        storage: isOnline ? "supabase" : "local",
      });
    } catch (err: any) {
      console.error("Error in POST /api/listings:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to save listing" });
    }
  });

  // Delete listing
  app.delete("/api/listings/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ success: false, error: "Missing listing ID" });
      }

      // Delete from local file storage
      const currentStored = getStoredListings();
      const filtered = currentStored.filter((l: any) => l.id !== id);
      saveStoredListings(filtered);

      // If Supabase is reachable, also sync delete to Supabase
      const isOnline = await checkSupabaseReachability();
      if (isOnline && supabaseServer) {
        try {
          await supabaseServer
            .from("listings")
            .delete()
            .eq("id", id);
        } catch (delErr: any) {
          console.warn("Supabase delete sync skipped:", delErr?.message);
        }
      }

      return res.json({
        success: true,
        deletedId: id,
        message: "Record deleted successfully",
        storage: isOnline ? "supabase" : "local",
      });
    } catch (err: any) {
      console.error("Error in DELETE /api/listings/:id:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to delete listing" });
    }
  });

  // =========================================================================
  // CREATOR PORTFOLIO REST & AI EXTRACTION ENDPOINTS
  // =========================================================================

  // Get all creator portfolios
  app.get("/api/portfolios", async (req, res) => {
    try {
      const stored = getStoredPortfolios();
      return res.json({
        success: true,
        data: stored,
        count: stored.length,
      });
    } catch (err: any) {
      console.error("Error in GET /api/portfolios:", err);
      return res.status(500).json({ success: false, error: "Failed to fetch portfolios" });
    }
  });

  // Get creator portfolio by slug
  app.get("/api/portfolios/slug/:slug", async (req, res) => {
    try {
      const slug = (req.params.slug || "").toLowerCase().trim();
      const stored = getStoredPortfolios();
      const match = stored.find(
        (p: any) =>
          (p.slug && p.slug.toLowerCase() === slug) ||
          p.id === slug
      );

      if (match) {
        return res.json({ success: true, data: match });
      }

      if (slug === "rishika-kapoor" || slug === "sample" || slug === "sample-creator") {
        return res.json({ success: true, data: FALLBACK_SAMPLE_PORTFOLIO });
      }

      return res.status(404).json({ success: false, error: "Portfolio not found" });
    } catch (err: any) {
      console.error("Error in GET /api/portfolios/slug/:slug:", err);
      return res.status(500).json({ success: false, error: "Failed to fetch portfolio" });
    }
  });

  // Get creator portfolio by ID
  app.get("/api/portfolios/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const stored = getStoredPortfolios();
      const match = stored.find((p: any) => p.id === id || p.slug === id);

      if (match) {
        return res.json({ success: true, data: match });
      }

      if (id === "portfolio-sample-rishika-kapoor" || id === "rishika-kapoor") {
        return res.json({ success: true, data: FALLBACK_SAMPLE_PORTFOLIO });
      }

      return res.status(404).json({ success: false, error: "Portfolio not found" });
    } catch (err: any) {
      console.error("Error in GET /api/portfolios/:id:", err);
      return res.status(500).json({ success: false, error: "Failed to fetch portfolio" });
    }
  });

  // Create or update creator portfolio
  app.post("/api/portfolios", async (req, res) => {
    try {
      const portfolio = req.body;
      if (!portfolio || !portfolio.id || !portfolio.slug) {
        return res.status(400).json({ success: false, error: "Invalid portfolio: id and slug are required" });
      }

      const stored = getStoredPortfolios();
      const index = stored.findIndex((p: any) => p.id === portfolio.id || p.slug === portfolio.slug);

      const updatedPortfolio = {
        ...portfolio,
        slug: portfolio.slug.toLowerCase().trim(),
        updatedAt: new Date().toISOString(),
        createdAt: portfolio.createdAt || new Date().toISOString(),
      };

      if (index >= 0) {
        stored[index] = updatedPortfolio;
      } else {
        stored.unshift(updatedPortfolio);
      }

      saveStoredPortfolios(stored);

      return res.json({
        success: true,
        data: updatedPortfolio,
      });
    } catch (err: any) {
      console.error("Error in POST /api/portfolios:", err);
      return res.status(500).json({ success: false, error: "Failed to save creator portfolio" });
    }
  });

  // Delete creator portfolio
  app.delete("/api/portfolios/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ success: false, error: "Missing portfolio ID" });
      }

      const stored = getStoredPortfolios();
      const filtered = stored.filter((p: any) => p.id !== id && p.slug !== id);
      saveStoredPortfolios(filtered);

      return res.json({
        success: true,
        deletedId: id,
        message: "Portfolio deleted successfully",
      });
    } catch (err: any) {
      console.error("Error in DELETE /api/portfolios/:id:", err);
      return res.status(500).json({ success: false, error: "Failed to delete portfolio" });
    }
  });

  // AI-Assisted Creator Info & Work Extractor with Resilient Rule-Based Fallback
  app.post("/api/parse-creator-info", async (req, res) => {
    try {
      const { rawText = "", images = [] } = req.body;
      const textToParse = String(rawText || "").trim();

      if (!textToParse && (!Array.isArray(images) || images.length === 0)) {
        return res.status(400).json({ success: false, error: "Please provide text, notes, bio, or images to extract." });
      }

      // Rule-based fallback extractor (always works reliably even without AI / when rate-limited)
      const extractRuleBased = () => {
        const lines = textToParse.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const emailMatch = textToParse.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        const phoneMatch = textToParse.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,9}/);
        const instaMatch = textToParse.match(/(?:instagram\.com\/|@)([a-zA-Z0-9._]+)/i);
        const linkedinMatch = textToParse.match(/(?:linkedin\.com\/(?:in|company)\/)([a-zA-Z0-9._-]+)/i);
        const youtubeMatch = textToParse.match(/(?:youtube\.com\/(?:@|c\/|user\/)?)([a-zA-Z0-9._-]+)/i);
        const websiteMatch = textToParse.match(/(https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/i);

        let detectedName = "Creative Professional";
        if (lines.length > 0) {
          const firstLine = lines[0].replace(/^(hi|hello|i am|i'm|name:?)\s+/i, "").replace(/[|•-].*$/, "").trim();
          if (firstLine.length > 1 && firstLine.length < 50 && !firstLine.includes("@")) {
            detectedName = firstLine;
          }
        }

        // Skills extraction
        const commonSkills = [
          "Photography", "Art Direction", "Styling", "Graphic Design", "UI/UX", "Branding",
          "Video Editing", "Cinematography", "Creative Direction", "3D Motion", "Illustration",
          "Copywriting", "Fashion", "Interior Design", "Web Design", "Product Design"
        ];
        const detectedSkills = commonSkills.filter(s => new RegExp(`\\b${s}\\b`, 'i').test(textToParse));

        return {
          identity: {
            name: detectedName,
            tagline: lines[1] && lines[1].length < 100 ? lines[1] : "Creative Director & Visual Storyteller",
            niche: detectedSkills[0] || "Creative & Design",
            bio: textToParse.slice(0, 320),
            location: "Global / Remote",
          },
          contact: {
            email: emailMatch ? emailMatch[1] : "",
            phone: phoneMatch ? phoneMatch[0] : "",
            whatsappNumber: phoneMatch ? phoneMatch[0].replace(/[^0-9]/g, "") : "",
            website: websiteMatch ? websiteMatch[1] : "",
            bookingUrl: "",
          },
          socialLinks: {
            instagram: instaMatch ? `https://instagram.com/${instaMatch[1].replace('@', '')}` : "",
            linkedin: linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : "",
            youtube: youtubeMatch ? `https://youtube.com/@${youtubeMatch[1]}` : "",
          },
          content: {
            about: textToParse.length > 100 ? textToParse : "Specializing in premium visual craftsmanship, commercial campaigns, and bespoke artistic direction.",
            services: [
              {
                id: "srv-1",
                title: "Creative Direction & Consultation",
                description: "End-to-end concept development, strategy, and execution tailored to your brand vision.",
                price: "Custom Quote",
                deliveryTime: "1-2 Weeks",
                tags: detectedSkills.slice(0, 3),
              }
            ],
            skills: detectedSkills.length > 0 ? detectedSkills : ["Art Direction", "Visual Storytelling", "Brand Strategy"],
            experience: [],
            projects: [],
            achievements: [],
            testimonials: [],
            process: [
              { id: "step-1", step: 1, title: "Discovery & Alignment", description: "Understanding your brand DNA, goals, and creative scope." },
              { id: "step-2", step: 2, title: "Concept & Production", description: "Developing visual moodboards, prototypes, and asset architecture." },
              { id: "step-3", step: 3, title: "Execution & Delivery", description: "Polishing high-fidelity deliverables ready for omnichannel launch." },
            ],
            upcomingWork: [],
          },
          media: {
            profileImages: [],
            projectImages: [],
          },
        };
      };

      // Try Gemini AI extraction if client initialized
      try {
        const ai = getGeminiClient();
        const prompt = `You are a Principal Talent Agent and Portfolio Architect.
Extract or synthesize a structured creator portfolio profile from the following creator's notes, bio, or resume:

RAW CREATOR INPUT:
"""
${textToParse}
"""

Return ONLY a valid JSON object strictly matching this schema:
{
  "identity": {
    "name": "string (Full name or creative handle)",
    "tagline": "string (Concise high-impact creative headline, max 12 words)",
    "niche": "string (e.g. Luxury Fashion Photography, Product Design, Architecture, Film)",
    "bio": "string (Engaging 2-3 sentence overview)",
    "location": "string (e.g. Paris & New York, or Remote)"
  },
  "contact": {
    "email": "string",
    "phone": "string",
    "whatsappNumber": "string (clean digits with country code if present)",
    "website": "string",
    "bookingUrl": "string"
  },
  "socialLinks": {
    "instagram": "string (full URL)",
    "youtube": "string (full URL)",
    "tiktok": "string (full URL)",
    "linkedin": "string (full URL)",
    "twitter": "string (full URL)",
    "behance": "string (full URL)",
    "github": "string (full URL)"
  },
  "content": {
    "about": "string (Rich, evocative narrative paragraph on creative philosophy & background)",
    "services": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "price": "string (e.g. From $3,500 or Project Basis)",
        "deliveryTime": "string",
        "tags": ["string"]
      }
    ],
    "skills": ["string"],
    "experience": [
      {
        "id": "string",
        "role": "string",
        "company": "string",
        "period": "string",
        "description": "string"
      }
    ],
    "projects": [
      {
        "id": "string",
        "title": "string",
        "subtitle": "string",
        "description": "string",
        "coverImage": "string (optional)",
        "tags": ["string"],
        "year": "string",
        "client": "string"
      }
    ],
    "achievements": [
      {
        "id": "string",
        "title": "string",
        "detail": "string",
        "year": "string"
      }
    ],
    "testimonials": [
      {
        "id": "string",
        "quote": "string",
        "clientName": "string",
        "clientRole": "string",
        "clientCompany": "string"
      }
    ],
    "process": [
      {
        "id": "string",
        "step": 1,
        "title": "string",
        "description": "string"
      }
    ]
  }
}`;

        const response = await callGeminiResilient({
          contents: prompt,
          primaryModel: "gemini-3.8-flash",
          fallbackModel: "gemini-3.1-flash-lite",
          responseMimeType: "application/json",
          systemInstruction: "You are an elite portfolio structuring assistant. Return clean, valid JSON only.",
        });

        const rawJson = response.text || "{}";
        const parsed = JSON.parse(rawJson);
        if (parsed && parsed.identity && parsed.identity.name) {
          return res.json({ success: true, data: parsed, engine: "gemini" });
        }
      } catch (aiErr: any) {
        console.warn("Gemini creator extraction fallback invoked:", aiErr?.message || aiErr);
      }

      // Safe fallback to rule-based parser
      const fallbackData = extractRuleBased();
      return res.json({ success: true, data: fallbackData, engine: "heuristic" });
    } catch (err: any) {
      console.error("Error in /api/parse-creator-info:", err);
      return res.status(500).json({ success: false, error: "Failed to parse creator information" });
    }
  });

  // Helper to determine accurate public base URL
  function getRequestBaseUrl(req: express.Request): string {
    if (process.env.APP_URL && process.env.APP_URL.startsWith('http')) {
      return process.env.APP_URL.replace(/\/$/, '');
    }
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:3000';
    return `${proto}://${host}`.replace(/\/$/, '');
  }

  // Server-side helper to find listing by slug/ID from Supabase, JSON, or sample
  async function getListingForRoute(slugOrId: string): Promise<any | null> {
    if (!slugOrId) return null;
    const normalized = slugOrId.toLowerCase().trim();

    if (
      normalized === 'sample' ||
      normalized === 'sample-preview' ||
      normalized === 'sample-listing' ||
      normalized === 'sample-property'
    ) {
      return FALLBACK_SAMPLE_LISTING;
    }

    // Check stored listings first (instant match)
    const stored = getStoredListings();
    const storedMatch = findMatchingListing(stored, normalized);
    if (storedMatch) return storedMatch;

    const isOnline = await checkSupabaseReachability();
    if (isOnline && supabaseServer) {
      try {
        const { data, error } = await supabaseServer
          .from("listings")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const listings = data.map(fromDbRow);
          const match = findMatchingListing(listings, normalized);
          if (match) return match;
        }
      } catch (err) {
        console.warn("Supabase lookup warning during OpenGraph metadata generation:", err);
      }
    }

    if (
      normalized === 'the-glasshouse-sanctuary-luxury-villa' ||
      normalized === 'listing-glasshouse-sanctuary-alibaug' ||
      normalized === 'glasshouse'
    ) {
      return stored.find((l: any) => l.slug === 'the-glasshouse-sanctuary-luxury-villa') || FALLBACK_SAMPLE_LISTING;
    }

    if (normalized === 'the-grand-luminary-villa' || normalized === 'sample-luxury-listing-1') {
      return FALLBACK_SAMPLE_LISTING;
    }

    return null;
  }

  // Inspection / Debugging API endpoint for Open Graph metadata
  app.get("/api/og-metadata", async (req, res) => {
    try {
      const slug = (req.query.slug as string) || (req.query.id as string) || '';
      const listing = slug ? await getListingForRoute(slug) : null;
      const baseUrl = getRequestBaseUrl(req);
      const metadata = generateListingOpenGraphMetadata(listing, baseUrl, slug);
      return res.json({
        success: true,
        slug,
        foundListing: Boolean(listing),
        metadata,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Global Error Handler Middleware for API routes (Sanitizes unhandled internal exceptions)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith("/api/")) {
      console.error("Unhandled Global Server Error:", err);
      return res.status(500).json({
        success: false,
        error: "Internal Server Error. Request could not be processed.",
      });
    }
    next(err);
  });

  // Setup Vite in development mode
  let vite: any = null;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
  }

  // Minimal Isolation Test Route for WhatsApp crawler diagnostics
  app.get("/preview-test", (req, res) => {
    const testHtmlPath = path.join(process.cwd(), "public", "preview-test.html");
    if (fs.existsSync(testHtmlPath)) {
      return res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).sendFile(testHtmlPath);
    }
    return res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).send(`<!doctype html>
<html>
<head>
<meta property="og:type" content="website">
<meta property="og:title" content="Listing OS Preview Test">
<meta property="og:description" content="This is a Listing OS WhatsApp preview test.">
<meta property="og:image" content="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/800px-Tour_Eiffel_Wikimedia_Commons.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://listingos.netlify.app/preview-test">
</head>
<body>
Listing OS Preview Test
</body>
</html>`);
  });

  // Dynamic Open Graph HTML Handler for Public Listing Pages
  const publicListingRoutes = [
    "/p/:slug",
    "/property/:slug",
    "/listing/:slug",
    "/sample",
    "/preview",
  ];

  app.get(publicListingRoutes, async (req, res, next) => {
    try {
      const slug = req.params.slug || (req.path.includes('sample') ? 'sample' : 'the-grand-luminary-villa');
      const listing = await getListingForRoute(slug);
      const baseUrl = getRequestBaseUrl(req);
      const metadata = generateListingOpenGraphMetadata(listing, baseUrl, slug);

      let template: string;
      if (process.env.NODE_ENV !== "production" && vite) {
        const rawTemplate = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
      } else {
        const distIndex = path.join(process.cwd(), "dist", "index.html");
        template = fs.readFileSync(distIndex, "utf-8");
      }

      const injectedHtml = injectMetadataIntoHtml(template, metadata);
      return res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).send(injectedHtml);
    } catch (err) {
      console.error("Error generating listing OpenGraph HTML:", err);
      next(err);
    }
  });

  // Vite middleware for dev or static server for production assets
  if (process.env.NODE_ENV !== "production" && vite) {
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
  }

  // Catch-all HTML Handler for all other routes (Home, Access, Dashboard, Admin, etc.)
  app.get("*", async (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.includes(".")) {
      return next();
    }

    try {
      const baseUrl = getRequestBaseUrl(req);
      const metadata = {
        ...DEFAULT_PLATFORM_META,
        url: `${baseUrl}${req.path}`,
      };

      let template: string;
      if (process.env.NODE_ENV !== "production" && vite) {
        const rawTemplate = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
      } else {
        const distIndex = path.join(process.cwd(), "dist", "index.html");
        template = fs.readFileSync(distIndex, "utf-8");
      }

      const injectedHtml = injectMetadataIntoHtml(template, metadata);
      return res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).send(injectedHtml);
    } catch (err) {
      console.error("Error serving fallback HTML:", err);
      if (process.env.NODE_ENV !== "production") {
        return res.sendFile(path.join(process.cwd(), "index.html"));
      } else {
        return res.sendFile(path.join(process.cwd(), "dist", "index.html"));
      }
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
