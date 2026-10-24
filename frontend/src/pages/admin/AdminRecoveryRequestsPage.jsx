import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { adminApi } from '@/services/api';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';

export default function AdminRecoveryRequestsPage() {
  const queryClient = useQueryClient();
  const [selectedReq, setSelectedReq] = useState(null);
  const [resolveAction, setResolveAction] = useState('approve_and_generate_token');
  const [resolveNotes, setResolveNotes] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);

  const { data: recoveryRequests, isLoading } = useQuery({
    queryKey: ['admin-recovery-requests'],
    queryFn: () => adminApi.getRecoveryRequests(),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, payload }) => adminApi.resolveRecoveryRequest(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-recovery-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      if (data.recovery_token) {
        setGeneratedToken(data.recovery_token);
      } else {
        setSelectedReq(null);
        setResolveNotes('');
      }
    },
    onError: (err) => alert(err.message || 'Action failed.'),
  });

  const handleResolveSubmit = (e) => {
    e.preventDefault();
    if (!selectedReq) return;
    resolveMutation.mutate({
      id: selectedReq.id,
      payload: {
        action: resolveAction,
        notes: resolveNotes || 'Identity verified through student card & registered phone confirmation',
      },
    });
  };

  const copyToken = () => {
    navigator.clipboard.writeText(generatedToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
          Administrator-Assisted Recovery Centre
        </h1>
        <p className="text-xs sm:text-sm text-secondary-text mt-1">
          Review identity restoration requests for students with forgotten emails or locked accounts.
        </p>
      </div>

      <div className="rounded-xl border border-border-color bg-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-primary-text">
            <thead className="bg-surface-secondary/50 border-b border-border-color font-semibold uppercase text-[10px] text-secondary-text">
              <tr>
                <th className="px-5 py-3">Request ID & Date</th>
                <th className="px-5 py-3">Candidate / Username</th>
                <th className="px-5 py-3">Recovery Method</th>
                <th className="px-5 py-3">Identifier Provided</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-secondary-text">
                    Loading requests...
                  </td>
                </tr>
              ) : recoveryRequests?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-secondary-text">
                    No recovery requests logged.
                  </td>
                </tr>
              ) : (
                recoveryRequests?.map((req) => (
                  <tr key={req.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-brand-teal">
                        REQ-{req.id}
                      </span>
                      <span className="text-[10px] text-secondary-text block">
                        {new Date(req.created_at).toLocaleString()}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="font-bold text-primary-text">
                        {req.username || 'Unmatched Identifier'}
                      </p>
                      {req.email && <p className="text-[10px] text-secondary-text">{req.email}</p>}
                    </td>

                    <td className="px-5 py-3.5 uppercase font-semibold text-[10px] text-brand-teal">
                      {req.method}
                    </td>

                    <td className="px-5 py-3.5 font-mono text-[11px] text-secondary-text">
                      {req.identifier_used || '—'}
                    </td>

                    <td className="px-5 py-3.5">
                      <StatusBadge status={req.status} size="xs" />
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {req.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReq(req);
                            setGeneratedToken('');
                            setResolveNotes('');
                          }}
                          className="px-2.5 py-1 rounded bg-brand-teal text-white text-[11px] font-bold shadow-xs hover:bg-brand-teal-hover transition-colors"
                        >
                          Resolve Request
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

      {/* Resolution Modal */}
      {selectedReq && (
        <Modal
          isOpen={!!selectedReq}
          onClose={() => setSelectedReq(null)}
          title={`Resolve Recovery Request #REQ-${selectedReq.id}`}
        >
          {generatedToken ? (
            <div className="space-y-4 text-xs animate-in fade-in">
              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 space-y-2">
                <p className="font-bold">Identity Verification Approved & Token Generated</p>
                <p className="text-[11px] leading-relaxed">
                  Provide this single-use recovery token to the verified student over an authenticated channel. Token is valid for 15 minutes.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-primary-text mb-1">Single-Use Recovery Token</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedToken}
                    className="flex-1 px-3 py-2 font-mono rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                  />
                  <button
                    type="button"
                    onClick={copyToken}
                    className="px-3 py-2 rounded-lg bg-brand-teal text-white text-xs font-bold flex items-center gap-1"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-border-color flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReq(null);
                    setGeneratedToken('');
                  }}
                  className="px-4 py-2 rounded-lg bg-brand-teal text-white text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl border border-border-color bg-surface-secondary/40 space-y-1">
                <p><strong>Candidate:</strong> {selectedReq.username || selectedReq.identifier_used}</p>
                <p><strong>Method:</strong> {selectedReq.method}</p>
              </div>

              <div>
                <label className="block font-semibold text-primary-text mb-1">Action Decision</label>
                <select
                  value={resolveAction}
                  onChange={(e) => setResolveAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                >
                  <option value="approve_and_generate_token">Approve & Issue 15-Minute Recovery Token</option>
                  <option value="reject">Reject (Unverified Identity)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-primary-text mb-1">
                  Verification Audit Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Document how identity was verified (e.g. Student ID number matching registration)..."
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-border-color flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 rounded-lg border border-border-color text-xs text-secondary-text hover:text-primary-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolveMutation.isPending}
                  className="px-5 py-2 rounded-lg bg-brand-teal text-white font-bold text-xs shadow-md hover:bg-brand-teal-hover"
                >
                  {resolveMutation.isPending ? 'Processing...' : 'Submit Decision'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
