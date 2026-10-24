import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  FileText,
  Award,
  Clock,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminApi } from '@/services/api';

const COLORS = ['#142B4A', '#0F9D8A', '#F59E0B', '#8B5CF6', '#10B981', '#EF4444'];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  const chartData = [
    { name: 'Total Students', value: stats?.total_students || 0 },
    { name: 'Active Opps', value: stats?.active_opportunities || 0 },
    { name: 'Applications', value: stats?.total_applications || 0 },
    { name: 'In Review', value: stats?.pending_reviews || 0 },
    { name: 'Offers Issued', value: stats?.offers_issued || 0 },
    { name: 'Accepted', value: stats?.offers_accepted || 0 },
  ];

  const distributionData = [
    { name: 'Pending Review', value: stats?.pending_reviews || 1 },
    { name: 'Interviews', value: stats?.interviews_scheduled || 1 },
    { name: 'Offers Issued', value: stats?.offers_issued || 1 },
    { name: 'Offers Accepted', value: stats?.offers_accepted || 1 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
          Recruitment & Operations Overview
        </h1>
        <p className="text-xs sm:text-sm text-secondary-text mt-1">
          Mzamo's Youth Development Company enterprise administration command center.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl border border-border-color bg-surface shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-secondary-text block">Total Students</span>
          <span className="text-2xl font-black text-primary-text mt-1 block">{stats?.total_students ?? 0}</span>
        </div>

        <div className="p-4 rounded-xl border border-border-color bg-surface shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-secondary-text block">Active Listings</span>
          <span className="text-2xl font-black text-brand-teal mt-1 block">{stats?.active_opportunities ?? 0}</span>
        </div>

        <div className="p-4 rounded-xl border border-border-color bg-surface shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-secondary-text block">Applications</span>
          <span className="text-2xl font-black text-primary-text mt-1 block">{stats?.total_applications ?? 0}</span>
        </div>

        <div className="p-4 rounded-xl border border-border-color bg-surface shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-secondary-text block">Pending Review</span>
          <span className="text-2xl font-black text-amber-500 mt-1 block">{stats?.pending_reviews ?? 0}</span>
        </div>

        <div className="p-4 rounded-xl border border-border-color bg-surface shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-secondary-text block">Offers Issued</span>
          <span className="text-2xl font-black text-purple-600 mt-1 block">{stats?.offers_issued ?? 0}</span>
        </div>

        <div className="p-4 rounded-xl border border-border-color bg-surface shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-secondary-text block">Offers Accepted</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{stats?.offers_accepted ?? 0}</span>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-2xl glass-panel border border-border-color shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-primary-text">Recruitment Funnel & Pipeline</h2>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" fill="#0F9D8A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 p-6 rounded-2xl glass-panel border border-border-color shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-primary-text">Pipeline Distribution</h2>
            <div className="w-full h-48 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-secondary-text pt-2 border-t border-border-color">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#142B4A]" />
              <span>Reviews</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F9D8A]" />
              <span>Interviews</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
              <span>Offers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
              <span>Accepted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Audit Log Stream */}
      <div className="glass-panel rounded-2xl p-6 border border-border-color shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-color">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-teal" />
            <h2 className="text-sm font-bold text-primary-text">Live Security Audit Log</h2>
          </div>
          <Link
            to="/admin/audit"
            className="text-xs font-semibold text-brand-teal hover:underline flex items-center gap-1"
          >
            <span>View Full Trail</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {stats?.recent_activity?.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-lg border border-border-color bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-secondary text-primary-text font-bold">
                  {log.action}
                </span>
                <span className="text-secondary-text font-medium">{log.details || 'System event'}</span>
              </div>
              <span className="text-[10px] text-secondary-text font-mono shrink-0">
                {new Date(log.timestamp).toLocaleString()} &bull; by {log.actor}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
