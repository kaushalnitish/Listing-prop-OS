import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mail,
  Phone,
  MessageCircle,
  Globe,
  Calendar,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Github,
  ExternalLink,
  MapPin,
  Sparkles,
  ArrowRight,
  Share2,
  Check,
  Briefcase,
  Layers,
  ChevronRight,
  ArrowUpRight,
  Edit,
} from 'lucide-react';
import { CreatorProfile } from '../../types';
import { getPortfolioBySlug, SAMPLE_CREATOR_PORTFOLIO } from '../../lib/portfolioStorage';

export const PublicPortfolioPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [portfolio, setPortfolio] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPortfolio() {
      setLoading(true);
      try {
        const found = await getPortfolioBySlug(slug || 'rishika-kapoor');
        if (isMounted) {
          if (found) {
            setPortfolio(found);
            // Update document title and meta description dynamically
            if (found.identity?.name) {
              document.title = `${found.identity.name} — ${found.identity.tagline || found.identity.niche || 'Portfolio'}`;
            }
          } else {
            // Fallback to sample portfolio if slug not found
            setPortfolio(SAMPLE_CREATOR_PORTFOLIO);
          }
        }
      } catch (err) {
        console.error('Error loading portfolio:', err);
        if (isMounted) {
          setPortfolio(SAMPLE_CREATOR_PORTFOLIO);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPortfolio();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: portfolio?.identity.name || 'Creator Portfolio',
          text: portfolio?.identity.tagline || portfolio?.identity.bio || '',
          url,
        });
        return;
      } catch {}
    }
    // Fallback copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-2 border-neutral-700 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-sm text-neutral-400 font-medium">Loading Creator Portfolio...</p>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Portfolio Not Found</h2>
        <p className="text-neutral-400 text-sm mb-6 max-w-md">
          The requested creator portfolio link does not exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/portfolio/rishika-kapoor')}
          className="px-5 py-2.5 rounded-xl bg-white text-neutral-950 font-medium text-sm"
        >
          View Sample Portfolio
        </button>
      </div>
    );
  }

  const { identity, contact, socialLinks, content, media } = portfolio;
  const whatsappUrl = contact.whatsappNumber
    ? `https://wa.me/${contact.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${identity.name}, I came across your portfolio and would love to discuss a project!`)}`
    : null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-neutral-800 selection:text-white">
      {/* Top Floating Action Bar */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-900 px-4 sm:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {identity.profilePhoto ? (
              <img
                src={identity.profilePhoto}
                alt={identity.name}
                className="w-8 h-8 rounded-full object-cover border border-neutral-800"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-semibold">
                {identity.name?.charAt(0) || 'C'}
              </div>
            )}
            <div>
              <span className="font-semibold text-sm tracking-tight text-white block">
                {identity.name}
              </span>
              <span className="text-[11px] text-neutral-400 block -mt-0.5">
                {identity.niche || 'Creator'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleShare}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors"
              title="Share portfolio"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}

            {contact.bookingUrl ? (
              <a
                href={contact.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Call</span>
              </a>
            ) : (
              <a
                href={`mailto:${contact.email}`}
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Inquire</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Portfolio Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-16 sm:space-y-24">
        {/* HERO SECTION */}
        <section className="pt-2 sm:pt-6">
          <div className="flex flex-col md:flex-row md:items-start gap-8 lg:gap-12">
            {/* Creator Photo */}
            <div className="shrink-0">
              <div className="relative group">
                <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden border-2 border-neutral-800 bg-neutral-900 shadow-2xl">
                  {identity.profilePhoto ? (
                    <img
                      src={identity.profilePhoto}
                      alt={identity.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-neutral-400">
                      {identity.name?.charAt(0)}
                    </div>
                  )}
                </div>
                {/* Available for Work Status Badge */}
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-medium text-emerald-400 flex items-center gap-1.5 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Available for Bookings</span>
                </div>
              </div>
            </div>

            {/* Creator Bio & Badges */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300">
                  {identity.niche}
                </span>
                {identity.location && (
                  <span className="px-3 py-1 rounded-full bg-neutral-900/60 border border-neutral-800/80 text-xs text-neutral-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-neutral-500" />
                    <span>{identity.location}</span>
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
                  {identity.name}
                </h1>
                {identity.tagline && (
                  <p className="text-lg sm:text-xl text-neutral-300 font-medium leading-snug">
                    {identity.tagline}
                  </p>
                )}
              </div>

              <p className="text-neutral-400 text-sm sm:text-base leading-relaxed max-w-2xl">
                {identity.bio}
              </p>

              {/* Social & Contact Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {socialLinks?.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    title="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {socialLinks?.youtube && (
                  <a
                    href={socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    title="YouTube"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {socialLinks?.linkedin && (
                  <a
                    href={socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {socialLinks?.behance && (
                  <a
                    href={socialLinks.behance}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors text-xs font-semibold"
                    title="Behance"
                  >
                    Bē
                  </a>
                )}
                {socialLinks?.github && (
                  <a
                    href={socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    title="GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {socialLinks?.twitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    title="Twitter / X"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {contact?.website && (
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    title="Website"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES / OFFERINGS SECTION */}
        {content?.services && content.services.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-end justify-between border-b border-neutral-900 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                  Services & Direct Engagements
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">How We Can Work Together</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {content.services.map((srv) => (
                <div
                  key={srv.id}
                  className="rounded-2xl bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800/80 p-6 flex flex-col justify-between transition-all duration-200 hover:border-neutral-700 shadow-sm hover:shadow-lg"
                >
                  <div>
                    <h3 className="font-semibold text-base text-white mb-2">{srv.title}</h3>
                    <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed mb-4">
                      {srv.description}
                    </p>

                    {srv.tags && srv.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {srv.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-800/80 text-neutral-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between">
                    <div>
                      {srv.price && (
                        <div className="text-xs font-semibold text-white">{srv.price}</div>
                      )}
                      {srv.deliveryTime && (
                        <div className="text-[11px] text-neutral-400">{srv.deliveryTime} turnaround</div>
                      )}
                    </div>
                    <a
                      href={whatsappUrl || `mailto:${contact.email}?subject=${encodeURIComponent(`Inquiry: ${srv.title}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-white hover:text-neutral-950 text-neutral-200 text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <span>Inquire</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SELECTED PROJECTS / PORTFOLIO WORKS */}
        {content?.projects && content.projects.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-end justify-between border-b border-neutral-900 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                  Showcase
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">Selected Projects & Works</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {content.projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => proj.coverImage && setSelectedProject(proj)}
                  className="group rounded-2xl overflow-hidden bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-all duration-300 flex flex-col cursor-pointer"
                >
                  {proj.coverImage && (
                    <div className="aspect-[16/10] overflow-hidden bg-neutral-900 relative">
                      <img
                        src={proj.coverImage}
                        alt={proj.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-xs text-white font-medium flex items-center gap-1">
                          <span>View Full Image</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                        <span>{proj.client || 'Commissioned Work'}</span>
                        <span>{proj.year}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-200 transition-colors mb-1">
                        {proj.title}
                      </h3>
                      {proj.subtitle && (
                        <p className="text-xs text-neutral-400 font-medium mb-3">
                          {proj.subtitle}
                        </p>
                      )}
                      {proj.description && (
                        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-4">
                          {proj.description}
                        </p>
                      )}
                    </div>

                    {proj.tags && proj.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {proj.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ABOUT NARRATIVE & SKILLS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          <div className="md:col-span-2 space-y-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
              Creative Background
            </span>
            <h2 className="text-2xl font-bold text-white">About & Philosophy</h2>
            <div className="text-neutral-300 text-sm sm:text-base leading-relaxed space-y-4">
              <p>{content?.about || identity.bio}</p>
            </div>
          </div>

          {content?.skills && content.skills.length > 0 && (
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                Core Capabilities
              </span>
              <h2 className="text-lg font-bold text-white">Skills & Toolkit</h2>
              <div className="flex flex-wrap gap-2">
                {content.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* EXPERIENCE TIMELINE */}
        {content?.experience && content.experience.length > 0 && (
          <section className="space-y-6">
            <div className="border-b border-neutral-900 pb-4">
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                Track Record
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">Experience & Editorial History</h2>
            </div>

            <div className="space-y-4">
              {content.experience.map((exp) => (
                <div
                  key={exp.id}
                  className="rounded-xl bg-neutral-900/40 border border-neutral-800/60 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div>
                    <h3 className="font-bold text-base text-white">{exp.role}</h3>
                    <p className="text-xs sm:text-sm text-neutral-300 font-medium">{exp.company}</p>
                    {exp.description && (
                      <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
                        {exp.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-neutral-800 text-neutral-300 shrink-0 self-start">
                    {exp.period}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TESTIMONIALS / ENDORSEMENTS */}
        {content?.testimonials && content.testimonials.length > 0 && (
          <section className="space-y-6">
            <div className="border-b border-neutral-900 pb-4">
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                Endorsements
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">What Clients & Directors Say</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {content.testimonials.map((test) => (
                <div
                  key={test.id}
                  className="rounded-2xl bg-neutral-900/40 border border-neutral-800/80 p-6 flex flex-col justify-between"
                >
                  <p className="text-sm text-neutral-300 italic leading-relaxed mb-6">
                    "{test.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    {test.avatar && (
                      <img
                        src={test.avatar}
                        alt={test.clientName}
                        className="w-10 h-10 rounded-full object-cover border border-neutral-800"
                      />
                    )}
                    <div>
                      <div className="text-sm font-semibold text-white">{test.clientName}</div>
                      {(test.clientRole || test.clientCompany) && (
                        <div className="text-xs text-neutral-400">
                          {[test.clientRole, test.clientCompany].filter(Boolean).join(' • ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4-STEP CREATIVE PROCESS */}
        {content?.process && content.process.length > 0 && (
          <section className="space-y-6">
            <div className="border-b border-neutral-900 pb-4">
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                Methodology
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">The Creative Process</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {content.process.map((step) => (
                <div
                  key={step.id}
                  className="rounded-2xl bg-neutral-900/30 border border-neutral-800/60 p-5 space-y-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-200 font-bold text-xs flex items-center justify-center">
                    0{step.step}
                  </div>
                  <h3 className="font-semibold text-sm text-white">{step.title}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DIRECT INQUIRY & FOOTER CARD */}
        <section className="rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-2xl">
          <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
            Let's Collaborate
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-white mt-2 mb-4">
            Ready to bring your next project to life?
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
            Available for commercial commissions, editorial campaigns, brand direction, and bespoke advisory.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-emerald-950/50"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Message on WhatsApp</span>
              </a>
            )}

            {contact.bookingUrl && (
              <a
                href={contact.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 font-semibold text-sm flex items-center gap-2 transition-colors shadow-lg"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule Consultation</span>
              </a>
            )}

            <a
              href={`mailto:${contact.email}`}
              className="px-5 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Email: {contact.email}</span>
            </a>
          </div>
        </section>
      </main>

      {/* Lightbox / Modal for Project Image */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="max-w-4xl w-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-[16/10] bg-black max-h-[70vh] flex items-center justify-center overflow-hidden">
              <img
                src={selectedProject.coverImage}
                alt={selectedProject.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="p-6 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-white">{selectedProject.title}</h3>
                {selectedProject.subtitle && (
                  <p className="text-xs text-neutral-400">{selectedProject.subtitle}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="border-t border-neutral-900 py-8 px-6 text-center text-xs text-neutral-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} {identity.name}. All rights reserved.
          </div>
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            <button
              onClick={() => navigate('/')}
              className="text-neutral-300 font-semibold hover:text-white transition-colors"
            >
              Listing OS
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
