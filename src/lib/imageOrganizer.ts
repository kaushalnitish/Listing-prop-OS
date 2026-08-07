import { PropertyImage } from '../types';

export type ImageCategory =
  | 'Exterior'
  | 'Living Room'
  | 'Kitchen'
  | 'Bedroom'
  | 'Bathroom'
  | 'Balcony'
  | 'Amenities'
  | 'Other';

export const IMAGE_CATEGORIES: ImageCategory[] = [
  'Exterior',
  'Living Room',
  'Kitchen',
  'Bedroom',
  'Bathroom',
  'Balcony',
  'Amenities',
  'Other',
];

export const CATEGORY_ORDER: Record<ImageCategory, number> = {
  Exterior: 1,
  'Living Room': 2,
  Kitchen: 3,
  Bedroom: 4,
  Bathroom: 5,
  Balcony: 6,
  Amenities: 7,
  Other: 8,
};

/**
 * Detects category from image caption, filename or URL keywords.
 */
export function detectCategory(text?: string): ImageCategory {
  if (!text) return 'Exterior';
  const lower = text.toLowerCase();

  // 1. Exterior
  if (
    lower.includes('exterior') ||
    lower.includes('facade') ||
    lower.includes('front') ||
    lower.includes('entry') ||
    lower.includes('architecture') ||
    lower.includes('aerial') ||
    lower.includes('building') ||
    lower.includes('elevation') ||
    lower.includes('driveway')
  ) {
    return 'Exterior';
  }

  // 2. Living Room
  if (
    lower.includes('living') ||
    lower.includes('salon') ||
    lower.includes('lounge') ||
    lower.includes('great room') ||
    lower.includes('sofa') ||
    lower.includes('sitting') ||
    lower.includes('fireplace') ||
    lower.includes('hall')
  ) {
    return 'Living Room';
  }

  // 3. Kitchen
  if (
    lower.includes('kitchen') ||
    lower.includes('chef') ||
    lower.includes('dining') ||
    lower.includes('cook') ||
    lower.includes('pantry') ||
    lower.includes('island') ||
    lower.includes('counter')
  ) {
    return 'Kitchen';
  }

  // 4. Bedroom
  if (
    lower.includes('bedroom') ||
    lower.includes('suite') ||
    lower.includes('master') ||
    lower.includes('bed') ||
    lower.includes('sleeping')
  ) {
    return 'Bedroom';
  }

  // 5. Bathroom
  if (
    lower.includes('bath') ||
    lower.includes('bathroom') ||
    lower.includes('spa') ||
    lower.includes('sauna') ||
    lower.includes('shower') ||
    lower.includes('vanity') ||
    lower.includes('tub')
  ) {
    return 'Bathroom';
  }

  // 6. Balcony / Terrace
  if (
    lower.includes('balcony') ||
    lower.includes('terrace') ||
    lower.includes('deck') ||
    lower.includes('patio') ||
    lower.includes('veranda') ||
    lower.includes('porch')
  ) {
    return 'Balcony';
  }

  // 7. Amenities
  if (
    lower.includes('pool') ||
    lower.includes('infinity') ||
    lower.includes('wine') ||
    lower.includes('cellar') ||
    lower.includes('cinema') ||
    lower.includes('gym') ||
    lower.includes('fitness') ||
    lower.includes('tennis') ||
    lower.includes('garage') ||
    lower.includes('dock') ||
    lower.includes('amenit')
  ) {
    return 'Amenities';
  }

  return 'Exterior';
}

/**
 * Automatically arranges property photos in optimal real estate viewing order:
 * 1. Exterior (Cover image automatically set to strongest exterior image)
 * 2. Living Room
 * 3. Kitchen
 * 4. Bedroom
 * 5. Bathroom
 * 6. Balcony
 * 7. Amenities
 */
export function autoOrganizeImages(images: PropertyImage[]): PropertyImage[] {
  if (images.length === 0) return [];

  // 1. Detect categories for images that don't have one set
  const categorized = images.map((img) => {
    const category =
      (img.category as ImageCategory) ||
      detectCategory(img.caption || img.url);
    return {
      ...img,
      category,
    };
  });

  // 2. Find the strongest Exterior image (or first image) to set as Cover Image
  let exteriorMatch = categorized.find((img) => img.category === 'Exterior');
  if (!exteriorMatch) {
    // Fall back to image that was previously cover, or first image
    exteriorMatch = categorized.find((img) => img.isCover) || categorized[0];
  }

  // 3. Group and Sort by category rank and original order
  const sorted = [...categorized].sort((a, b) => {
    const catA = (a.category as ImageCategory) || 'Other';
    const catB = (b.category as ImageCategory) || 'Other';

    const rankA = CATEGORY_ORDER[catA] || 99;
    const rankB = CATEGORY_ORDER[catB] || 99;

    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return a.order - b.order;
  });

  // 4. Update isCover and reindex order (1, 2, 3...)
  const targetCoverId = exteriorMatch.id;

  return sorted.map((img, index) => ({
    ...img,
    isCover: img.id === targetCoverId,
    order: index + 1,
  }));
}
