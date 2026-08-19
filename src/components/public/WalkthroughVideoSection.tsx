import React, { useState, useRef } from 'react';
import { Video, Play, AlertCircle, RefreshCw, Maximize, Volume2, Sparkles } from 'lucide-react';

interface WalkthroughVideoSectionProps {
  videoUrl?: string | null;
  videoType?: string | null;
  thumbnailUrl?: string | null;
  title?: string;
}

export const WalkthroughVideoSection: React.FC<WalkthroughVideoSectionProps> = ({
  videoUrl,
  videoType = 'video/mp4',
  thumbnailUrl,
  title,
}) => {
  // STRICT REQUIREMENT: If no video URL is provided, return null immediately.
  // Zero empty cards, zero empty containers, zero headings, zero vertical space.
  if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim() === '') {
    return null;
  }

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleStartPlay = () => {
    if (videoRef.current) {
      setIsLoading(true);
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.warn('Video play error:', err);
          setIsLoading(false);
        });
    }
  };

  const handleRetry = () => {
    setHasError(false);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  return (
    <section
      id="property-walkthrough-section"
      className="w-full bg-[#FAF9F6] py-10 sm:py-14 border-b border-stone-200/80 my-4 max-w-full overflow-hidden"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 space-y-6 sm:space-y-8 min-w-0">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 min-w-0">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-1 rounded-md bg-stone-200/70 text-stone-700">
                <Video className="w-3.5 h-3.5" />
              </span>
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-stone-500 font-normal truncate">
                PROPERTY WALKTHROUGH
              </p>
            </div>
            <h2 className="text-2xl sm:text-3xl font-normal text-stone-900 tracking-tight leading-[1.2] break-words">
              Experience the space in motion.
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-normal leading-relaxed pt-0.5 break-words">
              A guided visual tour showcasing spatial layout, room transitions, and natural light.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-stone-400 text-xs font-mono shrink-0 pb-1">
            <Sparkles className="w-3.5 h-3.5 text-stone-400" />
            <span>HD Walkthrough</span>
          </div>
        </div>

        {/* Video Player Container — 16:9 Aspect Ratio */}
        <div className="relative rounded-2xl sm:rounded-3xl border border-stone-200/80 bg-stone-950 overflow-hidden shadow-md aspect-video w-full max-w-full min-w-0 group">
          {hasError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-stone-900/90 text-stone-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-stone-800 border border-stone-700/80 flex items-center justify-center text-amber-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <p className="text-sm font-medium text-stone-100">
                  Walkthrough Video Unavailable
                </p>
                <p className="text-xs text-stone-400 leading-relaxed">
                  The video stream could not be loaded. Please check your network connection and try again.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Playback</span>
              </button>
            </div>
          ) : (
            <>
              {/* HTML5 Native Video Tag */}
              <video
                ref={videoRef}
                id="walkthrough-video-player"
                className="w-full h-full object-cover sm:object-contain bg-stone-950"
                controls
                playsInline
                preload="metadata"
                poster={thumbnailUrl || undefined}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={() => {
                  console.warn('Video failed to load URL:', videoUrl);
                  setHasError(true);
                }}
              >
                <source src={videoUrl} type={videoType || 'video/mp4'} />
                Your browser does not support HTML5 video streaming.
              </video>

              {/* Custom Play Overlay (Shown prior to first manual playback) */}
              {!isPlaying && !hasError && (
                <div
                  onClick={handleStartPlay}
                  className="absolute inset-0 bg-stone-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-stone-950/30 group-hover:scale-[1.01]"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 text-stone-900 flex items-center justify-center shadow-2xl transition-transform transform group-hover:scale-110 border border-stone-200/50">
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-stone-900 text-stone-900 ml-1" />
                  </div>
                  <p className="mt-3.5 text-xs sm:text-sm font-medium text-white tracking-wide drop-shadow-md bg-stone-900/60 px-3.5 py-1 rounded-full border border-white/20">
                    Watch Walkthrough Video
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};
