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
    <div className="rounded-2xl sm:rounded-3xl bg-white/75 backdrop-blur-md border border-stone-200/80 p-4 sm:p-8 shadow-sm space-y-6 w-full max-w-full min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 min-w-0">
        <div className="space-y-1 max-w-xl min-w-0 flex-1">
          <h2 className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-stone-500 font-normal">
            Location & Context
          </h2>
          <p className="text-xs sm:text-sm font-normal text-stone-700 flex items-start sm:items-center gap-2 min-w-0">
            <Navigation className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5 sm:mt-0" />
            <span className="break-words min-w-0 flex-1">{fullAddress}</span>
          </p>
        </div>

        <a
          href={googleMapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 rounded-full bg-white border border-stone-200/80 text-stone-800 hover:text-stone-950 hover:bg-stone-50 text-xs font-mono flex items-center gap-2 transition-all shadow-2xs shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5 text-stone-500 shrink-0" />
          <span>Open Maps</span>
        </a>
      </div>

      {/* Nearby Highlights list if present */}
      {location.nearbyHighlights && location.nearbyHighlights.length > 0 && (
        <div className="space-y-2 pt-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-stone-500">
            Nearby Landmarks
          </p>
          <div className="flex flex-wrap gap-2 min-w-0">
            {location.nearbyHighlights.map((highlight, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full bg-stone-50 border border-stone-200/80 text-xs text-stone-800 font-normal shadow-2xs max-w-full break-words min-w-0"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Embedded Google Maps Container */}
      <div className="w-full h-60 sm:h-72 rounded-xl sm:rounded-2xl overflow-hidden border border-stone-200/80 relative bg-stone-100 shadow-2xs">
        <iframe
          title="Property Location Map"
          src={mapEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full opacity-90 hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  );
};

