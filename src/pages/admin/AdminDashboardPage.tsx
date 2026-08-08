import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import {
  Plus,
  Eye,
  Edit3,
  Share2,
  Building2,
  Search,
  Copy,
  Archive,
  Trash2,
  CheckCircle2,
  FileText,
  Clock,
  Filter,
  RotateCcw,
  X,
} from 'lucide-react';
import { getListings, saveListing, deleteListing } from '../../lib/storage';
import { PropertyListing } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Auto dismiss toast after 6 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');

  const fetchListingsData = async () => {
    setLoading(true);
    const data = await getListings();
    setListings(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchListingsData();
  }, []);

  // Filter & Search Logic
  const filteredListings = listings.filter((item) => {
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

  // Action Handlers
  const handleCopyLink = async (item: PropertyListing) => {
    if (item.status !== 'published') {
      setToastMessage({
        type: 'info',
        message: 'Only published listings have a public link.',
      });
      return;
    }

    const publicUrl = `${window.location.origin}/p/${item.slug}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setToastMessage({
        type: 'success',
        message: 'Listing link copied',
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
        message: 'Listing archived. It is no longer publicly visible. You can republish it anytime from Archived Listings.',
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
        message: 'Listing republished successfully. It is now live and publicly accessible.',
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
      const targetSlug = itemToDelete.slug;
      setListings((prev) =>
        prev.filter((item) => item.id !== targetId && item.slug !== targetSlug)
      );
      await deleteListing(targetId);
      await fetchListingsData();
      setToastMessage({
        type: 'info',
        message: 'Listing permanently deleted.',
      });
    } catch (err) {
      console.error('Failed to delete listing:', err);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Property Listings Portfolio
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Internal agency management — Search, publish, edit, archive and manage property listings
            </p>
          </div>
          <Link
            to="/admin/new"
            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/10 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Listing</span>
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 p-3 sm:p-4 rounded-2xl">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by title, city or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors pl-9"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800/80 w-full md:w-auto overflow-x-auto">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  statusFilter === tab.key
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="py-20 text-center text-zinc-400 text-sm font-mono flex items-center justify-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span>Fetching listings portfolio...</span>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-zinc-800 rounded-2xl p-8 bg-zinc-900/40 space-y-3">
            <Building2 className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-base font-semibold text-zinc-200">No Listings Match Filter</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Try updating your search query or switching filter tabs.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-xs text-amber-400 hover:underline font-medium"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700/80 transition-all flex flex-col group"
              >
                {/* Cover Image & Status Badge */}
                <div className="relative aspect-[16/10] bg-zinc-950 overflow-hidden">
                  <img
                    src={
                      item.images?.[0]?.url ||
                      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={item.title}
                    width="800"
                    height="500"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />

                  {/* Price Tag */}
                  <div className="absolute top-3 left-3 bg-zinc-950/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono text-amber-400 font-bold border border-amber-500/20 shadow-lg">
                    {item.currency}
                    {item.price ? item.price.toLocaleString() : 'P.O.A.'}
                  </div>

                  {/* Status Badge */}
                  {item.status !== 'draft' && (
                    <div
                      className={`absolute top-3 right-3 text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full backdrop-blur-md border shadow-md ${
                        item.status === 'published'
                          ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/40'
                          : 'bg-zinc-900/90 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {item.status}
                    </div>
                  )}
                </div>

                {/* Card Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-zinc-100 line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                      {item.location.neighborhood || item.location.address || 'Exclusive Address'},{' '}
                      {item.location.city}
                    </p>
                  </div>

                  {/* Bottom Toolbar & Action Buttons */}
                  <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between gap-2 text-xs text-zinc-400">
                    <span className="font-mono text-[10px] text-zinc-500 truncate max-w-[100px]">
                      /{item.slug}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* View Link */}
                      <a
                        href={`/p/${item.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                        title="View Public Page"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>

                      {/* Edit Button */}
                      <Link
                        to={`/admin/edit/${item.id}`}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 transition-colors"
                        title="Edit Listing"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>

                      {/* Copy Public Link Button */}
                      <button
                        onClick={() => handleCopyLink(item)}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                        title="Copy Public Link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Archive / Republish Button */}
                      {item.status === 'archived' ? (
                        <button
                          onClick={() => handleRepublish(item)}
                          className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1"
                          title="Republish Listing"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleArchiveRequest(item)}
                          className="p-2 rounded-lg bg-zinc-800 hover:bg-amber-500/20 hover:text-amber-400 text-zinc-200 transition-colors"
                          title="Archive Listing"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteRequest(item)}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 transition-colors"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
          <div className="fixed top-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-300">
            <div
              className={`p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start justify-between gap-3 ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-100'
                  : 'bg-zinc-900/95 border-amber-500/40 text-zinc-100'
              }`}
            >
              <div className="flex items-start gap-3">
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
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Archive Confirmation Modal */}
        {itemToArchive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                  <Archive className="w-6 h-6" />
                </div>
                <button
                  type="button"
                  onClick={() => !isArchiving && setItemToArchive(null)}
                  className="text-zinc-400 hover:text-zinc-200 text-sm p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                  disabled={isArchiving}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-zinc-100">Archive Listing?</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Archive this listing? It will no longer be visible publicly, but you can republish it anytime from Archived Listings.
                </p>
              </div>

              <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl text-xs space-y-1">
                <span className="font-semibold text-zinc-200 block truncate">{itemToArchive.title}</span>
                <span className="text-zinc-500 block truncate font-mono">ID: {itemToArchive.id}</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setItemToArchive(null)}
                  disabled={isArchiving}
                  className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmArchive}
                  disabled={isArchiving}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isArchiving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      <span>Archiving...</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive Listing</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                  <Trash2 className="w-6 h-6" />
                </div>
                <button
                  type="button"
                  onClick={() => !isDeleting && setItemToDelete(null)}
                  className="text-zinc-400 hover:text-zinc-200 text-sm p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                  disabled={isDeleting}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-zinc-100">Delete Listing</h3>
                <p className="text-xs text-zinc-400">
                  Are you sure you want to delete this listing?
                </p>
              </div>

              <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl text-xs space-y-1">
                <span className="font-semibold text-zinc-200 block truncate">{itemToDelete.title}</span>
                <span className="text-zinc-500 block truncate font-mono">ID: {itemToDelete.id}</span>
              </div>

              <p className="text-xs text-red-400/90 leading-relaxed">
                This action cannot be undone. It will permanently remove this property listing and clean up its stored images.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/20 inline-flex items-center gap-1.5 disabled:opacity-50"
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
    </AdminLayout>
  );
};
