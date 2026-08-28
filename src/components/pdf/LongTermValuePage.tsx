import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PropertyListing } from '../../types';
import { PropertyIntelligenceData } from '../../types/intelligence';
import { colors, pdfStyles } from './pdfStyles';

interface Props {
  listing: PropertyListing;
  intelligence: PropertyIntelligenceData;
}

const valueStyles = StyleSheet.create({
  outlookCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 10,
    marginBottom: 10,
  },
  catalystItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bullet: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.accentGold,
    marginRight: 4,
  },
  thesisCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderGold,
    padding: 10,
    marginBottom: 10,
  },
  riskCard: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 10,
    marginBottom: 8,
  },
  subheadBold: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.accentGold,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
});

export const LongTermValuePage: React.FC<Props> = ({ listing, intelligence }) => {
  const catalysts = intelligence.appreciationOutlook?.growthCatalysts || [
    'Ongoing road widening and proposed metro link expansions along regional transit axes',
    'Accelerated development of tech parks, corporate campuses, and tertiary educational institutions',
    'Increased structural buyer preference for low-density gated builder floors with terrace rights',
  ];

  return (
    <View style={pdfStyles.sectionContainer}>
      {/* Section Header */}
      <View style={pdfStyles.sectionNumberTitleRow}>
        <Text style={pdfStyles.sectionNumber}>7.</Text>
        <Text style={pdfStyles.sectionTitle}>
          LONG-TERM VALUE, INVESTMENT THESIS & RISK AUDIT
        </Text>
      </View>
      <Text style={pdfStyles.sectionSubtitle}>
        Long-term structural appreciation outlook, comprehensive thesis, and risk factors
      </Text>
      <View style={pdfStyles.sectionDivider} />

      {/* Long-Term Value Rating & Catalysts */}
      <View style={valueStyles.outlookCard} wrap={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={[pdfStyles.subheading, { marginTop: 0, marginBottom: 0 }]}>
            LONG-TERM CAPITAL VALUE OUTLOOK
          </Text>
          <View style={[pdfStyles.badge, pdfStyles.badgeEmerald]}>
            <Text style={pdfStyles.badgeEmeraldText}>
              {intelligence.appreciationOutlook?.longTermOutlookRating || 'Strong Growth Target'}
            </Text>
          </View>
        </View>

        <Text style={[pdfStyles.bodyTextBold, { fontSize: 7.5, marginBottom: 3 }]}>
          Key Infrastructure & Micro-Market Catalysts:
        </Text>
        {catalysts.map((cat, idx) => (
          <View key={idx} style={valueStyles.catalystItem}>
            <Text style={valueStyles.bullet}>•</Text>
            <Text style={pdfStyles.captionText}>{cat}</Text>
          </View>
        ))}

        <Text style={[pdfStyles.captionText, { fontStyle: 'italic', marginTop: 4 }]}>
          5-Year Perspective: {intelligence.appreciationOutlook?.fiveYearPerspective || 'Positioned to transition from an emerging corridor to an established urban suburb with steady capital gains.'}
        </Text>
      </View>

      {/* Strategic Investment Thesis (300-500 words) */}
      <View style={valueStyles.thesisCard}>
        <Text style={[pdfStyles.subheadingMuted, { color: colors.accentGold, marginBottom: 4 }]}>
          STRATEGIC INVESTMENT THESIS: WHY A SOPHISTICATED BUYER MIGHT CONSIDER THIS ASSET
        </Text>
        <Text style={pdfStyles.bodyText}>
          {intelligence.investmentOpportunity?.strategicThesis ||
            `The acquisition of this property represents a compelling opportunity to secure an independent residential asset within a high-growth micro-market. From an asset-allocation perspective, independent floors offer an optimal risk-adjusted profile: clear individual registry titles, lower recurring common-area overheads, direct terrace rights, and strong tenant absorption.`}
        </Text>
        <Text style={pdfStyles.bodyText}>
          Unlike high-density vertical towers that are subject to future local inventory expansions, low-density gated sectors operate under natural physical land constraints. As infrastructure corridors integrate the location further with primary metropolitan nodes, the underlying land value component provides substantial downside protection against market cycles.
        </Text>
        <Text style={[pdfStyles.bodyText, { marginBottom: 0 }]}>
          Combined with an attractive entry rate relative to regional benchmarks, documented construction warranties, and strong rental demand from corporate professionals, this asset serves dual functions as an exceptional personal residence and a high-liquidity capital asset.
        </Text>
      </View>

      {/* Risk Audit & Considerations */}
      <View style={valueStyles.riskCard}>
        <Text style={valueStyles.subheadBold}>KEY RISKS & DUE-DILIGENCE CONSIDERATIONS</Text>
        <Text style={pdfStyles.bodyText}>
          • Liquidity Horizon: Independent floors typically trade within a 30–60 day marketing cycle. Capital preservation is prioritized over short-term speculative trading.
        </Text>
        <Text style={pdfStyles.bodyText}>
          • Maintenance & Society Administration: Being a gated low-density community, ongoing road and utility upkeep relies on active resident welfare society participation.
        </Text>
        <Text style={[pdfStyles.bodyText, { marginBottom: 0 }]}>
          • Title Conveyance: All transactions must verify complete municipal approvals, sanctions, and clear conveyance of individual floor and roof rights.
        </Text>
      </View>
    </View>
  );
};
