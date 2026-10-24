import React from 'react';
import {
  Settings,
  Database,
  Shield,
  FileCheck,
  HardDrive,
  Sparkles,
  Lock,
  Layers,
  Terminal,
} from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
          System Settings & Database Maintenance
        </h1>
        <p className="text-xs sm:text-sm text-secondary-text mt-1">
          Platform configurations, SQLite backup protocols, and privacy retention policies.
        </p>
      </div>

      {/* Brand Identity Card */}
      <div className="p-6 rounded-2xl glass-panel border border-border-color shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-primary-text pb-2 border-b border-border-color">
          Brand Identity & Engineering Attribution
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-secondary-text block">Organization:</span>
            <span className="font-bold text-primary-text">Mzamo's Youth Development Company</span>
          </div>
          <div>
            <span className="text-secondary-text block">Application:</span>
            <span className="font-bold text-primary-text">Student Company Application System — Enterprise Edition</span>
          </div>
          <div>
            <span className="text-secondary-text block">Creator & Developer:</span>
            <span className="font-semibold text-brand-teal">Mzamo Sandile Magudulela (ICT Student)</span>
          </div>
          <div>
            <span className="text-secondary-text block">Official Tagline:</span>
            <span className="italic text-primary-text">Your Skills. Your Opportunity. Your Future.</span>
          </div>
        </div>
      </div>

      {/* SQLite Backup & Disaster Recovery Guide */}
      <div className="glass-panel rounded-2xl p-6 border border-border-color shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border-color">
          <Database className="w-4 h-4 text-brand-teal" />
          <h2 className="text-sm font-bold text-primary-text">SQLite Database Backup & Restore Protocol</h2>
        </div>

        <p className="text-xs text-secondary-text leading-relaxed">
          The application database is persisted as a high-performance SQLite transactional store at <code>backend/mydc_app.db</code>. Follow standard enterprise cold/hot backup procedures:
        </p>

        <div className="space-y-3 font-mono text-[11px]">
          <div className="p-3.5 rounded-lg bg-surface-secondary border border-border-color space-y-1">
            <span className="text-secondary-text font-sans block font-semibold text-xs">
              1. Hot Online Backup Command (PowerShell / Shell):
            </span>
            <code className="text-brand-teal block">
              sqlite3 backend/mydc_app.db ".backup 'storage/backups/mydc_backup_$(Get-Date -Format yyyyMMdd_HHmm).db'"
            </code>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-secondary border border-border-color space-y-1">
            <span className="text-secondary-text font-sans block font-semibold text-xs">
              2. Disaster Recovery / Restore Command:
            </span>
            <code className="text-brand-teal block">
              Copy-Item "storage/backups/mydc_backup_20261024_0000.db" -Destination "backend/mydc_app.db" -Force
            </code>
          </div>
        </div>
      </div>

      {/* Security Policies */}
      <div className="glass-panel rounded-2xl p-6 border border-border-color shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border-color">
          <Shield className="w-4 h-4 text-brand-teal" />
          <h2 className="text-sm font-bold text-primary-text">Security & Cryptography Policies</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-border-color bg-surface-secondary/40 space-y-1">
            <span className="font-bold text-primary-text block">Password Hashing:</span>
            <p className="text-secondary-text">Argon2id (time=3, memory=65536KB, parallelism=4, salt=16B).</p>
          </div>

          <div className="p-4 rounded-xl border border-border-color bg-surface-secondary/40 space-y-1">
            <span className="font-bold text-primary-text block">Session Security:</span>
            <p className="text-secondary-text">256-bit cryptographically secure token, SHA-256 hashed in database.</p>
          </div>

          <div className="p-4 rounded-xl border border-border-color bg-surface-secondary/40 space-y-1">
            <span className="font-bold text-primary-text block">Account Lockout Policy:</span>
            <p className="text-secondary-text">5 consecutive failed attempts locks account for 15 minutes.</p>
          </div>

          <div className="p-4 rounded-xl border border-border-color bg-surface-secondary/40 space-y-1">
            <span className="font-bold text-primary-text block">Recovery Token Expiry:</span>
            <p className="text-secondary-text">Single-use, 15-minute lifespan with automatic revocation upon reset.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
