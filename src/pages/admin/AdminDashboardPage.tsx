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
} from 'lucide-react';
import { getListings, saveListing, deleteListing } from '../../lib/storage';
import { PropertyListing } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);

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
      statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Action Handlers
  const handleDuplicate = async (item: PropertyListing) => {
    const newId = `listing-${Date.now()}`;
    const newSlug = `${item.slug}-copy-${Math.floor(Math.random() * 1000)}`;

    const duplicatedItem: PropertyListing = {
      ...item,
      id: newId,
      slug: newSlug,
      title: `${item.title} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveListing(duplicatedItem);
    await fetchListingsData();
  };

  const handleToggleArchive = async (item: PropertyListing) => {
    const newStatus = item.status === 'archived' ? 'draft' : 'archived';
    const updatedItem: PropertyListing = {
      ...item,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    await saveListing(updatedItem);
    await fetchListingsData();
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
              Internal agency management — Search, publish, edit and duplicate luxury property listings
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
                { key: 'draft', label: 'Drafts' },
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
                  <div
                    className={`absolute top-3 right-3 text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full backdrop-blur-md border shadow-md ${
                      item.status === 'published'
                        ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/40'
                        : item.status === 'archived'
                        ? 'bg-zinc-900/90 text-zinc-400 border-zinc-700'
                        : 'bg-amber-950/90 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    {item.status}
                  </div>
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
                      {item.status === 'published' && (
                        <a
                          href={`/p/${item.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                          title="View Live Page"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Edit Button */}
                      <Link
                        to={`/admin/edit/${item.id}`}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 transition-colors"
                        title="Edit Listing"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>

                      {/* Duplicate Button */}
                      <button
                        onClick={() => handleDuplicate(item)}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                        title="Duplicate Listing"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Archive Button */}
                      <button
                        onClick={() => handleToggleArchive(item)}
                        className={`p-2 rounded-lg transition-colors ${
                          item.status === 'archived'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                        }`}
                        title={item.status === 'archived' ? 'Unarchive Listing' : 'Archive Listing'}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

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
