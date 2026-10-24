import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Award,
  FileCheck,
  Send,
  Check,
} from 'lucide-react';
import { studentApi } from '@/services/api';

export default function StudentNotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['student-notifications'],
    queryFn: () => studentApi.getNotifications(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => studentApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-stats'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => studentApi.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-stats'] });
    },
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'offer':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'cv_doctor':
        return <FileCheck className="w-4 h-4 text-brand-teal" />;
      case 'application':
      case 'application_status':
        return <Send className="w-4 h-4 text-blue-500" />;
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      default:
        return <Bell className="w-4 h-4 text-brand-teal" />;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
            Notifications & Milestones
          </h1>
          <p className="text-xs sm:text-sm text-secondary-text mt-1">
            Real-time status updates, application reviews, and diagnostic readiness alerts.
          </p>
        </div>

        {notifications?.some((n) => !n.is_read) && (
          <button
            type="button"
            onClick={() => markAllReadMutation.mutate()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border-color bg-surface hover:bg-surface-secondary text-primary-text text-xs font-semibold shadow-xs transition-colors"
          >
            <Check className="w-3.5 h-3.5 text-brand-teal" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-4 rounded-xl border border-border-color bg-surface animate-pulse h-20" />
          ))}
        </div>
      ) : notifications?.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-border-color bg-surface">
          <Bell className="w-10 h-10 text-secondary-text mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-bold text-primary-text">No notifications yet</h3>
          <p className="text-xs text-secondary-text mt-1 max-w-sm mx-auto">
            You will receive updates here as your applications progress through recruitment stages.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications?.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                notif.is_read
                  ? 'border-border-color bg-surface opacity-80'
                  : 'border-brand-teal/40 bg-brand-teal/5 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-surface border border-border-color shrink-0 mt-0.5">
                  {getCategoryIcon(notif.category)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-primary-text">{notif.title}</h3>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-brand-teal shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-secondary-text mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-secondary-text mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                    {notif.link && (
                      <Link
                        to={notif.link}
                        onClick={() => {
                          if (!notif.is_read) markReadMutation.mutate(notif.id);
                        }}
                        className="font-bold text-brand-teal hover:underline flex items-center gap-0.5"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {!notif.is_read && (
                <button
                  type="button"
                  onClick={() => markReadMutation.mutate(notif.id)}
                  className="text-[11px] font-semibold text-secondary-text hover:text-brand-teal shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
