import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Award,
  Download,
  Plus,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { adminApi, studentApi } from '@/services/api';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';

export default function AdminOffersPage() {
  const [searchParams] = useSearchParams();
  const preselectedAppId = searchParams.get('appId');
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetAppId, setTargetAppId] = useState(preselectedAppId || '');
  const [responseDeadline, setResponseDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [salaryStipend, setSalaryStipend] = useState('R12,500 - R15,000 per month standard graduate stipend');
  const [terms, setTerms] = useState(
    '1. 12-Month structured internship / appointment programme.\n' +
    '2. Assigned executive technical mentor and bi-weekly competency reviews.\n' +
    '3. Comprehensive health, workplace safety, and professional development support.\n' +
    '4. Must formalize acceptance via the MYDC portal before response deadline.'
  );

  const { data: applications } = useQuery({
    queryKey: ['admin-applications-shortlisted'],
    queryFn: () => adminApi.getApplications(),
  });

  useEffect(() => {
    if (preselectedAppId) {
      setTargetAppId(preselectedAppId);
      setIsModalOpen(true);
    }
  }, [preselectedAppId]);

  const issueOfferMutation = useMutation({
    mutationFn: ({ appId, payload }) => adminApi.issueOffer(appId, payload),
    onSuccess: () => {
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      alert('Formal offer letter successfully issued and PDF rendered!');
    },
    onError: (err) => alert(err.message || 'Failed to issue offer letter.'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetAppId || !responseDeadline) return;

    issueOfferMutation.mutate({
      appId: parseInt(targetAppId, 10),
      payload: {
        response_deadline: new Date(responseDeadline).toISOString(),
        start_date: startDate ? new Date(startDate).toISOString() : undefined,
        terms_and_conditions: terms,
        salary_stipend: salaryStipend,
      },
    });
  };

  const handleDownloadPDF = async (offerId, ref) => {
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
    }
  };

  // Find applications that already have an offer
  const appsWithOffers = applications?.filter((a) => a.offer) || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
            Offer Letters & Appointments
          </h1>
          <p className="text-xs sm:text-sm text-secondary-text mt-1">
            Generate formal, enterprise-grade PDF offer letters rendered by our ReportLab engine.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-teal text-white text-xs font-bold shadow-md hover:bg-brand-teal-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Issue New Offer Letter</span>
        </button>
      </div>

      {/* Issued Offers List */}
      <div className="space-y-4">
        {appsWithOffers.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-border-color bg-surface">
            <Award className="w-10 h-10 text-secondary-text mx-auto mb-3 opacity-40" />
            <h3 className="text-sm font-bold text-primary-text">No offer letters generated yet</h3>
            <p className="text-xs text-secondary-text mt-1 max-w-sm mx-auto">
              Select shortlisted or interviewed candidates to issue formal appointment offers.
            </p>
          </div>
        ) : (
          appsWithOffers.map((app) => (
            <div
              key={app.id}
              className="p-5 rounded-xl border border-border-color bg-surface shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border-color">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-brand-teal text-xs">
                      {app.offer?.offer_reference}
                    </span>
                    <StatusBadge status={app.offer?.status} size="xs" />
                  </div>
                  <h3 className="text-sm font-bold text-primary-text mt-0.5">
                    Position: {app.opportunity?.title} ({app.opportunity?.company_name})
                  </h3>
                  <p className="text-xs text-secondary-text">
                    Issued: {new Date(app.offer?.issue_date).toLocaleDateString()} &bull; Candidate Ref: {app.reference_number}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadPDF(app.offer.id, app.offer.offer_reference)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-color bg-surface hover:bg-surface-secondary text-primary-text text-xs font-semibold shadow-xs transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Offer PDF</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-secondary-text block">Response Deadline:</span>
                  <span className="font-bold text-rose-500">
                    {new Date(app.offer?.response_deadline).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-secondary-text block">Commencement Date:</span>
                  <span className="font-semibold text-primary-text">
                    {app.offer?.start_date ? new Date(app.offer.start_date).toLocaleDateString() : 'Mutual agreement'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Issue Offer Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Generate Official Offer Letter"
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-primary-text mb-1">
                Select Candidate Application *
              </label>
              <select
                required
                value={targetAppId}
                onChange={(e) => setTargetAppId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
              >
                <option value="">-- Choose Candidate --</option>
                {applications?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.reference_number} — {a.opportunity?.title} ({a.opportunity?.company_name}) [Stage: {a.status}]
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-primary-text mb-1">
                  Response Deadline *
                </label>
                <input
                  type="date"
                  required
                  value={responseDeadline}
                  onChange={(e) => setResponseDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-primary-text mb-1">
                  Commencement / Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-primary-text mb-1">
                Remuneration / Stipend Terms
              </label>
              <input
                type="text"
                value={salaryStipend}
                onChange={(e) => setSalaryStipend(e.target.value)}
                placeholder="e.g. Competitive market stipend"
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-primary-text mb-1">
                Official Appointment Terms & Conditions *
              </label>
              <textarea
                rows={4}
                required
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t border-border-color flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-border-color text-xs text-secondary-text hover:text-primary-text"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={issueOfferMutation.isPending || !targetAppId || !responseDeadline}
                className="px-5 py-2 rounded-lg bg-brand-teal text-white font-bold text-xs shadow-md hover:bg-brand-teal-hover disabled:opacity-50"
              >
                {issueOfferMutation.isPending ? 'Generating PDF Offer...' : 'Render & Issue Offer Letter'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
