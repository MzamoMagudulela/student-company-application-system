import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, ChevronDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle({ showLabel = false }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getActiveIcon = () => {
    if (theme === 'system') {
      return <Laptop className="w-4 h-4 text-brand-teal" />;
    }
    return resolvedTheme === 'dark' ? (
      <Moon className="w-4 h-4 text-brand-teal" />
    ) : (
      <Sun className="w-4 h-4 text-amber-500" />
    );
  };

  const getThemeLabel = () => {
    if (theme === 'system') return 'System';
    return theme === 'dark' ? 'Dark' : 'Light';
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select color theme"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border-color bg-surface hover:bg-surface-secondary text-primary-text text-xs font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
      >
        {getActiveIcon()}
        {showLabel && <span>{getThemeLabel()}</span>}
        <ChevronDown className="w-3.5 h-3.5 text-secondary-text ml-0.5 opacity-70" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Theme options"
          className="absolute right-0 mt-2 w-36 rounded-lg border border-border-color bg-surface shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            type="button"
            role="option"
            aria-selected={theme === 'light'}
            onClick={() => {
              setTheme('light');
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
              theme === 'light'
                ? 'bg-brand-teal/10 text-brand-teal font-semibold'
                : 'text-primary-text hover:bg-surface-secondary'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Light</span>
          </button>

          <button
            type="button"
            role="option"
            aria-selected={theme === 'dark'}
            onClick={() => {
              setTheme('dark');
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
              theme === 'dark'
                ? 'bg-brand-teal/10 text-brand-teal font-semibold'
                : 'text-primary-text hover:bg-surface-secondary'
            }`}
          >
            <Moon className="w-4 h-4 text-brand-teal" />
            <span>Dark</span>
          </button>

          <button
            type="button"
            role="option"
            aria-selected={theme === 'system'}
            onClick={() => {
              setTheme('system');
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
              theme === 'system'
                ? 'bg-brand-teal/10 text-brand-teal font-semibold'
                : 'text-primary-text hover:bg-surface-secondary'
            }`}
          >
            <Laptop className="w-4 h-4 text-secondary-text" />
            <span>System</span>
          </button>
        </div>
      )}
    </div>
  );
}
