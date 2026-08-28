import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import fs from 'fs';
import { GLASSHOUSE_SANCTUARY_LISTING } from '../src/data/sampleListing';
import { generatePropertyIntelligence } from '../src/lib/propertyIntelligence';
import { PropertyIntelligenceReport } from '../src/components/pdf/PropertyIntelligenceReport';

async function run() {
  console.log('Generating Property Intelligence data for The Glasshouse Sanctuary...');
  const intel = generatePropertyIntelligence(GLASSHOUSE_SANCTUARY_LISTING);

  console.log('Rendering PDF to output_glasshouse.pdf...');
  const doc = React.createElement(PropertyIntelligenceReport, {
    listing: GLASSHOUSE_SANCTUARY_LISTING,
    intelligence: intel,
  });

  await ReactPDF.renderToFile(doc, './output_glasshouse.pdf');
  console.log('Successfully generated ./output_glasshouse.pdf');
  const stats = fs.statSync('./output_glasshouse.pdf');
  console.log(`PDF File size: ${stats.size} bytes`);
}

run().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
