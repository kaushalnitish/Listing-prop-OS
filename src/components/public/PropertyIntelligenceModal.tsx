import React, { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  Scale,
  TrendingUp,
  Users,
  Gem,
  Briefcase,
  Navigation,
  Key,
  LineChart,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  MapPin,
  ShieldCheck,
  ArrowUpRight,
  ExternalLink,
  Globe,
  Search,
  Download,
  Loader2,
} from 'lucide-react';
import { IntelligenceCategory, PropertyIntelligenceData } from '../../types/intelligence';
import { PropertyListing } from '../../types';
import { generatePropertyIntelligencePdf } from '../../lib/pdfReport';

interface PropertyIntelligenceModalProps {
  category: IntelligenceCategory | null;
  intelligence: PropertyIntelligenceData;
  listing?: PropertyListing | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PropertyIntelligenceModal: React.FC<PropertyIntelligenceModalProps> = ({
  category,
  intelligence,
  listing,
  isOpen,
  onClose,
}) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleDownloadPdf = async () => {
    if (!listing) return;
    setDownloadingPdf(true);
    try {
      await generatePropertyIntelligencePdf(listing, intelligence);
    } catch (err) {
      console.error('Failed to generate PDF report:', err);
      alert('Unable to generate PDF report. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!isOpen || !category) return null;

  const getCategoryMeta = (cat: IntelligenceCategory) => {
    switch (cat) {
      case 'why-this-property':
        return {
          icon: Sparkles,
          eyebrow: 'INTELLIGENCE REPORT',
          title: 'Why This Property?',
          subtitle: 'Understand what makes this property worth considering.',
        };
      case 'comparable-properties':
        return {
          icon: Scale,
          eyebrow: 'MARKET BENCHMARK',
          title: 'Comparable Properties',
          subtitle: 'See similar properties and recent market activity.',
        };
      case 'market-trends':
        return {
          icon: TrendingUp,
          eyebrow: 'MACRO INSIGHTS',
          title: 'Market Trends',
          subtitle: 'Price movement, demand and market direction.',
        };
      case 'population-demographics':
        return {
          icon: Users,
          eyebrow: 'DEMOGRAPHIC PROFILE',
          title: 'Population & Demographics',
          subtitle: 'Understand who lives here and why it matters.',
        };
      case 'scarcity':
        return {
          icon: Gem,
          eyebrow: 'SUPPLY ANALYSIS',
          title: 'Scarcity Assessment',
          subtitle: 'See how rare this type of property is.',
        };
      case 'investment-opportunity':
        return {
          icon: Briefcase,
          eyebrow: 'INVESTMENT THESIS',
          title: 'Investment Opportunity',
          subtitle: 'Understand the case for owning this property.',
        };
      case 'location-advantages':
        return {
          icon: Navigation,
          eyebrow: 'CONNECTIVITY MATRIX',
          title: 'Location Advantages',
          subtitle: 'Explore lifestyle, access and nearby conveniences.',
        };
      case 'rental-potential':
        return {
          icon: Key,
          eyebrow: 'YIELD PROJECTION',
          title: 'Rental Potential',
          subtitle: 'Explore estimated rental demand and income potential.',
        };
      case 'appreciation-outlook':
        return {
          icon: LineChart,
          eyebrow: 'LONG-TERM VALUE',
          title: 'Appreciation Outlook',
          subtitle: 'Explore long-term market and value indicators.',
        };
    }
  };

  const meta = getCategoryMeta(category);
  const Icon = meta.icon;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 text-stone-100 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-zinc-800/80 bg-zinc-900/60 shrink-0">
          <div className="flex items-start space-x-3.5 sm:space-x-4 min-w-0 pr-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-stone-200 shrink-0 mt-0.5">
              <Icon className="w-5 h-5 stroke-[1.75]" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-stone-400 font-normal">
                {meta.eyebrow}
              </span>
              <h3 className="text-base sm:text-lg lg:text-xl font-medium text-stone-100 tracking-tight truncate">
                {meta.title}
              </h3>
              <p className="text-xs text-stone-400 font-normal truncate">
                {meta.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-stone-400 hover:text-stone-200 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6 text-stone-300 text-xs sm:text-sm leading-relaxed min-w-0">
          {/* 1. WHY THIS PROPERTY */}
          {category === 'why-this-property' && (
            <div className="space-y-6 min-w-0">
              {/* Thesis banner */}
              <div className="p-4 sm:p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-medium">
                  CORE VALUE PROPOSITION
                </span>
                <p className="text-stone-200 font-normal leading-relaxed text-xs sm:text-sm">
                  {intelligence.whyThisProperty.coreThesis}
                </p>
              </div>

              {/* 6 Structured Pillars */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-medium">
                  KEY VALUE PILLARS
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {intelligence.whyThisProperty.pillars.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5"
                    >
                      <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-800 text-stone-300 font-medium inline-block">
                        {p.tag}
                      </span>
                      <h5 className="text-xs sm:text-sm font-medium text-stone-100">
                        {p.title}
                      </h5>
                      <p className="text-[11px] sm:text-xs text-stone-400 font-normal leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Standout Summary */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="text-xs font-medium text-stone-200">Why It Stands Out</h5>
                  <p className="text-[11px] sm:text-xs text-stone-400 font-normal leading-relaxed">
                    {intelligence.whyThisProperty.whyItStandsOut}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. COMPARABLE PROPERTIES */}
          {category === 'comparable-properties' && (
            <div className="space-y-6 min-w-0">
              {/* Current Property Anchor Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-zinc-900 border border-zinc-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-medium">
                    SUBJECT PROPERTY
                  </span>
                  <span className="text-xs font-mono text-stone-400">
                    {intelligence.summary.formattedPricePerSqFt}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h4 className="text-sm sm:text-base font-medium text-white">
                      {intelligence.comparables.currentProperty.title}
                    </h4>
                    <p className="text-xs text-stone-400">
                      {intelligence.comparables.currentProperty.squareFeet.toLocaleString()} sq ft · {listing?.specs?.bedrooms || 3} BHK {listing?.specs?.propertyType || 'Residence'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-medium text-stone-100">
                      {intelligence.comparables.currentProperty.currency === '₹'
                        ? `₹${(intelligence.comparables.currentProperty.price / 10000000).toFixed(2)} Cr`
                        : `${intelligence.comparables.currentProperty.currency}${(intelligence.comparables.currentProperty.price / 1000000).toFixed(2)}M`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comparable Benchmarks List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-medium">
                    MICRO-MARKET COMPARABLES
                  </h4>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Sample Market Data
                  </span>
                </div>

                <div className="space-y-3">
                  {intelligence.comparables.items.map((comp) => {
                    const priceFormatted =
                      comp.currency === '₹'
                        ? `₹${(comp.price / 10000000).toFixed(2)} Cr`
                        : `${comp.currency}${(comp.price / 1000000).toFixed(2)}M`;

                    const rateFormatted =
                      comp.currency === '₹'
                        ? `₹${comp.pricePerSqFt.toLocaleString()} / sq ft`
                        : `${comp.currency}${comp.pricePerSqFt.toLocaleString()} / sq ft`;

                    return (
                      <div
                        key={comp.id}
                        className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5 hover:border-zinc-700/80 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs sm:text-sm font-medium text-stone-100">
                                {comp.name}
                              </span>
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-stone-300">
                                {comp.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-400 mt-0.5">
                              {comp.location} · {comp.squareFeet.toLocaleString()} sq ft · {comp.dateFormatted}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs sm:text-sm font-medium text-stone-100">
                              {priceFormatted}
                            </div>
                            <div className="text-[10px] font-mono text-stone-400">
                              {rateFormatted}
                            </div>
                          </div>
                        </div>

                        <div className="pt-1 text-[11px] text-stone-400 font-normal leading-relaxed border-t border-zinc-800/60">
                          <span className="text-stone-300 font-medium">Similarity: </span>
                          {comp.similarityNote}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Variance Summary */}
              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-[11px] text-stone-400">
                <span className="text-stone-300 font-medium">Positioning Insight: </span>
                {intelligence.comparables.marketVarianceSummary}
              </div>
            </div>
          )}

          {/* 3. MARKET TRENDS */}
          {category === 'market-trends' && (
            <div className="space-y-6 min-w-0">
              {/* 3 Quick Stat KPI Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                    YoY Movement
                  </span>
                  <div className="text-sm sm:text-base font-semibold text-emerald-400">
                    {intelligence.marketTrends.yoyPriceChange}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                    Days On Market
                  </span>
                  <div className="text-sm sm:text-base font-medium text-stone-100">
                    {intelligence.marketTrends.averageDaysOnMarket}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                    Demand Level
                  </span>
                  <div className="text-sm sm:text-base font-medium text-stone-100">
                    {intelligence.marketTrends.demandLevel}
                  </div>
                </div>
              </div>

              {/* Micro Trajectory Chart */}
              <div className="p-4 sm:p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-medium">
                    HISTORICAL PRICE / SQ FT TRAJECTORY
                  </h4>
                  <span className="text-[10px] font-mono text-stone-500">
                    Index Base 100
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2">
                  {intelligence.marketTrends.historicalTrajectory.map((point, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 text-center space-y-1"
                    >
                      <div className="text-[10px] font-mono text-stone-400">{point.period}</div>
                      <div className="text-xs font-semibold text-stone-100">
                        {intelligence.summary.currency === '₹'
                          ? `₹${point.avgPricePerSqFt.toLocaleString()}`
                          : `$${point.avgPricePerSqFt.toLocaleString()}`}
                      </div>
                      <div className="text-[9px] text-stone-500 font-mono">
                        Demand: {point.demandIndex}/100
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Direction Narrative */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-1.5">
                <h5 className="text-xs font-medium text-stone-200">Market Direction Assessment</h5>
                <p className="text-[11px] sm:text-xs text-stone-400 font-normal leading-relaxed">
                  {intelligence.marketTrends.marketDirectionInsight}
                </p>
              </div>
            </div>
          )}

          {/* 4. POPULATION & DEMOGRAPHICS */}
          {category === 'population-demographics' && (
            <div className="space-y-6 min-w-0">
              {/* Resident Profile Banner */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-medium">
                  PRIMARY RESIDENTIAL PROFILE
                </span>
                <p className="text-stone-100 font-medium text-xs sm:text-sm">
                  {intelligence.demographics.primaryResidentProfile}
                </p>
              </div>

              {/* 4 Key Demographic Metrics */}
              <div className="grid grid-cols-2 gap-3">
                {intelligence.demographics.metrics.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1"
                  >
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                      {m.label}
                    </span>
                    <div className="text-sm sm:text-base font-semibold text-stone-100">
                      {m.value}
                    </div>
                    {m.subtext && (
                      <p className="text-[10px] text-stone-400 leading-snug">{m.subtext}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Buyer Profile Distribution */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-medium">
                  BUYER PROFILE COMPOSITION
                </h4>
                <div className="space-y-2">
                  {intelligence.demographics.buyerProfileMix.map((mix, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs text-stone-300">
                        <span>{mix.segment}</span>
                        <span className="font-mono text-stone-400">{mix.percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-stone-300 rounded-full"
                          style={{ width: `${mix.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why it Matters Note */}
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-1">
                <h5 className="text-xs font-medium text-stone-200">Why Demographics Matter</h5>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  {intelligence.demographics.whyItMatters}
                </p>
              </div>
            </div>
          )}

          {/* 5. SCARCITY */}
          {category === 'scarcity' && (
            <div className="space-y-6 min-w-0">
              {/* Rarity Tier Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-medium">
                    SUPPLY CONSTRAINT RATING
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-stone-200">
                    {intelligence.scarcity.rarityTier}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-stone-200 font-normal">
                  {intelligence.scarcity.competingActiveInventory}
                </p>
              </div>

              {/* Key Scarcity Factors */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-medium">
                  STRUCTURAL SCARCITY INDICATORS
                </h4>
                <div className="space-y-2.5">
                  {intelligence.scarcity.uniqueFactors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start space-x-2.5"
                    >
                      <Gem className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] sm:text-xs text-stone-300 font-normal leading-relaxed">
                        {factor}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Replicability Note */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-1.5">
                <h5 className="text-xs font-medium text-stone-200">Replicability Assessment</h5>
                <p className="text-[11px] sm:text-xs text-stone-400 font-normal leading-relaxed">
                  {intelligence.scarcity.replicabilityAssessment}
                </p>
              </div>
            </div>
          )}

          {/* 6. INVESTMENT OPPORTUNITY */}
          {category === 'investment-opportunity' && (
            <div className="space-y-6 min-w-0">
              {/* Strategic Thesis */}
              <div className="p-4 sm:p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-medium">
                  STRATEGIC OWNERSHIP CASE
                </span>
                <p className="text-stone-200 text-xs sm:text-sm leading-relaxed">
                  {intelligence.investmentOpportunity.strategicThesis}
                </p>
              </div>

              {/* Core Investment Drivers */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-medium">
                  PRIMARY VALUE DRIVERS
                </h4>
                <div className="space-y-2.5">
                  {intelligence.investmentOpportunity.keyDrivers.map((driver, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1"
                    >
                      <h5 className="text-xs font-medium text-stone-100">{driver.title}</h5>
                      <p className="text-[11px] text-stone-400 font-normal leading-relaxed">
                        {driver.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk/Return Banner */}
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-stone-400">Risk/Return Profile:</span>
                <span className="font-medium text-stone-200">
                  {intelligence.investmentOpportunity.riskReturnProfile}
                </span>
              </div>
            </div>
          )}

          {/* 7. LOCATION ADVANTAGES */}
          {category === 'location-advantages' && (
            <div className="space-y-6 min-w-0">
              {/* Summary */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-medium">
                  CONNECTIVITY & LIFESTYLE SYNERGY
                </span>
                <p className="text-stone-200 text-xs sm:text-sm leading-relaxed">
                  {intelligence.locationAdvantages.connectivitySummary}
                </p>
              </div>

              {/* POI Matrix */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-medium">
                  KEY TRANSIT & LIFESTYLE NODES
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {intelligence.locationAdvantages.pointsOfInterest.map((poi, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start space-x-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-stone-300 shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-emerald-400 font-mono">
                            {poi.travelTime}
                          </span>
                          <span className="text-stone-500 text-[10px]">·</span>
                          <span className="text-xs font-medium text-stone-100 truncate">
                            {poi.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 truncate">
                          {poi.highlightNote}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 8. RENTAL POTENTIAL */}
          {category === 'rental-potential' && (
            <div className="space-y-6 min-w-0">
              {/* 3 Metric Chips */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                    Est. Monthly
                  </span>
                  <div className="text-xs sm:text-sm font-semibold text-stone-100 truncate">
                    {intelligence.rentalPotential.estimatedMonthlyRental}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                    Est. Annual Gross
                  </span>
                  <div className="text-xs sm:text-sm font-semibold text-stone-100 truncate">
                    {intelligence.rentalPotential.estimatedAnnualGross}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                    Gross Yield
                  </span>
                  <div className="text-xs sm:text-sm font-semibold text-emerald-400">
                    {intelligence.rentalPotential.estimatedGrossYield}
                  </div>
                </div>
              </div>

              {/* Lease Strategy Note */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                <h5 className="text-xs font-medium text-stone-200">Occupancy & Monetization Profile</h5>
                <p className="text-[11px] sm:text-xs text-stone-300 font-normal leading-relaxed">
                  {intelligence.rentalPotential.occupancyOrLeaseProfile}
                </p>
                <p className="text-[11px] text-stone-400 pt-1">
                  {intelligence.rentalPotential.rentalStrategyNote}
                </p>
              </div>
            </div>
          )}

          {/* 9. APPRECIATION OUTLOOK */}
          {category === 'appreciation-outlook' && (
            <div className="space-y-6 min-w-0">
              {/* Rating Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-medium">
                  LONG-TERM VALUE TRAJECTORY
                </span>
                <h4 className="text-sm sm:text-base font-medium text-stone-100">
                  {intelligence.appreciationOutlook.longTermOutlookRating}
                </h4>
              </div>

              {/* Catalysts & Demand Factors */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-medium">
                  STRUCTURAL VALUE CATALYSTS
                </h4>
                <div className="space-y-2">
                  {intelligence.appreciationOutlook.growthCatalysts.map((cat, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start space-x-2.5"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] sm:text-xs text-stone-300 leading-relaxed">
                        {cat}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5-Year Horizon Narrative */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-1.5">
                <h5 className="text-xs font-medium text-stone-200">5-Year Structural Perspective</h5>
                <p className="text-[11px] sm:text-xs text-stone-400 leading-relaxed">
                  {intelligence.appreciationOutlook.fiveYearPerspective}
                </p>
              </div>
            </div>
          )}

          {/* RESEARCH PROVENANCE & GROUNDED SOURCES */}
          {intelligence.sources && intelligence.sources.length > 0 && (
            <div className="mt-6 pt-5 border-t border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-stone-300">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <h5 className="text-[11px] font-mono uppercase tracking-wider font-semibold">
                    Live Web Grounding & Sources ({intelligence.sources.length})
                  </h5>
                </div>
                {intelligence.researchDate && (
                  <span className="text-[10px] font-mono text-stone-500">
                    Timestamp: {new Date(intelligence.researchDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Sources Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {intelligence.sources.slice(0, 6).map((source, sIdx) => (
                  <a
                    key={sIdx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 text-[11px] text-stone-300 group transition-colors"
                  >
                    <span className="truncate pr-2 font-medium group-hover:text-amber-400">
                      {source.title || 'Market Research Source'}
                    </span>
                    <ExternalLink className="w-3 h-3 text-stone-500 group-hover:text-amber-400 shrink-0" />
                  </a>
                ))}
              </div>

              {/* Data Classification Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded">
                  ✓ Factual Listing Data: Verified
                </span>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded">
                  ~ Micro-Market Trends: Indicative Benchmark
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Disclaimer & Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-[10px] text-stone-400 text-center sm:text-left">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-stone-500" />
            <span>
              This analysis is indicative and does not constitute a formal appraisal or valuation.
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {listing && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {downloadingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-stone-200 text-xs font-medium transition-colors cursor-pointer shrink-0"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
