import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Building2,
  MapPin,
  Calendar,
  Bookmark,
  ArrowRight,
  ArrowLeft,
  Check,
  Send,
  AlertCircle,
  Clock,
  Sparkles,
  FileText,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { opportunitiesApi, studentApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';

export default function StudentOpportunitiesPage() {
  const [searchParams] = useSearchParams();
  const applyParam = searchParams.get('apply');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [activeApplyOpp, setActiveApplyOpp] = useState(null);

  // Multi-step Application Wizard State
  const [appStep, setAppStep] = useState(1);
  const [selectedCvId, setSelectedCvId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [questionAnswers, setQuestionAnswers] = useState({
    availability: 'Immediate / Within 2 weeks',
    relocation: 'Yes, willing to relocate or work hybrid',
    portfolioUrl: '',
  });
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['student-opportunities', searchTerm, selectedType],
    queryFn: () =>
      opportunitiesApi.getPublicList({
        q: searchTerm || undefined,
        opportunity_type: selectedType || undefined,
      }),
  });

  const { data: cvs } = useQuery({
    queryKey: ['student-cvs'],
    queryFn: () => studentApi.getCVs(),
  });

  const { data: profile } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => studentApi.getProfile(),
  });

  useEffect(() => {
    if (cvs?.length > 0 && !selectedCvId) {
      const primary = cvs.find((c) => c.is_primary) || cvs[0];
      setSelectedCvId(primary.id);
    }
  }, [cvs, selectedCvId]);

  useEffect(() => {
    if (applyParam && opportunities) {
      const target = opportunities.find((o) => o.id === parseInt(applyParam, 10));
      if (target) {
        startApplication(target);
      }
    }
  }, [applyParam, opportunities]);

  const toggleSaveMutation = useMutation({
    mutationFn: (id) => studentApi.toggleSaveOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['student-saved-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-stats'] });
    },
  });

  const submitAppMutation = useMutation({
    mutationFn: (payload) => studentApi.submitApplication(payload),
    onSuccess: (data) => {
      setSubmissionSuccess(data);
      queryClient.invalidateQueries({ queryKey: ['student-applications'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['student-opportunities'] });
    },
    onError: (err) => {
      setSubmissionError(err.message || 'Application submission failed.');
    },
  });

  const startApplication = (opp) => {
    setActiveApplyOpp(opp);
    setAppStep(1);
    setSubmissionError('');
    setSubmissionSuccess(null);
    setDeclarationAccepted(false);
  };

  const handleFinalSubmit = () => {
    if (!declarationAccepted) {
      setSubmissionError('You must confirm the applicant declaration.');
      return;
    }
    setSubmissionError('');
    submitAppMutation.mutate({
      opportunity_id: activeApplyOpp.id,
      submitted_cv_id: selectedCvId ? parseInt(selectedCvId, 10) : undefined,
      cover_letter: coverLetter,
      question_responses: questionAnswers,
      declaration_accepted: true,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
          Browse Verified Opportunities
        </h1>
        <p className="text-xs sm:text-sm text-secondary-text mt-1">
          Apply directly to accredited employer programmes with your structured profile and CV Doctor document.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl border border-border-color bg-surface shadow-sm grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by job title or keyword..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <div className="md:col-span-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
          >
            <option value="">All Opportunity Types</option>
            <option value="internship">Internship</option>
            <option value="graduate_programme">Graduate Programme</option>
            <option value="learnership">Learnership</option>
            <option value="entry_level">Entry Level</option>
          </select>
        </div>
      </div>

      {/* Opportunities List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="p-6 rounded-xl border border-border-color bg-surface animate-pulse h-48" />
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
                  <button
                    type="button"
                    onClick={() => toggleSaveMutation.mutate(opp.id)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      opp.is_saved
                        ? 'border-brand-teal text-brand-teal bg-brand-teal/10'
                        : 'border-border-color text-secondary-text hover:text-primary-text'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${opp.is_saved ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <h3 className="text-sm font-bold text-primary-text group-hover:text-brand-teal transition-colors">
                  {opp.title}
                </h3>

                <div className="flex items-center gap-3 text-xs text-secondary-text mt-1.5">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {opp.company_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {opp.location} ({opp.location_type})
                  </span>
                </div>

                <p className="text-xs text-secondary-text line-clamp-2 mt-3 leading-relaxed">
                  {opp.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border-color flex items-center justify-between text-xs">
                <span className="text-[11px] text-secondary-text flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Closes: {new Date(opp.closing_date).toLocaleDateString()}
                </span>

                {opp.has_applied ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Applied</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => startApplication(opp)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-teal text-white font-bold text-xs shadow-xs hover:bg-brand-teal-hover transition-colors"
                  >
                    <span>Apply</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Multi-Step Application Modal */}
      {activeApplyOpp && (
        <Modal
          isOpen={!!activeApplyOpp}
          onClose={() => setActiveApplyOpp(null)}
          title={`Application: ${activeApplyOpp.title}`}
          maxWidth="max-w-2xl"
        >
          {submissionSuccess ? (
            <div className="text-center py-6 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-primary-text">
                Application Submitted Successfully!
              </h3>
              <p className="text-xs text-secondary-text max-w-md mx-auto leading-relaxed">
                Your application for <strong>{activeApplyOpp.title}</strong> at {activeApplyOpp.company_name} was saved. Reference:
              </p>
              <div className="inline-block p-2.5 rounded-lg bg-surface-secondary border border-border-color font-mono font-bold text-sm text-brand-teal">
                {submissionSuccess.reference_number}
              </div>
              <p className="text-[11px] text-secondary-text">
                You can track status updates and feedback in your Applications portal.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveApplyOpp(null)}
                  className="px-4 py-2 rounded-lg border border-border-color text-xs font-medium text-secondary-text hover:text-primary-text"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveApplyOpp(null);
                    navigate('/student/applications');
                  }}
                  className="px-4 py-2 rounded-lg bg-brand-teal text-white text-xs font-bold shadow-md hover:bg-brand-teal-hover"
                >
                  View My Applications
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stepper Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border-color text-xs">
                <span className="font-bold text-primary-text">
                  Step {appStep} of 6:{' '}
                  {appStep === 1 && 'Confirm Personal Details'}
                  {appStep === 2 && 'Confirm Qualifications'}
                  {appStep === 3 && 'Select CV Document'}
                  {appStep === 4 && 'Opportunity Questions'}
                  {appStep === 5 && 'Review Submission'}
                  {appStep === 6 && 'Declaration & Submit'}
                </span>
                <span className="text-[11px] text-secondary-text font-mono">
                  {Math.round((appStep / 6) * 100)}% Complete
                </span>
              </div>

              {submissionError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submissionError}</span>
                </div>
              )}

              {/* STEP 1: Personal Details */}
              {appStep === 1 && (
                <div className="space-y-3 text-xs">
                  <p className="text-secondary-text">
                    Verify that your contact credentials are accurate before proceeding:
                  </p>
                  <div className="p-4 rounded-xl border border-border-color bg-surface-secondary/40 space-y-2">
                    <p><strong>Candidate:</strong> {profile?.first_name} {profile?.last_name}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>Phone:</strong> {user?.phone_number || 'Not provided'}</p>
                    <p><strong>Location:</strong> {profile?.location || 'South Africa'}</p>
                  </div>
                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => setAppStep(2)}
                      className="px-5 py-2 rounded-lg bg-brand-teal text-white font-bold text-xs flex items-center gap-1 shadow-sm hover:bg-brand-teal-hover"
                    >
                      <span>Confirm & Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Qualifications & Skills */}
              {appStep === 2 && (
                <div className="space-y-3 text-xs">
                  <p className="text-secondary-text">
                    Review your academic qualification and competencies for this role:
                  </p>
                  <div className="p-4 rounded-xl border border-border-color bg-surface-secondary/40 space-y-2">
                    <p><strong>Institution:</strong> {profile?.institution || 'Tertiary Institution'}</p>
                    <p><strong>Qualification:</strong> {profile?.field_of_study || 'Degree / Diploma'}</p>
                    <p><strong>Graduation Year:</strong> {profile?.graduation_year || 'Current'}</p>
                    <div>
                      <strong>Skills:</strong>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {profile?.skills?.map((s, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border-color">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setAppStep(1)}
                      className="px-4 py-2 rounded-lg border border-border-color text-xs font-medium"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppStep(3)}
                      className="px-5 py-2 rounded-lg bg-brand-teal text-white font-bold text-xs flex items-center gap-1 shadow-sm hover:bg-brand-teal-hover"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CV Selection */}
              {appStep === 3 && (
                <div className="space-y-3 text-xs">
                  <p className="text-secondary-text">
                    Select which uploaded CV document to attach to this application:
                  </p>
                  {cvs?.length === 0 ? (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs">
                      No CV document uploaded yet. Please upload a CV in CV Doctor first.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cvs?.map((cv) => (
                        <label
                          key={cv.id}
                          className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                            selectedCvId === cv.id
                              ? 'border-brand-teal bg-brand-teal/10 shadow-xs'
                              : 'border-border-color bg-surface'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="cv_select"
                              checked={selectedCvId === cv.id}
                              onChange={() => setSelectedCvId(cv.id)}
                              className="text-brand-teal focus:ring-brand-teal"
                            />
                            <div>
                              <p className="font-bold text-primary-text">{cv.filename}</p>
                              <p className="text-[10px] text-secondary-text">
                                Uploaded {new Date(cv.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {cv.is_primary && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-brand-teal text-white font-bold">
                              Primary
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setAppStep(2)}
                      className="px-4 py-2 rounded-lg border border-border-color text-xs font-medium"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppStep(4)}
                      className="px-5 py-2 rounded-lg bg-brand-teal text-white font-bold text-xs flex items-center gap-1 shadow-sm hover:bg-brand-teal-hover"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Opportunity Questions & Cover Note */}
              {appStep === 4 && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-primary-text mb-1">
                      Earliest Availability Date
                    </label>
                    <input
                      type="text"
                      value={questionAnswers.availability}
                      onChange={(e) => setQuestionAnswers({ ...questionAnswers, availability: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-primary-text mb-1">
                      Portfolio / GitHub Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={questionAnswers.portfolioUrl}
                      onChange={(e) => setQuestionAnswers({ ...questionAnswers, portfolioUrl: e.target.value })}
                      placeholder="https://github.com/username"
                      className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-primary-text mb-1">
                      Brief Motivation / Cover Note
                    </label>
                    <textarea
                      rows={3}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Why are you a great match for this role?"
                      className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setAppStep(3)}
                      className="px-4 py-2 rounded-lg border border-border-color text-xs font-medium"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppStep(5)}
                      className="px-5 py-2 rounded-lg bg-brand-teal text-white font-bold text-xs flex items-center gap-1 shadow-sm hover:bg-brand-teal-hover"
                    >
                      <span>Review Application</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: Review All Details */}
              {appStep === 5 && (
                <div className="space-y-3 text-xs">
                  <p className="text-secondary-text">
                    Review your complete submission summary before final declaration:
                  </p>
                  <div className="p-4 rounded-xl border border-border-color bg-surface-secondary/40 space-y-2">
                    <p><strong>Position:</strong> {activeApplyOpp.title} ({activeApplyOpp.company_name})</p>
                    <p><strong>Candidate:</strong> {profile?.first_name} {profile?.last_name} ({user?.email})</p>
                    <p><strong>Attached CV ID:</strong> #{selectedCvId || 'Primary'}</p>
                    <p><strong>Availability:</strong> {questionAnswers.availability}</p>
                    {coverLetter && <p><strong>Cover Note:</strong> {coverLetter}</p>}
                  </div>
                  <div className="flex justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setAppStep(4)}
                      className="px-4 py-2 rounded-lg border border-border-color text-xs font-medium"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppStep(6)}
                      className="px-5 py-2 rounded-lg bg-brand-teal text-white font-bold text-xs flex items-center gap-1 shadow-sm hover:bg-brand-teal-hover"
                    >
                      <span>Proceed to Declaration</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 6: Accept Declaration & Submit */}
              {appStep === 6 && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl border border-border-color bg-surface-secondary/40 text-secondary-text leading-relaxed space-y-2">
                    <p className="font-bold text-primary-text">Candidate Accuracy Declaration:</p>
                    <p>
                      I hereby certify that all information submitted in this application is accurate and true to the best of my knowledge. I understand that misrepresentation of academic credentials or qualifications will result in disqualification.
                    </p>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={declarationAccepted}
                      onChange={(e) => setDeclarationAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-border-color text-brand-teal focus:ring-brand-teal"
                    />
                    <span className="text-xs font-semibold text-primary-text">
                      I formally agree to this declaration and authorize Mzamo's Youth Development Company to submit my profile to the employer recruitment panel.
                    </span>
                  </label>

                  <div className="flex justify-between pt-4 border-t border-border-color">
                    <button
                      type="button"
                      onClick={() => setAppStep(5)}
                      className="px-4 py-2 rounded-lg border border-border-color text-xs font-medium"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalSubmit}
                      disabled={!declarationAccepted || submitAppMutation.isPending}
                      className="px-6 py-2.5 rounded-lg bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 font-bold text-xs flex items-center gap-2 shadow-md hover:opacity-95 disabled:opacity-50 transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitAppMutation.isPending ? 'Submitting to SQLite...' : 'Submit Final Application'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
