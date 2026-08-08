import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PropertyForm } from '../../components/admin/PropertyForm';
import { ArrowLeft, Building2 } from 'lucide-react';
import { getListingById } from '../../lib/storage';
import { PropertyListing } from '../../types';

export const EditListingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = React.useState<PropertyListing | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (id) {
      getListingById(id).then((data) => {
        setListing(data);
        setLoading(false);
      });
    }
  }, [id]);

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300 shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-stone-900">Edit Property Listing</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              ID: <span className="font-mono text-stone-700">{id}</span>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-stone-500 text-sm font-medium">Loading listing details...</div>
        ) : !listing ? (
          <div className="py-16 text-center border border-dashed border-stone-200 rounded-2xl p-6 bg-white shadow-2xs">
            <Building2 className="w-10 h-10 text-stone-400 mx-auto mb-2" />
            <p className="text-sm text-stone-800 font-semibold">Listing Not Found</p>
            <p className="text-xs text-stone-500 mt-1 mb-4">No record found matching ID `{id}`.</p>
            <Link to="/admin" className="text-xs text-stone-900 font-semibold underline hover:text-stone-700">
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <PropertyForm initialData={listing} isEdit={true} />
        )}
      </div>
    </AdminLayout>
  );
};
