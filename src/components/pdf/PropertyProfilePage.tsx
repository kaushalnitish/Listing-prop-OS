import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PropertyListing } from '../../types';
import { PropertyIntelligenceData } from '../../types/intelligence';
import { colors, pdfStyles, formatPriceDisplay, formatRateDisplay } from './pdfStyles';

interface Props {
  listing: PropertyListing;
  intelligence: PropertyIntelligenceData;
}

const profileStyles = StyleSheet.create({
  specRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
    paddingVertical: 5,
  },
  specRowLast: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  specCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  specLabel: {
    width: 90,
    fontSize: 7.2,
    fontFamily: 'Helvetica-Bold',
    color: colors.textMuted,
  },
  specValue: {
    flex: 1,
    fontSize: 7.8,
    fontFamily: 'Helvetica',
    color: colors.textPrimary,
  },
  pillarCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 9,
    marginBottom: 7,
  },
  pillarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pillarTag: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.accentGold,
    backgroundColor: colors.bgAccentLight,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 2,
    marginRight: 6,
    textTransform: 'uppercase',
  },
  pillarTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.textPrimary,
  },
  pillarBody: {
    fontSize: 7.8,
    fontFamily: 'Helvetica',
    color: colors.textBody,
    lineHeight: 1.4,
  },
});

