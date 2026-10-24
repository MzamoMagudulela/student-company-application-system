import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  FileCheck,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  MapPin,
  Calendar,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { opportunitiesApi } from '@/services/api';
import StatusBadge from '@/components/ui/StatusBadge';

export default function HomePage() {
  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['public-opportunities-featured'],
    queryFn: () => opportunitiesApi.getPublicList({ limit: 4 }),
  });

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto pt-8 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-teal/30 bg-brand-teal/10 text-brand-teal text-xs font-semibold mb-6 animate-in fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          <span>MZAMO'S YOUTH DEVELOPMENT COMPANY &bull; ENTERPRISE PLATFORM</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-primary-text tracking-tight leading-[1.15]">
          Your Skills. Your Opportunity.{' '}
          <span className="text-brand-teal">Your Future.</span>
        </h1>

        <p className="mt-5 text-sm sm:text-base text-secondary-text max-w-2xl mx-auto leading-relaxed">
          The official student internship application, CV diagnostic readiness, and career acceleration platform. Designed and developed by <strong className="text-primary-text">Mzamo Sandile Magudulela</strong>, an ICT student, to empower young South African talent.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/opportunities"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 text-xs sm:text-sm font-bold shadow-lg hover:opacity-95 transition-all"
          >
            <Briefcase className="w-4 h-4" />
            <span>Explore Opportunities</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/cv-doctor"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border-color bg-surface hover:bg-surface-secondary text-primary-text text-xs sm:text-sm font-semibold shadow-sm transition-all"
          >
            <FileCheck className="w-4 h-4 text-brand-teal" />
            <span>Test CV Readiness</span>
          </Link>
        </div>

        {/* Key Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 p-6 rounded-2xl glass-panel border border-border-color shadow-sm">
          <div>
            <p className="text-2xl font-black text-brand-teal">100%</p>
            <p className="text-[11px] text-secondary-text mt-0.5 font-medium">Verified Partner Roles</p>
          </div>
          <div>
            <p className="text-2xl font-black text-primary-text">R0.00</p>
            <p className="text-[11px] text-secondary-text mt-0.5 font-medium">Free for All Students</p>
          </div>
          <div>
            <p className="text-2xl font-black text-brand-teal">ATS</p>
            <p className="text-[11px] text-secondary-text mt-0.5 font-medium">Diagnostic CV Doctor</p>
          </div>
          <div>
            <p className="text-2xl font-black text-primary-text">PDF</p>
            <p className="text-[11px] text-secondary-text mt-0.5 font-medium">Official Offer Letters</p>
          </div>
        </div>
      </section>

      {/* Featured Opportunities Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary-text">
              Featured Internships & Graduate Programmes
            </h2>
            <p className="text-xs text-secondary-text mt-1">
              Curated positions verified by Mzamo's Youth Development Company
            </p>
          </div>
          <Link
            to="/opportunities"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-teal hover:underline"
          >
            <span>View All Listings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-6 rounded-xl border border-border-color bg-surface animate-pulse h-40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunities?.map((opp) => (
              <div
                key={opp.id}
                className="p-6 rounded-xl border border-border-color bg-surface hover:border-brand-teal/50 shadow-sm transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-teal/10 text-brand-teal">
                      {opp.opportunity_type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-secondary-text flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Closes: {new Date(opp.closing_date).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-primary-text group-hover:text-brand-teal transition-colors">
                    {opp.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-secondary-text mt-1.5">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-secondary-text" />
                      {opp.company_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-secondary-text" />
                      {opp.location} ({opp.location_type})
                    </span>
                  </div>

                  <p className="text-xs text-secondary-text line-clamp-2 mt-3 leading-relaxed">
                    {opp.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-border-color flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {opp.skills_required?.slice(0, 3).map((s, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-surface-secondary text-secondary-text">
                        {s}
                      </span>
                    ))}
                  </div>

                  <Link
                    to={`/opportunities?selected=${opp.id}`}
                    className="text-xs font-semibold text-brand-teal hover:underline flex items-center gap-1"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CV Doctor & Learning Callout Banner */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CV Doctor Card */}
        <div className="p-8 rounded-2xl glass-panel border border-border-color flex flex-col justify-between shadow-sm">
          <div>
            <div className="w-10 h-10 rounded-xl bg-brand-teal/20 text-brand-teal flex items-center justify-center mb-4">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-primary-text">CV Doctor Diagnostic Engine</h3>
            <p className="text-xs text-secondary-text mt-2 leading-relaxed">
              Upload your PDF or Word document to receive an instant, objective evaluation. Our transparent 6-factor checklist evaluates contact data, education, skills, and academic projects without penalizing you for lacking formal corporate experience.
            </p>
          </div>
          <div className="mt-6">
            <Link
              to="/cv-doctor"
              className="inline-flex items-center gap-2 text-xs font-bold text-brand-teal hover:underline"
            >
              <span>Diagnose Your CV Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Career Learning Hub Card */}
        <div className="p-8 rounded-2xl glass-panel border border-border-color flex flex-col justify-between shadow-sm">
          <div>
            <div className="w-10 h-10 rounded-xl bg-brand-navy dark:bg-slate-800 text-brand-teal flex items-center justify-center mb-4">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-primary-text">Career Learning Hub</h3>
            <p className="text-xs text-secondary-text mt-2 leading-relaxed">
              Access educational curriculum created for South African graduates: technical interview preparation, STAR technique masterclass, professional email etiquette, and our vital guide to spotting recruitment scams.
            </p>
          </div>
          <div className="mt-6">
            <Link
              to="/learning"
              className="inline-flex items-center gap-2 text-xs font-bold text-brand-teal hover:underline"
            >
              <span>Explore Learning Modules</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
