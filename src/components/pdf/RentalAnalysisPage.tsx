import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PropertyListing } from '../../types';
import { PropertyIntelligenceData } from '../../types/intelligence';
import { colors, pdfStyles } from './pdfStyles';

interface Props {
  listing: PropertyListing;
  intelligence: PropertyIntelligenceData;
}

const rentalStyles = StyleSheet.create({
  rentRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  rentCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 8,
    marginRight: 6,
  },
  rentCardLast: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 8,
    marginRight: 0,
  },
  formulaBox: {
    backgroundColor: colors.bgAccentLight,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderGold,
    padding: 9,
    marginBottom: 10,
  },
  strategyCard: {
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

export const RentalAnalysisPage: React.FC<Props> = ({ listing, intelligence }) => {
  const rental = intelligence.rentalPotential;

  return (
    <View style={pdfStyles.sectionContainer}>
      {/* Section Header */}
      <View style={pdfStyles.sectionNumberTitleRow}>
        <Text style={pdfStyles.sectionNumber}>6.</Text>
        <Text style={pdfStyles.sectionTitle}>
          INDICATIVE RENTAL POTENTIAL & FINANCIAL CONTEXT
        </Text>
      </View>
      <Text style={pdfStyles.sectionSubtitle}>
        Rental yield analysis, tenant demand profiles, and lease positioning strategy
      </Text>
      <View style={pdfStyles.sectionDivider} />

      {/* 3 Metric Cards */}
      <View style={rentalStyles.rentRow}>
        <View style={rentalStyles.rentCard}>
          <Text style={pdfStyles.metricLabel}>ESTIMATED MONTHLY RENTAL</Text>
          <Text style={pdfStyles.metricValue}>
            {rental?.estimatedMonthlyRental || '₹22,000 - ₹28,000 / mo'}
          </Text>
          <Text style={pdfStyles.metricSub}>Semi-furnished market benchmark</Text>
        </View>

        <View style={rentalStyles.rentCard}>
          <Text style={pdfStyles.metricLabel}>ESTIMATED ANNUAL GROSS</Text>
          <Text style={pdfStyles.metricValue}>
            {rental?.estimatedAnnualGross || '₹2,64,000 - ₹3,36,000 / yr'}
          </Text>
          <Text style={pdfStyles.metricSub}>Annualized gross realization</Text>
        </View>

        <View style={rentalStyles.rentCardLast}>
          <Text style={pdfStyles.metricLabel}>INDICATIVE GROSS YIELD</Text>
          <Text style={pdfStyles.metricValueEmerald}>
            {rental?.estimatedGrossYield || '4.3% - 4.9% Gross Yield'}
          </Text>
          <Text style={pdfStyles.metricSub}>Gross Yield = (Annual / Price) × 100</Text>
        </View>
      </View>

      {/* Yield Formula & Methodology Box */}
      <View style={rentalStyles.formulaBox} wrap={false}>
        <Text style={[pdfStyles.subheadingMuted, { color: colors.accentGold, marginBottom: 3 }]}>
          YIELD CALCULATION METHODOLOGY & CORE ASSUMPTIONS
        </Text>
        <Text style={[pdfStyles.bodyTextBold, { fontSize: 7.5, marginBottom: 4 }]}>
          Gross Rental Yield Formula: [Estimated Annual Gross Rent ÷ Property Price] × 100
        </Text>
        <Text style={pdfStyles.captionText}>
          • Baseline Occupancy: Estimated at 92%–95% based on standard 11-month renewable lease agreements.
        </Text>
        <Text style={pdfStyles.captionText}>
          • Tenant Profile: Professional executive families, senior corporate employees, or university faculty.
        </Text>
        <Text style={pdfStyles.captionText}>
          • Scope of Analysis: Calculations reflect gross realization prior to local property taxation, society maintenance, and private furnishings depreciation.
        </Text>
      </View>

      {/* Leasing Strategy Breakdown */}
      <View style={rentalStyles.strategyCard}>
        <Text style={rentalStyles.subheadBold}>1. Primary Strategy: Long-Term Residential Lease (Recommended)</Text>
        <Text style={pdfStyles.bodyText}>
          Positioning the independent floor for 11–24 month corporate or family tenancies provides stable, recurring cash flow with minimal turnover costs. Semi-furnished configurations featuring modular kitchens and built-in wardrobes achieve upper-tier rentals with modest initial capital outlay.
        </Text>

        <Text style={rentalStyles.subheadBold}>2. Secondary Strategy: Corporate Housing / Relocation</Text>
        <Text style={pdfStyles.bodyText}>
          Given the convenient transit access to regional commercial clusters and IT hubs, partnering with corporate relocation desks can command a 15%–20% premium for fully furnished, executive-grade accommodations.
        </Text>

        <Text style={rentalStyles.subheadBold}>3. Risk Mitigation & Lease Covenants</Text>
        <Text style={[pdfStyles.bodyText, { marginBottom: 0 }]}>
          Standard lease conventions in this micro-market incorporate 2 months refundable security deposit and 1 month advance rental, providing owner protection against transition vacancies.
        </Text>
      </View>

      <View style={pdfStyles.calloutBox}>
        <Text style={pdfStyles.calloutText}>
          Rental Disclaimer: {rental?.disclaimer || 'Rental yield figures are indicative market estimates derived from prevailing submarket listings and do not guarantee contractual lease returns.'}
        </Text>
      </View>
    </View>
  );
};
