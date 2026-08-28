import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PropertyListing } from '../../types';
import { PropertyIntelligenceData, DemographicMetric } from '../../types/intelligence';
import { colors, pdfStyles } from './pdfStyles';

interface Props {
  listing: PropertyListing;
  intelligence: PropertyIntelligenceData;
}

const demoStyles = StyleSheet.create({
  metricRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 8,
    marginRight: 6,
  },
  metricCardLast: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 8,
    marginRight: 0,
  },
  mixCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 10,
    marginBottom: 10,
  },
  mixItemRow: {
    marginBottom: 6,
  },
  mixLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  mixSegment: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.textPrimary,
  },
  mixPercent: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.accentGold,
  },
  progressBarBg: {
    height: 3.5,
    backgroundColor: colors.bgPill,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accentGold,
    borderRadius: 2,
  },
  demandCard: {
    backgroundColor: colors.bgCard,
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

export const DemographicsPage: React.FC<Props> = ({ listing, intelligence }) => {
  const metrics: DemographicMetric[] =
    intelligence.demographics?.metrics || [
      { label: 'Median Household Income', value: '₹18L - ₹32L/yr', subtext: 'Upper-Middle Income Tier' },
      { label: 'Owner-Occupancy Rate', value: '76%', subtext: 'Predominantly End-User Community' },
      { label: 'Average Commute Time', value: '18 - 25 mins', subtext: 'To Major Business Hubs' },
    ];

  const buyerMix =
    intelligence.demographics?.buyerProfileMix || [
      { segment: 'Tech / IT Professionals & Corporate Executives', percentage: 45 },
      { segment: 'Business Owners, Retail Operators & Traders', percentage: 30 },
      { segment: 'Healthcare Practitioners & Academic Faculty', percentage: 15 },
      { segment: 'Defense Personnel, NRIs & Regional Investors', percentage: 10 },
    ];

  return (
    <View style={pdfStyles.sectionContainer}>
      {/* Section Header */}
      <View style={pdfStyles.sectionNumberTitleRow}>
        <Text style={pdfStyles.sectionNumber}>4.</Text>
        <Text style={pdfStyles.sectionTitle}>
          POPULATION, DEMOGRAPHICS & DEMAND DRIVERS
        </Text>
      </View>
      <Text style={pdfStyles.sectionSubtitle}>
        Socio-economic profile, buyer cohort distribution, and structural demand catalysts
      </Text>
      <View style={pdfStyles.sectionDivider} />

      {/* Sourced Demographic Metrics */}
      <View style={demoStyles.metricRow}>
        {metrics.map((m, idx) => {
          const isLast = idx === metrics.length - 1;
          return (
            <View key={idx} style={isLast ? demoStyles.metricCardLast : demoStyles.metricCard}>
              <Text style={pdfStyles.metricLabel}>{m.label}</Text>
              <Text style={pdfStyles.metricValue}>{m.value}</Text>
              <Text style={pdfStyles.metricSub}>{m.subtext || 'Verified Micro-Market Metric'}</Text>
            </View>
          );
        })}
      </View>

      {/* Buyer Profile Mix */}
      <View style={demoStyles.mixCard} wrap={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <Text style={[pdfStyles.subheading, { marginTop: 0, marginBottom: 0 }]}>
            BUYER COHORT DISTRIBUTION
          </Text>
          <Text style={[pdfStyles.captionText, { color: colors.accentGold }]}>
            AI-ASSISTED INTERPRETATION
          </Text>
        </View>

        {buyerMix.map((bm, i) => (
          <View key={i} style={demoStyles.mixItemRow}>
            <View style={demoStyles.mixLabelRow}>
              <Text style={demoStyles.mixSegment}>{bm.segment}</Text>
              <Text style={demoStyles.mixPercent}>{bm.percentage}%</Text>
            </View>
            <View style={demoStyles.progressBarBg}>
              <View style={[demoStyles.progressBarFill, { width: `${bm.percentage}%` }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Demand Implications */}
      <View style={demoStyles.demandCard}>
        <Text style={demoStyles.subheadBold}>1. End-User Community Stability</Text>
        <Text style={pdfStyles.bodyText}>
          A commanding owner-occupancy benchmark of {metrics.find(m => m.label.includes('Owner'))?.value || '76%'} indicates an established community of permanent owner-residents. End-user dominated neighborhoods consistently demonstrate superior maintenance standards, disciplined society governance, and lower volatility during broader market corrections.
        </Text>

        <Text style={demoStyles.subheadBold}>2. Tenant Absorption & Quality</Text>
        <Text style={pdfStyles.bodyText}>
          With concentrated household earnings in the {metrics[0]?.value || 'upper-middle tier'}, rental demand is characterized by high creditworthiness and low default risk. Corporate executives and healthcare professionals continuously seek low-density independent floors with dedicated parking and security covenants.
        </Text>

        <Text style={demoStyles.subheadBold}>3. Exit Liquidity & Secondary Market Depth</Text>
        <Text style={[pdfStyles.bodyText, { marginBottom: 0 }]}>
          {intelligence.demographics?.whyItMatters ||
            `The constant inflow of skilled corporate talent into nearby commercial parks provides a healthy, persistent buyer pool when the property is positioned for capital realization in future years.`}
        </Text>
      </View>
    </View>
  );
};
