import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { getListings, saveListing, deleteListing } from '../../lib/storage';
import { PropertyListing } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

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

                    {/* Quick Specs Badges */}
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
                    </div>
                  </div>

                  {/* Slug & Action Toolbar */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 text-xs text-stone-500">
                    <span className="font-mono text-[11px] text-stone-400 truncate max-w-[110px]" title={item.slug}>
                      /p/{item.slug}
                    </span>

                    <div className="flex items-center gap-1">
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
    </AdminLayout>
  );
};
