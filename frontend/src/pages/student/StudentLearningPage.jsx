import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  Play,
  Clock,
  CheckCircle2,
  Circle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { studentApi } from '@/services/api';

export default function StudentLearningPage() {
  const queryClient = useQueryClient();
  const [activeVideo, setActiveVideo] = useState(null);

  const { data: learningModules, isLoading } = useQuery({
    queryKey: ['student-learning-progress'],
    queryFn: () => studentApi.getLearningProgress(),
  });

  const toggleMutation = useMutation({
    mutationFn: (resourceId) => studentApi.toggleLearningComplete(resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-learning-progress'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-stats'] });
    },
  });

  const completedCount = learningModules?.filter((m) => m.is_completed).length || 0;
  const totalCount = learningModules?.length || 1;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
          Career Learning Hub & Progress
        </h1>
        <p className="text-xs sm:text-sm text-secondary-text mt-1">
          Complete graduate preparation masterclasses and track your career education milestones.
        </p>
      </div>

      {/* Progress Bar Banner */}
      <div className="p-6 rounded-2xl glass-panel border border-border-color shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary-text">Modules Mastered</span>
            <span className="text-xs font-bold text-brand-teal px-2 py-0.5 rounded bg-brand-teal/10">
              {completedCount} of {totalCount} Completed ({progressPct}%)
            </span>
          </div>
          <p className="text-xs text-secondary-text mt-1">
            Complete all modules to unlock the "Continuous Learner" career milestone badge.
          </p>
        </div>
        <div className="w-full sm:w-48 bg-surface-secondary h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-brand-teal h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Video Player Modal/Inline view */}
      {activeVideo && (
        <div className="p-5 rounded-2xl glass-panel border border-border-color shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-brand-teal px-2 py-0.5 rounded bg-brand-teal/10">
                {activeVideo.category}
              </span>
              <h3 className="text-sm font-bold text-primary-text mt-1">{activeVideo.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveVideo(null)}
              className="text-xs text-secondary-text hover:text-primary-text font-medium"
            >
              Close Video &times;
            </button>
          </div>

          <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-900 shadow-inner">
            <iframe
              src={activeVideo.video_url.replace('watch?v=', 'embed/')}
              title={activeVideo.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-secondary-text max-w-xl leading-relaxed">
              {activeVideo.description}
            </p>
            <button
              type="button"
              onClick={() => toggleMutation.mutate(activeVideo.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
                activeVideo.is_completed
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-brand-teal text-white hover:bg-brand-teal-hover'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{activeVideo.is_completed ? 'Marked Completed' : 'Mark as Completed'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modules List */}
      <div className="space-y-3">
        {learningModules?.map((mod) => (
          <div
            key={mod.id}
            className={`p-4 sm:p-5 rounded-xl border bg-surface transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              mod.is_completed ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20' : 'border-border-color'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-teal/10 text-brand-teal">
                  {mod.category}
                </span>
                <span className="text-[11px] text-secondary-text flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {mod.duration_minutes} mins
                </span>
                {mod.is_completed && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </span>
                )}
              </div>

              <h3 className="text-xs sm:text-sm font-bold text-primary-text">
                {mod.title}
              </h3>

              <p className="text-xs text-secondary-text mt-1 line-clamp-2 leading-relaxed">
                {mod.description}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => toggleMutation.mutate(mod.id)}
                className={`p-2 rounded-lg border text-xs transition-colors ${
                  mod.is_completed
                    ? 'border-emerald-300 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                    : 'border-border-color text-secondary-text hover:text-primary-text'
                }`}
                title={mod.is_completed ? 'Mark uncompleted' : 'Mark completed'}
              >
                {mod.is_completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveVideo(mod)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-teal text-white text-xs font-bold shadow-xs hover:bg-brand-teal-hover transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Watch Class</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
