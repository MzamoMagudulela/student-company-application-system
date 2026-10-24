import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Lock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  GraduationCap,
} from 'lucide-react';
import { adminApi } from '@/services/api';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';

export default function AdminStudentsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [targetStatus, setTargetStatus] = useState('active');
  const [statusReason, setStatusReason] = useState('');

  const { data: students, isLoading } = useQuery({
    queryKey: ['admin-students', searchTerm, statusFilter],
    queryFn: () =>
      adminApi.getStudents({
        q: searchTerm || undefined,
        status: statusFilter || undefined,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, status, reason }) =>
      adminApi.updateStudentStatus(userId, status, reason),
    onSuccess: () => {
      setSelectedStudent(null);
      setStatusReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err) => {
      alert(err.message || 'Failed to update student status.');
    },
  });

  const handleStatusSubmit = (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    updateStatusMutation.mutate({
      userId: selectedStudent.user_id,
      status: targetStatus,
      reason: statusReason,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
          Student Member Management
        </h1>
        <p className="text-xs sm:text-sm text-secondary-text mt-1">
          Review candidate profiles, inspect application metrics, and enforce security account statuses.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-border-color bg-surface shadow-xs grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, username, institution, or email..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <div className="md:col-span-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
          >
            <option value="">All Account Statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="locked">Locked</option>
            <option value="pending_verification">Pending Verification</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="rounded-xl border border-border-color bg-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-primary-text">
            <thead className="bg-surface-secondary/50 border-b border-border-color font-semibold uppercase text-[10px] text-secondary-text">
              <tr>
                <th className="px-5 py-3">Student Name / Username</th>
                <th className="px-5 py-3">Email & Contact</th>
                <th className="px-5 py-3">Institution & Field</th>
                <th className="px-5 py-3">Profile Completion</th>
                <th className="px-5 py-3">Applications</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-secondary-text">
                    Loading student records...
                  </td>
                </tr>
              ) : students?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-secondary-text">
                    No student accounts found matching your query.
                  </td>
                </tr>
              ) : (
                students?.map((stu) => (
                  <tr key={stu.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-primary-text">
                        {stu.first_name} {stu.last_name}
                      </p>
                      <span className="text-[10px] text-secondary-text font-mono">
                        @{stu.username}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-secondary-text">
                      <p>{stu.email}</p>
                      {stu.phone_number && <p className="text-[10px]">{stu.phone_number}</p>}
                    </td>

                    <td className="px-5 py-3.5 text-secondary-text">
                      <p className="font-medium text-primary-text">{stu.field_of_study || 'N/A'}</p>
                      <p className="text-[10px]">{stu.institution || 'No institution set'}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-teal">{stu.profile_completion_pct}%</span>
                        <div className="w-16 bg-surface-secondary h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-teal h-full rounded-full"
                            style={{ width: `${stu.profile_completion_pct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-bold">
                      {stu.applications_count}
                    </td>

                    <td className="px-5 py-3.5">
                      <StatusBadge status={stu.account_status} size="xs" />
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudent(stu);
                          setTargetStatus(stu.account_status);
                        }}
                        className="px-2.5 py-1 rounded border border-border-color hover:bg-surface-secondary text-[11px] font-semibold transition-colors"
                      >
                        Manage Status
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Status Management Modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={`Manage Account Status: ${selectedStudent.username}`}
        >
          <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
            <p className="text-secondary-text">
              Configure account standing for candidate <strong>{selectedStudent.first_name} {selectedStudent.last_name}</strong>.
            </p>

            <div>
              <label className="block font-semibold text-primary-text mb-1">Select Status</label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
              >
                <option value="active">Active (Normal Access)</option>
                <option value="disabled">Disabled (Administrative Lockout)</option>
                <option value="locked">Locked (Security Lockout)</option>
                <option value="pending_verification">Pending Verification</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-primary-text mb-1">
                Reason / Internal Audit Note <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Document the justification for this administrative status change..."
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t border-border-color flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-lg border border-border-color text-xs text-secondary-text hover:text-primary-text"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateStatusMutation.isPending || !statusReason.trim()}
                className="px-5 py-2 rounded-lg bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 font-bold text-xs shadow-md hover:opacity-95 disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update & Log Action'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
