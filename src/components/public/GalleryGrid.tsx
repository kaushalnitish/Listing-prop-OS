import React from 'react';
import { PropertyImage } from '../../types';
import { Maximize2 } from 'lucide-react';

interface GalleryGridProps {
  images: PropertyImage[];
  onOpenLightbox: (index: number) => void;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({
  images,
  onOpenLightbox,
}) => {
  if (!images || images.length === 0) return null;

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white/75 backdrop-blur-md border border-stone-200/80 p-6 sm:p-8 shadow-sm space-y-6 w-full max-w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-stone-500">
          Architecture & Interiors ({images.length})
        </h2>
        <span className="text-xs font-mono text-stone-500 hidden sm:inline">Select photo to view full frame</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {images.map((img, idx) => (
          <div
            key={img.id || idx}
            onClick={() => onOpenLightbox(idx)}
            className="group relative aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 cursor-pointer transition-all duration-300 hover:border-stone-400 shadow-2xs"
          >
            <img
              src={img.url}
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80';
              }}
              alt={img.caption || `Property image ${idx + 1}`}
              width="800"
              height="600"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              referrerPolicy="no-referrer"
            />

            {/* Subtle Gradient & Caption Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
              <div className="self-end">
                <span className="p-2 rounded-full bg-white/90 border border-stone-200 text-stone-900 inline-block shadow-md backdrop-blur-md">
                  <Maximize2 className="w-3.5 h-3.5" />
                </span>
              </div>

              {img.caption && (
                <p className="text-xs font-medium text-white line-clamp-2">
                  {img.caption}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

