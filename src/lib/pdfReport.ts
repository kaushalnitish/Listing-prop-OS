import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { PropertyListing } from '../types';
import { PropertyIntelligenceData } from '../types/intelligence';
import { generatePropertyIntelligence } from './propertyIntelligence';
import { PropertyIntelligenceReport } from '../components/pdf/PropertyIntelligenceReport';

/**
 * Generate and trigger download of the Property Intelligence & Market Positioning PDF Report
 * using the modern flow-based @react-pdf/renderer engine.
 */
export async function generatePropertyIntelligencePdf(
  listing: PropertyListing,
  intelligenceOverride?: PropertyIntelligenceData
): Promise<void> {
  const intel = intelligenceOverride || listing.intelligence || generatePropertyIntelligence(listing);

  // Instantiate the React-PDF document element
  const documentElement = React.createElement(PropertyIntelligenceReport, {
    listing,
    intelligence: intel,
  });

  // Render to Blob via @react-pdf/renderer
  const blob = await pdf(documentElement).toBlob();

  // Create download link and trigger immediate browser download
  const url = URL.createObjectURL(blob);
  const cleanTitle = (listing.title || 'Property-Intelligence-Report')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 50);
  const filename = `${cleanTitle}-Intelligence-Report.pdf`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up Object URL
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
