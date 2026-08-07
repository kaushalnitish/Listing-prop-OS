import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';

const COMMON_AMENITIES = [
  'Infinity Pool',
  'Spa & Sauna',
  'Wine Cellar',
  'Private Elevator',
  'Home Cinema',
  'Smart Home Automation',
  'Chef Kitchen',
  'Rooftop Terrace',
  'Private Dock / Marina',
  'Ocean View',
  'Panoramic Mountain View',
  '3-Car Garage',
  'Tennis Court',
  '24/7 Gated Security',
  'Helipad Access',
  'Private Gym',
  'Outdoor Kitchen & BBQ',
  'Concierge Service',
  'Solar Energy System',
  'EV Charging Station',
  'Staff Quarters',
  'Botanical Garden',
];

interface AmenitiesSelectorProps {
  selectedAmenities: string[];
  onChange: (amenities: string[]) => void;
}

export const AmenitiesSelector: React.FC<AmenitiesSelectorProps> = ({
  selectedAmenities,
  onChange,
}) => {
  const [customInput, setCustomInput] = useState('');

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      onChange(selectedAmenities.filter((a) => a !== amenity));
    } else {
      onChange([...selectedAmenities, amenity]);
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (trimmed && !selectedAmenities.includes(trimmed)) {
      onChange([...selectedAmenities, trimmed]);
      setCustomInput('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {COMMON_AMENITIES.map((amenity) => {
          const isSelected = selectedAmenities.includes(amenity);
          return (
            <button
              key={amenity}
              type="button"
              onClick={() => toggleAmenity(amenity)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {isSelected ? (
                <Check className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
              ) : (
                <Plus className="w-3.5 h-3.5 text-zinc-500" />
              )}
              <span>{amenity}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Tag Input */}
      <div className="flex items-center gap-2 pt-2">
        <input
          type="text"
          placeholder="Add custom amenity (e.g., Heated Saltwater Pool)..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustom(e);
            }
          }}
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60 transition-colors"
        />
        <button
          type="button"
          onClick={handleAddCustom}
          className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors shrink-0"
        >
          Add
        </button>
      </div>

      {/* Selected custom items tag list if outside COMMON */}
      {selectedAmenities.some((a) => !COMMON_AMENITIES.includes(a)) && (
        <div className="pt-2 flex flex-wrap gap-1.5">
          <span className="text-[11px] text-zinc-500 w-full">Custom Added:</span>
          {selectedAmenities
            .filter((a) => !COMMON_AMENITIES.includes(a))
            .map((customTag) => (
              <span
                key={customTag}
                className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-1.5"
              >
                {customTag}
                <button
                  type="button"
                  onClick={() => toggleAmenity(customTag)}
                  className="hover:text-amber-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
};
