import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Building2,
  MapPin,
  Calendar,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { studentApi } from '@/services/api';

export default function SavedOpportunitiesPage() {
  const queryClient = useQueryClient();

  const { data: savedOpps, isLoading } = useQuery({
    queryKey: ['student-saved-opportunities'],
    queryFn: () => studentApi.getSavedOpportunities(),
  });

  const toggleSaveMutation = useMutation({
    mutationFn: (id) => studentApi.toggleSaveOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-saved-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['student-opportunities'] });
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
          Saved Opportunities
        </h1>
        <p className="text-xs sm:text-sm text-secondary-text mt-1">
          Bookmark promising internships, learnerships, and graduate programmes to apply before the closing deadline.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((n) => (
            <div key={n} className="p-6 rounded-xl border border-border-color bg-surface animate-pulse h-40" />
          ))}
        </div>
      ) : savedOpps?.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-border-color bg-surface">
          <Bookmark className="w-10 h-10 text-secondary-text mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-bold text-primary-text">No saved opportunities</h3>
          <p className="text-xs text-secondary-text mt-1 max-w-sm mx-auto">
            Browse our verified employer listings and click the bookmark icon to save roles here.
          </p>
          <Link
            to="/student/opportunities"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-teal text-white text-xs font-bold shadow-xs hover:bg-brand-teal-hover"
          >
            Explore Opportunities
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedOpps?.map((opp) => (
            <div
              key={opp.id}
              className="p-6 rounded-xl border border-border-color bg-surface hover:border-brand-teal/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-teal/10 text-brand-teal">
                    {opp.opportunity_type.replace('_', ' ')}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSaveMutation.mutate(opp.id)}
                    className="p-1.5 rounded-lg text-secondary-text hover:text-rose-500"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-sm font-bold text-primary-text">{opp.title}</h3>

                <div className="flex items-center gap-3 text-xs text-secondary-text mt-1.5">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {opp.company_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {opp.location}
                  </span>
                </div>

                <p className="text-xs text-secondary-text line-clamp-2 mt-2 leading-relaxed">
                  {opp.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border-color flex items-center justify-between text-xs">
                <span className="text-[11px] text-secondary-text flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Closes: {new Date(opp.closing_date).toLocaleDateString()}
                </span>

                <Link
                  to={`/student/opportunities?apply=${opp.id}`}
                  className="px-3.5 py-1.5 rounded-lg bg-brand-teal text-white font-bold text-xs shadow-xs hover:bg-brand-teal-hover flex items-center gap-1"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
