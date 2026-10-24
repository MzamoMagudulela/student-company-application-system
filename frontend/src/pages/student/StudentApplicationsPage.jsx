import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Send,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { studentApi } from '@/services/api';
import StatusBadge from '@/components/ui/StatusBadge';

export default function StudentApplicationsPage() {
  const [expandedAppId, setExpandedAppId] = useState(null);

  const { data: applications, isLoading } = useQuery({
    queryKey: ['student-applications'],
    queryFn: () => studentApi.getApplications(),
  });

  const toggleExpand = (id) => {
    setExpandedAppId(expandedAppId === id ? null : id);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
          My Applications
        </h1>
        <p className="text-xs sm:text-sm text-secondary-text mt-1">
          Review genuine stage progressions, authorized feedback, and submission histories.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-6 rounded-xl border border-border-color bg-surface animate-pulse h-28" />
          ))}
        </div>
      ) : applications?.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-border-color bg-surface">
          <Send className="w-10 h-10 text-secondary-text mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-bold text-primary-text">No applications recorded</h3>
          <p className="text-xs text-secondary-text mt-1 max-w-sm mx-auto">
            You haven't submitted any internship applications yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications?.map((app) => {
            const isExpanded = expandedAppId === app.id;
            return (
              <div
                key={app.id}
                className="rounded-xl border border-border-color bg-surface overflow-hidden shadow-xs transition-all"
              >
                <div
                  onClick={() => toggleExpand(app.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-surface-secondary/30 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-teal">
                        {app.reference_number}
                      </span>
                      <span className="text-[11px] text-secondary-text">
                        &bull; Submitted {new Date(app.submitted_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-primary-text mt-1">
                      {app.opportunity?.title}
                    </h3>

                    <p className="text-xs text-secondary-text flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-secondary-text" />
                      {app.opportunity?.company_name} ({app.opportunity?.location})
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <StatusBadge status={app.status} size="sm" />
                    <button
                      type="button"
                      className="p-1 text-secondary-text hover:text-primary-text"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details & Stage History Timeline */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-border-color bg-surface-secondary/20 space-y-5 animate-in fade-in duration-150">
                    {/* Status History Timeline */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary-text mb-3">
                        Status Transition Timeline
                      </h4>

                      <div className="space-y-3 pl-2 border-l-2 border-brand-teal/40 ml-2">
                        {app.status_history?.map((hist, idx) => (
                          <div key={idx} className="relative pl-4 text-xs">
                            <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-brand-teal ring-4 ring-surface" />
                            <div className="flex items-center gap-2">
                              <StatusBadge status={hist.to_status} size="xs" />
                              <span className="text-[10px] text-secondary-text">
                                {new Date(hist.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {hist.notes && (
                              <p className="text-[11px] text-secondary-text mt-1 italic">
                                "{hist.notes}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Submitted Responses */}
                    {app.question_responses && Object.keys(app.question_responses).length > 0 && (
                      <div className="p-3.5 rounded-lg border border-border-color bg-surface text-xs space-y-1.5">
                        <span className="font-semibold text-primary-text block">Candidate Responses:</span>
                        {Object.entries(app.question_responses).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-[11px]">
                            <span className="text-secondary-text capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="font-medium text-primary-text">{String(v) || 'N/A'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
