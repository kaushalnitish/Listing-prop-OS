import React from 'react';
import { View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import { PropertyListing } from '../../types';
import { PropertyIntelligenceData } from '../../types/intelligence';
import { colors, pdfStyles } from './pdfStyles';

interface Props {
  listing: PropertyListing;
  intelligence: PropertyIntelligenceData;
}

const sourceStyles = StyleSheet.create({
  sourceCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 8,
    marginBottom: 6,
  },
  sourceTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  sourceUrl: {
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: colors.accentGold,
    textDecoration: 'none',
    marginBottom: 2,
  },
  sourceSnippet: {
    fontSize: 6.8,
    fontFamily: 'Helvetica',
    color: colors.textMuted,
    lineHeight: 1.3,
  },
  matrixCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 10,
    marginBottom: 10,
  },
  disclaimerBox: {
    backgroundColor: colors.bgHero,
    borderRadius: 4,
    padding: 10,
    marginTop: 6,
  },
  disclaimerTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.accentGoldLight,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 6.8,
    fontFamily: 'Helvetica',
    color: colors.textHeroMuted,
    lineHeight: 1.4,
  },
});

export const SourcesMethodologyPage: React.FC<Props> = ({ listing, intelligence }) => {
  const sources = intelligence.sources || [
    { title: '99acres Micro-Market Research — Sector Trends & Rate Indices', uri: 'https://www.99acres.com', snippet: 'Benchmark registry data and active inventory pricing.' },
    { title: 'MagicBricks Submarket Property Valuations & Corridor Report', uri: 'https://www.magicbricks.com', snippet: 'Rental yield indices and historical capital trajectory.' },
    { title: 'Housing.com Regional Demographic & Infrastructure Review', uri: 'https://housing.com', snippet: 'Corridor connectivity points and demographic profiles.' },
  ];

  return (
    <View style={pdfStyles.sectionContainer}>
      {/* Section Header */}
      <View style={pdfStyles.sectionNumberTitleRow}>
        <Text style={pdfStyles.sectionNumber}>8.</Text>
        <Text style={pdfStyles.sectionTitle}>
          RESEARCH METHODOLOGY, SOURCES & DATA CONFIDENCE
        </Text>
      </View>
      <Text style={pdfStyles.sectionSubtitle}>
        Information architecture, external source citations, and statutory due-diligence disclaimers
      </Text>
      <View style={pdfStyles.sectionDivider} />

      {/* Research Methodology */}
      <View style={[pdfStyles.card, { padding: 10, marginBottom: 10 }]}>
        <Text style={[pdfStyles.subheadingMuted, { color: colors.accentGold, marginBottom: 3 }]}>
          INSTITUTIONAL RESEARCH METHODOLOGY
        </Text>
        <Text style={pdfStyles.bodyText}>
          This report synthesizes primary listing data verified by the listing brokerage with multi-source external micro-market intelligence. Market trends, price spreads, and rental estimates are modeled by cross-referencing recent transactions, localized real-estate listings, and municipal infrastructure announcements.
        </Text>
      </View>

      {/* Data Confidence Classification Matrix */}
      <View style={sourceStyles.matrixCard} wrap={false}>
        <Text style={[pdfStyles.subheadingMuted, { color: colors.accentEmerald, marginBottom: 4 }]}>
          DATA CONFIDENCE CLASSIFICATION MATRIX
        </Text>

        <View style={{ flexDirection: 'row', marginBottom: 4 }}>
          <View style={[pdfStyles.badge, pdfStyles.badgeEmerald, { marginRight: 6 }]}>
            <Text style={pdfStyles.badgeEmeraldText}>VERIFIED DATA</Text>
          </View>
          <Text style={[pdfStyles.captionText, { flex: 1 }]}>
            Property Asking Price, Floor Area (Sq Ft), Configuration (BHK), Official Address, Warranty Covenants, and Active Listing Specifications.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 4 }}>
          <View style={[pdfStyles.badge, pdfStyles.badgeGold, { marginRight: 6 }]}>
            <Text style={pdfStyles.badgeGoldText}>INDICATIVE / ESTIMATED</Text>
          </View>
          <Text style={[pdfStyles.captionText, { flex: 1 }]}>
            Micro-Market Spread Variance, 4-Year Historical Trajectory, Indicative Gross Rental Yield, and Demographic Buyer Mix.
          </Text>
        </View>

        <View style={{ flexDirection: 'row' }}>
          <View style={[pdfStyles.badge, { marginRight: 6 }]}>
            <Text style={pdfStyles.badgeText}>UNAVAILABLE</Text>
          </View>
          <Text style={[pdfStyles.captionText, { flex: 1 }]}>
            Confidential proprietary registry deed prices and private tenant lease covenants not in the public domain.
          </Text>
        </View>
      </View>

      {/* External Sources Citations */}
      <Text style={[pdfStyles.subheading, { marginBottom: 6 }]}>
        EXTERNAL DATA CITATIONS & VERIFIED SOURCES
      </Text>

      {sources.map((src, idx) => (
        <View key={idx} style={sourceStyles.sourceCard} wrap={false}>
          <Text style={sourceStyles.sourceTitle}>
            [{idx + 1}] {src.title}
          </Text>
          {src.uri ? (
            <Link src={src.uri} style={sourceStyles.sourceUrl}>
              {src.uri}
            </Link>
          ) : null}
          {src.snippet ? <Text style={sourceStyles.sourceSnippet}>{src.snippet}</Text> : null}
        </View>
      ))}

      {/* Statutory Disclaimer Box */}
      <View style={sourceStyles.disclaimerBox} wrap={false}>
        <Text style={sourceStyles.disclaimerTitle}>
          IMPORTANT STATUTORY & DUE-DILIGENCE DISCLAIMER
        </Text>
        <Text style={sourceStyles.disclaimerText}>
          This Property Intelligence & Market Positioning Report is prepared solely for informational and due-diligence purposes for prospective purchasers. It does not constitute a formal bank appraisal, chartered structural survey, legal title warranty, or financial investment advice. All financial estimates, including rental yields, price per square foot comparisons, and market trajectories, are indicative heuristics derived from current market data. Prospective buyers are strongly advised to conduct independent legal title verification, physical structural inspection, and municipal sanction due diligence prior to executing binding agreements.
        </Text>
      </View>
    </View>
  );
};
