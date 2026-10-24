import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileCheck,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  FileText,
  ArrowRight,
  Shield,
  Layers,
  Check,
} from 'lucide-react';
import { studentApi } from '@/services/api';

export default function CVDoctorPage() {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [activeAnalysis, setActiveAnalysis] = useState(null);

  const { data: cvs, isLoading: cvsLoading } = useQuery({
    queryKey: ['student-cvs'],
    queryFn: () => studentApi.getCVs(),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData) => studentApi.uploadCV(formData),
    onSuccess: (analysisData) => {
      setSelectedFile(null);
      setUploadError('');
      setActiveAnalysis(analysisData);
      queryClient.invalidateQueries({ queryKey: ['student-cvs'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-stats'] });
    },
    onError: (err) => {
      setUploadError(err.message || 'CV upload and diagnostic failed.');
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File exceeds 5MB size limit.');
        return;
      }
      setSelectedFile(file);
      setUploadError('');
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    uploadMutation.mutate(formData);
  };

  const handleViewAnalysis = async (cvId) => {
    try {
      const data = await studentApi.getCVAnalysis(cvId);
      setActiveAnalysis(data);
    } catch (err) {
      alert(err.message || 'Unable to retrieve analysis for this version.');
    }
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
      alert('Failed to download CV file.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
          CV Doctor & ATS Readiness Engine
        </h1>
        <p className="text-xs sm:text-sm text-secondary-text mt-1 max-w-2xl">
          Automated diagnostic feedback tailored specifically for student graduates. We examine keyword density, academic capstones, and structural clarity without penalizing you for lacking formal corporate tenure.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-border-color shadow-sm">
        <h2 className="text-sm font-bold text-primary-text mb-4">Upload CV for Diagnostic Scan</h2>
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-border-color hover:border-brand-teal/60 rounded-xl p-8 text-center transition-colors">
            <Upload className="w-8 h-8 text-secondary-text mx-auto mb-2" />
            <p className="text-xs font-semibold text-primary-text">
              Drag and drop your latest CV document here, or choose a file
            </p>
            <p className="text-[11px] text-secondary-text mt-1">
              Supports PDF (.pdf) and Microsoft Word (.docx) &bull; Maximum file size: 5MB
            </p>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileSelect}
              className="mt-4 block mx-auto text-xs text-secondary-text file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-teal file:text-white hover:file:bg-brand-teal-hover cursor-pointer"
            />
          </div>

          {selectedFile && (
            <div className="p-3.5 rounded-lg bg-surface-secondary/70 border border-border-color flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-teal" />
                <span className="font-semibold text-primary-text truncate">{selectedFile.name}</span>
              </div>
              <span className="text-[11px] text-secondary-text font-mono">
                {(selectedFile.size / 1024).toFixed(0)} KB
              </span>
            </div>
          )}

          {uploadError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!selectedFile || uploadMutation.isPending}
              className="px-6 py-2.5 rounded-lg bg-brand-teal text-white text-xs font-bold shadow-md hover:bg-brand-teal-hover transition-colors disabled:opacity-50"
            >
              {uploadMutation.isPending ? 'Diagnosing with CV Doctor...' : 'Analyze Document'}
            </button>
          </div>
        </form>
      </div>

      {/* Active Diagnostic Report Display */}
      {activeAnalysis && (
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-border-color shadow-lg space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-color">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Diagnostic Report</span>
              </div>
              <h2 className="text-lg font-bold text-primary-text">CV Doctor Evaluation Results</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-3xl font-black text-brand-teal">{activeAnalysis.score}%</span>
                <span className="text-[10px] text-secondary-text block font-medium">Readiness Score</span>
              </div>
              <span className={`text-xs uppercase font-bold px-3 py-1 rounded-full ${
                activeAnalysis.score >= 80
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : activeAnalysis.score >= 60
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {activeAnalysis.score >= 80 ? 'ATS Ready' : activeAnalysis.score >= 60 ? 'Competent' : 'Action Required'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="p-5 rounded-xl border border-border-color bg-surface/70 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmed Strengths</span>
              </h3>
              <ul className="space-y-2 text-xs text-primary-text">
                {activeAnalysis.strengths?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="p-5 rounded-xl border border-border-color bg-surface/70 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Recommended Improvements</span>
              </h3>
              <ul className="space-y-2 text-xs text-secondary-text">
                {activeAnalysis.recommendations?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded CV Documents History */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-primary-text">Uploaded CV Document History</h2>
        {cvs?.length === 0 ? (
          <div className="p-6 text-center rounded-xl border border-border-color bg-surface text-xs text-secondary-text">
            No CV documents uploaded yet. Upload your first document above.
          </div>
        ) : (
          <div className="space-y-3">
            {cvs?.map((cv) => (
              <div
                key={cv.id}
                className="p-4 rounded-xl border border-border-color bg-surface hover:border-brand-teal/40 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-lg bg-brand-teal/10 text-brand-teal shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-primary-text truncate">{cv.filename}</p>
                      {cv.is_primary && (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-brand-teal text-white">
                          Primary CV
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-secondary-text">
                      {(cv.file_size / 1024).toFixed(0)} KB &bull; Uploaded {new Date(cv.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleViewAnalysis(cv.id)}
                    className="px-3 py-1.5 rounded-lg border border-border-color hover:bg-surface-secondary text-primary-text text-xs font-medium transition-colors"
                  >
                    View Diagnosis
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadCV(cv.id, cv.filename)}
                    className="p-1.5 rounded-lg border border-border-color hover:bg-surface-secondary text-secondary-text hover:text-primary-text transition-colors"
                    title="Download document"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
