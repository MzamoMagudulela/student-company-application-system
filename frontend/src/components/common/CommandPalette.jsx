import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Briefcase,
  FileText,
  GraduationCap,
  Bell,
  Settings,
  Shield,
  Award,
  Users,
  FileCheck,
  FolderOpen,
  HelpCircle,
  X,
  Compass,
} from 'lucide-react';

export default function CommandPalette({ isOpen, onClose, userRole }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allItems = useMemo(() => {
    const publicItems = [
      { id: 'home', title: 'Home', section: 'Public Pages', path: '/', icon: Compass },
      { id: 'opps', title: 'Explore Opportunities', section: 'Public Pages', path: '/opportunities', icon: Briefcase },
      { id: 'cv-doctor', title: 'CV Doctor & Readiness', section: 'Public Pages', path: '/cv-doctor', icon: FileCheck },
      { id: 'learning', title: 'Career Learning Hub', section: 'Public Pages', path: '/learning', icon: GraduationCap },
      { id: 'about', title: 'About MZAMO Platform', section: 'Public Pages', path: '/about', icon: HelpCircle },
      { id: 'recovery', title: 'Account Recovery Centre', section: 'Security', path: '/recovery', icon: Shield },
    ];

    const studentItems = [
      { id: 's-dash', title: 'Student Overview', section: 'Student Dashboard', path: '/student/dashboard', icon: Compass },
      { id: 's-profile', title: 'My Profile', section: 'Student Dashboard', path: '/student/profile', icon: Users },
      { id: 's-cv-builder', title: 'CV Builder (PDF)', section: 'Student Dashboard', path: '/student/cv-builder', icon: FileText },
      { id: 's-cv-doctor', title: 'CV Doctor Checklist', section: 'Student Dashboard', path: '/student/cv-doctor', icon: FileCheck },
      { id: 's-opps', title: 'Browse Opportunities', section: 'Student Dashboard', path: '/student/opportunities', icon: Briefcase },
      { id: 's-saved', title: 'Saved Opportunities', section: 'Student Dashboard', path: '/student/saved', icon: FolderOpen },
      { id: 's-apps', title: 'My Applications', section: 'Student Dashboard', path: '/student/applications', icon: FileText },
      { id: 's-offers', title: 'My Offers', section: 'Student Dashboard', path: '/student/offers', icon: Award },
      { id: 's-notifs', title: 'Notifications', section: 'Student Dashboard', path: '/student/notifications', icon: Bell },
      { id: 's-learn', title: 'Career Learning Progress', section: 'Student Dashboard', path: '/student/learning', icon: GraduationCap },
      { id: 's-sec', title: 'Account Security', section: 'Student Dashboard', path: '/student/security', icon: Shield },
    ];

    const adminItems = [
      { id: 'a-dash', title: 'Admin Overview', section: 'Administration', path: '/admin/dashboard', icon: Compass },
      { id: 'a-students', title: 'Manage Students', section: 'Administration', path: '/admin/students', icon: Users },
      { id: 'a-opps', title: 'Manage Opportunities', section: 'Administration', path: '/admin/opportunities', icon: Briefcase },
      { id: 'a-apps', title: 'Application Review & Status', section: 'Administration', path: '/admin/applications', icon: FileText },
      { id: 'a-offers', title: 'Generate & Manage Offer Letters', section: 'Administration', path: '/admin/offers', icon: Award },
      { id: 'a-learn', title: 'Learning Resources Manager', section: 'Administration', path: '/admin/learning', icon: GraduationCap },
      { id: 'a-audit', title: 'Security Audit Logs', section: 'Administration', path: '/admin/audit', icon: Shield },
      { id: 'a-settings', title: 'System Settings', section: 'Administration', path: '/admin/settings', icon: Settings },
    ];

    let items = [...publicItems];
    if (userRole === 'student') {
      items = [...studentItems, ...publicItems];
    } else if (userRole === 'admin') {
      // Admin sees admin items, student overview, and public pages
      items = [...adminItems, ...studentItems, ...publicItems];
    }
    return items;
  }, [userRole]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;
    const lower = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        item.section.toLowerCase().includes(lower)
    );
  }, [allItems, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  const handleSelect = (item) => {
    onClose();
    navigate(item.path);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-border-color bg-surface shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-color">
          <Search className="w-5 h-5 text-secondary-text" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search pages..."
            className="flex-1 bg-transparent text-sm text-primary-text placeholder-secondary-text focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-secondary-text hover:text-primary-text hover:bg-surface-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-secondary-text">
              No matching pages or commands found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-brand-teal/10 text-brand-teal font-medium'
                      : 'text-primary-text hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-teal' : 'text-secondary-text'}`} />
                    <span>{item.title}</span>
                  </div>
                  <span className="text-[10px] text-secondary-text px-2 py-0.5 rounded bg-surface-secondary">
                    {item.section}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-border-color bg-surface-secondary/50 text-[11px] text-secondary-text">
          <div className="flex items-center gap-3">
            <span>Use <kbd className="px-1 py-0.5 rounded bg-surface border border-border-color">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-surface border border-border-color">↓</kbd> to navigate</span>
            <span><kbd className="px-1 py-0.5 rounded bg-surface border border-border-color">Enter</kbd> to select</span>
          </div>
          <span><kbd className="px-1 py-0.5 rounded bg-surface border border-border-color">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
