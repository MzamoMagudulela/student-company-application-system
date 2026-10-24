import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Shield,
  FileText,
  Award,
  Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { studentApi } from '@/services/api';

export default function CVDoctorPublicPage() {
  const { isAuthenticated } = useAuth();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setErrorMsg('File exceeds maximum size of 5MB.');
        return;
      }
      setFile(selected);
      setErrorMsg('');
    }
  };

  const handleDiagnose = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select a PDF or DOCX file to diagnose.');
      return;
    }

    if (!isAuthenticated) {
      // Prompt user to register / log in to access the full diagnostic engine
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await studentApi.uploadCV(formData);
      setAnalysis(res);
    } catch (err) {
      setErrorMsg(err.message || 'Diagnostic failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const checklistItems = [
    { title: 'Contact Information', desc: 'Prominent telephone number, active email, and location without private ID numbers.', weight: '15%' },
    { title: 'Career Summary', desc: 'Succinct 2-3 sentence statement of your field of study, core technologies, and career objective.', weight: '15%' },
    { title: 'Education & Qualifications', desc: 'Tertiary institution, degree/diploma title, major subjects, and expected graduation year.', weight: '20%' },
    { title: 'Technical & Domain Skills', desc: 'Structured technical tools, programming languages, databases, and interpersonal capabilities.', weight: '20%' },
    { title: 'Academic & Practical Projects', desc: 'Applied evidence: capstone projects, assignments, and GitHub repositories demonstrating practical competence.', weight: '20%' },
    { title: 'Document Density & Formatting', desc: 'Optimal information density, ATS-readable typography, and clear section breaks.', weight: '10%' },
  ];

  return (
    <div className="space-y-12 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-teal/30 bg-brand-teal/10 text-brand-teal text-xs font-semibold mb-3">
          <FileCheck className="w-4 h-4" />
          <span>ATS Diagnostic Readiness Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary-text tracking-tight">
          CV Doctor & Readiness Diagnostic
        </h1>
        <p className="text-xs sm:text-sm text-secondary-text mt-2 leading-relaxed">
          Transparent, fair CV feedback designed specifically for students and recent graduates. We evaluate your actual competence, projects, and academic qualifications — never penalizing you for lacking formal corporate employment.
        </p>
      </div>

      {/* Main Diagnostic Tester */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-border-color shadow-lg">
        <div className="max-w-2xl mx-auto">
          {!isAuthenticated ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-teal/20 text-brand-teal flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-primary-text">
                Sign In to Run Full Diagnostic Analysis
              </h3>
              <p className="text-xs text-secondary-text max-w-md mx-auto leading-relaxed">
                Registered students receive instant scoring, detailed section checklists, missing keyword alerts, and private document storage.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  to="/login"
                  className="py-2.5 px-5 rounded-lg bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 text-xs font-bold shadow-md hover:opacity-95 transition-opacity"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="py-2.5 px-5 rounded-lg bg-brand-teal text-white text-xs font-bold shadow-md hover:bg-brand-teal-hover transition-colors"
                >
                  Create Student Account
                </Link>
              </div>
            </div>
          ) : analysis ? (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-border-color">
                <div>
                  <h3 className="text-base font-bold text-primary-text">Diagnostic Assessment Results</h3>
                  <p className="text-xs text-secondary-text">Document analyzed successfully</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-brand-teal">{analysis.score}%</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-brand-teal/10 text-brand-teal">
                    {analysis.score >= 80 ? 'ATS Ready' : analysis.score >= 60 ? 'Competent' : 'Needs Review'}
                  </span>
                </div>
              </div>

              {/* Strengths */}
              {analysis.strengths?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                    Key Strengths Identified
                  </h4>
                  <ul className="space-y-1.5 text-xs text-primary-text">
                    {analysis.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                    Tailored Recommendations
                  </h4>
                  <ul className="space-y-1.5 text-xs text-secondary-text">
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-border-color flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setAnalysis(null);
                    setFile(null);
                  }}
                  className="text-xs text-secondary-text hover:text-primary-text"
                >
                  Diagnose Another File
                </button>
                <Link
                  to="/student/cv-doctor"
                  className="py-2 px-4 rounded-lg bg-brand-teal text-white text-xs font-bold hover:bg-brand-teal-hover transition-colors shadow-sm"
                >
                  View in Student Workspace &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleDiagnose} className="space-y-4">
              <div className="border-2 border-dashed border-border-color hover:border-brand-teal/60 rounded-xl p-8 text-center transition-colors">
                <Upload className="w-8 h-8 text-secondary-text mx-auto mb-2" />
                <p className="text-xs font-semibold text-primary-text">
                  Drag and drop your CV file here, or click to browse
                </p>
                <p className="text-[11px] text-secondary-text mt-1">
                  Supports PDF (.pdf) and Microsoft Word (.docx) &bull; Max 5MB
                </p>
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="mt-4 block mx-auto text-xs text-secondary-text file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-teal file:text-white hover:file:bg-brand-teal-hover"
                />
              </div>

              {file && (
                <div className="p-3 rounded-lg bg-surface-secondary/70 border border-border-color flex items-center justify-between text-xs">
                  <span className="font-medium text-primary-text truncate">{file.name}</span>
                  <span className="text-[11px] text-secondary-text">{(file.size / 1024).toFixed(0)} KB</span>
                </div>
              )}

              {errorMsg && (
                <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={isUploading || !file}
                className="w-full py-2.5 px-4 rounded-lg bg-brand-teal text-white text-xs font-bold shadow-md hover:bg-brand-teal-hover transition-colors disabled:opacity-50"
              >
                {isUploading ? 'Analyzing Document with CV Doctor...' : 'Diagnose Document'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Transparent 6-Factor Checklist */}
      <div className="space-y-4">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-lg sm:text-xl font-bold text-primary-text">The 6-Factor CV Doctor Standard</h2>
          <p className="text-xs text-secondary-text mt-1">
            Every score is calculated deterministically against our graduate career readiness criteria.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {checklistItems.map((item, idx) => (
            <div key={idx} className="p-5 rounded-xl border border-border-color bg-surface shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-teal px-2 py-0.5 rounded bg-brand-teal/10">
                  Weight: {item.weight}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-xs font-bold text-primary-text">{item.title}</h3>
              <p className="text-[11px] text-secondary-text leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
