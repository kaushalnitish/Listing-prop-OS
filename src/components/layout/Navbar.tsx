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
    <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 transition-colors">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-semibold tracking-wide text-zinc-100 uppercase">
              Lumina Studio
            </span>
            <span className="block text-[10px] text-zinc-400 uppercase tracking-widest font-mono">
              Internal Tool
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/admin"
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors ${
              location.pathname === '/admin'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <Link
            to="/admin/new"
            className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1.5 transition-all shadow-sm shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Listing</span>
          </Link>

          <Link
            to="/p/the-grand-luminary-villa"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 flex items-center gap-1.5 border border-zinc-800"
            title="Preview Public Template"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden md:inline">Sample Preview</span>
          </Link>

          {ENABLE_AUTH && authenticated && (
            <button
              onClick={handleLogout}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-950/30 flex items-center gap-1.5 border border-zinc-800/80 transition-colors"
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
