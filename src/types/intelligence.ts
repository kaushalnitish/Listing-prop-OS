export type IntelligenceCategory =
  | 'why-this-property'
  | 'comparable-properties'
  | 'market-trends'
  | 'population-demographics'
  | 'scarcity'
  | 'investment-opportunity'
  | 'location-advantages'
  | 'rental-potential'
  | 'appreciation-outlook';

export interface ComparableProperty {
  id: string;
  name: string;
  propertyType: string;
  location: string;
  squareFeet: number;
  price: number;
  currency: string;
  pricePerSqFt: number;
  status: 'Sold' | 'Active Listing' | 'Under Contract' | 'Recent Benchmark';
  dateFormatted?: string;
  similarityScore?: number; // e.g. 96% match
  similarityNote: string;
  imageUrl?: string;
}

export interface MarketTrendPoint {
  period: string; // e.g. "2023", "2024", "2025", "2026 (Est)"
  avgPricePerSqFt: number;
  inventoryCount?: number;
  demandIndex?: number; // 0-100
}

export interface DemographicMetric {
  label: string;
  value: string;
  subtext?: string;
}

export interface LocationAdvantageItem {
  name: string;
  category: 'transit' | 'leisure' | 'dining' | 'nature' | 'civic' | 'education' | 'commercial';
  travelTime: string; // e.g. "12 mins"
  distance?: string; // e.g. "4.2 km"
  highlightNote: string;
}

export interface PropertyIntelligenceData {
  summary: {
    pricePerSqFt: number;
    currency: string;
    formattedPricePerSqFt: string;
    marketPositioning: string;
    indicativeRating: string;
  };
  whyThisProperty: {
    coreThesis: string;
    pillars: Array<{
      tag: 'LOCATION' | 'SCARCITY' | 'PROPERTY QUALITY' | 'MARKET POSITION' | 'LIFESTYLE' | 'ACCESSIBILITY';
      title: string;
      description: string;
    }>;
    whyItStandsOut: string;
  };
  comparables: {
    currentProperty: {
      title: string;
      price: number;
      currency: string;
      squareFeet: number;
      pricePerSqFt: number;
    };
    items: ComparableProperty[];
    marketVarianceSummary: string;
  };
  marketTrends: {
    yoyPriceChange: string; // e.g. "+8.4% YoY"
    averageDaysOnMarket: string;
    demandLevel: 'High' | 'Very High' | 'Moderate' | 'Exclusive Low-Volume';
    historicalTrajectory: MarketTrendPoint[];
    marketDirectionInsight: string;
  };
  demographics: {
    primaryResidentProfile: string;
    metrics: DemographicMetric[];
    buyerProfileMix: Array<{ segment: string; percentage: number }>;
    whyItMatters: string;
  };
  scarcity: {
    rarityTier: 'Exceptional (Top 1%)' | 'Very High (Top 5%)' | 'High (Top 10%)';
    competingActiveInventory: string;
    uniqueFactors: string[];
    replicabilityAssessment: string;
  };
  investmentOpportunity: {
    strategicThesis: string;
    keyDrivers: Array<{ title: string; detail: string }>;
    riskReturnProfile: string;
    disclaimer: string;
  };
  locationAdvantages: {
    connectivitySummary: string;
    pointsOfInterest: LocationAdvantageItem[];
  };
  rentalPotential: {
    estimatedMonthlyRental: string;
    estimatedAnnualGross: string;
    estimatedGrossYield: string;
    occupancyOrLeaseProfile: string;
    rentalStrategyNote: string;
    disclaimer: string;
  };
  appreciationOutlook: {
    longTermOutlookRating: string;
    growthCatalysts: string[];
    structuralDemandFactors: string[];
    fiveYearPerspective: string;
  };
  researchDate?: string;
  confidenceLevel?: 'verified-research' | 'indicative-estimate' | 'partial-research';
  sources?: Array<{
    title: string;
    uri: string;
    snippet?: string;
  }>;
  searchQueriesPerformed?: string[];
  dataClassification?: {
    verifiedFields: string[];
    indicativeFields: string[];
    unavailableFields: string[];
  };
}
