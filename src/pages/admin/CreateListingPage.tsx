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
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Create Property Listing</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Upload photos and client notes to create a bespoke property presentation.
            </p>
          </div>
        </div>

        {/* Property Form */}
        <PropertyForm />
      </div>
    </AdminLayout>
  );
};
