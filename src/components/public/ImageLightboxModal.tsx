import React, { useEffect } from 'react';
import { PropertyImage } from '../../types';
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';

interface ImageLightboxModalProps {
  images: PropertyImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate((currentIndex - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') onNavigate((currentIndex + 1) % images.length);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose, onNavigate]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-2 sm:p-6 animate-in fade-in duration-200 w-full max-w-full overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-black/60 border border-white/15 px-3 py-1.5 rounded-full text-xs font-mono text-white/90 backdrop-blur-md">
          <Camera className="w-3.5 h-3.5 text-zinc-300" />
          <span>
            {currentIndex + 1} / {images.length}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title="Close Lightbox (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Container */}
      <div className="relative w-full max-w-5xl h-full max-h-[85vh] flex flex-col items-center justify-center">
        <img
          src={currentImage.url}
          onError={(e) => {
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80';
          }}
          alt={currentImage.caption || `Property image ${currentIndex + 1}`}
          className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
          referrerPolicy="no-referrer"
        />

        {/* Caption Banner */}
        {currentImage.caption && (
          <div className="mt-4 px-4 py-2 bg-zinc-900/80 border border-zinc-800/80 rounded-xl max-w-lg text-center">
            <p className="text-xs text-zinc-300 font-medium">
              {currentImage.caption}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => onNavigate((currentIndex - 1 + images.length) % images.length)}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 border border-white/15 text-white hover:bg-white hover:text-black backdrop-blur-md transition-all shadow-xl"
            title="Previous Image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={() => onNavigate((currentIndex + 1) % images.length)}
            className="absolute right-3 sm:left-auto sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 border border-white/15 text-white hover:bg-white hover:text-black backdrop-blur-md transition-all shadow-xl"
            title="Next Image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
    </div>
  );
};
