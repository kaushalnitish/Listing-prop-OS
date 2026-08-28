import React, { useState } from 'react';
import {
  Sparkles,
  Scale,
  TrendingUp,
  Users,
  Gem,
  Briefcase,
  Navigation,
  Key,
  LineChart,
  ChevronRight,
  Download,
  Loader2,
  FileText,
} from 'lucide-react';
import { PropertyListing } from '../../types';
import { IntelligenceCategory } from '../../types/intelligence';
import { generatePropertyIntelligence } from '../../lib/propertyIntelligence';
import { PropertyIntelligenceModal } from './PropertyIntelligenceModal';
import { generatePropertyIntelligencePdf } from '../../lib/pdfReport';

interface PropertyIntelligenceSectionProps {
  listing?: PropertyListing | null;
}

export const PropertyIntelligenceSection: React.FC<PropertyIntelligenceSectionProps> = ({
  listing,
}) => {
  const [activeCategory, setActiveCategory] = useState<IntelligenceCategory | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Generate dynamic intelligence data for this listing
  const intelligence = listing?.intelligence || generatePropertyIntelligence(listing);

  const handleDownloadPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const intelligenceCards = [
    {
      id: 'why-this-property' as IntelligenceCategory,
      title: 'Why This Property?',
      subtitle: 'Understand what makes this property worth considering.',
      icon: Sparkles,
      badge: '6 Strategic Pillars',
    },
    {
      id: 'comparable-properties' as IntelligenceCategory,
      title: 'Comparable Properties',
      subtitle: 'See similar properties and recent market activity.',
      icon: Scale,
      badge: '3 Market Benchmarks',
    },
    {
      id: 'market-trends' as IntelligenceCategory,
      title: 'Market Trends',
      subtitle: 'Price movement, demand and market direction.',
      icon: TrendingUp,
      badge: intelligence.marketTrends.yoyPriceChange,
    },
    {
      id: 'population-demographics' as IntelligenceCategory,
      title: 'Population & Demographics',
      subtitle: 'Understand who lives here and why it matters.',
      icon: Users,
      badge: 'Affluent Corridor',
    },
    {
      id: 'scarcity' as IntelligenceCategory,
      title: 'Scarcity',
      subtitle: 'See how rare this type of property is.',
      icon: Gem,
      badge: intelligence.scarcity.rarityTier.includes('Top 1%') ? 'Top 1% Rarity' : 'High Scarcity',
    },
    {
      id: 'investment-opportunity' as IntelligenceCategory,
      title: 'Investment Opportunity',
      subtitle: 'Understand the case for owning this property.',
      icon: Briefcase,
      badge: 'Strategic Thesis',
    },
    {
      id: 'location-advantages' as IntelligenceCategory,
      title: 'Location Advantages',
      subtitle: 'Explore lifestyle, access and nearby conveniences.',
      icon: Navigation,
      badge: `${intelligence.locationAdvantages.pointsOfInterest.length} Key Nodes`,
    },
    {
      id: 'rental-potential' as IntelligenceCategory,
      title: 'Rental Potential',
      subtitle: 'Explore estimated rental demand and income potential.',
      icon: Key,
      badge: intelligence.rentalPotential.estimatedGrossYield,
    },
    {
      id: 'appreciation-outlook' as IntelligenceCategory,
      title: 'Appreciation Outlook',
      subtitle: 'Explore long-term market and value indicators.',
      icon: LineChart,
      badge: '5-Yr Perspective',
    },
  ];

  return (
    <section className="w-full bg-zinc-950 text-stone-100 py-10 sm:py-14 my-6 sm:my-10 border-y border-zinc-800/80 shadow-inner max-w-full overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 space-y-8 min-w-0">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6 min-w-0">
          <div className="space-y-1.5 min-w-0">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em] text-stone-400 font-normal truncate block">
              PROPERTY INTELLIGENCE
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-normal text-stone-100 tracking-tight leading-[1.2] break-words">
              Understand the property beyond the listing.
            </h2>
            <div className="h-px w-8 bg-stone-700 mt-2" />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-wider">
              {intelligence.confidenceLevel === 'verified-research' && (
                <span className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Verified Research</span>
                </span>
              )}
              {intelligence.sources && intelligence.sources.length > 0 && (
                <span className="text-stone-300 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full">
                  {intelligence.sources.length} Sources Cited
                </span>
              )}
            </div>

            {listing && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-100 hover:bg-white text-zinc-950 text-[11px] font-semibold tracking-normal transition-all shadow-sm hover:shadow active:scale-98 disabled:opacity-50 cursor-pointer"
                title="Download complete property intelligence report as PDF"
              >
                {downloadingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Property Report</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 3x3 Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 min-w-0">
          {intelligenceCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => setActiveCategory(card.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveCategory(card.id);
                  }
                }}
                className="group relative p-5 sm:p-6 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between space-y-4 select-none"
              >
                {/* Top Row: Icon & Action arrow */}
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-stone-300 group-hover:text-white group-hover:border-zinc-700 transition-colors shrink-0">
                    <Icon className="w-4 h-4 stroke-[1.75]" />
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-950/80 border border-zinc-800/80 text-stone-400 group-hover:text-stone-300 group-hover:border-zinc-700 transition-colors">
                      {card.badge}
                    </span>
                    <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-stone-300 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                  </div>
                </div>

                {/* Text Content */}
                <div className="space-y-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-medium text-stone-100 tracking-tight group-hover:text-white transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-stone-400 font-normal leading-relaxed line-clamp-2">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Modal */}
      <PropertyIntelligenceModal
        category={activeCategory}
        intelligence={intelligence}
        listing={listing}
        isOpen={activeCategory !== null}
        onClose={() => setActiveCategory(null)}
      />
    </section>
  );
};
