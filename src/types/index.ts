export interface PropertySpec {
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  propertyType: 'Villa' | 'Penthouse' | 'Apartment' | 'Estate' | 'Townhouse' | string;
  yearBuilt?: number;
  parkingSpaces?: number;
  lotSize?: string;
}

export type PropertySpecs = PropertySpec;

export interface LocationDetail {
  address: string;
  neighborhood: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  nearbyHighlights?: string[];
}

export type PropertyLocation = LocationDetail;

export interface ContactDetail {
  agentName: string;
  agentRole: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  agencyName: string;
  avatarUrl?: string;
}

export type AgentContact = ContactDetail;

export interface PropertyImage {
  id: string;
  url: string;
  caption?: string;
  category?: 'Exterior' | 'Living Room' | 'Kitchen' | 'Bedroom' | 'Bathroom' | 'Balcony' | 'Amenities' | 'Other' | string;
  isCover?: boolean;
  order: number;
}

export interface PropertyListing {
  id: string;
  slug: string;
  title: string;
  tagline?: string;
  price: number;
  currency: string;
  specs: PropertySpec;
  location: LocationDetail;
  description: string;
  highlights: string[];
  amenities: string[];
  images: PropertyImage[];
  contact: ContactDetail;
  status: 'draft' | 'published' | 'archived';
  seoTitle?: string;
  metaDescription?: string;
  // Optional Walkthrough Video Fields
  walkthrough_video_url?: string | null;
  walkthrough_video_type?: string | null;
  walkthrough_video_thumbnail?: string | null;
  walkthroughVideoUrl?: string | null;
  walkthroughVideoType?: string | null;
  walkthroughVideoThumbnail?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
  } | null;
}
