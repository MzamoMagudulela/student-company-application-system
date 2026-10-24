import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Play,
  Clock,
  User,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { studentApi } from '@/services/api';

export default function LearningPage() {
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeVideo, setActiveVideo] = useState(null);

  // Fallback verified real educational modules for public visitors
  const verifiedModules = [
    {
      id: 1,
      title: 'Mastering the ICT Graduate CV: Formatting & Impact',
      category: 'CV Writing',
      description: 'Learn how to structure your student CV to pass ATS screeners and highlight academic projects without requiring 5 years of corporate experience.',
      video_url: 'https://www.youtube.com/embed/y8YH0Qbu5h4',
      duration_minutes: 18,
      author: 'Mzamo Sandile Magudulela',
    },
    {
      id: 2,
      title: 'Technical & Competency Interview Preparation for Graduates',
      category: 'Interview Preparation',
      description: 'A step-by-step breakdown of the STAR technique (Situation, Task, Action, Result) with real scenarios for ICT internships and graduate roles.',
      video_url: 'https://www.youtube.com/embed/1mHjMNZZvFo',
      duration_minutes: 22,
      author: 'Mzamo Sandile Magudulela',
    },
    {
      id: 3,
      title: 'Identifying and Avoiding Recruitment Scams in South Africa',
      category: 'Recruitment Scam Awareness',
      description: 'Essential guide to recognizing fake job offers, fraudulent WhatsApp recruitment rings, and why legitimate employers never charge application fees.',
      video_url: 'https://www.youtube.com/embed/9_y3r4h5gQ0',
      duration_minutes: 15,
      author: 'Mzamo Sandile Magudulela',
    },
    {
      id: 4,
      title: 'Building a Standout GitHub Portfolio for Student Developers',
      category: 'LinkedIn and Portfolios',
      description: 'How to write clean READMEs, showcase full-stack projects, and demonstrate engineering discipline to hiring managers.',
      video_url: 'https://www.youtube.com/embed/2n3xS89E7wA',
      duration_minutes: 20,
      author: 'Mzamo Sandile Magudulela',
    },
    {
      id: 5,
      title: 'Professional Email & Workplace Communication Etiquette',
      category: 'Professional Email Writing',
      description: 'How to write compelling introductory emails, follow-up messages after interviews, and formal offer acceptance letters.',
      video_url: 'https://www.youtube.com/embed/4xGzVd9KjLs',
      duration_minutes: 14,
      author: 'Mzamo Sandile Magudulela',
    },
  ];

  const categories = [
    'All',
    'CV Writing',
    'Interview Preparation',
    'Recruitment Scam Awareness',
    'LinkedIn and Portfolios',
    'Professional Email Writing',
  ];

  const filtered = selectedCategory === 'All'
    ? verifiedModules
    : verifiedModules.filter((m) => m.category === selectedCategory);

  return (
    <div className="space-y-10 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-teal/30 bg-brand-teal/10 text-brand-teal text-xs font-semibold mb-3">
          <GraduationCap className="w-4 h-4" />
          <span>Curated Graduate Development Curriculum</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary-text tracking-tight">
          Career Learning Hub
        </h1>
        <p className="text-xs sm:text-sm text-secondary-text mt-2 leading-relaxed">
          Free, high-impact career masterclasses covering CV readiness, interview mastery, professional portfolio presentation, and graduate workplace transition.
        </p>
      </div>

      {/* Scam Awareness Alert Banner */}
      <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-200">
          <strong className="block font-bold">Important Notice on Student Safety:</strong>
          Mzamo's Youth Development Company and verified partner employers will <em>never</em> ask for application fees, administrative deposits, or money for interviews. Report any suspicious requests immediately.
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 shadow-sm'
                : 'border border-border-color bg-surface hover:bg-surface-secondary text-secondary-text hover:text-primary-text'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Active Video Player (if clicked) */}
      {activeVideo && (
        <div className="p-4 rounded-2xl glass-panel border border-border-color shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-primary-text">{activeVideo.title}</h3>
            <button
              type="button"
              onClick={() => setActiveVideo(null)}
              className="text-xs text-secondary-text hover:text-primary-text font-medium"
            >
              Close Player &times;
            </button>
          </div>
          <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-900">
            <iframe
              src={activeVideo.video_url}
              title={activeVideo.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-xs text-secondary-text leading-relaxed">
            {activeVideo.description}
          </p>
        </div>
      )}

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((module) => (
          <div
            key={module.id}
            className="p-5 rounded-xl border border-border-color bg-surface hover:border-brand-teal/50 shadow-sm transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] text-secondary-text mb-2">
                <span className="font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-teal/10 text-brand-teal">
                  {module.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {module.duration_minutes} mins
                </span>
              </div>

              <h3 className="text-sm font-bold text-primary-text group-hover:text-brand-teal transition-colors line-clamp-2 mt-1">
                {module.title}
              </h3>

              <p className="text-xs text-secondary-text line-clamp-3 mt-2 leading-relaxed">
                {module.description}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-border-color flex items-center justify-between">
              <span className="text-[11px] text-secondary-text flex items-center gap-1">
                <User className="w-3 h-3" />
                {module.author}
              </span>

              <button
                type="button"
                onClick={() => setActiveVideo(module)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-teal/10 text-brand-teal text-xs font-bold hover:bg-brand-teal hover:text-white transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Watch</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
