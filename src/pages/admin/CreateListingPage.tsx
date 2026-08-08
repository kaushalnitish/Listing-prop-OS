import React from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PropertyForm } from '../../components/admin/PropertyForm';
import { ArrowLeft } from 'lucide-react';

export const CreateListingPage: React.FC = () => {
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
            <h1 className="text-xl font-bold text-stone-900">Create Property Listing</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Upload photos and client notes to generate a property presentation.
            </p>
          </div>
        </div>

        {/* Property Form */}
        <PropertyForm />
      </div>
    </AdminLayout>
  );
};