export const PropertyProfilePage: React.FC<Props> = ({ listing, intelligence }) => {
  const priceDisplay = formatPriceDisplay(listing.price, listing.currency);
  const calculatedRate =
    intelligence.summary?.formattedPricePerSqFt ||
    (listing.specs?.squareFeet && listing.price
      ? formatRateDisplay(Math.round(listing.price / listing.specs.squareFeet), listing.currency)
      : 'Market Benchmark');

  const pillars = intelligence.whyThisProperty?.pillars || [
    {
      tag: 'LOCATION',
      title: 'Corridor Connectivity & Commute Infrastructure',
      description: 'Positioned along primary transit corridors offering rapid access to regional tech clusters, commercial centers, and premier educational institutions.',
    },
    {
      tag: 'SCARCITY',
      title: 'Constrained Low-Density Inventory',
      description: 'Independent residential configuration with dedicated access rights and limited available inventory in the immediate organized sector pockets.',
    },
    {
      tag: 'PROPERTY QUALITY',
      title: 'Superior Build Specifications & Warranties',
      description: 'Engineered with durable materials, high-grade utility connections, and documented structural/woodwork warranty commitments.',
    },
    {
      tag: 'MARKET POSITION',
      title: 'Advantageous Price Per Square Foot Benchmark',
      description: 'Priced competitively against surrounding developments while delivering higher personal land and private space ownership.',
    },
    {
      tag: 'LIFESTYLE',
      title: 'Family-Oriented Gated Community Security',
      description: 'Gated access control, wide internal RCC roadways, and planned neighborhood infrastructure creating an exceptional living environment.',
    },
    {
      tag: 'ACCESSIBILITY',
      title: 'Civic, Healthcare & Retail Proximity',
      description: 'Situated within brief driving distance of regional shopping malls, super-specialty hospitals, and major transit interchanges.',
    },
  ];

  return (
    <View style={pdfStyles.sectionContainer}>
      {/* Section Header */}
      <View style={pdfStyles.sectionNumberTitleRow}>
        <Text style={pdfStyles.sectionNumber}>1.</Text>
        <Text style={pdfStyles.sectionTitle}>
          PROPERTY PROFILE & STRATEGIC VALUE PILLARS
        </Text>
      </View>
      <Text style={pdfStyles.sectionSubtitle}>
        Comprehensive architectural specifications, space breakdown, and core investment rationale
      </Text>
      <View style={pdfStyles.sectionDivider} />

      {/* Snapshot Table Card */}
      <View style={[pdfStyles.card, { padding: 10, marginBottom: 10 }]}>
        <Text style={[pdfStyles.subheading, { marginTop: 0, marginBottom: 6 }]}>
          ARCHITECTURAL & SPECIFICATION PROFILE
        </Text>

        <View style={profileStyles.specRow}>
          <View style={profileStyles.specCol}>
            <Text style={profileStyles.specLabel}>Property Title:</Text>
            <Text style={profileStyles.specValue}>{listing.title}</Text>
          </View>
          <View style={profileStyles.specCol}>
            <Text style={profileStyles.specLabel}>Super Built-up Area:</Text>
            <Text style={profileStyles.specValue}>
              {listing.specs?.squareFeet ? `${listing.specs.squareFeet.toLocaleString()} Sq Ft` : 'Refer to Architectural Plans'}
            </Text>
          </View>
        </View>

        <View style={profileStyles.specRow}>
          <View style={profileStyles.specCol}>
            <Text style={profileStyles.specLabel}>Micro-Market:</Text>
            <Text style={profileStyles.specValue}>
              {[listing.location.neighborhood, listing.location.city].filter(Boolean).join(', ')}
            </Text>
          </View>
          <View style={profileStyles.specCol}>
            <Text style={profileStyles.specLabel}>Configuration:</Text>
            <Text style={profileStyles.specValue}>
              {listing.specs?.bedrooms ? `${listing.specs.bedrooms} BHK` : 'Custom Layout'} ({listing.specs?.bathrooms || 'N/A'} Bathrooms)
            </Text>
          </View>
        </View>

        <View style={profileStyles.specRow}>
          <View style={profileStyles.specCol}>
            <Text style={profileStyles.specLabel}>Asking Price:</Text>
            <Text style={profileStyles.specValue}>{priceDisplay}</Text>
          </View>
          <View style={profileStyles.specCol}>
            <Text style={profileStyles.specLabel}>Unit Rate:</Text>
            <Text style={profileStyles.specValue}>{calculatedRate}</Text>
          </View>
        </View>

        <View style={profileStyles.specRowLast}>
          <View style={profileStyles.specCol}>
            <Text style={profileStyles.specLabel}>Parking & Access:</Text>
            <Text style={profileStyles.specValue}>
              {listing.specs?.parkingSpaces ? `${listing.specs.parkingSpaces} Reserved Slots` : 'Dedicated Space'} · Gated Access
            </Text>
          </View>
          <View style={profileStyles.specCol}>
            <Text style={profileStyles.specLabel}>Key Amenities:</Text>
            <Text style={profileStyles.specValue}>
              {listing.amenities?.slice(0, 4).join(', ') || 'Gated Society, RCC Roads, 24/7 Security'}
            </Text>
          </View>
        </View>
      </View>

      {/* Property Characteristics Narrative */}
      <View style={[pdfStyles.card, { padding: 10, marginBottom: 12 }]}>
        <Text style={[pdfStyles.subheading, { marginTop: 0, marginBottom: 4 }]}>
          PROPERTY CHARACTERISTICS & DESIGN HIGHLIGHTS
        </Text>
        <Text style={pdfStyles.bodyText}>
          {listing.description ||
            'This residence represents a thoughtfully engineered modern development designed to maximize functional utility, natural airflow, and everyday residential comfort. The floorplan balances private accommodations with generous communal spaces, supported by robust civil infrastructure.'}
        </Text>
        {listing.highlights && listing.highlights.length > 0 && (
          <View style={{ marginTop: 4 }}>
            <Text style={[pdfStyles.bodyTextBold, { fontSize: 7.5, marginBottom: 3 }]}>
              Distinct Architectural & Quality Commitments:
            </Text>
            {listing.highlights.slice(0, 4).map((hl, i) => (
              <Text key={i} style={[pdfStyles.captionText, { color: colors.textBody, marginBottom: 2 }]}>
                • {hl}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* The Six Strategic Value Pillars */}
      <View style={{ marginBottom: 6 }}>
        <Text style={[pdfStyles.subheading, { marginTop: 2, marginBottom: 2 }]}>
          THE SIX STRATEGIC VALUE PILLARS
        </Text>
        <Text style={pdfStyles.captionText}>
          Detailed assessment of competitive differentiators and their importance to prospective purchasers
        </Text>
      </View>

      {pillars.map((pillar, idx) => (
        <View key={idx} style={profileStyles.pillarCard} wrap={false}>
          <View style={profileStyles.pillarHeaderRow}>
            <Text style={profileStyles.pillarTag}>{pillar.tag}</Text>
            <Text style={profileStyles.pillarTitle}>{pillar.title}</Text>
          </View>
          <Text style={profileStyles.pillarBody}>{pillar.description}</Text>
        </View>
      ))}
    </View>
  );
};
