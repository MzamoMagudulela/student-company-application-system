import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Download,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { studentApi } from '@/services/api';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';

export default function StudentOffersPage() {
  const queryClient = useQueryClient();
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [responseAction, setResponseAction] = useState(null); // 'accept' | 'decline'
  const [responseNotes, setResponseNotes] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: offers, isLoading } = useQuery({
    queryKey: ['student-offers'],
    queryFn: () => studentApi.getOffers(),
  });

  const respondMutation = useMutation({
    mutationFn: ({ offerId, action, notes }) =>
      studentApi.respondToOffer(offerId, action, notes),
    onSuccess: () => {
      setSelectedOffer(null);
      setResponseAction(null);
      setResponseNotes('');
      queryClient.invalidateQueries({ queryKey: ['student-offers'] });
      queryClient.invalidateQueries({ queryKey: ['student-applications'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-stats'] });
    },
    onError: (err) => {
      alert(err.message || 'Failed to submit response.');
    },
  });

  const handleDownloadPDF = async (offerId, ref) => {
    setIsDownloading(true);
    try {
      const blob = await studentApi.downloadOfferPDF(offerId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Offer_Letter_${ref}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Failed to download offer PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDecisionSubmit = (e) => {
    e.preventDefault();
    if (!responseAction || !selectedOffer) return;
    respondMutation.mutate({
      offerId: selectedOffer.id,
      action: responseAction,
      notes: responseNotes,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
          My Formal Offers
        </h1>
        <p className="text-xs sm:text-sm text-secondary-text mt-1">
          Review official employment & internship offers, verify approved terms, download enterprise PDF offer documents, and submit your decision.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="p-6 rounded-xl border border-border-color bg-surface animate-pulse h-40" />
          ))}
        </div>
      ) : offers?.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-border-color bg-surface">
          <Award className="w-10 h-10 text-secondary-text mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-bold text-primary-text">No offers received yet</h3>
          <p className="text-xs text-secondary-text mt-1 max-w-sm mx-auto">
            Once employers review and approve your application, formal offer letters with legal terms and response deadlines will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers?.map((offer) => (
            <div
              key={offer.id}
              className="p-6 rounded-xl border border-border-color bg-surface shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-color">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-teal">
                      {offer.offer_reference}
                    </span>
                    <StatusBadge status={offer.status} size="xs" />
                  </div>
                  <h3 className="text-base font-bold text-primary-text mt-1">
                    Formal Appointment Offer
                  </h3>
                  <p className="text-xs text-secondary-text">
                    Issued on {new Date(offer.issue_date).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(offer.id, offer.offer_reference)}
                    disabled={isDownloading}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border-color bg-surface hover:bg-surface-secondary text-primary-text text-xs font-semibold transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Offer</span>
                  </button>

                  {offer.status === 'issued' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOffer(offer);
                        setResponseAction('accept');
                      }}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand-teal text-white text-xs font-bold shadow-xs hover:bg-brand-teal-hover transition-colors"
                    >
                      <span>Respond to Offer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Offer Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-secondary-text font-medium block">Response Deadline:</span>
                  <span className="text-rose-500 font-bold flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(offer.response_deadline).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-secondary-text font-medium block">Start Date:</span>
                  <span className="text-primary-text font-semibold mt-0.5 block">
                    {offer.start_date ? new Date(offer.start_date).toLocaleDateString() : 'To be mutually agreed'}
                  </span>
                </div>
              </div>

              {/* Terms & Conditions Summary */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-text block mb-1">
                  Terms & Conditions:
                </span>
                <p className="text-xs text-primary-text bg-surface-secondary/50 p-3.5 rounded-lg border border-border-color whitespace-pre-line leading-relaxed">
                  {offer.terms_and_conditions}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offer Response Modal */}
      {selectedOffer && (
        <Modal
          isOpen={!!selectedOffer}
          onClose={() => setSelectedOffer(null)}
          title={`Respond to Offer (${selectedOffer.offer_reference})`}
        >
          <form onSubmit={handleDecisionSubmit} className="space-y-4">
            <p className="text-xs text-secondary-text">
              Please indicate your formal decision regarding this appointment:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResponseAction('accept')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  responseAction === 'accept'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500'
                    : 'border-border-color bg-surface text-secondary-text hover:text-primary-text'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold">Accept Offer</span>
                </div>
                <p className="text-[10px] mt-1 text-secondary-text">Confirm acceptance and initiate onboarding</p>
              </button>

              <button
                type="button"
                onClick={() => setResponseAction('decline')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  responseAction === 'decline'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500'
                    : 'border-border-color bg-surface text-secondary-text hover:text-primary-text'
                }`}
              >
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold">Decline Offer</span>
                </div>
                <p className="text-[10px] mt-1 text-secondary-text">Politely decline this specific opportunity</p>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1">
                Candidate Note / Comments (Optional)
              </label>
              <textarea
                rows={3}
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                placeholder="Add any message or questions for the recruitment team..."
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t border-border-color flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedOffer(null)}
                className="px-4 py-2 rounded-lg border border-border-color text-xs text-secondary-text hover:text-primary-text"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={respondMutation.isPending || !responseAction}
                className={`px-5 py-2 rounded-lg text-white text-xs font-bold shadow-md transition-colors ${
                  responseAction === 'accept'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {respondMutation.isPending ? 'Recording Decision...' : `Confirm ${responseAction?.toUpperCase()}`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
