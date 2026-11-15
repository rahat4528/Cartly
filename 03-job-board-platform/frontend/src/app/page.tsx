'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  Search, 
  Filter, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Clock
} from 'lucide-react';

function JobsContent() {
  const searchParams = useSearchParams();
  const { user, token } = useAuth();

  const [jobs, setJobs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedJobType, setSelectedJobType] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Apply Modal state
  const [activeJobForApply, setActiveJobForApply] = useState<any>(null);
  const [coverNote, setCoverNote] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applyFeedback, setApplyFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    fetchJobs();
    fetchCategories();
  }, [selectedCategory, searchQuery, selectedJobType]);

  const fetchCategories = async () => {
    try {
      const data = await apiRequest('/jobs/categories');
      setCategories(data);
    } catch {}
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (searchQuery) params.append('query', searchQuery);
      if (selectedJobType) params.append('jobType', selectedJobType);

      const res = await apiRequest(`/jobs?${params.toString()}`);
      setJobs(res.jobs || []);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setApplyFeedback({ type: 'error', msg: 'Please sign in as a candidate to submit an application.' });
      return;
    }

    setSubmittingApply(true);
    setApplyFeedback(null);

    try {
      await apiRequest(`/jobs/${activeJobForApply.id}/apply`, {
        method: 'POST',
        body: JSON.stringify({
          resumeId: 'res_default_alex',
          coverNote
        })
      }, token);

      setApplyFeedback({
        type: 'success',
        msg: `Application successfully submitted for ${activeJobForApply.title}! Track progress in My Applications.`
      });
      setTimeout(() => {
        setActiveJobForApply(null);
        setCoverNote('');
        setApplyFeedback(null);
      }, 3000);
    } catch (err: any) {
      setApplyFeedback({ type: 'error', msg: err.message || 'Application submission failed.' });
    } finally {
      setSubmittingApply(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl text-white">
        <div className="max-w-2xl space-y-3">
          <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
            Professional Recruitment Marketplace
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Discover roles at verified engineering organizations
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Transparent skill matching algorithms, confidential resume access controls, and direct candidate-to-hiring-manager interview pipelines.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by job title, tech stack, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.jobCount})</option>
              ))}
            </select>

            <select
              value={selectedJobType}
              onChange={(e) => setSelectedJobType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700"
            >
              <option value="">All Work Types</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Listing */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
          <span>Active Openings ({jobs.length})</span>
          <span>Transparent Keyword Match Scoring</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Querying verified career listings...</div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-300 rounded-xl p-8 bg-white">
            <p className="text-sm font-semibold text-slate-700">No positions found matching your criteria.</p>
            <button
              onClick={() => { setSelectedCategory(''); setSearchQuery(''); setSelectedJobType(''); }}
              className="text-xs text-indigo-600 font-bold hover:underline mt-2 inline-block"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-slate-200 hover:border-indigo-400 p-5 rounded-xl shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition text-base">
                      {job.title}
                    </span>
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      {job.jobType.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {job.company.name}
                      {job.company.isVerified && (
                        <span title="Verified Employer"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" /></span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1 font-mono font-bold text-slate-800">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      ${(job.minSalary / 1000).toFixed(0)}k - ${(job.maxSalary / 1000).toFixed(0)}k / yr
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Skills Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.requiredSkills?.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-[11px] text-slate-400 font-sans">
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => setActiveJobForApply(job)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {activeJobForApply && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  Submit Application
                </span>
                <h3 className="font-bold text-lg text-slate-900">{activeJobForApply.title}</h3>
                <p className="text-xs text-slate-500">{activeJobForApply.company.name} &bull; {activeJobForApply.location}</p>
              </div>
              <button
                onClick={() => { setActiveJobForApply(null); setApplyFeedback(null); }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {applyFeedback && (
              <div className={`p-3 rounded-lg text-xs font-medium border ${
                applyFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}>
                {applyFeedback.msg}
              </div>
            )}

            <form onSubmit={handleApply} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Candidate Identity</span>
                <p className="font-bold text-slate-800">{user?.name} ({user?.email})</p>
                <p className="text-slate-500 text-[11px]">Default Resume: <strong>Alex_Mercer_Distributed_Systems_Resume.pdf</strong></p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Brief Cover Note to Hiring Team (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Highlight your background, relevant open source work, or interest in this role..."
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveJobForApply(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApply}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold shadow-sm transition disabled:bg-slate-300"
                >
                  {submittingApply ? 'Submitting Application...' : 'Send Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Opening recruitment platform...</div>}>
      <JobsContent />
    </Suspense>
  );
}
