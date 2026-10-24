import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import {
  Compass,
  Users,
  Briefcase,
  FileText,
  Award,
  Bell,
  GraduationCap,
  BarChart3,
  ShieldAlert,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  KeyRound,
} from 'lucide-react';
import FloatingBubbles from '@/components/common/FloatingBubbles';
import ThemeToggle from '@/components/common/ThemeToggle';
import CommandPalette from '@/components/common/CommandPalette';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout() {
  const { user, isAuthenticated, role, logout, isLoading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const location = useLocation();

  // Route guard: only administrators allowed
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary-text">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-secondary-text font-medium">Verifying Administration Access...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role !== 'admin') {
    return <Navigate to="/student/dashboard" replace />;
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { label: 'Overview', path: '/admin/dashboard', icon: Compass },
    { label: 'Students', path: '/admin/students', icon: Users },
    { label: 'Opportunities', path: '/admin/opportunities', icon: Briefcase },
    { label: 'Applications', path: '/admin/applications', icon: FileText },
    { label: 'Offer Letters', path: '/admin/offers', icon: Award },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Learning Resources', path: '/admin/learning', icon: GraduationCap },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Audit Logs', path: '/admin/audit', icon: ShieldAlert },
    { label: 'Recovery Requests', path: '/admin/recovery-requests', icon: KeyRound },
    { label: 'System Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-background text-primary-text relative transition-colors duration-200">
      <FloatingBubbles />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border-color bg-surface/90 backdrop-blur-md z-30 shrink-0">
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-border-color flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 flex items-center justify-center font-bold text-base shadow-sm">
            M
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs tracking-tight text-primary-text leading-tight">
              Mzamo's Youth Dev
            </span>
            <span className="text-[10px] text-amber-500 dark:text-amber-400 font-bold tracking-wide uppercase">
              Recruitment Admin
            </span>
          </div>
        </div>

        {/* Admin Card */}
        <div className="p-4 mx-3 my-3 rounded-xl border border-border-color bg-surface-secondary/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-semibold text-xs">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary-text truncate">{user?.username}</p>
              <p className="text-[10px] text-secondary-text truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 font-semibold shadow-xs'
                    : 'text-secondary-text hover:text-primary-text hover:bg-surface-secondary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border-color space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] text-secondary-text font-medium">Appearance</span>
            <ThemeToggle showLabel={false} />
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-border-color bg-surface/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg border border-border-color text-secondary-text"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-color bg-surface-secondary/70 text-secondary-text hover:text-primary-text text-xs transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin commands...</span>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border-color text-secondary-text">
                Ctrl+K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border-color">
              <span className="text-xs font-medium text-primary-text">{user?.username}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                Administrator
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Modal */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden flex"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <div
              className="w-72 bg-surface h-full flex flex-col border-r border-border-color p-4 space-y-4 animate-in slide-in-from-left duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border-color pb-3">
                <span className="font-bold text-sm text-primary-text">Admin Navigation</span>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-md text-secondary-text hover:text-primary-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                        isActive
                          ? 'bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 font-semibold'
                          : 'text-primary-text hover:bg-surface-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-border-color">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        userRole="admin"
      />
    </div>
  );
}
