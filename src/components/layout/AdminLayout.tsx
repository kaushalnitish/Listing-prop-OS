import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  PlusCircle,
  ExternalLink,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Plus,
} from 'lucide-react';
import { isAdminAuthenticated, logoutAdmin, ENABLE_AUTH } from '../../lib/auth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const authenticated = isAdminAuthenticated();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard,
      active: location.pathname === '/admin' && !location.hash,
    },
    {
      label: 'Listings',
      path: '/admin',
      icon: Home,
      active: location.pathname === '/admin' && location.hash === '#listings',
    },
    {
      label: 'Create Listing',
      path: '/admin/new',
      icon: PlusCircle,
      active: location.pathname === '/admin/new',
    },
    {
      label: 'Sample Preview',
      path: '/p/the-grand-luminary-villa',
      icon: ExternalLink,
      external: true,
      active: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-stone-900 flex flex-col lg:flex-row font-sans antialiased">
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/80 px-4 h-14 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-stone-900">
            Listing OS
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/new"
            className="p-1.5 rounded-lg bg-stone-900 text-white text-xs font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation - Desktop Fixed / Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-stone-200/80 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between pb-6 border-b border-stone-100">
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-stone-900 block leading-none">
                  Listing OS
                </span>
                <span className="text-[11px] text-stone-400 font-medium">
                  Property Platform
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav List */}
          <nav className="mt-6 space-y-1 flex-1">
            <div className="px-3 pb-2 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
              Management
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return item.external ? (
                <a
                  key={item.label}
                  href={item.path}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-stone-400 group-hover:text-stone-700" />
                    <span>{item.label}</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-stone-300 group-hover:text-stone-500" />
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    item.active
                      ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      item.active ? 'text-white' : 'text-stone-400 group-hover:text-stone-700'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer Actions */}
          <div className="pt-4 border-t border-stone-100 space-y-1">
            {ENABLE_AUTH && authenticated && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-stone-600 hover:text-rose-600 hover:bg-rose-50/60 transition-colors"
              >
                <LogOut className="w-4 h-4 text-stone-400" />
                <span>Sign Out</span>
              </button>
            )}
            <div className="px-3.5 py-2 text-[11px] text-stone-400 font-normal">
              Internal Version 2.4.0
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-stone-900/30 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header Bar */}
        <header className="hidden lg:flex items-center justify-between h-16 px-8 border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-400">Admin</span>
            <span className="text-xs text-stone-300">/</span>
            <span className="text-xs font-semibold text-stone-800">
              {location.pathname === '/admin/new'
                ? 'Create Listing'
                : location.pathname.startsWith('/admin/edit')
                ? 'Edit Listing'
                : 'Property Listings'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/p/the-grand-luminary-villa"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
              <span>Sample Preview</span>
            </a>

            <Link
              to="/admin/new"
              className="px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Listing</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-stone-200/80 text-xs text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-2 bg-white/50">
          <p>© {new Date().getFullYear()} Listing OS — Property Management Platform</p>
          <p className="text-stone-400 font-normal">Internal Property Listing Engine</p>
        </footer>
      </div>
    </div>
  );
};
