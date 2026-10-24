import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { adminApi } from '@/services/api';
import Modal from '@/components/ui/Modal';

export default function AdminOpportunitiesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState(null);

  const defaultForm = {
    title: '',
    company_name: '',
    opportunity_type: 'internship',
    location: '',
    location_type: 'on_site',
    description: '',
    requirements: '',
    skills_required: '',
    official_url: '',
    is_external: false,
    closing_date: '',
    is_active: true,
  };

  const [formData, setFormData] = useState(defaultForm);

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['admin-opportunities', searchTerm],
    queryFn: () => adminApi.getOpportunities({ q: searchTerm || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => adminApi.createOpportunity(payload),
    onSuccess: () => {
      setIsModalOpen(false);
      setEditingOpp(null);
      setFormData(defaultForm);
      queryClient.invalidateQueries({ queryKey: ['admin-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err) => alert(err.message || 'Failed to save opportunity.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => adminApi.updateOpportunity(id, payload),
    onSuccess: () => {
      setIsModalOpen(false);
      setEditingOpp(null);
      setFormData(defaultForm);
      queryClient.invalidateQueries({ queryKey: ['admin-opportunities'] });
    },
    onError: (err) => alert(err.message || 'Failed to update opportunity.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
  });

  const openCreate = () => {
    setEditingOpp(null);
    setFormData(defaultForm);
    setIsModalOpen(true);
  };

  const openEdit = (opp) => {
    setEditingOpp(opp);
    setFormData({
      title: opp.title,
      company_name: opp.company_name,
      opportunity_type: opp.opportunity_type,
      location: opp.location,
      location_type: opp.location_type,
      description: opp.description,
      requirements: opp.requirements,
      skills_required: opp.skills_required?.join(', ') || '',
      official_url: opp.official_url || '',
      is_external: opp.is_external,
      closing_date: opp.closing_date ? opp.closing_date.slice(0, 10) : '',
      is_active: opp.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const skillsList = formData.skills_required
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      ...formData,
      skills_required: skillsList,
      closing_date: new Date(formData.closing_date).toISOString(),
    };

    if (editingOpp) {
      updateMutation.mutate({ id: editingOpp.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
            Opportunity Listings Management
          </h1>
          <p className="text-xs sm:text-sm text-secondary-text mt-1">
            Publish, edit, and verify authenticated internships, graduate programmes, and learnerships.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-teal text-white text-xs font-bold shadow-md hover:bg-brand-teal-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Opportunity</span>
        </button>
      </div>

      {/* Opportunities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {opportunities?.map((opp) => (
          <div
            key={opp.id}
            className="p-5 rounded-xl border border-border-color bg-surface shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-teal/10 text-brand-teal">
                  {opp.opportunity_type.replace('_', ' ')}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  opp.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {opp.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <h3 className="text-sm font-bold text-primary-text">{opp.title}</h3>

              <div className="flex items-center gap-3 text-xs text-secondary-text mt-1">
                <span className="flex items-center gap-1 font-medium">
                  <Building2 className="w-3.5 h-3.5" />
                  {opp.company_name}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {opp.location} ({opp.location_type})
                </span>
              </div>

              <p className="text-xs text-secondary-text line-clamp-2 mt-2 leading-relaxed">
                {opp.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-border-color flex items-center justify-between text-xs">
              <span className="text-[11px] text-secondary-text flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Closes: {new Date(opp.closing_date).toLocaleDateString()}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(opp)}
                  className="p-1.5 rounded-lg border border-border-color hover:bg-surface-secondary text-secondary-text hover:text-primary-text"
                  title="Edit opportunity"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${opp.title}"?`)) {
                      deleteMutation.mutate(opp.id);
                    }
                  }}
                  className="p-1.5 rounded-lg border border-border-color hover:bg-rose-50 text-secondary-text hover:text-rose-500"
                  title="Delete opportunity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingOpp ? 'Edit Opportunity Listing' : 'Publish Verified Opportunity'}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-primary-text mb-1">Position Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Junior Systems Analyst Intern"
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-primary-text mb-1">Company / Organization *</label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="e.g. Apex Financial Solutions"
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-primary-text mb-1">Programme Type *</label>
                <select
                  value={formData.opportunity_type}
                  onChange={(e) => setFormData({ ...formData, opportunity_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                >
                  <option value="internship">Internship</option>
                  <option value="graduate_programme">Graduate Programme</option>
                  <option value="learnership">Learnership</option>
                  <option value="entry_level">Entry Level</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-primary-text mb-1">Work Arrangement *</label>
                <select
                  value={formData.location_type}
                  onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                >
                  <option value="on_site">On-Site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-primary-text mb-1">Closing Date *</label>
                <input
                  type="date"
                  required
                  value={formData.closing_date}
                  onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-primary-text mb-1">Location Details (City, Province) *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Durban, KwaZulu-Natal"
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-primary-text mb-1">Role Description *</label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-semibold text-primary-text mb-1">Requirements & Qualifications *</label>
              <textarea
                rows={3}
                required
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-semibold text-primary-text mb-1">Required Skills (Comma separated)</label>
              <input
                type="text"
                value={formData.skills_required}
                onChange={(e) => setFormData({ ...formData, skills_required: e.target.value })}
                placeholder="Python, SQL, React, Git"
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-primary-text mb-1">Official Employer Link (Optional)</label>
              <input
                type="url"
                value={formData.official_url}
                onChange={(e) => setFormData({ ...formData, official_url: e.target.value })}
                placeholder="https://company.example.com/careers"
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs"
              />
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_external}
                  onChange={(e) => setFormData({ ...formData, is_external: e.target.checked })}
                  className="rounded text-brand-teal focus:ring-brand-teal"
                />
                <span className="text-xs text-primary-text font-medium">External Listing</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded text-brand-teal focus:ring-brand-teal"
                />
                <span className="text-xs text-primary-text font-medium">Listing Active</span>
              </label>
            </div>

            <div className="pt-4 border-t border-border-color flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-border-color text-xs text-secondary-text hover:text-primary-text"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-brand-teal text-white font-bold text-xs shadow-md hover:bg-brand-teal-hover"
              >
                {editingOpp ? 'Update Listing' : 'Publish Opportunity'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
