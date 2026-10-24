import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  MapPin,
  Building2,
  Calendar,
  Bookmark,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Layers,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import { opportunitiesApi, studentApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/ui/Modal';

export default function OpportunitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [selectedLocType, setSelectedLocType] = useState(searchParams.get('location_type') || '');
  const [sortBy, setSortBy] = useState('closing_date');
  const [selectedOpp, setSelectedOpp] = useState(null);

  // Comparison feature: select up to 3 opportunities
  const [compareList, setCompareList] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const { isAuthenticated, role } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: opportunities, isLoading, refetch } = useQuery({
    queryKey: ['opportunities', searchTerm, selectedType, selectedLocType, sortBy],
    queryFn: () =>
      opportunitiesApi.getPublicList({
        q: searchTerm || undefined,
        opportunity_type: selectedType || undefined,
        location_type: selectedLocType || undefined,
        sort_by: sortBy,
      }),
  });

  const toggleSaveMutation = useMutation({
    mutationFn: (id) => studentApi.toggleSaveOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['saved-opportunities'] });
    },
  });

  const handleSaveClick = (e, oppId) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    toggleSaveMutation.mutate(oppId);
  };

  const toggleCompare = (opp) => {
    if (compareList.some((item) => item.id === opp.id)) {
      setCompareList(compareList.filter((item) => item.id !== opp.id));
    } else {
      if (compareList.length >= 3) {
        alert('You can compare a maximum of 3 opportunities simultaneously.');
        return;
      }
      setCompareList([...compareList, opp]);
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
          Verified Opportunities Explorer
        </h1>
        <p className="text-xs sm:text-sm text-secondary-text mt-1 max-w-2xl">
          Discover vetted internships, graduate programmes, learnerships, and junior positions across South Africa.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl border border-border-color bg-surface shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by job title, company, or keyword..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>

          {/* Opportunity Type Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
            >
              <option value="">All Opportunity Types</option>
              <option value="internship">Internships</option>
              <option value="graduate_programme">Graduate Programmes</option>
              <option value="learnership">Learnerships</option>
              <option value="entry_level">Entry Level</option>
            </select>
          </div>

          {/* Location Type Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedLocType}
              onChange={(e) => setSelectedLocType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
            >
              <option value="">Any Location</option>
              <option value="on_site">On-Site</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
            >
              <option value="closing_date">Deadline (Earliest)</option>
              <option value="newest">Recently Added</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Sticky Pill Bar */}
      {compareList.length > 0 && (
        <div className="p-3 rounded-xl border border-brand-teal/40 bg-brand-teal/10 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-teal" />
            <span className="text-xs font-semibold text-primary-text">
              {compareList.length} opportunity selected for comparison
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCompareOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-brand-teal text-white text-xs font-bold shadow-sm hover:bg-brand-teal-hover transition-colors"
            >
              Compare Side-by-Side
            </button>
            <button
              type="button"
              onClick={() => setCompareList([])}
              className="p-1.5 rounded-lg text-secondary-text hover:text-primary-text"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Listings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="p-6 rounded-xl border border-border-color bg-surface animate-pulse h-48" />
          ))}
        </div>
      ) : opportunities?.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-border-color bg-surface">
          <Briefcase className="w-10 h-10 text-secondary-text mx-auto mb-3 opacity-50" />
          <h3 className="text-sm font-bold text-primary-text">No matching opportunities found</h3>
          <p className="text-xs text-secondary-text mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords, location filters, or opportunity types.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities?.map((opp) => {
            const isComparing = compareList.some((c) => c.id === opp.id);
            return (
              <div
                key={opp.id}
                onClick={() => setSelectedOpp(opp)}
                className={`p-6 rounded-xl border bg-surface hover:border-brand-teal/50 shadow-sm transition-all cursor-pointer flex flex-col justify-between group ${
                  isComparing ? 'ring-2 ring-brand-teal' : 'border-border-color'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-teal/10 text-brand-teal">
                      {opp.opportunity_type.replace('_', ' ')}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleSaveClick(e, opp.id)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        opp.is_saved
                          ? 'border-brand-teal text-brand-teal bg-brand-teal/10'
                          : 'border-border-color text-secondary-text hover:text-primary-text'
                      }`}
                      title={opp.is_saved ? 'Remove bookmark' : 'Bookmark opportunity'}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${opp.is_saved ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-primary-text group-hover:text-brand-teal transition-colors">
                    {opp.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-secondary-text mt-1.5">
                    <span className="flex items-center gap-1 font-medium">
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

                <div className="mt-5 pt-4 border-t border-border-color flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-secondary-text">
                    <Clock className="w-3 h-3" />
                    <span>Closes: {new Date(opp.closing_date).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompare(opp);
                      }}
                      className={`text-[11px] px-2 py-1 rounded border font-medium transition-colors ${
                        isComparing
                          ? 'bg-brand-teal text-white border-brand-teal'
                          : 'border-border-color text-secondary-text hover:text-primary-text'
                      }`}
                    >
                      {isComparing ? 'Comparing' : 'Compare'}
                    </button>

                    <span className="font-semibold text-brand-teal group-hover:underline flex items-center gap-1">
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Opportunity Detail Modal */}
      {selectedOpp && (
        <Modal
          isOpen={!!selectedOpp}
          onClose={() => setSelectedOpp(null)}
          title={selectedOpp.title}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border-color">
              <div>
                <p className="text-sm font-bold text-primary-text flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand-teal" />
                  {selectedOpp.company_name}
                </p>
                <p className="text-xs text-secondary-text flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedOpp.location} &bull;{' '}
                  <span className="uppercase font-semibold text-brand-teal">{selectedOpp.location_type}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-teal/10 text-brand-teal">
                  {selectedOpp.opportunity_type.replace('_', ' ')}
                </span>
                <p className="text-[11px] text-secondary-text mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Closing: {new Date(selectedOpp.closing_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary-text mb-2">Description</h4>
              <p className="text-xs text-secondary-text leading-relaxed whitespace-pre-line">
                {selectedOpp.description}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary-text mb-2">Requirements & Qualifications</h4>
              <p className="text-xs text-secondary-text leading-relaxed whitespace-pre-line">
                {selectedOpp.requirements}
              </p>
            </div>

            {selectedOpp.skills_required?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary-text mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedOpp.skills_required.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-lg border border-border-color bg-surface-secondary text-primary-text font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-xl border border-border-color bg-surface-secondary/40 text-[11px] text-secondary-text space-y-1">
              <div className="flex items-center justify-between">
                <span>Verification Status:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified by MYDC
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Application Channel:</span>
                <span className="font-semibold text-primary-text">
                  {selectedOpp.is_external ? 'External Partner Portal' : 'Direct System Application'}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-color">
              <button
                type="button"
                onClick={() => setSelectedOpp(null)}
                className="py-2 px-4 rounded-lg border border-border-color text-xs font-medium text-secondary-text hover:text-primary-text"
              >
                Close
              </button>

              {selectedOpp.is_external && selectedOpp.official_url ? (
                <a
                  href={selectedOpp.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 py-2 px-5 rounded-lg bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 text-xs font-bold shadow-md hover:opacity-95 transition-opacity"
                >
                  <span>Apply on Official Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : isAuthenticated ? (
                <Link
                  to={`/student/opportunities?apply=${selectedOpp.id}`}
                  className="flex items-center gap-1.5 py-2 px-5 rounded-lg bg-brand-teal text-white text-xs font-bold shadow-md hover:bg-brand-teal-hover transition-colors"
                >
                  <span>Apply Now via Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 py-2 px-5 rounded-lg bg-brand-teal text-white text-xs font-bold shadow-md hover:bg-brand-teal-hover transition-colors"
                >
                  <span>Sign In to Apply</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Side-by-Side Comparison Modal */}
      {isCompareOpen && (
        <Modal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          title="Opportunity Side-by-Side Comparison"
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            <p className="text-xs text-secondary-text">
              Comparing {compareList.length} positions across location, qualification requirements, deadlines, and required skills.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {compareList.map((opp) => (
                <div key={opp.id} className="p-4 rounded-xl border border-border-color bg-surface flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-teal/10 text-brand-teal">
                      {opp.opportunity_type.replace('_', ' ')}
                    </span>
                    <h4 className="text-sm font-bold text-primary-text mt-2">{opp.title}</h4>
                    <p className="text-xs text-secondary-text font-medium">{opp.company_name}</p>

                    <div className="my-3 py-2 border-y border-border-color space-y-1.5 text-xs">
                      <div>
                        <span className="text-secondary-text text-[11px] block">Location:</span>
                        <span className="text-primary-text font-medium">{opp.location} ({opp.location_type})</span>
                      </div>
                      <div>
                        <span className="text-secondary-text text-[11px] block">Closing Date:</span>
                        <span className="text-primary-text font-medium">{new Date(opp.closing_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-secondary-text text-[11px] block font-semibold uppercase">Requirements:</span>
                      <p className="text-xs text-primary-text line-clamp-4 leading-relaxed">{opp.requirements}</p>
                    </div>

                    <div className="mt-3">
                      <span className="text-secondary-text text-[11px] block font-semibold uppercase mb-1">Skills:</span>
                      <div className="flex flex-wrap gap-1">
                        {opp.skills_required?.map((s, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-secondary text-secondary-text">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border-color flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => toggleCompare(opp)}
                      className="text-[11px] text-rose-500 hover:underline"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCompareOpen(false);
                        setSelectedOpp(opp);
                      }}
                      className="text-xs font-bold text-brand-teal hover:underline"
                    >
                      View Details &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
