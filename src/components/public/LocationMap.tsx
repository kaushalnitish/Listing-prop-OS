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
    <div className="space-y-6 pt-4 border-t border-zinc-800/80">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
            Location & Context
          </h2>
          <p className="text-sm sm:text-base font-normal text-zinc-200 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>{fullAddress}</span>
          </p>
        </div>

        <a
          href={googleMapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium flex items-center gap-2 transition-all shadow-sm"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open Maps</span>
        </a>
      </div>

      {/* Nearby Highlights list if present */}
      {location.nearbyHighlights && location.nearbyHighlights.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-mono text-zinc-400">
            Nearby Highlights
          </p>
          <div className="flex flex-wrap gap-2">
            {location.nearbyHighlights.map((highlight, idx) => (
              <span
                key={idx}
                className="px-3.5 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 font-normal"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Embedded Google Maps Container */}
      <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-zinc-800/80 relative bg-zinc-950">
        <iframe
          title="Property Location Map"
          src={mapEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(100%)' }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full opacity-90 hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  );
};

