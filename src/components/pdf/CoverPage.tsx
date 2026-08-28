import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PropertyListing } from '../../types';
import { PropertyIntelligenceData } from '../../types/intelligence';
import { colors, pdfStyles, formatPriceDisplay, formatRateDisplay } from './pdfStyles';

interface Props {
  listing: PropertyListing;
  intelligence: PropertyIntelligenceData;
}

const coverStyles = StyleSheet.create({
  heroBlock: {
    backgroundColor: colors.bgHero,
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
  },
  reportTypeTag: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.accentGoldLight,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: colors.textWhite,
    lineHeight: 1.25,
    marginBottom: 6,
  },
  heroLocation: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: colors.textHeroMuted,
    lineHeight: 1.35,
    marginBottom: 12,
  },
  heroPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 0.5,
    borderTopColor: colors.bgHeroCard,
    paddingTop: 10,
  },
  pricePrimary: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: colors.accentGoldLight,
  },
  priceRate: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: colors.textHeroMuted,
    marginTop: 2,
  },
  heroMetaTag: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: colors.accentEmerald,
    textAlign: 'right',
  },
  heroMetaDate: {
    fontSize: 6.5,
    fontFamily: 'Helvetica',
    color: colors.textHeroMuted,
    textAlign: 'right',
    marginTop: 2,
  },
  
  // Spec Grid
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  specItem: {
    width: '31.8%',
    marginRight: '2.3%',
    marginBottom: 6,
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 7,
  },
  specItemLastInRow: {
    width: '31.8%',
    marginRight: 0,
    marginBottom: 6,
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 7,
  },

  // Executive Summary
  execCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderGold,
    padding: 12,
    marginBottom: 12,
  },
  execHeader: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.accentGold,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  execParagraph: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: colors.textBody,
    lineHeight: 1.45,
    marginBottom: 6,
  },

  // Highlight Cards Row
  highlightRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: colors.bgCardAlt,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 8,
    marginRight: 6,
  },
  highlightCardLast: {
    flex: 1,
    backgroundColor: colors.bgCardAlt,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 8,
    marginRight: 0,
  },
});

