import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Plus, LayoutDashboard, ExternalLink, LogOut } from 'lucide-react';
import { isAdminAuthenticated, logoutAdmin, ENABLE_AUTH } from '../../lib/auth';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const authenticated = isAdminAuthenticated();

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center text-white shadow-2xs group-hover:bg-stone-800 transition-colors">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-stone-900 block leading-none">
              Lumina Studio
            </span>
            <span className="text-[10px] text-stone-400 font-medium">
              Property Platform
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/admin"
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors ${
              location.pathname === '/admin'
                ? 'bg-stone-100 text-stone-900 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-stone-500" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <Link
            to="/p/the-grand-luminary-villa"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 border border-stone-200/80 flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Preview Public Template"
          >
            <ExternalLink className="w-4 h-4 text-stone-400" />
            <span className="hidden md:inline">Sample Preview</span>
          </Link>

          <Link
            to="/admin/new"
            className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-stone-900 hover:bg-stone-800 text-white flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Listing</span>
          </Link>

          {ENABLE_AUTH && authenticated && (
            <button
              onClick={handleLogout}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs sm:text-sm font-medium text-stone-500 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 border border-stone-200/80 transition-colors"
              title="Sign Out of Admin"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
