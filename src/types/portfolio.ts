export interface CreatorIdentity {
  name: string;
  tagline?: string;
  profilePhoto?: string;
  niche: string;
  bio: string;
  location?: string;
}

export interface CreatorContact {
  email: string;
  phone?: string;
  whatsappNumber?: string;
  website?: string;
  bookingUrl?: string;
}

export interface CreatorSocialLinks {
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  behance?: string;
  dribbble?: string;
  other?: { label: string; url: string }[];
}

export interface CreatorService {
  id: string;
  title: string;
  description: string;
  price?: string;
  deliveryTime?: string;
  tags?: string[];
}

export interface CreatorExperience {
  id: string;
  role: string;
  company: string;
  period: string;
  description?: string;
}

export interface CreatorProject {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  coverImage?: string;
  images?: string[];
  link?: string;
  tags?: string[];
  year?: string;
  client?: string;
}

export interface CreatorAchievement {
  id: string;
  title: string;
  detail: string;
  year?: string;
}

export interface CreatorTestimonial {
  id: string;
  quote: string;
  clientName: string;
  clientRole?: string;
  clientCompany?: string;
  avatar?: string;
}

export interface CreatorProcessStep {
  id: string;
  step: number;
  title: string;
  description: string;
}

export interface CreatorContent {
  about?: string;
  services?: CreatorService[];
  skills?: string[];
  experience?: CreatorExperience[];
  projects?: CreatorProject[];
  achievements?: CreatorAchievement[];
  testimonials?: CreatorTestimonial[];
  process?: CreatorProcessStep[];
  upcomingWork?: string[];
}

export interface CreatorMediaItem {
  id: string;
  url: string;
  caption?: string;
  category?: 'profile' | 'project' | 'screenshot' | 'asset';
  isPrimary?: boolean;
}

export interface CreatorMedia {
  profileImages?: CreatorMediaItem[];
  projectImages?: CreatorMediaItem[];
  socialScreenshots?: CreatorMediaItem[];
  otherAssets?: CreatorMediaItem[];
}

export interface CreatorSeo {
  title?: string;
  metaDescription?: string;
  ogImage?: string;
}

/**
 * Normalized CreatorProfile Schema
 * Decoupled from visual presentation and future renderers (Web, PDF, Slideshow).
 */
export interface CreatorProfile {
  id: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  templateId: 'default' | 'minimal' | 'editorial' | string;
  identity: CreatorIdentity;
  contact: CreatorContact;
  socialLinks: CreatorSocialLinks;
  content: CreatorContent;
  media: CreatorMedia;
  seo?: CreatorSeo;
  createdAt: string;
  updatedAt: string;
}

export type ServiceType = 'listing' | 'portfolio';
