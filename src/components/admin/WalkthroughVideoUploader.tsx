import React, { useState, useRef } from 'react';
import {
  Video,
  Upload,
  Play,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  Info,
} from 'lucide-react';
import { uploadWalkthroughVideoToSupabaseStorage, deleteWalkthroughVideoFromStorage } from '../../lib/storage';

interface WalkthroughVideoUploaderProps {
  videoUrl?: string | null;
  videoType?: string | null;
  thumbnailUrl?: string | null;
  listingId?: string;
  onChange: (url: string | null, type: string | null, thumbnail?: string | null) => void;
}

export const WalkthroughVideoUploader: React.FC<WalkthroughVideoUploaderProps> = ({
  videoUrl,
  videoType = 'video/mp4',
  thumbnailUrl,
  listingId,
  onChange,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const handleFileSelect = async (files: FileList | File[]) => {
    const file = Array.from(files)[0];
    if (!file) return;

    // Reset errors
    setErrorMessage(null);

    // Validate video mime type / extension
    const validExtensions = ['.mp4', '.webm', '.mov'];
    const validMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const fileNameLower = file.name.toLowerCase();
    const isExtensionValid = validExtensions.some((ext) => fileNameLower.endsWith(ext));
    const isMimeValid = validMimes.includes(file.type);

    if (!isExtensionValid && !isMimeValid) {
      setErrorMessage('Unsupported file format. Please choose an MP4, WebM, or MOV video.');
      return;
    }

    // Validate size (100MB limit)
    const MAX_SIZE_BYTES = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage(`Video size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 100 MB limit.`);
      return;
    }

    setUploading(true);
    setUploadProgress(15);

    try {
      // Simulate progress ticks while uploading
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 400);

      // Perform upload to Supabase Storage property-walkthroughs bucket
      const result = await uploadWalkthroughVideoToSupabaseStorage(file, listingId);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // If there was an old video, optionally clean it up in the background
      if (videoUrl && videoUrl !== result.url) {
        deleteWalkthroughVideoFromStorage(videoUrl).catch(() => {});
      }

      onChange(result.url, result.type || file.type || 'video/mp4', null);
    } catch (err: any) {
      console.error('Walkthrough video upload error:', err);
      setErrorMessage(err?.message || 'Failed to upload video to storage.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!videoUrl) return;
    if (!window.confirm('Remove the walkthrough video from this listing?')) return;

    setRemoving(true);
    try {
      await deleteWalkthroughVideoFromStorage(videoUrl);
      onChange(null, null, null);
    } catch (err) {
      console.warn('Error removing video:', err);
      onChange(null, null, null);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFileSelect(e.target.files);
        }}
      />

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-100">Walkthrough Video</h3>
              <span className="text-[10px] font-mono uppercase bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700">
                Optional
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Add a short video walkthrough of this property (MP4, WebM, MOV up to 100MB).
            </p>
          </div>
        </div>

        {videoUrl && (
          <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Video Attached</span>
          </span>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Upload Notice</p>
            <p className="mt-0.5 text-red-300/90">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-200 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Uploading State */}
      {uploading && (
        <div className="p-8 rounded-2xl bg-zinc-950 border border-amber-500/40 space-y-4 text-center">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-sm font-semibold text-zinc-200">
              Uploading walkthrough video...
            </p>
            <p className="text-xs text-zinc-500">
              Storing video in high-performance cloud storage bucket
            </p>
          </div>

          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden max-w-xs mx-auto">
            <div
              className="bg-amber-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-amber-400/90">
            {uploadProgress}% completed
          </span>
        </div>
      )}

      {/* Preview Player (When Video Exists) */}
      {!uploading && videoUrl && (
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-black border border-zinc-800/80 aspect-video max-w-xl mx-auto shadow-lg">
            <video
              ref={videoPreviewRef}
              src={videoUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <FileVideo className="w-4 h-4 text-amber-400" />
              <span className="truncate max-w-xs">{videoUrl.split('/').pop()}</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace Video</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={removing}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{removing ? 'Removing...' : 'Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Dropzone (When No Video) */}
      {!uploading && !videoUrl && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files) handleFileSelect(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-3 ${
            dragOver
              ? 'border-amber-500 bg-amber-500/5 scale-[0.99]'
              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-950/70'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mx-auto transition-colors group-hover:text-amber-400">
            <Upload className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-semibold text-zinc-200">
              Drag and drop your property walkthrough video, or <span className="text-amber-400 underline">browse</span>
            </p>
            <p className="text-[11px] text-zinc-500">
              Supports MP4, WebM, MOV • Maximum file size: 100 MB
            </p>
          </div>

          <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
            <Info className="w-3.5 h-3.5 text-zinc-500" />
            <span>Recommended duration: 30–90 seconds</span>
          </div>
        </div>
      )}
    </div>
  );
};
