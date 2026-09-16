import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Sparkles,
  ArrowRight,
  Layers,
  CheckCircle2,
  Globe2,
  Smartphone,
  ShieldCheck,
  Compass,
  Briefcase,
  Share2,
} from 'lucide-react';

export const ServiceSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-neutral-800 selection:text-white">
      {/* Subtle background ambient blur */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-neutral-800/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top Navigation */}
      <header className="relative z-10 border-b border-neutral-900/80 bg-neutral-950/70 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white text-neutral-950 flex items-center justify-center font-bold text-base shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-white text-base">LISTING OS</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">
                  Dual Engine
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors flex items-center gap-2"
            >
              <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
              <span>Unified Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Choice Hub */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-6 py-14 sm:py-20 flex flex-col justify-center">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-medium text-neutral-300 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Select Your Creation Workflow</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            What do you want to create?
          </h1>
          <p className="text-neutral-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            One unified operating system powering bespoke digital presentations for high-value properties and elite creative professionals.
          </p>
        </div>

        {/* Engine Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto w-full">
          {/* OPTION 1: PROPERTY LISTING */}
          <div
            onClick={() => navigate('/create')}
            className="group relative rounded-2xl p-7 sm:p-8 bg-neutral-900/60 hover:bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-neutral-950/50"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  Real Estate Engine
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-amber-200 transition-colors">
                Property Listing
              </h2>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                Create a premium digital property presentation. Turn photos, specs, and WhatsApp notes into an elite real estate showcase with instant sharing.
              </p>

              <div className="space-y-2.5 border-t border-neutral-800/80 pt-5 mb-8">
                <div className="flex items-center gap-2.5 text-xs text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>High-converting editorial property hero</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>AI-assisted brochure & WhatsApp parser</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Verified specs, floorplans & WhatsApp lead CTA</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/create');
                }}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all group-hover:shadow-lg group-hover:shadow-amber-500/20"
              >
                <span>Create Property Listing</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/admin?tab=listings');
                  }}
                  className="text-xs text-neutral-400 hover:text-neutral-200 underline-offset-4 hover:underline"
                >
                  Or view existing listings →
                </button>
              </div>
            </div>
          </div>

          {/* OPTION 2: CREATOR PORTFOLIO */}
          <div
            onClick={() => navigate('/portfolio/create')}
            className="group relative rounded-2xl p-7 sm:p-8 bg-neutral-900/60 hover:bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-neutral-950/50"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Compass className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400/90 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
                  Creator Engine
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-sky-200 transition-colors">
                Creator Portfolio
              </h2>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                Create a professional portfolio website. Transform raw bio notes, Instagram screenshots, or PDF resumes into a structured showcase for your work and services.
              </p>

              <div className="space-y-2.5 border-t border-neutral-800/80 pt-5 mb-8">
                <div className="flex items-center gap-2.5 text-xs text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Mobile-first responsive digital portfolio</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>AI extractor from raw notes, resumes & screenshots</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Curated project showcase, services & booking CTA</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/portfolio/create');
                }}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all group-hover:shadow-lg group-hover:shadow-white/20"
              >
                <span>Create Creator Portfolio</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/admin?tab=portfolios');
                  }}
                  className="text-xs text-neutral-400 hover:text-neutral-200 underline-offset-4 hover:underline"
                >
                  Or view existing portfolios →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Value Prop Micro-Bar */}
        <div className="mt-14 pt-8 border-t border-neutral-900 max-w-4xl mx-auto w-full grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <Globe2 className="w-4 h-4 text-neutral-500 shrink-0" />
            <span>Instant public live URLs with custom slugs</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <Smartphone className="w-4 h-4 text-neutral-500 shrink-0" />
            <span>100% responsive and optimized for mobile sharing</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-neutral-500 shrink-0" />
            <span>Structured data decoupled from presentation</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-900/80 px-6 py-6 text-center text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Listing OS. Built for real estate leaders and creative visionaries.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/portfolio/rishika-kapoor')}
              className="text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              View Sample Portfolio
            </button>
            <span>•</span>
            <button
              onClick={() => navigate('/sample')}
              className="text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              View Sample Listing
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
