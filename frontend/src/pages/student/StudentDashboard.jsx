import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Compass,
  FileCheck,
  Briefcase,
  Send,
  Award,
  Bookmark,
  GraduationCap,
  Bell,
  ArrowRight,
  Clock,
  Sparkles,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { studentApi, opportunitiesApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import StatusBadge from '@/components/ui/StatusBadge';

export default function StudentDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['student-dashboard-stats'],
    queryFn: () => studentApi.getDashboardStats(),
  });

  const { data: applications } = useQuery({
    queryKey: ['student-applications'],
    queryFn: () => studentApi.getApplications(),
  });

  const { data: offers } = useQuery({
    queryKey: ['student-offers'],
    queryFn: () => studentApi.getOffers(),
  });

  const { data: upcomingOpps } = useQuery({
    queryKey: ['student-upcoming-opps'],
    queryFn: () => opportunitiesApi.getPublicList({ limit: 3, sort_by: 'closing_date' }),
  });

  const studentName = user?.profile?.first_name || user?.username || 'Student';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-border-color shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-teal/30 bg-brand-teal/10 text-brand-teal text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>STUDENT CAREER DASHBOARD</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary-text">
            Welcome back, {studentName}
          </h1>
          <p className="text-xs text-secondary-text mt-1 max-w-xl leading-relaxed">
            Track your internship applications, monitor your CV Doctor readiness score, and review verified employer opportunities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/student/opportunities"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-teal text-white text-xs font-bold shadow-sm hover:bg-brand-teal-hover transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Discover Roles</span>
          </Link>
          <Link
            to="/student/cv-doctor"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border-color bg-surface hover:bg-surface-secondary text-primary-text text-xs font-medium transition-colors"
          >
            <FileCheck className="w-3.5 h-3.5 text-brand-teal" />
            <span>CV Doctor</span>
          </Link>
        </div>
      </div>

      {/* Key Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Profile Completion */}
        <div className="p-5 rounded-xl border border-border-color bg-surface shadow-xs">
          <div className="flex items-center justify-between text-secondary-text mb-2">
            <span className="text-[11px] font-semibold uppercase">Profile Completion</span>
            <Compass className="w-4 h-4 text-brand-teal" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary-text">
              {stats?.profile_completion_pct ?? 25}%
            </span>
          </div>
          <div className="w-full bg-surface-secondary h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-brand-teal h-full rounded-full transition-all duration-500"
              style={{ width: `${stats?.profile_completion_pct ?? 25}%` }}
            />
          </div>
        </div>

        {/* CV Readiness */}
        <div className="p-5 rounded-xl border border-border-color bg-surface shadow-xs">
          <div className="flex items-center justify-between text-secondary-text mb-2">
            <span className="text-[11px] font-semibold uppercase">CV Readiness</span>
            <FileCheck className="w-4 h-4 text-brand-teal" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary-text">
              {stats?.cv_readiness_score ?? 0}%
            </span>
            <span className="text-[10px] text-secondary-text">
              {stats?.cv_readiness_score ? 'ATS Score' : 'Upload Required'}
            </span>
          </div>
          <div className="w-full bg-surface-secondary h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-brand-teal h-full rounded-full transition-all duration-500"
              style={{ width: `${stats?.cv_readiness_score ?? 0}%` }}
            />
          </div>
        </div>

        {/* Applications Active */}
        <div className="p-5 rounded-xl border border-border-color bg-surface shadow-xs">
          <div className="flex items-center justify-between text-secondary-text mb-2">
            <span className="text-[11px] font-semibold uppercase">Applications</span>
            <Send className="w-4 h-4 text-brand-teal" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary-text">
              {stats?.applications_submitted ?? 0}
            </span>
            <span className="text-[10px] text-secondary-text">
              {stats?.applications_under_review ?? 0} in review
            </span>
          </div>
          <p className="text-[10px] text-secondary-text mt-3">
            {stats?.shortlisted_count ?? 0} shortlisted
          </p>
        </div>

        {/* Offers Received */}
        <div className="p-5 rounded-xl border border-border-color bg-surface shadow-xs">
          <div className="flex items-center justify-between text-secondary-text mb-2">
            <span className="text-[11px] font-semibold uppercase">Offers Received</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-500">
              {stats?.offers_received ?? 0}
            </span>
            <span className="text-[10px] text-secondary-text">formal offers</span>
          </div>
          <p className="text-[10px] text-secondary-text mt-3">
            {stats?.saved_opportunities_count ?? 0} saved roles
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Applications (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-primary-text">Recent Applications</h2>
            <Link
              to="/student/applications"
              className="text-xs font-semibold text-brand-teal hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {applications?.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-border-color bg-surface">
              <Send className="w-8 h-8 text-secondary-text mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-primary-text">No applications submitted yet</p>
              <p className="text-[11px] text-secondary-text mt-1 max-w-xs mx-auto">
                Explore our curated listings and submit your first internship application today.
              </p>
              <Link
                to="/student/opportunities"
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-teal text-white text-xs font-semibold"
              >
                Browse Opportunities
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {applications?.slice(0, 4).map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl border border-border-color bg-surface hover:border-brand-teal/40 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono font-semibold text-secondary-text block">
                      {app.reference_number}
                    </span>
                    <h3 className="text-xs font-bold text-primary-text truncate mt-0.5">
                      {app.opportunity?.title}
                    </h3>
                    <p className="text-[11px] text-secondary-text truncate">
                      {app.opportunity?.company_name} &bull; Submitted {new Date(app.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={app.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Closing Deadlines (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-primary-text">Upcoming Closing Deadlines</h2>
            <Link
              to="/student/opportunities"
              className="text-xs font-semibold text-brand-teal hover:underline"
            >
              Explore
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingOpps?.slice(0, 3).map((opp) => (
              <div
                key={opp.id}
                className="p-4 rounded-xl border border-border-color bg-surface hover:border-brand-teal/40 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-primary-text line-clamp-1">{opp.title}</h4>
                  <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(opp.closing_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[11px] text-secondary-text flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-secondary-text" />
                  {opp.company_name} ({opp.location})
                </p>
                <div className="pt-2 flex justify-end">
                  <Link
                    to={`/student/opportunities?apply=${opp.id}`}
                    className="text-xs font-bold text-brand-teal hover:underline flex items-center gap-1"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
