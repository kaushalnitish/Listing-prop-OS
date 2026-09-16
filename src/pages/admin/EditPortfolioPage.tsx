import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Save,
  Globe,
  Eye,
  Plus,
  Trash2,
  Check,
  Layers,
} from 'lucide-react';
import { CreatorProfile, CreatorService, CreatorProject, CreatorExperience } from '../../types';
import { getPortfolioById, getPortfolioBySlug, savePortfolio } from '../../lib/portfolioStorage';

export const EditPortfolioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'identity' | 'services' | 'projects' | 'experience' | 'contact'>('identity');
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      setLoading(true);
      if (!id) return;
      try {
        let found = await getPortfolioById(id);
        if (!found) {
          found = await getPortfolioBySlug(id);
        }
        if (isMounted && found) {
          setProfile(found);
        }
      } catch (err) {
        console.error('Failed to load portfolio for editing:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-xs text-neutral-400">Loading Portfolio for Editing...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Portfolio Not Found</h2>
        <p className="text-neutral-400 text-xs mb-4">Could not locate creator profile {id}.</p>
        <button
          onClick={() => navigate('/admin?tab=portfolios')}
          className="px-4 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Add Service
  const handleAddService = () => {
    const newService: CreatorService = {
      id: `srv-${Date.now()}`,
      title: 'New Creative Service',
      description: 'Describe what deliverables and outcomes are included.',
      price: 'Custom Quote',
      deliveryTime: '1-2 Weeks',
      tags: ['Creative'],
    };
    setProfile({
      ...profile,
      content: {
        ...profile.content,
        services: [...profile.content.services, newService],
      },
    });
  };

  const handleRemoveService = (srvId: string) => {
    setProfile({
      ...profile,
      content: {
        ...profile.content,
        services: profile.content.services.filter((s) => s.id !== srvId),
      },
    });
  };

  // Add Project
  const handleAddProject = () => {
    const newProject: CreatorProject = {
      id: `proj-${Date.now()}`,
      title: 'New Project Title',
      subtitle: 'Campaign / Exploration',
      description: 'Project narrative and deliverables.',
      coverImage: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=80',
      tags: ['Editorial'],
      year: new Date().getFullYear().toString(),
      client: 'Brand Partner',
    };
    setProfile({
      ...profile,
      content: {
        ...profile.content,
        projects: [...profile.content.projects, newProject],
      },
    });
  };

  const handleRemoveProject = (projId: string) => {
    setProfile({
      ...profile,
      content: {
        ...profile.content,
        projects: profile.content.projects.filter((p) => p.id !== projId),
      },
    });
  };

  // Add Experience
  const handleAddExperience = () => {
    const newExp: CreatorExperience = {
      id: `exp-${Date.now()}`,
      role: 'Creative Lead',
      company: 'Studio / Agency',
      period: '2023 - Present',
      description: '',
    };
    setProfile({
      ...profile,
      content: {
        ...profile.content,
        experience: [...profile.content.experience, newExp],
      },
    });
  };

  const handleRemoveExperience = (expId: string) => {
    setProfile({
      ...profile,
      content: {
        ...profile.content,
        experience: profile.content.experience.filter((e) => e.id !== expId),
      },
    });
  };

  // Add Skill
  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!profile.content.skills.includes(skillInput.trim())) {
        setProfile({
          ...profile,
          content: {
            ...profile.content,
            skills: [...profile.content.skills, skillInput.trim()],
          },
        });
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setProfile({
      ...profile,
      content: {
        ...profile.content,
        skills: profile.content.skills.filter((s) => s !== skill),
      },
    });
  };

  const handleSave = async (publish?: boolean) => {
    setIsSaving(true);
    try {
      const updated: CreatorProfile = {
        ...profile,
        status: publish !== undefined ? (publish ? 'published' : 'draft') : profile.status,
        updatedAt: new Date().toISOString(),
      };
      await savePortfolio(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);

      if (publish) {
        navigate(`/portfolio/${updated.slug}`);
      }
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to update portfolio.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-neutral-800">
      {/* Top Bar */}
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
                <span className="text-xs font-semibold text-sky-400">Edit Portfolio</span>
              </div>
              <h1 className="text-base font-bold text-white leading-tight">
                {profile.identity.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(`/portfolio/${profile.slug}`)}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Public Page</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {saveSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Publish</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
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

        {/* TAB 1: IDENTITY */}
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
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      identity: { ...profile.identity, name: e.target.value },
                    })
                  }
                  className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Primary Niche
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
                  className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Elevator Tagline
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
                className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-white"
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
                  className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-white"
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
                  className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Concise Bio
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
                className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 p-3 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Extended About & Philosophy
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
                className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 p-3 text-white"
              />
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Public URL Slug
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
                  className="flex-1 text-sm rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2 text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SERVICES */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Services</h2>
              </div>
              <button
                type="button"
                onClick={handleAddService}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-white flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service</span>
              </button>
            </div>

            <div className="space-y-4">
              {profile.content.services.map((srv, idx) => (
                <div key={srv.id} className="rounded-2xl bg-neutral-900/40 border border-neutral-800 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400">Service 0{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveService(srv.id)}
                      className="text-neutral-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
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
                      <input
                        type="text"
                        value={srv.price || ''}
                        onChange={(e) => {
                          const updated = [...profile.content.services];
                          updated[idx].price = e.target.value;
                          setProfile({ ...profile, content: { ...profile.content, services: updated } });
                        }}
                        placeholder="Price"
                        className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white"
                      />
                    </div>
                  </div>
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
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Projects</h2>
              </div>
              <button
                type="button"
                onClick={handleAddProject}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-white flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </button>
            </div>

            <div className="space-y-4">
              {profile.content.projects.map((proj, idx) => (
                <div key={proj.id} className="rounded-2xl bg-neutral-900/40 border border-neutral-800 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400">Project 0{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveProject(proj.id)}
                      className="text-neutral-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => {
                        const updated = [...profile.content.projects];
                        updated[idx].title = e.target.value;
                        setProfile({ ...profile, content: { ...profile.content, projects: updated } });
                      }}
                      placeholder="Title"
                      className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white"
                    />
                    <input
                      type="text"
                      value={proj.coverImage || ''}
                      onChange={(e) => {
                        const updated = [...profile.content.projects];
                        updated[idx].coverImage = e.target.value;
                        setProfile({ ...profile, content: { ...profile.content, projects: updated } });
                      }}
                      placeholder="Cover Image URL"
                      className="w-full text-xs rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white"
                    />
                  </div>
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
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: EXPERIENCE & SKILLS */}
        {activeTab === 'experience' && (
          <div className="space-y-8">
            <div className="space-y-4 bg-neutral-900/40 border border-neutral-800 p-6 rounded-2xl">
              <h2 className="text-base font-bold text-white">Skills</h2>
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
                      className="hover:text-red-400"
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
          </div>
        )}

        {/* TAB 5: CONTACT */}
        {activeTab === 'contact' && (
          <div className="space-y-6 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Direct Email</label>
                <input
                  type="email"
                  value={profile.contact.email}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      contact: { ...profile.contact, email: e.target.value },
                    })
                  }
                  className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">WhatsApp Number</label>
                <input
                  type="text"
                  value={profile.contact.whatsappNumber || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      contact: { ...profile.contact, whatsappNumber: e.target.value },
                    })
                  }
                  className="w-full text-sm rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-between pt-6 border-t border-neutral-800">
          <button
            type="button"
            onClick={() => navigate('/admin?tab=portfolios')}
            className="text-xs text-neutral-400 hover:text-white"
          >
            Return to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-white"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-bold"
            >
              Save & Publish
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
