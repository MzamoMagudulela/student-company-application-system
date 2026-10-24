import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Compass,
  Briefcase,
  FileCheck,
  GraduationCap,
  Info,
  LogIn,
  UserPlus,
  Menu,
  X,
  Search,
  ShieldCheck,
} from 'lucide-react';
import FloatingBubbles from '@/components/common/FloatingBubbles';
import ThemeToggle from '@/components/common/ThemeToggle';
import CommandPalette from '@/components/common/CommandPalette';
import { useAuth } from '@/contexts/AuthContext';

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, role } = useAuth();

  // Keyboard shortcut Ctrl+K / Cmd+K
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

  const navLinks = [
    { label: 'Home', path: '/', icon: Compass },
    { label: 'Explore Opportunities', path: '/opportunities', icon: Briefcase },
    { label: 'CV Doctor', path: '/cv-doctor', icon: FileCheck },
    { label: 'Career Learning Hub', path: '/learning', icon: GraduationCap },
    { label: 'About', path: '/about', icon: Info },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-primary-text relative transition-colors duration-200">
      <FloatingBubbles />

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-border-color bg-surface/80 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 flex items-center justify-center font-bold text-lg shadow-sm transition-transform group-hover:scale-105">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-primary-text leading-tight group-hover:text-brand-teal transition-colors">
                Mzamo's Youth Development
              </span>
              <span className="text-[11px] text-secondary-text font-medium leading-tight">
                Student Company Application System
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-teal/10 text-brand-teal'
                      : 'text-secondary-text hover:text-primary-text hover:bg-surface-secondary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Quick Search Ctrl+K Button */}
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border-color bg-surface-secondary/60 text-secondary-text hover:text-primary-text text-xs transition-colors"
              title="Search commands and pages (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search...</span>
              <kbd className="text-[10px] px-1 py-0.2 rounded bg-surface border border-border-color text-secondary-text">
                Ctrl+K
              </kbd>
            </button>

            {/* Theme Switcher */}
            <ThemeToggle />

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <Link
                to={role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                className="px-3 py-1.5 rounded-lg bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 text-xs font-semibold hover:opacity-95 shadow-sm transition-opacity"
              >
                Go to Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-color bg-surface hover:bg-surface-secondary text-primary-text text-xs font-medium transition-colors shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-teal text-white text-xs font-medium hover:bg-brand-teal-hover transition-colors shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg border border-border-color text-secondary-text hover:text-primary-text"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border-color bg-surface p-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-brand-teal/10 text-brand-teal'
                      : 'text-primary-text hover:bg-surface-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-border-color flex flex-col gap-2">
              <Link
                to="/recovery"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-secondary-text hover:text-primary-text"
              >
                <ShieldCheck className="w-4 h-4 text-brand-teal" />
                <span>Account Recovery Centre</span>
              </Link>
              {!isAuthenticated && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex justify-center items-center py-2 rounded-lg border border-border-color text-xs font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex justify-center items-center py-2 rounded-lg bg-brand-teal text-white text-xs font-medium"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Enterprise Footer */}
      <footer className="border-t border-border-color bg-surface/90 transition-colors duration-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 flex items-center justify-center font-bold text-sm">
                  M
                </div>
                <span className="font-bold text-sm text-primary-text">
                  Mzamo's Youth Development Company
                </span>
              </div>
              <p className="text-xs text-secondary-text max-w-md leading-relaxed">
                Empowering students and recent graduates across South Africa to discover legitimate internships, graduate programmes, and learnerships, master CV readiness, and launch their careers.
              </p>
              <div className="text-[11px] text-secondary-text pt-1">
                <strong>Project Tagline:</strong> <em>Your Skills. Your Opportunity. Your Future.</em>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary-text">Platform Navigation</h4>
              <ul className="space-y-1.5 text-xs text-secondary-text">
                <li><Link to="/opportunities" className="hover:text-brand-teal transition-colors">Verified Opportunities</Link></li>
                <li><Link to="/cv-doctor" className="hover:text-brand-teal transition-colors">CV Doctor Diagnostic</Link></li>
                <li><Link to="/learning" className="hover:text-brand-teal transition-colors">Career Learning Hub</Link></li>
                <li><Link to="/recovery" className="hover:text-brand-teal transition-colors">Account Recovery Centre</Link></li>
                <li><Link to="/about" className="hover:text-brand-teal transition-colors">About the Project</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary-text">Creator & Engineering</h4>
              <p className="text-xs text-secondary-text leading-relaxed">
                Designed & Developed by <strong>Mzamo Sandile Magudulela</strong>, ICT student and software engineer.
              </p>
              <div className="text-[11px] text-secondary-text bg-surface-secondary/60 p-2.5 rounded-lg border border-border-color">
                Built with FastAPI, SQLite, React, Tailwind CSS, ReportLab and Enterprise Cryptography.
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border-color flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-secondary-text">
            <span>&copy; {new Date().getFullYear()} Mzamo's Youth Development Company. All rights reserved.</span>
            <span>Enterprise Edition &bull; Mzamo Sandile Magudulela</span>
          </div>
        </div>
      </footer>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        userRole={role || 'guest'}
      />
    </div>
  );
}
