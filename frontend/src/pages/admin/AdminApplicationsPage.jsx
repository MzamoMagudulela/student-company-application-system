import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Award,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { adminApi, studentApi } from '@/services/api';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';

const ALLOWED_NEXT_STATUSES = {
  Submitted: ['Under Review', 'Rejected', 'Withdrawn'],
  'Under Review': ['Shortlisted', 'Additional Information Requested', 'Rejected', 'Withdrawn'],
  'Additional Information Requested': ['Under Review', 'Rejected', 'Withdrawn'],
  Shortlisted: ['Interview', 'Offered', 'Rejected', 'Withdrawn'],
  Interview: ['Offered', 'Rejected', 'Withdrawn'],
  Offered: ['Accepted', 'Offer Declined', 'Offer Expired'],
  Accepted: [],
  'Offer Declined': [],
  'Offer Expired': [],
  Rejected: [],
  Withdrawn: [],
};

export default function AdminApplicationsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [newInternalNote, setNewInternalNote] = useState('');

  const { data: applications, isLoading } = useQuery({
    queryKey: ['admin-applications', searchTerm, statusFilter],
    queryFn: () =>
      adminApi.getApplications({
        q: searchTerm || undefined,
        status: statusFilter || undefined,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, newStatus, notes }) =>
      adminApi.updateApplicationStatus(id, { new_status: newStatus, notes }),
    onSuccess: () => {
      setSelectedApp(null);
      setStatusNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err) => alert(err.message || 'Status transition rejected.'),
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ id, noteText }) =>
      adminApi.addApplicationNote(id, { note_text: noteText, is_internal: true }),
    onSuccess: () => {
      setNewInternalNote('');
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
    },
  });

  const handleOpenStatusModal = (app) => {
    setSelectedApp(app);
    const allowed = ALLOWED_NEXT_STATUSES[app.status] || [];
    setTargetStatus(allowed[0] || app.status);
    setStatusNotes('');
  };

  const handleStatusSubmit = (e) => {
    e.preventDefault();
    if (!selectedApp || !targetStatus) return;
    updateStatusMutation.mutate({
      id: selectedApp.id,
      newStatus: targetStatus,
      notes: statusNotes,
    });
  };

  const handleDownloadCV = async (cvId, filename) => {
    try {
      const blob = await studentApi.downloadCV(cvId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Unable to download candidate CV.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
          Application Assessment & Review
        </h1>
        <p className="text-xs sm:text-sm text-secondary-text mt-1">
          Review candidate submissions, examine CV readiness, transition hiring stages, and issue formal offers.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-xl border border-border-color bg-surface shadow-xs grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by candidate name, reference number, or position..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <div className="md:col-span-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
          >
            <option value="">All Application Stages</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interview">Interview</option>
            <option value="Offered">Offered</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Data Table */}
      <div className="rounded-xl border border-border-color bg-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-primary-text">
            <thead className="bg-surface-secondary/50 border-b border-border-color font-semibold uppercase text-[10px] text-secondary-text">
              <tr>
                <th className="px-5 py-3">Reference & Date</th>
                <th className="px-5 py-3">Candidate</th>
                <th className="px-5 py-3">Opportunity</th>
                <th className="px-5 py-3">Current Stage</th>
                <th className="px-5 py-3">CV Attached</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-secondary-text">
                    Loading applications...
                  </td>
                </tr>
              ) : applications?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-secondary-text">
                    No applications found matching your criteria.
                  </td>
                </tr>
              ) : (
                applications?.map((app) => (
                  <tr key={app.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-brand-teal block">
                        {app.reference_number}
                      </span>
                      <span className="text-[10px] text-secondary-text">
                        {new Date(app.submitted_at).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="font-bold text-primary-text">
                        Candidate #{app.student_id}
                      </p>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-primary-text">{app.opportunity?.title}</p>
                      <p className="text-[10px] text-secondary-text">{app.opportunity?.company_name}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <StatusBadge status={app.status} size="xs" />
                    </td>

                    <td className="px-5 py-3.5">
                      {app.submitted_cv_id ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadCV(app.submitted_cv_id, `CV_${app.reference_number}.pdf`)}
                          className="font-bold text-brand-teal hover:underline text-[11px]"
                        >
                          Download CV
                        </button>
                      ) : (
                        <span className="text-secondary-text text-[11px]">No CV</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(app)}
                        className="px-2.5 py-1 rounded border border-border-color hover:bg-surface-secondary text-[11px] font-semibold transition-colors"
                      >
                        Update Stage
                      </button>

                      {['Shortlisted', 'Interview'].includes(app.status) && (
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/offers?appId=${app.id}`)}
                          className="px-2.5 py-1 rounded bg-brand-teal text-white text-[11px] font-bold shadow-xs hover:bg-brand-teal-hover transition-colors"
                        >
                          Issue Offer
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stage Transition Modal */}
      {selectedApp && (
        <Modal
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title={`Update Application Stage: ${selectedApp.reference_number}`}
        >
          <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl border border-border-color bg-surface-secondary/40">
              <p><strong>Position:</strong> {selectedApp.opportunity?.title}</p>
              <p><strong>Current Stage:</strong> <StatusBadge status={selectedApp.status} size="xs" /></p>
            </div>

            <div>
              <label className="block font-semibold text-primary-text mb-1">
                Select Allowed Next Stage *
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
              >
                {(ALLOWED_NEXT_STATUSES[selectedApp.status] || []).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-primary-text mb-1">
                Stage Transition Note / Candidate Feedback
              </label>
              <textarea
                rows={3}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Candidate will receive this feedback note in their portal..."
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t border-border-color flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded-lg border border-border-color text-xs text-secondary-text hover:text-primary-text"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateStatusMutation.isPending || !targetStatus}
                className="px-5 py-2 rounded-lg bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 font-bold text-xs shadow-md hover:opacity-95 disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? 'Transitioning...' : 'Confirm Stage Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
