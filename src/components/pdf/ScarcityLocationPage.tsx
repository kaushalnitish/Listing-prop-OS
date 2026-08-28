import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PropertyListing } from '../../types';
import { PropertyIntelligenceData, LocationAdvantageItem } from '../../types/intelligence';
import { colors, pdfStyles } from './pdfStyles';

interface Props {
  listing: PropertyListing;
  intelligence: PropertyIntelligenceData;
}

const locStyles = StyleSheet.create({
  scarcityCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 10,
    marginBottom: 10,
  },
  scarcityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  factorItem: {
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
    backgroundColor: colors.bgCardAlt,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: 10,
    marginBottom: 8,
  },
});

export const ScarcityLocationPage: React.FC<Props> = ({ listing, intelligence }) => {
  const pois: LocationAdvantageItem[] =
    intelligence.locationAdvantages?.pointsOfInterest || [
      { name: 'Chandigarh-Kharar Highway Corridor', category: 'transit', travelTime: '3 mins', distance: '0.8 km', highlightNote: 'Primary arterial expressway corridor' },
      { name: 'VR Punjab Mega Retail Mall', category: 'leisure', travelTime: '8 mins', distance: '3.5 km', highlightNote: 'Multiplex, brand retail and fine dining' },
      { name: 'Max / Fortis Super Specialty Hospital', category: 'civic', travelTime: '12 mins', distance: '5.8 km', highlightNote: 'Tertiary healthcare and emergency services' },
      { name: 'Kharar Railway & Regional Transit Hub', category: 'transit', travelTime: '7 mins', distance: '2.9 km', highlightNote: 'Interstate rail and regional transit' },
      { name: 'Mohali IT City & Quark City Cluster', category: 'commercial', travelTime: '16 mins', distance: '9.2 km', highlightNote: 'Major corporate and technology employers' },
    ];

  const uniqueFactors = intelligence.scarcity?.uniqueFactors || [
    'Wide 45-50ft RCC internal society roadways with underground utilities',
    'Independent floor registry with legal roof rights and terrace ownership',
    'Documented 5-year woodwork warranty and 1-year dedicated after-sales service',
  ];

  return (
    <View style={pdfStyles.sectionContainer}>
      {/* Section Header */}
      <View style={pdfStyles.sectionNumberTitleRow}>
        <Text style={pdfStyles.sectionNumber}>5.</Text>
        <Text style={pdfStyles.sectionTitle}>
          SCARCITY ANALYSIS & LOCATION ADVANTAGES
        </Text>
      </View>
      <Text style={pdfStyles.sectionSubtitle}>
        Physical supply constraints, civic connectivity, and proximity to regional infrastructure
      </Text>
      <View style={pdfStyles.sectionDivider} />

      {/* Scarcity Card */}
      <View style={locStyles.scarcityCard} wrap={false}>
        <View style={locStyles.scarcityHeader}>
          <Text style={[pdfStyles.subheading, { marginTop: 0, marginBottom: 0 }]}>
            SCARCITY & EXCLUSIVITY RATING
          </Text>
          <View style={[pdfStyles.badge, pdfStyles.badgeEmerald]}>
            <Text style={pdfStyles.badgeEmeraldText}>
              {intelligence.scarcity?.rarityTier || 'Very High (Top 5%)'}
            </Text>
          </View>
        </View>

        <Text style={[pdfStyles.captionText, { color: colors.textSecondary, marginBottom: 6 }]}>
          Active Competing Inventory: {intelligence.scarcity?.competingActiveInventory || '14 - 18 Active Units in Sector'}
        </Text>

        <Text style={[pdfStyles.bodyTextBold, { fontSize: 7.5, marginBottom: 3 }]}>
          Non-Replicable Physical Characteristics:
        </Text>
        {uniqueFactors.map((f, i) => (
          <View key={i} style={locStyles.factorItem}>
            <Text style={locStyles.bullet}>•</Text>
            <Text style={pdfStyles.captionText}>{f}</Text>
          </View>
        ))}

        <Text style={[pdfStyles.captionText, { fontStyle: 'italic', marginTop: 4 }]}>
          Replicability Assessment: {intelligence.scarcity?.replicabilityAssessment || 'Scarce developable land parcels in organized sectors constrain new low-density floor supply.'}
        </Text>
      </View>

      {/* Structured POI Connectivity Table */}
      <Text style={[pdfStyles.subheading, { marginBottom: 6 }]}>
        STRATEGIC CIVIC & TRANSIT CONNECTIVITY MATRIX
      </Text>

      <View style={pdfStyles.tableContainer} wrap={false}>
        <View style={pdfStyles.tableHeaderRow}>
          <Text style={[pdfStyles.tableHeaderCell, { flex: 2.2 }]}>DESTINATION / HUB</Text>
          <Text style={[pdfStyles.tableHeaderCell, { flex: 1.2 }]}>CATEGORY</Text>
          <Text style={[pdfStyles.tableHeaderCell, { flex: 1.2 }]}>TRAVEL TIME</Text>
          <Text style={[pdfStyles.tableHeaderCell, { flex: 1.0 }]}>DISTANCE</Text>
          <Text style={[pdfStyles.tableHeaderCell, { flex: 2.4 }]}>STRATEGIC RELEVANCE</Text>
        </View>

        {pois.map((poi, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <View key={idx} style={isEven ? pdfStyles.tableRow : pdfStyles.tableRowAlt}>
              <Text style={[pdfStyles.tableCellBold, { flex: 2.2 }]}>{poi.name}</Text>
              <Text style={[pdfStyles.tableCell, { flex: 1.2, textTransform: 'capitalize' }]}>
                {poi.category}
              </Text>
              <Text style={[pdfStyles.tableCellBold, { flex: 1.2, color: colors.accentGold }]}>
                {poi.travelTime}
              </Text>
              <Text style={[pdfStyles.tableCell, { flex: 1.0 }]}>{poi.distance || 'Nearby'}</Text>
              <Text style={[pdfStyles.tableCell, { flex: 2.4 }]}>{poi.highlightNote}</Text>
            </View>
          );
        })}
      </View>

      {/* Location Thesis */}
      <View style={locStyles.thesisCard}>
        <Text style={[pdfStyles.subheadingMuted, { color: colors.accentGold, marginBottom: 3 }]}>
          STRATEGIC LOCATION THESIS
        </Text>
        <Text style={pdfStyles.bodyText}>
          {intelligence.locationAdvantages?.connectivitySummary ||
            `The micro-location balances high-speed arterial highway connectivity with tranquil neighborhood living. Residents enjoy seamless 10–15 minute transit to regional corporate districts while insulated from heavy commercial congestion.`}
        </Text>
        <Text style={[pdfStyles.bodyText, { marginBottom: 0 }]}>
          Close proximity to top-tier schools, accredited healthcare centers, and regional retail destinations creates an exceptional quality-of-life ecosystem that underpins enduring end-user demand.
        </Text>
      </View>
    </View>
  );
};
