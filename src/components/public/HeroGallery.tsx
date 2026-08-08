import React, { useState } from 'react';
import { PropertyImage } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  Share2,
  Check,
  Maximize2,
} from 'lucide-react';

interface HeroGalleryProps {
  images: PropertyImage[];
  propertyTitle: string;
  propertyType?: string;
  onOpenLightbox: (index: number) => void;
}

export const HeroGallery: React.FC<HeroGalleryProps> = ({
  images,
  propertyTitle,
  propertyType = 'Estate Villa',
  onOpenLightbox,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // If no images uploaded, use fallback luxury image
  const displayImages =
    images.length > 0
      ? images
      : [
          {
            id: 'fallback-1',
            url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
            caption: 'Exterior Architecture',
            isCover: true,
            order: 1,
          },
        ];

  const currentImage = displayImages[activeIndex] || displayImages[0];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: propertyTitle,
          text: `Explore ${propertyTitle}`,
          url: window.location.href,
        });
      } catch {
        // Share dismissed or unsupported
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % displayImages.length);
  };

  return (
    <div className="relative group w-full bg-stone-100 overflow-hidden border-b border-stone-200/60">
      {/* Aspect Ratio Box: Wide Editorial Cinematic Frame */}
      <div
        className="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] max-h-[75vh] w-full cursor-pointer bg-stone-200/80 overflow-hidden"
        onClick={() => onOpenLightbox(activeIndex)}
      >
        <img
          src={currentImage.url}
          alt={currentImage.caption || propertyTitle}
          width="1600"
          height="900"
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.02]"
          referrerPolicy="no-referrer"
        />

        {/* Subtle Bottom Vignette Gradient for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-stone-900/10 pointer-events-none" />

        {/* Top Floating Header Controls */}
        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 z-10 flex items-center justify-between pointer-events-auto">
          <span className="px-3.5 py-1.5 rounded-full bg-white/80 border border-stone-200/80 text-stone-800 text-[10px] sm:text-[11px] font-mono tracking-widest uppercase backdrop-blur-md shadow-xs">
            {propertyType}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="px-3.5 py-2 rounded-full bg-white/80 border border-stone-200/80 text-stone-800 hover:text-stone-950 hover:bg-white backdrop-blur-md transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
            title="Share Listing"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-800" />
                <span className="text-[10px] sm:text-[11px] font-mono pr-1 text-emerald-800 font-semibold">Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-700" />
                <span className="text-[10px] sm:text-[11px] font-medium text-stone-800">Share</span>
              </>
            )}
          </button>
        </div>

        {/* Carousel Navigation Arrows */}
        {displayImages.length > 1 && (
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 sm:px-6 pointer-events-none opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handlePrev}
              className="p-2.5 sm:p-3 rounded-full bg-white/80 border border-stone-200/80 text-stone-800 hover:bg-white hover:text-stone-950 backdrop-blur-md pointer-events-auto transition-all shadow-md active:scale-95"
              title="Previous Photo"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={handleNext}
              className="p-2.5 sm:p-3 rounded-full bg-white/80 border border-stone-200/80 text-stone-800 hover:bg-white hover:text-stone-950 backdrop-blur-md pointer-events-auto transition-all shadow-md active:scale-95"
              title="Next Photo"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}

        {/* Bottom Bar overlay: Photo Index Badge + Fullscreen Trigger */}
        <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 z-10 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-stone-200/80 backdrop-blur-md text-[11px] font-mono text-stone-800 shadow-xs">
            <Camera className="w-3.5 h-3.5 text-stone-600" />
            <span>
              {activeIndex + 1} / {displayImages.length}
            </span>
          </div>

          <button
            onClick={() => onOpenLightbox(activeIndex)}
            className="px-3.5 py-1.5 rounded-full bg-white/80 border border-stone-200/80 backdrop-blur-md text-[11px] font-mono text-stone-800 hover:text-stone-950 hover:bg-white flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <Maximize2 className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">Expand Gallery</span>
          </button>
        </div>
      </div>
    </div>
  );
};

