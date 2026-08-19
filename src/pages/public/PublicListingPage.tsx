import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { getListingBySlug, getListingById } from '../../lib/storage';
import {
  generateListingOpenGraphMetadata,
  buildListingTitle,
  buildListingDescription,
  extractCoverImageUrl,
} from '../../lib/seo';
import { PropertyListing } from '../../types';

import { HeroGallery } from '../../components/public/HeroGallery';
import { PropertySpecs } from '../../components/public/PropertySpecs';
import { PropertyHighlightsBand } from '../../components/public/PropertyHighlightsBand';
import { PropertyExperience } from '../../components/public/PropertyExperience';
import { PropertyStory } from '../../components/public/PropertyStory';
import { WalkthroughVideoSection } from '../../components/public/WalkthroughVideoSection';
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

  // Dynamic SEO & OpenGraph metadata injection on client
  useEffect(() => {
    if (!listing) return;

    const pageTitle = buildListingTitle(listing);
    const metaDesc = buildListingDescription(listing);
    const coverImage = extractCoverImageUrl(listing, window.location.origin);

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
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Listing OS');
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', pageTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', metaDesc);
    if (coverImage) {
      setMetaTag('meta[property="og:image"]', 'property', 'og:image', coverImage);
      setMetaTag('meta[property="og:image:secure_url"]', 'property', 'og:image:secure_url', coverImage);
      setMetaTag('meta[property="og:image:width"]', 'property', 'og:image:width', '800');
      setMetaTag('meta[property="og:image:height"]', 'property', 'og:image:height', '800');
    }
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', window.location.href);
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', pageTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', metaDesc);
    if (coverImage) setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', coverImage);

    return () => {
      document.title = 'Listing OS — Real Estate Showcase';
    };
  }, [listing]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchListing = async () => {
      let found: PropertyListing | null = null;

      if (id) {
        found = await getListingById(id);
      } else if (slug) {
        found = await getListingBySlug(slug);
      } else {
        found = await getListingBySlug('the-grand-luminary-villa');
      }

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
    return (
      <PublicLayout>
        <NotFoundListing requestedSlug={slug} />
      </PublicLayout>
    );
  }

  const contactInfo = listing.contact || {
    agentName: '',
    agentRole: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    agencyName: '',
  };

  return (
    <PublicLayout>
      <div className="w-full max-w-full overflow-x-hidden bg-[#FAF9F6]">
        {/* 1. Hero Image Gallery */}
        <HeroGallery
          images={listing.images || []}
          propertyTitle={listing.title}
          propertyType={listing.specs?.propertyType}
          onOpenLightbox={handleOpenLightbox}
        />

        {/* 2. Price, Property Title Header Block */}
        <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 pt-6 sm:pt-10">
          <PropertySpecs
            price={listing.price}
            currency={listing.currency || '$'}
            title={listing.title}
            tagline={listing.tagline}
            specs={listing.specs}
            location={listing.location}
            hideDetails={true}
          />
        </div>

        {/* 3. Dark Feature Section: PROPERTY HIGHLIGHTS */}
        <PropertyHighlightsBand listing={listing} />

        {/* 4. Property Experience Section: SPACES THAT ELEVATE YOUR EVERYDAY */}
        <PropertyExperience listing={listing} />

        {/* Content Layout Container */}
        <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 pt-6 sm:pt-10 pb-20 sm:pb-24 space-y-8 sm:space-y-12">
          {/* 5. Property Details & Specs Grid */}
          <PropertySpecs
            price={listing.price}
            currency={listing.currency || '$'}
            title={listing.title}
            tagline={listing.tagline}
            specs={listing.specs}
            location={listing.location}
            hideHeader={true}
          />

          {/* 6. Property Story (Narrative, Key Highlights, Amenities) */}
          <PropertyStory
            description={listing.description}
            highlights={listing.highlights}
            amenities={listing.amenities}
          />

          {/* 7. Property Walkthrough Video (Rendered only if video exists) */}
          <WalkthroughVideoSection
            videoUrl={listing.walkthrough_video_url || (listing as any).walkthroughVideoUrl}
            videoType={listing.walkthrough_video_type || (listing as any).walkthroughVideoType}
            thumbnailUrl={listing.walkthrough_video_thumbnail || (listing as any).walkthroughVideoThumbnail}
            title={listing.title}
          />

          {/* 8. Photo Gallery Grid */}
          <GalleryGrid
            images={listing.images || []}
            onOpenLightbox={handleOpenLightbox}
          />

          {/* 9. Location & Google Maps */}
          <LocationMap location={listing.location} />
        </div>

        {/* 10. Sticky Action Bar */}
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
