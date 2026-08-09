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
  onOpenLightbox,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

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

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % displayImages.length);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 pt-4 sm:pt-8">
      {/* Large Rounded Container with subtle depth & soft shadow */}
      <div className="relative group w-full bg-stone-100 rounded-2xl sm:rounded-3xl overflow-hidden border border-stone-200/80 shadow-md transition-shadow hover:shadow-lg">
        {/* Aspect Ratio Box */}
        <div
          className="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] max-h-[70vh] w-full cursor-pointer bg-stone-200/80 overflow-hidden"
          onClick={() => onOpenLightbox(activeIndex)}
        >
          <img
            src={currentImage.url}
            onError={(e) => {
              e.currentTarget.src =
                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80';
            }}
            alt={currentImage.caption || propertyTitle}
            width="1600"
            height="900"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.02]"
            referrerPolicy="no-referrer"
          />

          {/* Subtle Natural Vignette for Depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5 pointer-events-none" />

          {/* Carousel Navigation Arrows */}
          {displayImages.length > 1 && (
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 sm:px-6 pointer-events-none opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={handlePrev}
                className="p-2 sm:p-2.5 rounded-full bg-white/85 text-stone-800 hover:bg-white border border-stone-200/80 backdrop-blur-md pointer-events-auto transition-all shadow-md active:scale-95"
                title="Previous Photo"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={handleNext}
                className="p-2 sm:p-2.5 rounded-full bg-white/85 text-stone-800 hover:bg-white border border-stone-200/80 backdrop-blur-md pointer-events-auto transition-all shadow-md active:scale-95"
                title="Next Photo"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}

          {/* Clean Bottom Right Gallery Trigger */}
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenLightbox(activeIndex);
              }}
              className="px-3 py-1.5 rounded-full bg-white/85 border border-stone-200/80 backdrop-blur-md text-[11px] font-mono text-stone-800 hover:text-stone-950 hover:bg-white flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <Maximize2 className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden sm:inline">Expand Gallery</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

