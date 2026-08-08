import React from 'react';
import { PropertyLocation } from '../../types';
import { ExternalLink, Navigation } from 'lucide-react';

interface LocationMapProps {
  location: PropertyLocation;
}

export const LocationMap: React.FC<LocationMapProps> = ({ location }) => {
  const fullAddress = [
    location.address,
    location.neighborhood,
    location.city,
    location.state,
    location.country,
  ]
    .filter(Boolean)
    .join(', ');

  const googleMapsSearchUrl =
    location.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    fullAddress
  )}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="space-y-6 pt-4 border-t border-white/[0.08]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <h2 className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
            Location & Context
          </h2>
          <p className="text-sm sm:text-base font-normal text-zinc-200 flex items-center gap-2 break-words">
            <Navigation className="w-4 h-4 text-zinc-500 shrink-0" />
            <span>{fullAddress}</span>
          </p>
        </div>

        <a
          href={googleMapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-white/[0.08] text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-mono flex items-center gap-2 transition-all shadow-sm"
        >
          <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          <span>Open Maps</span>
        </a>
      </div>

      {/* Nearby Highlights list if present */}
      {location.nearbyHighlights && location.nearbyHighlights.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
            Nearby Landmarks
          </p>
          <div className="flex flex-wrap gap-2">
            {location.nearbyHighlights.map((highlight, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full bg-zinc-900/50 border border-white/[0.08] text-xs text-zinc-300 font-normal"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Embedded Google Maps Container */}
      <div className="w-full h-60 sm:h-72 rounded-xl overflow-hidden border border-white/[0.08] relative bg-zinc-950 shadow-inner">
        <iframe
          title="Property Location Map"
          src={mapEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(100%)' }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full opacity-85 hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  );
};

