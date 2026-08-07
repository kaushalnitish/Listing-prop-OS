import React, { useState, useRef } from 'react';
import { PropertyImage } from '../../types';
import { compressImage } from '../../lib/imageCompression';
import {
  autoOrganizeImages,
  detectCategory,
  IMAGE_CATEGORIES,
  ImageCategory,
} from '../../lib/imageOrganizer';
import {
  Upload,
  Image as ImageIcon,
  Star,
  Trash2,
  MoveLeft,
  MoveRight,
  Loader2,
  Sparkles,
  Wand2,
  Tag,
} from 'lucide-react';

interface ImageUploaderProps {
  images: PropertyImage[];
  onChange: (images: PropertyImage[]) => void;
  maxImages?: number;
}

const SAMPLE_LUXURY_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
    caption: 'Front Exterior & Architectural Entry',
    category: 'Exterior',
  },
  {
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
    caption: 'Heated Infinity Pool Terrace',
    category: 'Amenities',
  },
  {
    url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80',
    caption: 'Double-Height Living Salon',
    category: 'Living Room',
  },
  {
    url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=80',
    caption: 'Master Suite Sanctuary',
    category: 'Bedroom',
  },
  {
    url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80',
    caption: 'Chef Kitchen & Marble Island',
    category: 'Kitchen',
  },
];

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 20,
}) => {
  const [compressing, setCompressing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      alert(`Maximum limit of ${maxImages} images reached.`);
      return;
    }

    const filesToProcess = filesArray.slice(0, remainingSlots);
    setCompressing(true);

    try {
      const newImages: PropertyImage[] = [];

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        if (!file.type.startsWith('image/')) continue;

        const compressedDataUrl = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
        });

        const caption = file.name.replace(/\.[^/.]+$/, '');
        const category = detectCategory(caption);

        newImages.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          url: compressedDataUrl,
          caption,
          category,
          isCover: false,
          order: images.length + i + 1,
        });
      }

      // Run auto-organizer to place exterior first, cover photo, optimal room sequence
      const organized = autoOrganizeImages([...images, ...newImages]);
      onChange(organized);
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Failed to process one or more images.');
    } finally {
      setCompressing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleAutoOrganize = () => {
    const organized = autoOrganizeImages(images);
    onChange(organized);
  };

  const setAsCover = (id: string) => {
    const updated = images.map((img) => ({
      ...img,
      isCover: img.id === id,
    }));
    onChange(updated);
  };

  const removeImage = (id: string) => {
    const filtered = images.filter((img) => img.id !== id);
    if (filtered.length > 0 && !filtered.some((img) => img.isCover)) {
      filtered[0].isCover = true;
    }
    const reordered = filtered.map((img, idx) => ({ ...img, order: idx + 1 }));
    onChange(reordered);
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;

    const reordered = newImages.map((img, idx) => ({ ...img, order: idx + 1 }));
    onChange(reordered);
  };

  const updateCaption = (id: string, caption: string) => {
    const updated = images.map((img) =>
      img.id === id ? { ...img, caption } : img
    );
    onChange(updated);
  };

  const updateCategory = (id: string, category: string) => {
    const updated = images.map((img) =>
      img.id === id ? { ...img, category } : img
    );
    onChange(updated);
  };

  const addSamplePhotos = () => {
    const newItems: PropertyImage[] = SAMPLE_LUXURY_PHOTOS.map((photo, idx) => ({
      id: `sample-${Date.now()}-${idx}`,
      url: photo.url,
      caption: photo.caption,
      category: photo.category,
      isCover: false,
      order: images.length + idx + 1,
    }));

    const organized = autoOrganizeImages([...images, ...newItems].slice(0, maxImages));
    onChange(organized);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-amber-500 bg-amber-500/10'
            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept="image/*"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          {compressing ? (
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Upload className="w-5 h-5" />
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-zinc-200">
              {compressing
                ? 'Compressing & auto-categorizing photos...'
                : 'Click to upload or drag and drop property photos'}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              Supports JPEG, PNG, WEBP (Up to {maxImages} high-res photos). Auto-detects room type & arranges sequence.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <span className="text-[11px] text-zinc-400 font-mono">
              {images.length} / {maxImages} uploaded
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addSamplePhotos();
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium flex items-center gap-1 hover:bg-amber-500/20 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>Add Sample Luxury Photos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Organize Action Banner */}
      {images.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-3 px-4">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <Wand2 className="w-4 h-4 text-amber-400" />
            <span>
              <strong>Smart Auto-Organizer:</strong> Detects Exterior, Rooms, Kitchen, Bath & Amenities, and sets cover photo.
            </span>
          </div>

          <button
            type="button"
            onClick={handleAutoOrganize}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/10"
          >
            <Wand2 className="w-3.5 h-3.5 fill-zinc-950" />
            <span>Auto-Organize Sequence</span>
          </button>
        </div>
      )}

      {/* Uploaded Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className={`relative bg-zinc-900 border rounded-xl overflow-hidden group transition-all ${
                img.isCover
                  ? 'border-amber-500/80 ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/5'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="aspect-[16/10] relative bg-zinc-950 overflow-hidden">
                <img
                  src={img.url}
                  alt={img.caption || `Property image ${idx + 1}`}
                  width="800"
                  height="500"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />

                {/* Cover Tag Badge */}
                {img.isCover ? (
                  <span className="absolute top-2 left-2 bg-amber-500 text-zinc-950 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded shadow-md flex items-center gap-1">
                    <Star className="w-3 h-3 fill-zinc-950" />
                    <span>Cover Photo</span>
                  </span>
                ) : (
                  <span className="absolute top-2 left-2 bg-zinc-950/80 backdrop-blur-md text-zinc-300 text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-800">
                    #{idx + 1}
                  </span>
                )}

                {/* Quick Toolbar */}
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-zinc-950/80 backdrop-blur-md p-1 rounded-lg border border-zinc-800 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {!img.isCover && (
                    <button
                      type="button"
                      onClick={() => setAsCover(img.id)}
                      className="p-1 rounded text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
                      title="Set as Cover Image"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => moveImage(idx, 'left')}
                    disabled={idx === 0}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move Left"
                  >
                    <MoveLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(idx, 'right')}
                    disabled={idx === images.length - 1}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move Right"
                  >
                    <MoveRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-zinc-800 transition-colors"
                    title="Delete Image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Category Selector & Caption Input */}
              <div className="p-2.5 bg-zinc-900 border-t border-zinc-800 space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-3 h-3 text-amber-400 shrink-0" />
                  <select
                    value={img.category || 'Exterior'}
                    onChange={(e) => updateCategory(img.id, e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-2 py-0.5 text-[11px] text-amber-300 font-medium focus:outline-none focus:border-amber-500/60"
                  >
                    {IMAGE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Image caption / room name..."
                  value={img.caption || ''}
                  onChange={(e) => updateCaption(img.id, e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-2.5 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

