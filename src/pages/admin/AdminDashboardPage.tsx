import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import {
  Plus,
  Eye,
  Edit3,
  Search,
  Copy,
  Archive,
  Trash2,
  CheckCircle2,
  Building2,
  RotateCcw,
  X,
  MapPin,
  ArrowUpDown,
  SlidersHorizontal,
  ExternalLink,
  Bed,
  Bath,
  Maximize2,
  Sparkles,
  Loader2,
  Globe,
  Layers,
  Compass,
  ArrowRight,
  Share2,
  Check,
} from 'lucide-react';
import { getListings, saveListing, deleteListing } from '../../lib/storage';
import { getPortfolios, deletePortfolio } from '../../lib/portfolioStorage';
import { researchPropertyIntelligenceWithAi } from '../../lib/aiParser';
import { PropertyListing, CreatorProfile } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'portfolios' ? 'portfolios' : 'listings';

  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [portfolios, setPortfolios] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Auto dismiss toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-low' | 'price-high' | 'title'>('newest');
  const [refreshingIntelId, setRefreshingIntelId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [listingsData, portfoliosData] = await Promise.all([
        getListings().catch(() => []),
        getPortfolios().catch(() => []),
      ]);
      setListings(listingsData);
      setPortfolios(portfoliosData);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setToastMessage({
        type: 'error',
        message: err.message || 'Failed to load data from database.',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchListingsData = fetchDashboardData;

  const handleRefreshIntelligence = async (listing: PropertyListing) => {
    setRefreshingIntelId(listing.id);
    try {
      const result = await researchPropertyIntelligenceWithAi(listing);
      if (result.success && result.data) {
        const updated: PropertyListing = {
          ...listing,
          intelligence: result.data,
          updatedAt: new Date().toISOString(),
        };
        await saveListing(updated);
        await fetchListingsData();
        setToastMessage({
          type: 'success',
          message: `Property Intelligence updated with ${result.metadata?.sourcesFound || 0} live sources!`,
        });
      } else {
        setToastMessage({
          type: 'error',
          message: result.error || 'Failed to refresh intelligence.',
        });
      }
    } catch (err: any) {
      console.error('Error refreshing intelligence:', err);
      setToastMessage({
        type: 'error',
        message: err.message || 'Error executing external research.',
      });
    } finally {
      setRefreshingIntelId(null);
    }
  };

  useEffect(() => {
    fetchListingsData();
  }, []);

  // Filter & Search Logic
  const filteredAndSortedListings = useMemo(() => {
    const filtered = listings.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.slug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === 'price-high') {
        return (b.price || 0) - (a.price || 0);
      }
      if (sortBy === 'price-low') {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [listings, searchQuery, statusFilter, sortBy]);

  // Action Handlers
  const handleCopyLink = async (item: PropertyListing) => {
    if (item.status !== 'published') {
      setToastMessage({
        type: 'info',
        message: 'Only published listings have a public live link.',
      });
      return;
    }

    const publicUrl = `${window.location.origin}/p/${item.slug}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setToastMessage({
        type: 'success',
        message: 'Public listing URL copied to clipboard.',
      });
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Archive Modal State
  const [itemToArchive, setItemToArchive] = useState<PropertyListing | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchiveRequest = (item: PropertyListing) => {
    setItemToArchive(item);
  };

  const confirmArchive = async () => {
    if (!itemToArchive) return;
    setIsArchiving(true);
    try {
      const updatedItem: PropertyListing = {
        ...itemToArchive,
        status: 'archived',
        updatedAt: new Date().toISOString(),
      };

      await saveListing(updatedItem);
      await fetchListingsData();
      setToastMessage({
        type: 'info',
        message: 'Listing archived. It is no longer publicly visible.',
      });
    } catch (err) {
      console.error('Failed to archive listing:', err);
    } finally {
      setIsArchiving(false);
      setItemToArchive(null);
    }
  };

  const handleRepublish = async (item: PropertyListing) => {
    try {
      const updatedItem: PropertyListing = {
        ...item,
        status: 'published',
        updatedAt: new Date().toISOString(),
      };

      await saveListing(updatedItem);
      await fetchListingsData();
      setToastMessage({
        type: 'success',
        message: 'Listing republished successfully and is live publicly.',
      });
    } catch (err) {
      console.error('Failed to republish listing:', err);
    }
  };

  // Delete confirmation state
  const [itemToDelete, setItemToDelete] = useState<PropertyListing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteRequest = (item: PropertyListing) => {
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const targetId = itemToDelete.id;
      await deleteListing(targetId);

      // Re-fetch from authoritative source to verify deletion
      const freshListings = await getListings();
      setListings(freshListings);

      const stillPresent = freshListings.some((l) => l.id === targetId);

      if (!stillPresent) {
        setToastMessage({
          type: 'info',
          message: 'Listing permanently deleted.',
        });
      } else {
        setToastMessage({
          type: 'error',
          message: 'Unable to delete listing from server database. Record still present.',
        });
      }
    } catch (err: any) {
      console.error('Failed to delete listing:', err);
      setToastMessage({
        type: 'error',
        message: `Delete failed: ${err.message || 'Server error'}`,
      });
      // Refresh to ensure UI matches exact server state
      await fetchListingsData();
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  // Delete portfolio state
  const [portfolioToDelete, setPortfolioToDelete] = useState<CreatorProfile | null>(null);
  const [isDeletingPortfolio, setIsDeletingPortfolio] = useState(false);

  const confirmDeletePortfolio = async () => {
    if (!portfolioToDelete) return;
    setIsDeletingPortfolio(true);
    try {
      await deletePortfolio(portfolioToDelete.id);
      await fetchDashboardData();
      setToastMessage({
        type: 'info',
        message: 'Creator portfolio deleted.',
      });
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        message: 'Failed to delete creator portfolio.',
      });
    } finally {
      setIsDeletingPortfolio(false);
      setPortfolioToDelete(null);
    }
  };

  const copyPortfolioUrl = (slug: string, id: string) => {
    const url = `${window.location.origin}/portfolio/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
    setToastMessage({
      type: 'success',
      message: 'Public portfolio link copied to clipboard!',
    });
  };

  // Filtered portfolios
  const filteredPortfolios = useMemo(() => {
    return portfolios.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        p.identity.name.toLowerCase().includes(q) ||
        p.identity.niche.toLowerCase().includes(q) ||
        p.identity.tagline.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      );
    });
  }, [portfolios, searchQuery]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Unified Dual Engine Switcher Banner */}
        <div className="bg-stone-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Listing OS</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-semibold">Dual Platform</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white">Unified Asset & Portfolio Management</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-stone-800 p-1 rounded-xl border border-stone-700/60">
              <button
                type="button"
                onClick={() => setSearchParams({ tab: 'listings' })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'listings'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Property Listings ({listings.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchParams({ tab: 'portfolios' })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'portfolios'
                    ? 'bg-sky-400 text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Creator Portfolios ({portfolios.length})</span>
              </button>
            </div>

            <Link
              to="/select"
              className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-colors hidden md:flex items-center gap-1.5 shrink-0"
              title="Switch creation service hub"
            >
              <span>Service Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* =========================================================================
            VIEW 1: CREATOR PORTFOLIOS TAB
            ========================================================================= */}
        {activeTab === 'portfolios' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                  Creator Portfolios
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 mt-1 font-normal">
                  Manage bespoke digital portfolios, commercial services, and public live URLs for creative talent.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <Link
                  to="/portfolio/rishika-kapoor"
                  target="_blank"
                  className="inline-flex items-center justify-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Sample Portfolio</span>
                </Link>

                <Link
                  to="/portfolio/create"
                  className="inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-2xs shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Creator Portfolio</span>
                </Link>
              </div>
            </div>

            {/* Portfolios Search Bar */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs flex items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <input
                  type="text"
                  placeholder="Search creator by name, niche or handle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-50/80 border border-stone-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 focus:bg-white transition-colors pl-9"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-xs text-stone-500 font-medium whitespace-nowrap">
                {filteredPortfolios.length} {filteredPortfolios.length === 1 ? 'Portfolio' : 'Portfolios'}
              </span>
            </div>

            {/* Portfolios Grid */}
            {filteredPortfolios.length === 0 ? (
              <div className="bg-white border border-stone-200/80 rounded-2xl p-12 text-center shadow-2xs max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900 mb-1">No Creator Portfolios Found</h3>
                <p className="text-xs text-stone-500 mb-6">
                  {searchQuery
                    ? `No portfolios matching "${searchQuery}".`
                    : 'Get started by creating your first digital showcase with AI auto-fill.'}
                </p>
                <Link
                  to="/portfolio/create"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Portfolio</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPortfolios.map((portfolio) => (
                  <div
                    key={portfolio.id}
                    className="bg-white border border-stone-200/80 hover:border-stone-300 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Header Avatar & Name */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          {portfolio.identity.profilePhoto ? (
                            <img
                              src={portfolio.identity.profilePhoto}
                              alt={portfolio.identity.name}
                              className="w-12 h-12 rounded-xl object-cover border border-stone-200 bg-stone-100 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 font-bold text-base shrink-0">
                              {portfolio.identity.name?.charAt(0) || 'C'}
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-stone-900 text-base leading-tight">
                              {portfolio.identity.name}
                            </h3>
                            <span className="text-xs text-stone-500 font-medium block mt-0.5">
                              {portfolio.identity.niche}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full ${
                            portfolio.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}
                        >
                          {portfolio.status}
                        </span>
                      </div>

                      {/* Tagline / Bio */}
                      {portfolio.identity.tagline && (
                        <p className="text-xs text-stone-600 line-clamp-2 mb-3 leading-relaxed">
                          {portfolio.identity.tagline}
                        </p>
                      )}

                      {/* Stats Pills */}
                      <div className="flex flex-wrap items-center gap-2 mb-4 pt-2 border-t border-stone-100">
                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200/80 text-stone-600">
                          {portfolio.content?.services?.length || 0} Services
                        </span>
                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200/80 text-stone-600">
                          {portfolio.content?.projects?.length || 0} Projects
                        </span>
                        {portfolio.identity.location && (
                          <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200/80 text-stone-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            <span className="truncate max-w-[100px]">{portfolio.identity.location}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/portfolio/${portfolio.slug}`}
                          target="_blank"
                          className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 hover:text-stone-900 transition-colors"
                          title="View Live Portfolio"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => copyPortfolioUrl(portfolio.slug, portfolio.id)}
                          className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 hover:text-stone-900 transition-colors"
                          title="Copy Public Link"
                        >
                          {copiedId === portfolio.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <Link
                          to={`/portfolio/edit/${portfolio.id}`}
                          className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 hover:text-stone-900 transition-colors"
                          title="Edit Portfolio"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPortfolioToDelete(portfolio)}
                        className="p-2 rounded-xl hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
                        title="Delete Portfolio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Portfolio Delete Confirmation Modal */}
            {portfolioToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
                <div className="bg-white border border-stone-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <button
                      type="button"
                      onClick={() => !isDeletingPortfolio && setPortfolioToDelete(null)}
                      className="text-stone-400 hover:text-stone-600 p-1 rounded-lg transition-colors"
                      disabled={isDeletingPortfolio}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-stone-900">Delete Creator Portfolio</h3>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Are you sure you want to delete {portfolioToDelete.identity.name}'s portfolio? This action cannot be undone.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setPortfolioToDelete(null)}
                      disabled={isDeletingPortfolio}
                      className="px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmDeletePortfolio}
                      disabled={isDeletingPortfolio}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-2xs inline-flex items-center gap-1.5"
                    >
                      {isDeletingPortfolio ? 'Deleting...' : 'Delete Portfolio'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            VIEW 2: PROPERTY LISTINGS TAB (ORIGINAL LISTING OS ENGINE)
            ========================================================================= */}
        {activeTab === 'listings' && (
          <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Property Listings
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 font-normal">
              Manage, publish, and archive all your property listings.
            </p>
          </div>
          <Link
            to="/admin/new"
            className="inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-2xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Listing</span>
          </Link>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by title, city or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50/80 border border-stone-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 focus:bg-white transition-colors pl-9"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls Right */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-stone-100/80 p-1 rounded-xl border border-stone-200/60 overflow-x-auto">
              {(
                [
                  { key: 'all', label: 'All Listings' },
                  { key: 'published', label: 'Published' },
                  { key: 'archived', label: 'Archived' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    statusFilter === tab.key
                      ? 'bg-white text-stone-900 font-semibold shadow-2xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex items-center gap-1.5 bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs text-stone-600">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-stone-800 font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-high">Price: High to Low</option>
                <option value="price-low">Price: Low to High</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="py-24 text-center text-stone-500 text-sm flex items-center justify-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-stone-800 border-t-transparent animate-spin" />
            <span className="font-medium">Loading property listings...</span>
          </div>
        ) : filteredAndSortedListings.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-stone-200 rounded-2xl p-8 bg-white shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-center mx-auto text-stone-400">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-stone-800">No Property Listings Found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              No properties matched your current search query or filter selection.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-xs text-stone-900 font-semibold underline underline-offset-4 hover:text-stone-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedListings.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-stone-300 transition-all duration-200 flex flex-col group"
              >
                {/* Property Cover Image & Badges */}
                <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
                  <img
                    src={
                      item.images?.[0]?.url ||
                      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'
                    }
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80';
                    }}
                    alt={item.title}
                    width="800"
                    height="500"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />

                  {/* Price Tag Overlay */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-900 border border-stone-200/80 shadow-2xs">
                    {item.currency}
                    {item.price ? item.price.toLocaleString() : 'P.O.A.'}
                  </div>

                  {/* Status Badge Overlay */}
                  <div className="absolute top-3 right-3">
                    {item.status === 'published' ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-medium px-2.5 py-0.5 rounded-full shadow-2xs inline-flex items-center gap-1.5 backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Published
                      </span>
                    ) : item.status === 'archived' ? (
                      <span className="bg-stone-100/90 text-stone-600 border border-stone-200 text-[11px] font-medium px-2.5 py-0.5 rounded-full shadow-2xs backdrop-blur-md">
                        Archived
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium px-2.5 py-0.5 rounded-full shadow-2xs backdrop-blur-md">
                        Draft
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-stone-900 group-hover:text-stone-700 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-stone-500 flex items-center gap-1.5 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>
                        {item.location.neighborhood || item.location.address || 'Exclusive Area'},{' '}
                        {item.location.city}
                      </span>
                    </p>

                    {/* Quick Specs & Intelligence Status Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {item.specs?.bedrooms ? (
                        <span className="text-[11px] text-stone-600 bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200/60 font-medium inline-flex items-center gap-1">
                          <Bed className="w-3 h-3 text-stone-400" />
                          {item.specs.bedrooms} Beds
                        </span>
                      ) : null}
                      {item.specs?.bathrooms ? (
                        <span className="text-[11px] text-stone-600 bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200/60 font-medium inline-flex items-center gap-1">
                          <Bath className="w-3 h-3 text-stone-400" />
                          {item.specs.bathrooms} Baths
                        </span>
                      ) : null}
                      {item.specs?.squareFeet ? (
                        <span className="text-[11px] text-stone-600 bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200/60 font-medium inline-flex items-center gap-1">
                          <Maximize2 className="w-3 h-3 text-stone-400" />
                          {item.specs.squareFeet} sqft
                        </span>
                      ) : null}

                      {/* Intelligence status tag */}
                      {item.intelligence ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 font-mono font-medium inline-flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Intel ({item.intelligence.sources?.length || 0} src)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200 font-mono inline-flex items-center gap-1">
                          <span>Intel Pending</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Slug & Action Toolbar */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 text-xs text-stone-500">
                    <span className="font-mono text-[11px] text-stone-400 truncate max-w-[110px]" title={item.slug}>
                      /p/{item.slug}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Refresh Intelligence Button */}
                      <button
                        type="button"
                        onClick={() => handleRefreshIntelligence(item)}
                        disabled={refreshingIntelId === item.id}
                        className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
                        title="Refresh live external market research & intelligence"
                      >
                        {refreshingIntelId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </button>

                      {/* View Link */}
                      <a
                        href={`/p/${item.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                        title="View Public Page"
                      >
                        <Eye className="w-4 h-4" />
                      </a>

                      {/* Edit Button */}
                      <Link
                        to={`/admin/edit/${item.id}`}
                        className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                        title="Edit Listing"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>

                      {/* Copy Link Button */}
                      <button
                        onClick={() => handleCopyLink(item)}
                        className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                        title="Copy Public Link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Archive / Republish Button */}
                      {item.status === 'archived' ? (
                        <button
                          onClick={() => handleRepublish(item)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                          title="Republish Listing"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleArchiveRequest(item)}
                          className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                          title="Archive Listing"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteRequest(item)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-200">
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-900 text-white shadow-xl flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    toastMessage.type === 'success' ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                />
                <p className="text-xs font-medium leading-relaxed">{toastMessage.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Archive Confirmation Modal */}
        {itemToArchive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
                  <Archive className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  onClick={() => !isArchiving && setItemToArchive(null)}
                  className="text-stone-400 hover:text-stone-600 p-1 rounded-lg transition-colors"
                  disabled={isArchiving}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-stone-900">Archive Listing?</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  This property will be hidden from public access. You can republish it at any time from the Archived listings tab.
                </p>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl text-xs space-y-0.5">
                <span className="font-semibold text-stone-800 block truncate">{itemToArchive.title}</span>
                <span className="text-stone-400 block truncate font-mono text-[11px]">ID: {itemToArchive.id}</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setItemToArchive(null)}
                  disabled={isArchiving}
                  className="px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmArchive}
                  disabled={isArchiving}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-all shadow-2xs inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isArchiving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Archiving...</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-3.5 h-3.5" />
                      <span>Confirm Archive</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  onClick={() => !isDeleting && setItemToDelete(null)}
                  className="text-stone-400 hover:text-stone-600 p-1 rounded-lg transition-colors"
                  disabled={isDeleting}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-stone-900">Delete Listing Permanently</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Are you sure you want to delete this listing? This action cannot be undone.
                </p>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl text-xs space-y-0.5">
                <span className="font-semibold text-stone-800 block truncate">{itemToDelete.title}</span>
                <span className="text-stone-400 block truncate font-mono text-[11px]">ID: {itemToDelete.id}</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all shadow-2xs inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Listing</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        </div>
        )}
      </div>
    </AdminLayout>
  );
};
