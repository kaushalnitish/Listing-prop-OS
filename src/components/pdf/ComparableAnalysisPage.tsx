import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PropertyListing } from '../../types';
import { PropertyIntelligenceData, ComparableProperty } from '../../types/intelligence';
import { colors, pdfStyles, formatPriceDisplay, formatRateDisplay } from './pdfStyles';

interface Props {
  listing: PropertyListing;
  intelligence: PropertyIntelligenceData;
}

const compStyles = StyleSheet.create({
  compCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 9,
    marginBottom: 8,
  },
  compHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  compTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  compPrice: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.accentGold,
  },
  compMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  compMetaText: {
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: colors.textMuted,
  },
  compNoteBox: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: 3,
    padding: 5,
    marginTop: 4,
  },
  compNoteText: {
    fontSize: 7.2,
    fontFamily: 'Helvetica',
    color: colors.textBody,
    lineHeight: 1.35,
  },
  spreadBox: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  spreadItem: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 8,
    marginRight: 6,
  },
  spreadItemLast: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 8,
    marginRight: 0,
  },
});

export const ComparableAnalysisPage: React.FC<Props> = ({ listing, intelligence }) => {
  const compsList: ComparableProperty[] = intelligence.comparables?.items || [];

  const subjectRate =
    listing.specs?.squareFeet && listing.price
      ? Math.round(listing.price / listing.specs.squareFeet)
      : intelligence.summary?.pricePerSqFt || 0;

  const validCompRates = compsList
    .map(c => c.pricePerSqFt)
    .filter(r => typeof r === 'number' && r > 0);

  const medianCompRate =
    validCompRates.length > 0
      ? Math.round(validCompRates.reduce((a, b) => a + b, 0) / validCompRates.length)
      : subjectRate;

  const spreadPct =
    medianCompRate > 0
      ? (((subjectRate - medianCompRate) / medianCompRate) * 100).toFixed(1)
      : '0.0';

  const isBelow = parseFloat(spreadPct) < 0;

  return (
    <View style={pdfStyles.sectionContainer}>
      {/* Section Header */}
      <View style={pdfStyles.sectionNumberTitleRow}>
        <Text style={pdfStyles.sectionNumber}>2.</Text>
        <Text style={pdfStyles.sectionTitle}>
          COMPARABLE PROPERTIES & PRICE POSITIONING
        </Text>
      </View>
      <Text style={pdfStyles.sectionSubtitle}>
        Micro-market transaction benchmarks, rate per square foot analysis, and relative value spread
      </Text>
      <View style={pdfStyles.sectionDivider} />

      {/* Benchmark Metric Spread Bar */}
      <View style={compStyles.spreadBox}>
        <View style={compStyles.spreadItem}>
          <Text style={pdfStyles.metricLabel}>SUBJECT PROPERTY RATE</Text>
          <Text style={pdfStyles.metricValue}>{formatRateDisplay(subjectRate, listing.currency)}</Text>
          <Text style={pdfStyles.metricSub}>Active Asking Rate</Text>
        </View>

        <View style={compStyles.spreadItem}>
          <Text style={pdfStyles.metricLabel}>COMPARABLE BENCHMARK RATE</Text>
          <Text style={pdfStyles.metricValueGold}>{formatRateDisplay(medianCompRate, listing.currency)}</Text>
          <Text style={pdfStyles.metricSub}>Micro-Market Median</Text>
        </View>

        <View style={compStyles.spreadItemLast}>
          <Text style={pdfStyles.metricLabel}>INDICATIVE VALUE SPREAD</Text>
          <Text style={isBelow ? pdfStyles.metricValueEmerald : pdfStyles.metricValueGold}>
            {isBelow ? '' : '+'}{spreadPct}%
          </Text>
          <Text style={pdfStyles.metricSub}>
            {isBelow ? 'Priced Below Sector Median' : 'Specification Premium'}
          </Text>
        </View>
      </View>

      {/* Narrative: What the Pricing Suggests */}
      <View style={[pdfStyles.cardHighlight, { marginBottom: 12 }]}>
        <Text style={[pdfStyles.subheadingMuted, { color: colors.accentGold }]}>
          INDICATIVE MARKET POSITIONING ANALYSIS
        </Text>
        <Text style={pdfStyles.bodyText}>
          {intelligence.comparables?.marketVarianceSummary ||
            `Evaluation of current comparable listings and recent micro-market transactions reveals that the subject property commands an asking rate of ${formatRateDisplay(subjectRate, listing.currency)}, representing an indicative ${Math.abs(parseFloat(spreadPct))}% ${isBelow ? 'favorable spread below' : 'measured spread relative to'} the sector benchmark of ${formatRateDisplay(medianCompRate, listing.currency)}.`}
        </Text>
        <Text style={[pdfStyles.bodyText, { marginBottom: 0 }]}>
          This positioning reflects the asset's specific physical characteristics, including independent floor land rights, lower recurring maintenance liabilities compared to high-density towers, and dedicated warranty covenants. The asset offers tangible spatial value without speculative developer loading.
        </Text>
      </View>

      {/* Micro-Market Comparables Breakdown */}
      <Text style={[pdfStyles.subheading, { marginBottom: 6 }]}>
        MICRO-MARKET COMPARABLE BENCHMARKS
      </Text>

      {compsList.map((comp, idx) => {
        const compPriceStr = formatPriceDisplay(comp.price, comp.currency);
        const compRateStr = formatRateDisplay(comp.pricePerSqFt, comp.currency);
        const isSale =
          comp.status?.toLowerCase().includes('sold') ||
          comp.status?.toLowerCase().includes('benchmark');

        return (
          <View key={comp.id || idx} style={compStyles.compCard} wrap={false}>
            <View style={compStyles.compHeaderRow}>
              <Text style={compStyles.compTitle}>
                {idx + 1}. {comp.name}
              </Text>
              <Text style={compStyles.compPrice}>
                {compPriceStr} ({compRateStr})
              </Text>
            </View>

            <View style={compStyles.compMetaRow}>
              <View style={[pdfStyles.badge, isSale ? pdfStyles.badgeEmerald : pdfStyles.badgeGold, { marginRight: 6 }]}>
                <Text style={isSale ? pdfStyles.badgeEmeraldText : pdfStyles.badgeGoldText}>
                  {comp.status || 'Active Listing'}
                </Text>
              </View>
              <Text style={compStyles.compMetaText}>
                Location: {comp.location}  ·  Type: {comp.propertyType}  ·  Area: {comp.squareFeet ? `${comp.squareFeet.toLocaleString()} Sq Ft` : 'N/A'}
              </Text>
            </View>

            <View style={compStyles.compNoteBox}>
              <Text style={compStyles.compNoteText}>
                Comparative Rationale: {comp.similarityNote || 'Directly comparable in configuration, access corridor, and micro-market target demographic.'}
              </Text>
            </View>
          </View>
        );
      })}

      <View style={pdfStyles.calloutBox}>
        <Text style={pdfStyles.calloutText}>
          Methodology Note: Comparable properties are selected based on geographic proximity, functional layout equivalence, and recent transaction or active listing data. Spread calculations are indicative for due-diligence purposes and do not substitute for a statutory physical appraisal.
        </Text>
      </View>
    </View>
  );
};
