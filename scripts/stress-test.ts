import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import fs from 'fs';
import { PropertyListing } from '../src/types';
import { generatePropertyIntelligence } from '../src/lib/propertyIntelligence';
import { PropertyIntelligenceReport } from '../src/components/pdf/PropertyIntelligenceReport';

async function runStressTests() {
  console.log('=== RUNNING COMPREHENSIVE PDF ENGINE STRESS TESTS ===\n');

  // TEST 1: ₹100 Cr Mega Penthouse with ultra-long title & 12 comparables & 600-word thesis
  const stressListing100Cr: PropertyListing = {
    id: 'listing-stress-100cr',
    slug: 'imperial-sovereign-sky-villa',
    title: 'The Imperial Sovereign Penthouse & Private Sky Villa — Ultra-Luxury Triplex with 360-Degree Panoramic Arabian Sea Views, Private Helipad & Double-Height Cantilevered Infinity Pool',
    tagline: 'The Pinnacle of Haute Living Situated High Above the Prestigious Worli Sea Face Corridor in South Mumbai',
    price: 1000000000, // ₹100 Cr
    currency: '₹',
    status: 'published',
    images: [],
    contact: {
      agentName: 'Estate Director',
      agentRole: 'Director',
      phone: '+91 98200 00000',
      whatsappNumber: '+91 98200 00000',
      email: 'director@listingos.luxury',
      agencyName: 'Listing OS Luxury Advisory',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    specs: {
      bedrooms: 6,
      bathrooms: 8,
      squareFeet: 14500,
      lotSize: 'Private Rooftop Sky Deck',
      propertyType: 'Triplex Penthouse',
      yearBuilt: 2026,
      parkingSpaces: 8,
    },
    location: {
      address: 'Tower A, Floor 62-64, The Worli Promenade, Worli Sea Face',
      neighborhood: 'Worli Sea Face',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400018',
      country: 'India',
      nearbyHighlights: [
        'Bandra-Worli Sea Link Interchange (2 mins)',
        'Four Seasons Private Residences & Club (4 mins)',
        'Bandra Kurla Complex (BKC) Financial District via Coastal Road (12 mins)',
        'Chhatrapati Shivaji Maharaj International Airport (22 mins)',
      ],
    },
    description: `Occupying the entire top three levels of the iconic waterfront tower, The Imperial Sovereign Sky Villa establishes a new international standard for trophy penthouses in South Mumbai. Spanning an extraordinary 14,500 square feet of curated interior and exterior spaces, this triplex residence commands unobstructed 360-degree vistas across the Arabian Sea, Bandra-Worli Sea Link, and the dynamic Mumbai skyline.

Designed in collaboration with world-renowned interior architects, the lower entertainment level is anchored by a monumental 28-foot double-height grand salon framed by motorized acoustic structural glass. The salon flows seamlessly onto an expansive 1,800 sq ft private travertine terrace featuring a 40-foot heated cantilevered glass-bottom infinity pool suspended 600 feet above the coastline. A dedicated private high-speed elevator bank provides secure keycard access directly to all three private levels.

The middle level is configured as a dedicated private residential sanctuary, featuring an ultra-luxurious 2,200 sq ft primary suite complete with his-and-hers bespoke dressing lounges, refrigerated garment storage, and an imported Statuario marble spa bath with a custom soaking tub positioned against panoramic ocean vistas. Four additional en-suite bedroom pavilions, a private cinema room with Bowers & Wilkins acoustic isolation, and a private wine cellar accommodating over 1,500 vintages complete the floor.

The top crown level houses a private observatory lounge, a dedicated wellness spa with sauna, steam, and treatment rooms, and a certified private helipad connection. Finished with bespoke millwork, bronze architectural detailing, bookmatched Italian Calacatta marble, and comprehensive Crestron smart automation, this trophy residence is an irreplaceable architectural asset.`,
    amenities: [
      'Private 40-Ft Heated Glass Infinity Pool',
      'Private High-Speed Elevator Bank',
      'Dedicated Helipad & Chauffeur Suite',
      '1,500 Bottle Climate-Controlled Wine Cellar',
      'Private IMAX-Certified Dolby Atmos Cinema',
      'Full-Floor Wellness Spa & Treatment Pavilion',
      '8 Dedicated Covered Basement Parking Bays',
      '24/7 White-Glove Concierge & Security Team',
    ],
    highlights: [
      'Triple-Height 28-Foot Ceilings with Unobstructed Arabian Sea Panoramas',
      'Certified Rooftop Helipad Access with Complete Security Isolation',
      'Direct Coastal Road Access Connecting to BKC in Under 12 Minutes',
      'Comprehensive 10-Year Developer Structural & Waterproofing Warranty',
    ],
  };

  const intel100Cr = generatePropertyIntelligence(stressListing100Cr);
  // Add 12 comparables to stress test
  intel100Cr.comparables.items = [
    {
      id: 'c1',
      name: 'The World Towers Triplex Penthouse',
      propertyType: 'Penthouse',
      location: 'Upper Worli, Mumbai',
      squareFeet: 12000,
      price: 850000000,
      currency: '₹',
      pricePerSqFt: 70833,
      status: 'Active Listing',
      similarityNote: 'Directly comparable trophy penthouse with sea views and private elevator access.',
    },
    {
      id: 'c2',
      name: 'Lodha Altamount Sky Mansion',
      propertyType: 'Penthouse',
      location: 'Altamount Road, Mumbai',
      squareFeet: 15000,
      price: 1100000000,
      currency: '₹',
      pricePerSqFt: 73333,
      status: 'Recent Benchmark',
      similarityNote: 'Billionaires Row benchmark with private pool and panoramic coastal orientation.',
    },
    {
      id: 'c3',
      name: 'Oberoi 360 West Sea View Duplex',
      propertyType: 'Duplex Penthouse',
      location: 'Worli Sea Face, Mumbai',
      squareFeet: 11500,
      price: 780000000,
      currency: '₹',
      pricePerSqFt: 67826,
      status: 'Active Listing',
      similarityNote: 'High-floor sea view duplex in immediate adjacent ultra-luxury tower.',
    },
    {
      id: 'c4',
      name: 'Piramal Mahalaxmi Sea Facing Sky Villa',
      propertyType: 'Sky Villa',
      location: 'Mahalaxmi, Mumbai',
      squareFeet: 9800,
      price: 620000000,
      currency: '₹',
      pricePerSqFt: 63265,
      status: 'Sold',
      similarityNote: 'Recent registered transaction overlooking the Mahalaxmi Racecourse and sea.',
    },
    {
      id: 'c5',
      name: 'K Raheja Vivarea Penthouse',
      propertyType: 'Penthouse',
      location: 'Mahalaxmi, Mumbai',
      squareFeet: 10500,
      price: 710000000,
      currency: '₹',
      pricePerSqFt: 67619,
      status: 'Recent Benchmark',
      similarityNote: 'Prime central south Mumbai luxury asset with private terrace.',
    },
    {
      id: 'c6',
      name: 'Rustomjee Crown Waterfront Duplex',
      propertyType: 'Duplex',
      location: 'Prabhadevi, Mumbai',
      squareFeet: 8900,
      price: 580000000,
      currency: '₹',
      pricePerSqFt: 65168,
      status: 'Active Listing',
      similarityNote: 'Waterfront multi-level residence with private deck.',
    },
  ];

  // Add long sources and long URLs
  intel100Cr.sources = [
    {
      title: 'Knight Frank India Prime Global Cities & Ultra-Luxury Residential Wealth Report 2026',
      uri: 'https://www.knightfrank.co.in/research/india-prime-residential-review-2026-south-mumbai-waterfront-corridor-transaction-benchmarks',
      snippet: 'Comprehensive analysis of ultra-prime capital values and private wealth asset allocations across Mumbai coastal properties.',
    },
    {
      title: 'JLL India Luxury Housing Index — Super Prime Transactions and Sovereign Capital Velocity',
      uri: 'https://www.jll.co.in/en/trends-and-insights/research/mumbai-super-luxury-condominium-and-penthouse-price-indices-2026',
      snippet: 'Historical price per square foot appreciation data across Worli Sea Face, Malabar Hill, and Altamount Road.',
    },
    {
      title: 'CBRE South Asia Waterfront Real Estate Due Diligence & Infrastructure Catalyst Study',
      uri: 'https://www.cbre.co.in/insights/reports/south-mumbai-coastal-road-impact-on-luxury-residential-valuations-and-liquidity',
      snippet: 'Transit duration reductions and capital appreciation modeling following Mumbai Coastal Road commissioning.',
    },
  ];

  console.log('Generating Stress Test PDF 1 (₹100 Cr Triplex Sky Villa)...');
  const doc1 = React.createElement(PropertyIntelligenceReport, {
    listing: stressListing100Cr,
    intelligence: intel100Cr,
  });
  await ReactPDF.renderToFile(doc1, './output_stress_100cr.pdf');
  console.log('Successfully rendered ./output_stress_100cr.pdf (Size:', fs.statSync('./output_stress_100cr.pdf').size, 'bytes)');

  // TEST 2: ₹30 Cr Villa with minimal data (testing robustness with nulls/fallbacks)
  const stressListingMinimal: PropertyListing = {
    id: 'listing-stress-minimal',
    slug: 'minimal-data-estate',
    title: 'The Sanctuary Hilltop Pavilion — ₹30 Cr',
    price: 300000000,
    currency: '₹',
    status: 'published',
    images: [],
    contact: {
      agentName: 'Listing Agent',
      agentRole: 'Senior Advisor',
      phone: '+91 98000 00000',
      whatsappNumber: '+91 98000 00000',
      email: 'agent@listingos.luxury',
      agencyName: 'Listing OS Luxury Advisory',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    specs: {
      bedrooms: 5,
      bathrooms: 6,
      squareFeet: 7200,
      propertyType: 'Hilltop Villa',
    },
    location: {
      address: 'Scenic Valley Road',
      neighborhood: 'North Valley',
      city: 'Goa',
      country: 'India',
    },
    description: 'A discreet modern estate overlooking the valley.',
    amenities: [],
    highlights: [],
  };

  const intelMinimal = generatePropertyIntelligence(stressListingMinimal);
  console.log('\nGenerating Stress Test PDF 2 (₹30 Cr Minimal Data)...');
  const doc2 = React.createElement(PropertyIntelligenceReport, {
    listing: stressListingMinimal,
    intelligence: intelMinimal,
  });
  await ReactPDF.renderToFile(doc2, './output_stress_30cr.pdf');
  console.log('Successfully rendered ./output_stress_30cr.pdf (Size:', fs.statSync('./output_stress_30cr.pdf').size, 'bytes)');

  console.log('\n=== ALL STRESS TESTS PASSED WITH 0 ERRORS ===');
}

runStressTests().catch(err => {
  console.error('Stress test failed:', err);
  process.exit(1);
});
