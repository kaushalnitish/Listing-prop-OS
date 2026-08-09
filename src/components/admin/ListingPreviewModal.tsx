import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PropertyListing } from '../../types';
import { HeroGallery } from '../public/HeroGallery';
import { PropertySpecs } from '../public/PropertySpecs';
import { PropertyStory } from '../public/PropertyStory';
import { GalleryGrid } from '../public/GalleryGrid';
import { LocationMap } from '../public/LocationMap';
import { StickyActionBar } from '../public/StickyActionBar';
import { ImageLightboxModal } from '../public/ImageLightboxModal';
import {
  ArrowLeft,
  Save,
  Globe,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  X,
} from 'lucide-react';

interface ListingPreviewModalProps {
  listing: PropertyListing;
  onBackToEdit: () => void;
  onSaveDraft: () => Promise<void>;
  onPublish: () => Promise<void>;
  saving: boolean;
  publishedUrl?: string | null;
  onCloseSuccessModal?: () => void;
}

export const ListingPreviewModal: React.FC<ListingPreviewModalProps> = ({
  listing,
  onBackToEdit,
  onSaveDraft,
  onPublish,
  saving,
  publishedUrl,
  onCloseSuccessModal,
}) => {
  const navigate = useNavigate();

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Copy URL state
  const [copied, setCopied] = useState(false);

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const contactInfo = listing.contact || {
    agentName: 'Alexander Vance',
    agentRole: 'Principal Director',
    phone: '+1 (305) 890-4421',
    whatsappNumber: '13058904421',
    email: 'alexander@luminaryestates.com',
    agencyName: 'Luminary Real Estate Group',
  };

  const handleCopyLink = () => {
    if (publishedUrl) {
      navigator.clipboard.writeText(publishedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950 flex flex-col">
      {/* 1. Top Publishing Controls Bar */}
      <div className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/90 p-3 sm:p-4 px-4 sm:px-8 shadow-2xl flex items-center justify-end gap-3">
        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBackToEdit}
            disabled={saving}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Edit</span>
          </button>

          <button
            type="button"
            onClick={onSaveDraft}
            disabled={saving}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={onPublish}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Globe className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{saving ? 'Publishing...' : 'Publish'}</span>
          </button>
        </div>
      </div>

      {/* 2. Public Template Preview Content */}
      <div className="flex-1 bg-[#FAF9F6] pb-28 sm:pb-36 w-full max-w-full overflow-x-hidden">
        {/* Hero Gallery */}
        <HeroGallery
          images={listing.images || []}
          propertyTitle={listing.title}
          propertyType={listing.specs?.propertyType}
          onOpenLightbox={handleOpenLightbox}
        />

        {/* Content Container */}
        <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 pt-6 sm:pt-10 space-y-8 sm:space-y-12">
          <PropertySpecs
            price={listing.price}
            currency={listing.currency || '$'}
            title={listing.title}
            tagline={listing.tagline}
            specs={listing.specs}
            location={listing.location}
          />

          <PropertyStory
            description={listing.description}
            highlights={listing.highlights}
            amenities={listing.amenities}
          />

          <GalleryGrid
            images={listing.images || []}
            onOpenLightbox={handleOpenLightbox}
          />

          <LocationMap location={listing.location} />
        </div>

        <StickyActionBar
          contact={contactInfo}
          propertyTitle={listing.title}
          price={listing.price}
          currency={listing.currency || '$'}
        />

        <ImageLightboxModal
          images={listing.images || []}
          currentIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNavigate={(newIndex) => setLightboxIndex(newIndex)}
        />
      </div>

      {/* 3. Published Success Link Modal */}
      {publishedUrl && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6">
            <button
              onClick={onCloseSuccessModal || (() => navigate('/admin'))}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">
                Listing Published Successfully!
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your property listing is now live and accessible via its public URL.
              </p>
            </div>

            {/* Public Link Box */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Public URL
              </label>
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-2 pl-3">
                <input
                  type="text"
                  readOnly
                  value={publishedUrl}
                  className="bg-transparent text-xs text-amber-300 font-mono flex-1 focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => navigate('/admin')}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium text-center transition-colors"
              >
                Return to Dashboard
              </button>
              <a
                href={`/p/${listing.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Live Page</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
