import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  KeyRound,
  QrCode,
  Lock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Clock,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentSecurityPage() {
  const { user, logout } = useAuth();
  const [successMsg, setSuccessMsg] = useState('');

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
          Account Security & Credentials
        </h1>
        <p className="text-xs sm:text-sm text-secondary-text mt-1">
          Review authenticated sessions, password encryption standards, and account recovery configurations.
        </p>
      </div>

      {/* Account Status Card */}
      <div className="p-6 rounded-2xl glass-panel border border-border-color shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-color">
          <div>
            <h2 className="text-sm font-bold text-primary-text">Account Authentication State</h2>
            <p className="text-xs text-secondary-text">Current session details and account standing</p>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {user?.account_status || 'Active'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-secondary-text block">Username:</span>
            <span className="font-semibold text-primary-text">{user?.username}</span>
          </div>
          <div>
            <span className="text-secondary-text block">Registered Email:</span>
            <span className="font-semibold text-primary-text">{user?.email}</span>
          </div>
          <div>
            <span className="text-secondary-text block">Password Cryptography:</span>
            <span className="font-semibold text-brand-teal">Argon2id (64MB / 3 passes)</span>
          </div>
        </div>
      </div>

      {/* Account Recovery QR Centre Link Banner */}
      <div className="p-6 rounded-2xl border border-brand-teal/40 bg-brand-teal/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-brand-teal text-white shrink-0 mt-0.5">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary-text">QR-Code Account Recovery Centre</h3>
            <p className="text-xs text-secondary-text mt-0.5 max-w-lg leading-relaxed">
              Generate or scan your secure recovery QR code. Enables guided account restoration without needing to remember an email address.
            </p>
          </div>
        </div>
        <Link
          to="/recovery"
          className="px-4 py-2 rounded-lg bg-brand-teal text-white text-xs font-bold shadow-md hover:bg-brand-teal-hover transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <span>Open Recovery Centre</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Session Management */}
      <div className="glass-panel rounded-2xl p-6 border border-border-color shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-primary-text pb-2 border-b border-border-color">
          Current Active Session
        </h2>

        <div className="p-4 rounded-xl border border-border-color bg-surface-secondary/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <Smartphone className="w-4 h-4 text-brand-teal" />
            <div>
              <p className="font-semibold text-primary-text">Active Web Session</p>
              <p className="text-[11px] text-secondary-text">Token hashed with SHA-256 &bull; 24-hour expiration</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
          >
            Revoke & Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
