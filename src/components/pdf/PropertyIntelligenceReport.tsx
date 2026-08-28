import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { PropertyListing } from '../../types';
import { PropertyIntelligenceData } from '../../types/intelligence';
import { pdfStyles } from './pdfStyles';
import { CoverPage } from './CoverPage';
import { PropertyProfilePage } from './PropertyProfilePage';
import { ComparableAnalysisPage } from './ComparableAnalysisPage';
import { MarketTrendsPage } from './MarketTrendsPage';
import { DemographicsPage } from './DemographicsPage';
import { ScarcityLocationPage } from './ScarcityLocationPage';
import { RentalAnalysisPage } from './RentalAnalysisPage';
import { LongTermValuePage } from './LongTermValuePage';
import { SourcesMethodologyPage } from './SourcesMethodologyPage';

interface Props {
  listing: PropertyListing;
  intelligence: PropertyIntelligenceData;
}

export const PropertyIntelligenceReport: React.FC<Props> = ({ listing, intelligence }) => {
  const shortTitle =
    listing.title?.length > 40 ? `${listing.title.substring(0, 37)}...` : listing.title;

  const researchDate = intelligence.researchDate
    ? new Date(intelligence.researchDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <Document
      title={`Property Intelligence Report — ${listing.title}`}
      author={listing.contact?.agentName || 'Listing OS'}
      subject="Property Intelligence & Market Positioning Report"
      keywords="real estate, intelligence, property report, market analysis"
    >
      {/* 
        PAGE 1: COVER & EXECUTIVE SUMMARY
        Dedicated executive summary with 6-metric grid and key decision factors
      */}
      <Page size="A4" style={pdfStyles.page}>
        <CoverPage listing={listing} intelligence={intelligence} />
        <View style={pdfStyles.pageFooter}>
          <Text style={pdfStyles.pageFooterText}>
            Listing OS Institutional Property Intelligence · Confidential Due Diligence Dossier
          </Text>
          <Text
            style={pdfStyles.pageFooterPageNum}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>

      {/* 
        PAGES 2+: CONTINUOUS FLOW REPORT BODY
        React-PDF native flexbox flow engine handles all section progression,
        card wrapping (wrap={false} on indiv cards), and seamless page transitions.
      */}
      <Page size="A4" style={pdfStyles.page} wrap>
        {/* Persistent Running Header on every page */}
        <View style={pdfStyles.pageHeader} fixed>
          <Text style={pdfStyles.pageHeaderText}>
            PROPERTY INTELLIGENCE & MARKET POSITIONING REPORT
          </Text>
          <Text style={pdfStyles.pageHeaderRight}>{shortTitle} · CONFIDENTIAL</Text>
        </View>

        {/* Section 1: Property Profile & Six Strategic Value Pillars */}
        <PropertyProfilePage listing={listing} intelligence={intelligence} />

        {/* Section 2: Comparable Properties & Price Positioning */}
        <ComparableAnalysisPage listing={listing} intelligence={intelligence} />

        {/* Section 3: Micro-Market Trends & Price Trajectory */}
        <MarketTrendsPage listing={listing} intelligence={intelligence} />

        {/* Section 4: Population, Demographics & Demand Drivers */}
        <DemographicsPage listing={listing} intelligence={intelligence} />

        {/* Section 5: Scarcity Analysis & Location Advantages */}
        <ScarcityLocationPage listing={listing} intelligence={intelligence} />

        {/* Section 6: Indicative Rental Potential & Financial Context */}
        <RentalAnalysisPage listing={listing} intelligence={intelligence} />

        {/* Section 7: Long-Term Value, Investment Thesis & Risk Audit */}
        <LongTermValuePage listing={listing} intelligence={intelligence} />

        {/* Section 8: Research Methodology, Sources & Data Confidence */}
        <SourcesMethodologyPage listing={listing} intelligence={intelligence} />

        {/* Persistent Running Footer on every page */}
        <View style={pdfStyles.pageFooter} fixed>
          <Text style={pdfStyles.pageFooterText}>
            Research Date: {researchDate} · Indicative Micro-Market Analysis · Listing OS Intelligence
          </Text>
          <Text
            style={pdfStyles.pageFooterPageNum}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            fixed
          />
        </View>
      </Page>
    </Document>
  );
};
