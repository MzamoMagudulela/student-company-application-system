import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Code2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Database,
  Lock,
  FileCheck,
  Layers,
  HeartHandshake,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-12 py-8 max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-teal/30 bg-brand-teal/10 text-brand-teal text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PROJECT VISION & ARCHITECTURE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary-text tracking-tight">
          About Mzamo's Youth Development Company
        </h1>
        <p className="text-sm text-secondary-text max-w-2xl mx-auto leading-relaxed">
          The <em>Student Company Application System — Enterprise Edition</em> is built to bridge the gap between academic study and employment for young graduates across South Africa.
        </p>
      </div>

      {/* Developer Profile Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-border-color shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 flex items-center justify-center font-black text-2xl shadow-md shrink-0">
            MSM
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary-text">
              Mzamo Sandile Magudulela
            </h2>
            <p className="text-xs text-brand-teal font-semibold mt-0.5">
              Creator, System Architect & ICT Student
            </p>
            <p className="text-xs text-secondary-text mt-2 leading-relaxed">
              Designed and engineered as a comprehensive enterprise-grade solution to address graduate unemployment, predatory recruitment fees, and the friction students face when transitioning from university or TVET colleges into verified internships and learnerships.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border-color text-xs">
          <div className="p-3 rounded-xl bg-surface-secondary/50 border border-border-color">
            <span className="text-[10px] text-secondary-text block uppercase font-bold">Brand Tagline</span>
            <span className="text-primary-text font-semibold mt-0.5 block">Your Skills. Your Opportunity. Your Future.</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-secondary/50 border border-border-color">
            <span className="text-[10px] text-secondary-text block uppercase font-bold">Core Focus</span>
            <span className="text-primary-text font-semibold mt-0.5 block">ICT Internships & Career Readiness</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-secondary/50 border border-border-color">
            <span className="text-[10px] text-secondary-text block uppercase font-bold">Platform Status</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">Production Enterprise Monolith</span>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-primary-text">Enterprise Engineering Standards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-xl border border-border-color bg-surface space-y-2">
            <div className="flex items-center gap-2 text-brand-teal font-bold">
              <Lock className="w-4 h-4" />
              <span>Argon2id & Cryptographic Sessions</span>
            </div>
            <p className="text-secondary-text leading-relaxed">
              No plaintext passwords or raw recovery tokens are stored. Tokens are short-lived, hashed via SHA-256, and verified with single-use revocation.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border-color bg-surface space-y-2">
            <div className="flex items-center gap-2 text-brand-teal font-bold">
              <Database className="w-4 h-4" />
              <span>Relational SQLite & Alembic Engine</span>
            </div>
            <p className="text-secondary-text leading-relaxed">
              Enforced foreign key constraints, explicit status transition state machine, audit log tracking, and transactional Alembic migrations.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border-color bg-surface space-y-2">
            <div className="flex items-center gap-2 text-brand-teal font-bold">
              <FileCheck className="w-4 h-4" />
              <span>Objective CV Diagnostic Engine</span>
            </div>
            <p className="text-secondary-text leading-relaxed">
              CV Doctor evaluates academic projects, coursework, and technical skills without penalizing graduates for lacking corporate employment.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border-color bg-surface space-y-2">
            <div className="flex items-center gap-2 text-brand-teal font-bold">
              <Layers className="w-4 h-4" />
              <span>ReportLab PDF Offer Generation</span>
            </div>
            <p className="text-secondary-text leading-relaxed">
              Automated PDF generation for official offer letters and downloadable CVs with tamper-evident reference codes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
