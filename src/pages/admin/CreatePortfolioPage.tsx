import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Save,
  Globe,
  Eye,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  UploadCloud,
  Layers,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { CreatorProfile, CreatorService, CreatorProject, CreatorExperience } from '../../types';
import { savePortfolio } from '../../lib/portfolioStorage';
import { extractCreatorProfileWithAi } from '../../lib/creatorAiParser';

export const CreatePortfolioPage: React.FC = () => {
  const navigate = useNavigate();

  // AI assistant state
  const [aiText, setAiText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);

  // Form saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'identity' | 'services' | 'projects' | 'experience' | 'contact'>('identity');

  // Form profile state
  const [profile, setProfile] = useState<CreatorProfile>({
    id: `portfolio-${Date.now()}`,
    slug: '',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    identity: {
      name: '',
      tagline: '',
      niche: 'Creative & Design',
      bio: '',
      location: '',
      profilePhoto: '',
    },
    contact: {
      email: '',
      phone: '',
      whatsappNumber: '',
      website: '',
      bookingUrl: '',
    },
    socialLinks: {
      instagram: '',
      youtube: '',
      tiktok: '',
      linkedin: '',
      twitter: '',
      behance: '',
      github: '',
    },
    content: {
      about: '',
      services: [
        {
          id: `srv-${Date.now()}-1`,
          title: 'Creative Consultation & Strategy',
          description: 'Comprehensive creative vision, concept development, and execution roadmap.',
          price: 'Custom Quote',
          deliveryTime: '1-2 Weeks',
          tags: ['Strategy', 'Creative'],
        },
      ],
      skills: ['Art Direction', 'Visual Storytelling', 'Brand Strategy'],
      experience: [],
      projects: [],
      achievements: [],
      testimonials: [],
      process: [
        { id: 'step-1', step: 1, title: 'Discovery', description: 'Brief alignment and initial concept ideation.' },
        { id: 'step-2', step: 2, title: 'Development', description: 'Visual explorations and prototyping.' },
        { id: 'step-3', step: 3, title: 'Refinement', description: 'Feedback review and high-fidelity polishing.' },
        { id: 'step-4', step: 4, title: 'Delivery', description: 'Handoff of final assets across all digital formats.' },
      ],
      upcomingWork: [],
    },
    media: {
      profileImages: [],
      projectImages: [],
    },
  });

  const [skillInput, setSkillInput] = useState('');

  // Auto-generate slug when name changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const generatedSlug = newName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setProfile((prev) => ({
      ...prev,
      slug: prev.slug === '' || prev.slug === prev.identity.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        ? generatedSlug
        : prev.slug,
      identity: {
        ...prev.identity,
        name: newName,
      },
    }));
  };

  // AI Extraction handler
  const handleExtractWithAi = async () => {
    if (!aiText.trim()) return;
    setIsExtracting(true);
    setAiStatus(null);

    try {
      const result = await extractCreatorProfileWithAi(aiText);
      const extracted = result.data || {};
      setProfile((prev) => {
        const name = extracted.identity?.name || prev.identity.name || 'Creative Professional';
        const generatedSlug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

        return {
          ...prev,
          slug: prev.slug || generatedSlug,
          identity: {
            ...prev.identity,
            name,
            tagline: extracted.identity?.tagline || prev.identity.tagline,
            niche: extracted.identity?.niche || prev.identity.niche,
            bio: extracted.identity?.bio || prev.identity.bio,
            location: extracted.identity?.location || prev.identity.location,
          },
          contact: {
            ...prev.contact,
            email: extracted.contact?.email || prev.contact.email,
            phone: extracted.contact?.phone || prev.contact.phone,
            whatsappNumber: extracted.contact?.whatsappNumber || prev.contact.whatsappNumber,
            website: extracted.contact?.website || prev.contact.website,
            bookingUrl: extracted.contact?.bookingUrl || prev.contact.bookingUrl,
          },
          socialLinks: {
            ...prev.socialLinks,
            ...extracted.socialLinks,
          },
          content: {
            ...prev.content,
            about: extracted.content?.about || prev.content.about,
            services: extracted.content?.services?.length ? extracted.content.services : prev.content.services,
            skills: extracted.content?.skills?.length ? extracted.content.skills : prev.content.skills,
            projects: extracted.content?.projects?.length ? extracted.content.projects : prev.content.projects,
            experience: extracted.content?.experience?.length ? extracted.content.experience : prev.content.experience,
          },
        };
      });
      setAiStatus(result.success ? 'Successfully parsed details into form fields below!' : (result.error || 'Parsed basic info using smart heuristics.'));
    } catch (err) {
      console.warn('AI parsing error:', err);
      setAiStatus('Parsed basic info using smart heuristics.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Add Service
  const handleAddService = () => {
    const newService: CreatorService = {
      id: `srv-${Date.now()}`,
      title: 'New Creative Service',
      description: 'Describe what deliverables and outcomes are included.',
      price: 'Custom Quote',
      deliveryTime: '1 Week',
      tags: ['Creative'],
    };
    setProfile((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        services: [...prev.content.services, newService],
      },
    }));
  };

  // Remove Service
  const handleRemoveService = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        services: prev.content.services.filter((s) => s.id !== id),
      },
    }));
  };

  // Add Project
  const handleAddProject = () => {
    const newProject: CreatorProject = {
      id: `proj-${Date.now()}`,
      title: 'Project Title',
      subtitle: 'Editorial / Commercial Campaign',
      description: 'Brief narrative about the project concept, aesthetic direction, and deliverables.',
      coverImage: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=80',
      tags: ['Editorial', 'Art Direction'],
      year: new Date().getFullYear().toString(),
      client: 'Brand Partner',
    };
    setProfile((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        projects: [...prev.content.projects, newProject],
      },
    }));
  };

  // Remove Project
  const handleRemoveProject = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        projects: prev.content.projects.filter((p) => p.id !== id),
      },
    }));
  };

  // Add Experience
  const handleAddExperience = () => {
    const newExp: CreatorExperience = {
      id: `exp-${Date.now()}`,
      role: 'Creative Lead',
      company: 'Studio / Agency',
      period: '2023 - Present',
      description: 'Led visual narratives and bespoke brand campaigns.',
    };
    setProfile((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        experience: [...prev.content.experience, newExp],
      },
    }));
  };

  // Remove Experience
  const handleRemoveExperience = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        experience: prev.content.experience.filter((e) => e.id !== id),
      },
    }));
  };

  // Add Skill
  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!profile.content.skills.includes(skillInput.trim())) {
        setProfile((prev) => ({
          ...prev,
          content: {
            ...prev.content,
            skills: [...prev.content.skills, skillInput.trim()],
          },
        }));
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setProfile((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        skills: prev.content.skills.filter((s) => s !== skill),
      },
    }));
  };

  // Save portfolio handler
  const handleSave = async (publish: boolean = false) => {
    if (!profile.identity.name.trim()) {
      alert('Please enter a creator name.');
      return;
    }

    const finalSlug = (profile.slug || profile.identity.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
      .trim()
      .replace(/^-+|-+$/g, '');

    setIsSaving(true);
    try {
      const toSave: CreatorProfile = {
        ...profile,
        slug: finalSlug,
        status: publish ? 'published' : profile.status,
        updatedAt: new Date().toISOString(),
      };

      const saved = await savePortfolio(toSave);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      if (publish) {
        navigate(`/portfolio/${saved.slug}`);
      }
    } catch (err) {
      console.error('Error saving portfolio:', err);
      alert('Failed to save portfolio. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-neutral-800">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80 px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin?tab=portfolios')}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Listing OS</span>
                <span className="text-xs text-neutral-600">/</span>
                <span className="text-xs font-semibold text-sky-400">New Creator Portfolio</span>
              </div>
              <h1 className="text-base font-bold text-white leading-tight">
                {profile.identity.name || 'Untitled Portfolio'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {profile.slug && (
              <button
                type="button"
                onClick={() => handleSave(false).then(() => navigate(`/portfolio/${profile.slug}`))}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Preview</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {saveSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Publish Portfolio</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* AI Quick Import Banner */}
        <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-white mb-1">
                AI Quick-Fill Assistant
              </h2>
              <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
                Paste raw creator notes, an Instagram bio, resume snippet, or client list. The assistant will auto-populate your identity, services, skills, and contact info.
              </p>

              <div className="space-y-3">
                <textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="Paste bio, Instagram bio text, services, client names, email, phone..."
                  rows={3}
                  className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 p-3 text-neutral-200 focus:outline-none focus:border-sky-500 transition-colors placeholder:text-neutral-600"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">
                    Includes automatic rule-based fallback if AI rate limit is reached.
                  </span>
                  <button
                    type="button"
                    onClick={handleExtractWithAi}
                    disabled={isExtracting || !aiText.trim()}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-neutral-950 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isExtracting ? 'Extracting...' : 'Auto-Extract Profile'}</span>
                  </button>
                </div>

                {aiStatus && (
                  <div className="text-xs text-emerald-400 flex items-center gap-1.5 pt-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{aiStatus}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800/80 gap-6 overflow-x-auto text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'identity'
                ? 'border-sky-400 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            1. Identity & Bio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'services'
                ? 'border-sky-400 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            2. Services ({profile.content.services.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'projects'
                ? 'border-sky-400 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            3. Projects & Works ({profile.content.projects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('experience')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'experience'
                ? 'border-sky-400 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            4. Experience & Skills
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'contact'
                ? 'border-sky-400 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            5. Contact & Social
          </button>
        </div>

        {/* TAB 1: IDENTITY & BIO */}
        {activeTab === 'identity' && (
          <div className="space-y-6 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Full Name or Studio Handle *
                </label>
                <input
                  type="text"
                  value={profile.identity.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Rishika Kapoor"
                  className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Primary Niche or Profession
                </label>
                <input
                  type="text"
                  value={profile.identity.niche}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      identity: { ...profile.identity, niche: e.target.value },
                    })
                  }
                  placeholder="e.g. Fashion Photography & Creative Direction"
                  className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Elevator Tagline (Max 12 words)
              </label>
              <input
                type="text"
                value={profile.identity.tagline}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    identity: { ...profile.identity, tagline: e.target.value },
                  })
                }
                placeholder="e.g. Visual Director Crafting High-Contrast Editorial Campaigns for Global Brands"
                className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Location / Base
                </label>
                <input
                  type="text"
                  value={profile.identity.location}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      identity: { ...profile.identity, location: e.target.value },
                    })
                  }
                  placeholder="e.g. Mumbai • London • Available Worldwide"
                  className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Profile Photo URL
                </label>
                <input
                  type="text"
                  value={profile.identity.profilePhoto || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      identity: { ...profile.identity, profilePhoto: e.target.value },
                    })
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Concise Bio (Hero Section)
              </label>
              <textarea
                value={profile.identity.bio}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    identity: { ...profile.identity, bio: e.target.value },
                  })
                }
                rows={3}
                placeholder="Brief intro highlighting your aesthetic signature, clients, and commercial focus..."
                className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 p-3 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Extended Creative Philosophy & Background (About Section)
              </label>
              <textarea
                value={profile.content.about}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    content: { ...profile.content, about: e.target.value },
                  })
                }
                rows={4}
                placeholder="Dive deeper into your career background, philosophy on craft, and how you approach commissions..."
                className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 p-3 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Custom Public URL Slug
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">yoursite.com/portfolio/</span>
                <input
                  type="text"
                  value={profile.slug}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    })
                  }
                  className="flex-1 text-sm rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SERVICES & OFFERINGS */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Services & Direct Engagements</h2>
                <p className="text-xs text-neutral-400">
                  Clearly display what potential clients can commission you for.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddService}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service</span>
              </button>
            </div>

            <div className="space-y-4">
              {profile.content.services.map((srv, idx) => (
                <div
                  key={srv.id}
                  className="rounded-2xl bg-neutral-900/40 border border-neutral-800 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400">Service 0{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveService(srv.id)}
                      className="text-neutral-500 hover:text-red-400 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                        Service Title
                      </label>
                      <input
                        type="text"
                        value={srv.title}
                        onChange={(e) => {
                          const updated = [...profile.content.services];
                          updated[idx].title = e.target.value;
                          setProfile({ ...profile, content: { ...profile.content, services: updated } });
                        }}
                        className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                        Price / Starting Rate
                      </label>
                      <input
                        type="text"
                        value={srv.price || ''}
                        onChange={(e) => {
                          const updated = [...profile.content.services];
                          updated[idx].price = e.target.value;
                          setProfile({ ...profile, content: { ...profile.content, services: updated } });
                        }}
                        placeholder="e.g. From $2,500"
                        className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                      Deliverables & Scope Description
                    </label>
                    <textarea
                      value={srv.description}
                      onChange={(e) => {
                        const updated = [...profile.content.services];
                        updated[idx].description = e.target.value;
                        setProfile({ ...profile, content: { ...profile.content, services: updated } });
                      }}
                      rows={2}
                      className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                      Turnaround / Delivery Time
                    </label>
                    <input
                      type="text"
                      value={srv.deliveryTime || ''}
                      onChange={(e) => {
                        const updated = [...profile.content.services];
                        updated[idx].deliveryTime = e.target.value;
                        setProfile({ ...profile, content: { ...profile.content, services: updated } });
                      }}
                      placeholder="e.g. 1-2 Weeks"
                      className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white max-w-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PROJECTS & WORKS */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Selected Works & Case Studies</h2>
                <p className="text-xs text-neutral-400">
                  Add high-impact visual projects, client campaigns, or personal explorations.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddProject}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </button>
            </div>

            <div className="space-y-4">
              {profile.content.projects.map((proj, idx) => (
                <div
                  key={proj.id}
                  className="rounded-2xl bg-neutral-900/40 border border-neutral-800 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400">Project 0{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveProject(proj.id)}
                      className="text-neutral-500 hover:text-red-400 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                        Project Title
                      </label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => {
                          const updated = [...profile.content.projects];
                          updated[idx].title = e.target.value;
                          setProfile({ ...profile, content: { ...profile.content, projects: updated } });
                        }}
                        className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                        Client / Commission
                      </label>
                      <input
                        type="text"
                        value={proj.client || ''}
                        onChange={(e) => {
                          const updated = [...profile.content.projects];
                          updated[idx].client = e.target.value;
                          setProfile({ ...profile, content: { ...profile.content, projects: updated } });
                        }}
                        placeholder="e.g. Vogue India"
                        className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                        Cover Image URL
                      </label>
                      <input
                        type="text"
                        value={proj.coverImage || ''}
                        onChange={(e) => {
                          const updated = [...profile.content.projects];
                          updated[idx].coverImage = e.target.value;
                          setProfile({ ...profile, content: { ...profile.content, projects: updated } });
                        }}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                        Year
                      </label>
                      <input
                        type="text"
                        value={proj.year || ''}
                        onChange={(e) => {
                          const updated = [...profile.content.projects];
                          updated[idx].year = e.target.value;
                          setProfile({ ...profile, content: { ...profile.content, projects: updated } });
                        }}
                        placeholder="e.g. 2024"
                        className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                      Project Description
                    </label>
                    <textarea
                      value={proj.description}
                      onChange={(e) => {
                        const updated = [...profile.content.projects];
                        updated[idx].description = e.target.value;
                        setProfile({ ...profile, content: { ...profile.content, projects: updated } });
                      }}
                      rows={2}
                      className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 p-2.5 text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: EXPERIENCE & SKILLS */}
        {activeTab === 'experience' && (
          <div className="space-y-8">
            {/* Skills */}
            <div className="space-y-4 bg-neutral-900/40 border border-neutral-800 p-6 rounded-2xl">
              <h2 className="text-base font-bold text-white">Skills & Toolkit</h2>
              <p className="text-xs text-neutral-400">
                Type a skill and press Enter to add to your list.
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {profile.content.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-medium text-neutral-200 flex items-center gap-2"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                placeholder="Type skill and press Enter..."
                className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-white"
              />
            </div>

            {/* Experience */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Career & Editorial History</h2>
                  <p className="text-xs text-neutral-400">
                    Roles, positions, and institutional collaborations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Experience</span>
                </button>
              </div>

              <div className="space-y-4">
                {profile.content.experience.map((exp, idx) => (
                  <div
                    key={exp.id}
                    className="rounded-2xl bg-neutral-900/40 border border-neutral-800 p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-400">Position 0{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(exp.id)}
                        className="text-neutral-500 hover:text-red-400 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                          Role Title
                        </label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => {
                            const updated = [...profile.content.experience];
                            updated[idx].role = e.target.value;
                            setProfile({ ...profile, content: { ...profile.content, experience: updated } });
                          }}
                          className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                          Company / Studio / Agency
                        </label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const updated = [...profile.content.experience];
                            updated[idx].company = e.target.value;
                            setProfile({ ...profile, content: { ...profile.content, experience: updated } });
                          }}
                          className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                          Period
                        </label>
                        <input
                          type="text"
                          value={exp.period}
                          onChange={(e) => {
                            const updated = [...profile.content.experience];
                            updated[idx].period = e.target.value;
                            setProfile({ ...profile, content: { ...profile.content, experience: updated } });
                          }}
                          placeholder="e.g. 2022 - Present"
                          className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CONTACT & SOCIAL */}
        {activeTab === 'contact' && (
          <div className="space-y-6 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 sm:p-8">
            <h2 className="text-base font-bold text-white">Direct Communication & Booking</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Direct Email *
                </label>
                <input
                  type="email"
                  value={profile.contact.email}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      contact: { ...profile.contact, email: e.target.value },
                    })
                  }
                  placeholder="contact@studio.com"
                  className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  WhatsApp Number (with country code)
                </label>
                <input
                  type="text"
                  value={profile.contact.whatsappNumber || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      contact: { ...profile.contact, whatsappNumber: e.target.value },
                    })
                  }
                  placeholder="+91 98200 12345"
                  className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Personal Website
                </label>
                <input
                  type="url"
                  value={profile.contact.website || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      contact: { ...profile.contact, website: e.target.value },
                    })
                  }
                  placeholder="https://..."
                  className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Booking Calendar Link (Cal.com / Calendly)
                </label>
                <input
                  type="url"
                  value={profile.contact.bookingUrl || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      contact: { ...profile.contact, bookingUrl: e.target.value },
                    })
                  }
                  placeholder="https://cal.com/..."
                  className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-white"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-800">
              <h3 className="text-sm font-semibold text-white mb-4">Social & Portfolio Handles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Instagram URL</label>
                  <input
                    type="url"
                    value={profile.socialLinks?.instagram || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        socialLinks: { ...profile.socialLinks, instagram: e.target.value },
                      })
                    }
                    placeholder="https://instagram.com/..."
                    className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={profile.socialLinks?.linkedin || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        socialLinks: { ...profile.socialLinks, linkedin: e.target.value },
                      })
                    }
                    placeholder="https://linkedin.com/in/..."
                    className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Behance URL</label>
                  <input
                    type="url"
                    value={profile.socialLinks?.behance || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        socialLinks: { ...profile.socialLinks, behance: e.target.value },
                      })
                    }
                    placeholder="https://behance.net/..."
                    className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">YouTube URL</label>
                  <input
                    type="url"
                    value={profile.socialLinks?.youtube || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        socialLinks: { ...profile.socialLinks, youtube: e.target.value },
                      })
                    }
                    placeholder="https://youtube.com/@..."
                    className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bar Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-neutral-800">
          <button
            type="button"
            onClick={() => navigate('/admin?tab=portfolios')}
            className="text-xs text-neutral-400 hover:text-white transition-colors"
          >
            Cancel and Return
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-white transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-bold transition-colors shadow-lg"
            >
              Publish Portfolio
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