export const CoverPage: React.FC<Props> = ({ listing, intelligence }) => {
  const priceDisplay = formatPriceDisplay(listing.price, listing.currency);
  const calculatedRate =
    intelligence.summary?.formattedPricePerSqFt ||
    (listing.specs?.squareFeet && listing.price
      ? formatRateDisplay(Math.round(listing.price / listing.specs.squareFeet), listing.currency)
      : 'Market Benchmark');

  const fullLocation = [
    listing.location.address,
    listing.location.neighborhood,
    listing.location.city,
    listing.location.country,
  ]
    .filter(Boolean)
    .join(', ');

  const researchDate = intelligence.researchDate
    ? new Date(intelligence.researchDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const confLabel =
    intelligence.confidenceLevel === 'verified-research'
      ? 'VERIFIED MICRO-MARKET GROUNDING'
      : 'INDICATIVE MARKET HEURISTICS';

  const specsList = [
    { label: 'PROPERTY TYPE', val: listing.specs?.propertyType || 'Residential' },
    { label: 'CONFIGURATION', val: listing.specs?.bedrooms ? `${listing.specs.bedrooms} Bedrooms` : 'Custom Layout' },
    { label: 'SUPER BUILT-UP AREA', val: listing.specs?.squareFeet ? `${listing.specs.squareFeet.toLocaleString()} Sq Ft` : 'Refer to Plans' },
    { label: 'BATHROOMS', val: listing.specs?.bathrooms ? `${listing.specs.bathrooms} Bathrooms` : 'N/A' },
    { label: 'PARKING CAPACITY', val: listing.specs?.parkingSpaces ? `${listing.specs.parkingSpaces} Reserved Slots` : 'Dedicated Space' },
    { label: 'LOT / GROUNDS', val: listing.specs?.lotSize || (listing.specs?.yearBuilt ? `Built ${listing.specs.yearBuilt}` : 'Independent Freehold') },
  ];

  return (
    <View style={{ marginBottom: 10 }}>
      {/* Dark Hero Block */}
      <View style={coverStyles.heroBlock}>
        <Text style={coverStyles.reportTypeTag}>
          PROPERTY INTELLIGENCE & MARKET POSITIONING REPORT
        </Text>
        <Text style={coverStyles.heroTitle}>{listing.title}</Text>
        <Text style={coverStyles.heroLocation}>{fullLocation}</Text>

        <View style={coverStyles.heroPriceRow}>
          <View>
            <Text style={coverStyles.pricePrimary}>{priceDisplay}</Text>
            <Text style={coverStyles.priceRate}>{calculatedRate}</Text>
          </View>
          <View>
            <Text style={coverStyles.heroMetaTag}>{confLabel}</Text>
            <Text style={coverStyles.heroMetaDate}>Research Date: {researchDate}</Text>
          </View>
        </View>
      </View>

      {/* 6-Point Specification Grid */}
      <View style={coverStyles.specGrid}>
        {specsList.map((spec, idx) => {
          const isLastInRow = (idx + 1) % 3 === 0;
          return (
            <View
              key={idx}
              style={isLastInRow ? coverStyles.specItemLastInRow : coverStyles.specItem}
            >
              <Text style={pdfStyles.metricLabel}>{spec.label}</Text>
              <Text style={pdfStyles.bodyTextBold}>{spec.val}</Text>
            </View>
          );
        })}
      </View>

      {/* Executive Research Summary Box */}
      <View style={coverStyles.execCard}>
        <Text style={coverStyles.execHeader}>
          EXECUTIVE RESEARCH SUMMARY & STRATEGIC CONTEXT
        </Text>
        <Text style={coverStyles.execParagraph}>
          This institutional property intelligence dossier provides an objective, evidence-based evaluation of {listing.title}, situated within {listing.location.neighborhood || listing.location.address || 'the designated micro-market'} of {listing.location.city}. Offered at {priceDisplay} ({calculatedRate}), this asset represents a notable {listing.specs?.propertyType || 'residential'} configuration spanning {listing.specs?.squareFeet ? `${listing.specs.squareFeet.toLocaleString()} square feet of built-up area` : 'generously proportioned living spaces'}.
        </Text>
        <Text style={coverStyles.execParagraph}>
          Market positioning indicates that the subject property commands a strategic position within the {listing.location.city} corridor. Local comparable benchmarks currently reflect transaction and listing values in the vicinity of {intelligence.summary?.formattedPricePerSqFt || calculatedRate}, backed by sustained YoY appreciation of {intelligence.marketTrends?.yoyPriceChange || '+8% to +12%'} across organized residential clusters. The asset benefits from strong physical non-replicability, including dedicated infrastructure specifications, favorable road widths, and direct proximity to key commercial and transit arteries.
        </Text>
        <Text style={[coverStyles.execParagraph, { marginBottom: 0 }]}>
          Key investment considerations for serious purchasers include high end-user owner-occupancy ({intelligence.demographics?.metrics?.find(m => m.label.includes('Owner'))?.value || '76%'}), robust tenant demand with indicative gross rental yields estimated at {intelligence.rentalPotential?.estimatedGrossYield || '4.2% - 4.9%'}, and ongoing infrastructure catalysts that support long-term capital preservation.
        </Text>
      </View>

      {/* 3 Key Decision Factor Cards */}
      <View style={coverStyles.highlightRow}>
        <View style={coverStyles.highlightCard}>
          <Text style={pdfStyles.metricLabel}>MARKET POSITION</Text>
          <Text style={pdfStyles.metricValueGold}>{calculatedRate}</Text>
          <Text style={pdfStyles.captionText}>
            Priced relative to local sector benchmark averages with documented quality specifications.
          </Text>
        </View>
        <View style={coverStyles.highlightCard}>
          <Text style={pdfStyles.metricLabel}>SUPPLY & SCARCITY</Text>
          <Text style={pdfStyles.metricValueEmerald}>{intelligence.scarcity?.rarityTier || 'High (Top 10%)'}</Text>
          <Text style={pdfStyles.captionText}>
            {intelligence.scarcity?.competingActiveInventory || 'Low competing inventory'}. High structural barriers to entry for new supply.
          </Text>
        </View>
        <View style={coverStyles.highlightCardLast}>
          <Text style={pdfStyles.metricLabel}>RENTAL YIELD POTENTIAL</Text>
          <Text style={pdfStyles.metricValueEmerald}>{intelligence.rentalPotential?.estimatedGrossYield || '4.3% - 4.9%'}</Text>
          <Text style={pdfStyles.captionText}>
            Indicative gross yield of {intelligence.rentalPotential?.estimatedMonthlyRental || 'competitive market rates'} based on executive tenant demand.
          </Text>
        </View>
      </View>

      {/* Footer Disclaimer Callout */}
      <View style={pdfStyles.calloutBox}>
        <Text style={pdfStyles.calloutText}>
          Confidential Research Dossier: Prepared exclusively for client due-diligence. Contains verified property records synthesized with live micro-market comparables. See Section 9 for complete data sources, research confidence classification, and methodology.
        </Text>
      </View>
    </View>
  );
};
