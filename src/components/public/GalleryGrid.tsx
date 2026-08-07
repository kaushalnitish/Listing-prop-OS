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
    <div className="space-y-6 pt-4 border-t border-zinc-800/80">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
          Architecture & Interiors ({images.length})
        </h2>
        <span className="text-xs font-mono text-zinc-400 hidden sm:inline">Select photo to view full frame</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {images.map((img, idx) => (
          <div
            key={img.id || idx}
            onClick={() => onOpenLightbox(idx)}
            className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800/80 cursor-pointer transition-all duration-500 hover:border-zinc-500"
          >
            <img
              src={img.url}
              alt={img.caption || `Property image ${idx + 1}`}
              width="800"
              height="600"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              referrerPolicy="no-referrer"
            />

            {/* Subtle Gradient & Caption Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
              <div className="self-end">
                <span className="p-2 rounded-full bg-black/60 border border-white/20 text-white inline-block shadow-lg backdrop-blur-md">
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

