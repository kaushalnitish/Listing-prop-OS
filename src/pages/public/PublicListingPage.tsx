import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { getListingBySlug, getListingById, sampleListings } from '../../lib/storage';
import { PropertyListing } from '../../types';

import { HeroGallery } from '../../components/public/HeroGallery';
import { PropertySpecs } from '../../components/public/PropertySpecs';
import { PropertyStory } from '../../components/public/PropertyStory';
import { GalleryGrid } from '../../components/public/GalleryGrid';
import { LocationMap } from '../../components/public/LocationMap';
import { StickyActionBar } from '../../components/public/StickyActionBar';
import { ImageLightboxModal } from '../../components/public/ImageLightboxModal';
import { NotFoundListing } from '../../components/public/NotFoundListing';
import { ListingSkeleton } from '../../components/public/ListingSkeleton';

export const PublicListingPage: React.FC = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const [listing, setListing] = useState<PropertyListing | null>(null);
  const [loading, setLoading] = useState(true);

  // Lightbox Modal state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Dynamic SEO & OpenGraph metadata injection
  useEffect(() => {
    if (!listing) return;

    const pageTitle = listing.seoTitle || `${listing.title} | ${listing.location?.city || 'Luxury'} Real Estate`;
    const metaDesc = listing.metaDescription || listing.tagline || listing.description?.slice(0, 155) || '';
    const coverImage = listing.images?.find((img) => img.isCover)?.url || listing.images?.[0]?.url || '';

    document.title = pageTitle;

    const setMetaTag = (selector: string, attrName: string, attrVal: string, contentVal: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentVal);
    };

    setMetaTag('meta[name="description"]', 'name', 'description', metaDesc);
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', pageTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', metaDesc);
    if (coverImage) setMetaTag('meta[property="og:image"]', 'property', 'og:image', coverImage);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', window.location.href);
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', pageTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', metaDesc);
    if (coverImage) setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', coverImage);

    return () => {
      document.title = 'Lumina Studio | Luxury Real Estate';
    };
  }, [listing]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchListing = async () => {
      let found: PropertyListing | null = null;

      console.log(`[DEBUG PIPELINE 5 & 6] PublicListingPage mounted with params - slug: "${slug}", id: "${id}"`);

      if (id) {
        console.log(`[DEBUG PIPELINE 6] Fetching by ID: "${id}"`);
        found = await getListingById(id);
      } else if (slug) {
        console.log(`[DEBUG PIPELINE 6] Fetching by Slug: "${slug}"`);
        found = await getListingBySlug(slug);
      }

      console.log(`[DEBUG PIPELINE 6 & 8] Result returned to PublicListingPage:`, found ? {
        id: found.id,
        title: found.title,
        slug: found.slug,
        status: found.status
      } : 'NULL (NOT FOUND)');

      if (isMounted) {
        setListing(found);
        setLoading(false);
      }
    };

    fetchListing();

    return () => {
      isMounted = false;
    };
  }, [slug, id]);

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (loading) {
    return (
      <PublicLayout>
        <ListingSkeleton />
      </PublicLayout>
    );
  }

  // 404 Page if listing not found, or if accessed via public route and not published
  if (!listing || (!id && listing.status !== 'published')) {
    console.warn(`[DEBUG PIPELINE 7 & 8] 404 CONDITION TRIGGERED!`, {
      listingExists: !!listing,
      listingStatus: listing?.status,
      requestedSlug: slug,
      requestedId: id,
      reason: !listing ? 'Listing is NULL' : `Status is "${listing.status}" instead of "published"`
    });
    return (
      <PublicLayout>
        <NotFoundListing requestedSlug={slug} />
      </PublicLayout>
    );
  }

  // Fallback default contact info if missing
  const contactInfo = listing.contact || {
    agentName: 'Alexander Vance',
    agentRole: 'Principal Director',
    phone: '+1 (305) 890-4421',
    whatsappNumber: '13058904421',
    email: 'alexander@luminaryestates.com',
    agencyName: 'Luminary Real Estate Group',
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-zinc-950 pb-12">
        {/* 1. Hero Image Gallery */}
        <HeroGallery
          images={listing.images || []}
          propertyTitle={listing.title}
          propertyType={listing.specs?.propertyType}
          onOpenLightbox={handleOpenLightbox}
        />

        {/* Locked Page Content Layout Container */}
        <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 pt-8 sm:pt-16 pb-24 sm:pb-32 space-y-16 sm:space-y-24">
          {/* 2 & 3. Price, Property Title & Quick Specs */}
          <PropertySpecs
            price={listing.price}
            currency={listing.currency || '$'}
            title={listing.title}
            tagline={listing.tagline}
            specs={listing.specs}
            location={listing.location}
          />

          {/* 4. Property Story (Narrative, Highlights, Amenities) */}
          <PropertyStory
            description={listing.description}
            highlights={listing.highlights}
            amenities={listing.amenities}
          />

          {/* 5. Photo Gallery Grid */}
          <GalleryGrid
            images={listing.images || []}
            onOpenLightbox={handleOpenLightbox}
          />

          {/* 6. Location & Google Maps */}
          <LocationMap location={listing.location} />
        </div>

        {/* 7. Sticky Action Bar (WhatsApp + Call) */}
        <StickyActionBar
          contact={contactInfo}
          propertyTitle={listing.title}
          price={listing.price}
          currency={listing.currency || '$'}
        />

        {/* Lightbox Modal */}
        <ImageLightboxModal
          images={listing.images || []}
          currentIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNavigate={(newIndex) => setLightboxIndex(newIndex)}
        />
      </div>
    </PublicLayout>
  );
};
