import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  User,
  GraduationCap,
  Building,
  Calendar,
  MapPin,
  Sparkles,
  Save,
  CheckCircle2,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react';
import { studentApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentProfilePage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => studentApi.getProfile(),
  });

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        headline: profile.headline || '',
        field_of_study: profile.field_of_study || '',
        institution: profile.institution || '',
        graduation_year: profile.graduation_year || '',
        bio: profile.bio || '',
        location: profile.location || '',
      });
      setSkills(profile.skills || []);
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: (payload) => studentApi.updateProfile(payload),
    onSuccess: (data) => {
      setSuccessMsg('Profile updated successfully!');
      setErrorMsg('');
      queryClient.setQueryData(['student-profile'], data);
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-stats'] });
      refreshUser();
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to update profile.');
    },
  });

  const onSubmit = (formData) => {
    updateMutation.mutate({
      ...formData,
      skills,
    });
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
          My Student Profile
        </h1>
        <p className="text-xs sm:text-sm text-secondary-text mt-1">
          Keep your qualifications, competencies, and career summary up to date for partner recruiters.
        </p>
      </div>

      {/* Completion Meter Card */}
      <div className="p-6 rounded-2xl glass-panel border border-border-color shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary-text">Profile Readiness Level</span>
              <span className="text-xs font-black text-brand-teal px-2 py-0.5 rounded bg-brand-teal/10">
                {profile?.profile_completion_pct ?? 25}%
              </span>
            </div>
            <p className="text-xs text-secondary-text mt-1">
              Recruiters prioritize profiles with comprehensive institution, headline, and skills data.
            </p>
          </div>
          <div className="w-full sm:w-48 bg-surface-secondary h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-brand-teal h-full rounded-full transition-all duration-500"
              style={{ width: `${profile?.profile_completion_pct ?? 25}%` }}
            />
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-200 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-border-color shadow-sm space-y-6">
          <h2 className="text-sm font-bold text-primary-text pb-3 border-b border-border-color">
            Personal & Academic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">First Name</label>
              <input
                type="text"
                {...register('first_name')}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:ring-2 focus:ring-brand-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">Last Name</label>
              <input
                type="text"
                {...register('last_name')}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:ring-2 focus:ring-brand-teal"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary-text mb-1.5">
              Professional Headline / Objective
            </label>
            <input
              type="text"
              {...register('headline')}
              placeholder="e.g. Aspiring Full-Stack Software Developer & Final-Year ICT Student"
              className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:ring-2 focus:ring-brand-teal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-primary-text mb-1.5">
                Field of Study / Qualification Title
              </label>
              <input
                type="text"
                {...register('field_of_study')}
                placeholder="e.g. Diploma in Information & Communications Technology"
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:ring-2 focus:ring-brand-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">
                Graduation Year
              </label>
              <input
                type="text"
                {...register('graduation_year')}
                placeholder="e.g. 2026"
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:ring-2 focus:ring-brand-teal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">
                Tertiary Institution / University / TVET
              </label>
              <input
                type="text"
                {...register('institution')}
                placeholder="e.g. Durban University of Technology"
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:ring-2 focus:ring-brand-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">
                Current Location (City, Province)
              </label>
              <input
                type="text"
                {...register('location')}
                placeholder="e.g. Johannesburg, Gauteng"
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:ring-2 focus:ring-brand-teal"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary-text mb-1.5">
              Biography & Motivation Statement
            </label>
            <textarea
              rows={4}
              {...register('bio')}
              placeholder="Highlight your academic focus, career motivation, key coursework, and the type of internship you seek..."
              className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:ring-2 focus:ring-brand-teal leading-relaxed"
            />
          </div>

          {/* Dynamic Skills Tagger */}
          <div>
            <label className="block text-xs font-semibold text-primary-text mb-1.5">
              Technical & Interpersonal Skills
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill (e.g. Python, React, SQL, Problem Solving)"
                className="flex-1 px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:ring-2 focus:ring-brand-teal"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3.5 py-2 rounded-lg bg-brand-teal text-white text-xs font-bold flex items-center gap-1 shadow-sm hover:bg-brand-teal-hover transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border-color bg-surface-secondary text-primary-text text-xs font-medium"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-secondary-text hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border-color flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-teal hover:bg-brand-teal-hover text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{updateMutation.isPending ? 'Saving Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
