import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Plus,
  Trash2,
  Sparkles,
  Eye,
  GraduationCap,
  Building,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { studentApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function CVBuilderPage() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    first_name: user?.profile?.first_name || '',
    last_name: user?.profile?.last_name || '',
    headline: user?.profile?.headline || 'ICT Graduate & Junior Developer',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    location: user?.profile?.location || 'South Africa',
    summary:
      user?.profile?.bio ||
      'Dedicated ICT student with a solid academic foundation in modern software development, databases, and problem-solving. Seeking an internship or graduate opportunity to apply practical skills in an agile, professional environment.',
    institution: user?.profile?.institution || 'Tertiary Institution',
    field_of_study: user?.profile?.field_of_study || 'Diploma in Information & Communications Technology',
    graduation_year: user?.profile?.graduation_year || '2026',
    education_details: 'Major coursework: Software Development, Systems Analysis, Relational Databases, and Networks.',
    skills: user?.profile?.skills?.length ? user.profile.skills : ['Python', 'SQL', 'FastAPI', 'React', 'Git', 'Agile'],
    projects: [
      {
        title: 'Student Company Application System',
        technologies: 'FastAPI, SQLite, React, Tailwind CSS',
        description: 'Engineered a full-stack career platform with automated CV diagnostics, Argon2id security, and ReportLab PDF offer letter generation.',
      },
    ],
    experience: [],
  });

  const handleAddProject = () => {
    setFormData({
      ...formData,
      projects: [
        ...formData.projects,
        { title: '', technologies: '', description: '' },
      ],
    });
  };

  const handleRemoveProject = (index) => {
    const next = [...formData.projects];
    next.splice(index, 1);
    setFormData({ ...formData, projects: next });
  };

  const handleProjectChange = (index, field, value) => {
    const next = [...formData.projects];
    next[index][field] = value;
    setFormData({ ...formData, projects: next });
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const blob = await studentApi.generateCVBuilderPDF(formData);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${formData.first_name || 'Student'}_Professional_CV.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Error generating PDF CV.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
            ATS-Friendly CV Builder
          </h1>
          <p className="text-xs sm:text-sm text-secondary-text mt-1">
            Build and export a clean, publication-ready PDF CV powered by our backend ReportLab rendering engine.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-teal text-white text-xs font-bold shadow-md hover:bg-brand-teal-hover transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isGenerating ? 'Rendering PDF...' : 'Download Official PDF'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-border-color shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-primary-text pb-2 border-b border-border-color">
              Personal & Contact Details
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1">Professional Title</label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">City, Province</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1">Professional Summary</label>
              <textarea
                rows={3}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Education Block */}
          <div className="glass-panel rounded-2xl p-6 border border-border-color shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-primary-text pb-2 border-b border-border-color">
              Education & Qualifications
            </h2>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-primary-text mb-1">Qualification Title</label>
                <input
                  type="text"
                  value={formData.field_of_study}
                  onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">Year</label>
                <input
                  type="text"
                  value={formData.graduation_year}
                  onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1">Institution</label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
              />
            </div>
          </div>

          {/* Academic Projects */}
          <div className="glass-panel rounded-2xl p-6 border border-border-color shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-color">
              <h2 className="text-sm font-bold text-primary-text">Academic & Practical Projects</h2>
              <button
                type="button"
                onClick={handleAddProject}
                className="flex items-center gap-1 text-xs font-semibold text-brand-teal hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </button>
            </div>

            {formData.projects.map((proj, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-border-color bg-surface-secondary/40 space-y-3 relative">
                <button
                  type="button"
                  onClick={() => handleRemoveProject(idx)}
                  className="absolute top-3 right-3 text-secondary-text hover:text-rose-500"
                  title="Remove project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-3 pr-8">
                  <div>
                    <label className="block text-[11px] font-semibold text-primary-text mb-1">Project Name</label>
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => handleProjectChange(idx, 'title', e.target.value)}
                      placeholder="e.g. Campus Management Portal"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-primary-text mb-1">Technologies Used</label>
                    <input
                      type="text"
                      value={proj.technologies}
                      onChange={(e) => handleProjectChange(idx, 'technologies', e.target.value)}
                      placeholder="e.g. Python, SQLite, HTML"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-primary-text mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={proj.description}
                    onChange={(e) => handleProjectChange(idx, 'description', e.target.value)}
                    placeholder="Brief description of what you engineered..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live ATS Preview (5 Cols) */}
        <div className="lg:col-span-5 sticky top-20">
          <div className="p-6 rounded-2xl border border-border-color bg-white text-slate-900 shadow-xl space-y-4 font-sans text-xs min-h-[600px]">
            <div className="border-b-2 border-teal-600 pb-3">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                {formData.first_name || 'First'} {formData.last_name || 'Last'}
              </h2>
              <p className="text-xs font-bold text-teal-700 mt-0.5">{formData.headline}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                {[formData.email, formData.phone_number, formData.location].filter(Boolean).join(' • ')}
              </p>
            </div>

            {formData.summary && (
              <div>
                <h3 className="text-[11px] font-black uppercase text-slate-800 tracking-wider mb-1">
                  Professional Summary
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">{formData.summary}</p>
              </div>
            )}

            <div>
              <h3 className="text-[11px] font-black uppercase text-slate-800 tracking-wider mb-1">
                Education
              </h3>
              <p className="text-[11px] font-bold text-slate-900">
                {formData.field_of_study} — {formData.institution} ({formData.graduation_year})
              </p>
            </div>

            {formData.skills?.length > 0 && (
              <div>
                <h3 className="text-[11px] font-black uppercase text-slate-800 tracking-wider mb-1">
                  Skills
                </h3>
                <p className="text-[11px] text-slate-600">{formData.skills.join(', ')}</p>
              </div>
            )}

            {formData.projects?.length > 0 && (
              <div>
                <h3 className="text-[11px] font-black uppercase text-slate-800 tracking-wider mb-1">
                  Projects
                </h3>
                <div className="space-y-2">
                  {formData.projects.map((p, i) => (
                    <div key={i} className="text-[11px]">
                      <span className="font-bold text-slate-900">{p.title || 'Untitled Project'}</span>
                      {p.technologies && <span className="text-slate-500 italic"> | {p.technologies}</span>}
                      {p.description && <p className="text-slate-600 mt-0.5">&bull; {p.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
