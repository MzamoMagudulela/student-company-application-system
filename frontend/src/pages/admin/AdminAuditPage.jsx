import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Layers,
} from 'lucide-react';
import { adminApi } from '@/services/api';

export default function AdminAuditPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', searchTerm],
    queryFn: () => adminApi.getAuditLogs({ action: searchTerm || undefined }),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
          System Security & Audit Trail
        </h1>
        <p className="text-xs sm:text-sm text-secondary-text mt-1">
          Immutable logging of all authentication events, administrative status changes, and document downloads.
        </p>
      </div>

      <div className="p-4 rounded-xl border border-border-color bg-surface shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by action (e.g. USER_LOGIN, PASSWORD_RESET, UPDATE_APPLICATION_STATUS)..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border-color bg-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-primary-text">
            <thead className="bg-surface-secondary/50 border-b border-border-color font-semibold uppercase text-[10px] text-secondary-text">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Action Event</th>
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">Target Entity</th>
                <th className="px-5 py-3">Details / Context</th>
                <th className="px-5 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color font-mono text-[11px]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-secondary-text font-sans">
                    Loading audit trail...
                  </td>
                </tr>
              ) : auditLogs?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-secondary-text font-sans">
                    No audit records match your query.
                  </td>
                </tr>
              ) : (
                auditLogs?.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-5 py-3 text-secondary-text whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="px-5 py-3 font-bold text-brand-teal">
                      {log.action}
                    </td>

                    <td className="px-5 py-3 text-primary-text font-sans font-semibold">
                      {log.actor_username || 'System / Unauth'}
                    </td>

                    <td className="px-5 py-3 text-secondary-text">
                      {log.target_entity} #{log.target_id || '-'}
                    </td>

                    <td className="px-5 py-3 font-sans text-primary-text max-w-xs truncate">
                      {log.details || '—'}
                    </td>

                    <td className="px-5 py-3 text-secondary-text">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
