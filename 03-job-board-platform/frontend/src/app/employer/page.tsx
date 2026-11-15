'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { 
  Building2, 
  PlusCircle, 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function EmployerPortalPage() {
  const { user, token } = useAuth();

  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // New Job Form State
  const [showPostForm, setShowPostForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('cat_eng');
  const [newJobType, setNewJobType] = useState('FULL_TIME');
  const [newLocation, setNewLocation] = useState('Remote (US/EU)');
  const [newMinSalary, setNewMinSalary] = useState(150000);
  const [newMaxSalary, setNewMaxSalary] = useState(190000);
  const [newSkills, setNewSkills] = useState('Go, Kubernetes, PostgreSQL');
  const [newDescription, setNewDescription] = useState('');
  const [submittingJob, setSubmittingJob] = useState(false);

  // Status Update Modal/Action State
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    if (token && user?.role === 'EMPLOYER') {
      loadEmployerJobs();
    } else {
      setLoading(false);
    }
  }, [token, user]);

  const loadEmployerJobs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/employer/jobs', {}, token!);
      setJobs(data);
      if (data.length > 0) {
        setSelectedJobId(data[0].id);
        loadApplicantsForJob(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadApplicantsForJob = async (jobId: string) => {
    setLoadingApplicants(true);
    try {
      const data = await apiRequest(`/employer/jobs/${jobId}/applications`, {}, token!);
      setApplicants(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    loadApplicantsForJob(jobId);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingJob(true);
    try {
      const skillsArray = newSkills.split(',').map(s => s.trim()).filter(Boolean);
      await apiRequest('/employer/jobs', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle,
          categoryId: newCategory,
          jobType: newJobType,
          location: newLocation,
          minSalary: newMinSalary,
          maxSalary: newMaxSalary,
          requiredSkills: skillsArray,
          description: newDescription
        })
      }, token!);

      setFeedbackMsg('Job successfully published to live recruitment catalog.');
      setShowPostForm(false);
      setNewTitle('');
      setNewDescription('');
      setTimeout(() => setFeedbackMsg(null), 3000);
      loadEmployerJobs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingJob(false);
    }
  };

  const handleAdvanceStatus = async (applicationId: string, nextStatus: string) => {
    try {
      await apiRequest(`/employer/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          note: statusNote || `Advanced to ${nextStatus} by hiring manager`
        })
      }, token!);

      setFeedbackMsg(`Candidate transitioned to ${nextStatus}.`);
      setStatusNote('');
      setTimeout(() => setFeedbackMsg(null), 3000);
      if (selectedJobId) {
        loadApplicantsForJob(selectedJobId);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!token || user?.role !== 'EMPLOYER') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Employer Privileges Required</h2>
        <p className="text-xs text-slate-500 mt-1">
          Use the top banner to toggle into the Employer role.
        </p>
      </div>
    );
  }

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">
            Hiring Management
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Applicant Tracking System (ATS)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage candidates, evaluate keyword skill matching, and schedule interviews
          </p>
        </div>

        <button
          onClick={() => setShowPostForm(!showPostForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showPostForm ? 'Close Form' : 'Post New Job'}</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Post Job Form Drawer */}
      {showPostForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-6 shadow-md space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Create New Job Listing</h3>
          <form onSubmit={handleCreateJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Job Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Backend Engineer"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 bg-white"
              >
                <option value="cat_eng">Software Engineering</option>
                <option value="cat_devops">DevOps &amp; Cloud</option>
                <option value="cat_product">Product &amp; Design</option>
                <option value="cat_security">Cybersecurity</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Work Type &amp; Location</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newJobType}
                  onChange={(e) => setNewJobType(e.target.value)}
                  className="border border-slate-300 rounded p-2 bg-white"
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="CONTRACT">Contract</option>
                </select>
                <input
                  type="text"
                  required
                  placeholder="Location / Timezone"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="border border-slate-300 rounded p-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Annual Salary Range ($)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  required
                  placeholder="Min Salary"
                  value={newMinSalary}
                  onChange={(e) => setNewMinSalary(Number(e.target.value))}
                  className="border border-slate-300 rounded p-2"
                />
                <input
                  type="number"
                  required
                  placeholder="Max Salary"
                  value={newMaxSalary}
                  onChange={(e) => setNewMaxSalary(Number(e.target.value))}
                  className="border border-slate-300 rounded p-2"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Required Skills (Comma separated)</label>
              <input
                type="text"
                required
                placeholder="e.g. Go, Kubernetes, PostgreSQL, Redis"
                value={newSkills}
                onChange={(e) => setNewSkills(e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Role Description &amp; Responsibilities</label>
              <textarea
                required
                rows={3}
                placeholder="Detail core duties, tech stack architecture, and requirements..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={submittingJob}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-lg transition"
              >
                {submittingJob ? 'Publishing...' : 'Publish Job Listing'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main ATS Pipeline Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Job Openings Selector */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Your Organization Openings ({jobs.length})
          </h3>

          <div className="space-y-2">
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => handleSelectJob(job.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                  selectedJobId === job.id
                    ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 text-indigo-900'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div>
                  <h4 className="font-bold text-xs line-clamp-1">{job.title}</h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {job.location} &bull; ${(job.minSalary / 1000).toFixed(0)}k - ${(job.maxSalary / 1000).toFixed(0)}k
                  </div>
                </div>
                <span className="bg-slate-200/80 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {job.applicantCount || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Candidates Pipeline */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 p-4 rounded-xl flex justify-between items-center text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Reviewing Pipeline For</span>
              <h3 className="font-bold text-sm text-slate-900">{selectedJob?.title || 'Select a Job'}</h3>
            </div>
            <span className="text-slate-500 font-semibold">{applicants.length} Applicants Received</span>
          </div>

          {loadingApplicants ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading applicants for opening...</div>
          ) : applicants.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-200 bg-white rounded-xl p-8">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No candidate applications received yet for this position.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applicants.map((cand) => (
                <div
                  key={cand.id}
                  className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{cand.seekerName}</h4>
                      <p className="text-slate-500 text-[11px]">{cand.seekerEmail} &bull; Applied {new Date(cand.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Keyword Skill Match Pill */}
                      <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold font-mono">
                        {cand.matchScore}% Match
                      </span>
                      <span className="bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {cand.status}
                      </span>
                    </div>
                  </div>

                  {/* Skills Breakdown */}
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <span className="font-bold text-slate-500">Matched Skills:</span>
                    {cand.matchedSkills?.map((s: string, i: number) => (
                      <span key={i} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                        ✓ {s}
                      </span>
                    ))}
                    {cand.missingSkills?.length > 0 && (
                      <>
                        <span className="font-bold text-slate-500 ml-2">Missing:</span>
                        {cand.missingSkills.map((s: string, i: number) => (
                          <span key={i} className="bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded font-medium">
                            ✗ {s}
                          </span>
                        ))}
                      </>
                    )}
                  </div>

                  {cand.coverNote && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700 italic text-[11px]">
                      "{cand.coverNote}"
                    </div>
                  )}

                  {/* ATS Stage Transition Actions */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Transition Stage:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cand.status === 'APPLIED' && (
                        <button
                          onClick={() => handleAdvanceStatus(cand.id, 'REVIEWED')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-[10px] font-bold"
                        >
                          Mark Reviewed
                        </button>
                      )}
                      {['APPLIED', 'REVIEWED'].includes(cand.status) && (
                        <button
                          onClick={() => handleAdvanceStatus(cand.id, 'SHORTLISTED')}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded text-[10px] font-bold"
                        >
                          Shortlist
                        </button>
                      )}
                      {['SHORTLISTED'].includes(cand.status) && (
                        <button
                          onClick={() => handleAdvanceStatus(cand.id, 'INTERVIEW')}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded text-[10px] font-bold"
                        >
                          Schedule Interview
                        </button>
                      )}
                      {['INTERVIEW'].includes(cand.status) && (
                        <button
                          onClick={() => handleAdvanceStatus(cand.id, 'OFFERED')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[10px] font-bold"
                        >
                          Extend Offer
                        </button>
                      )}
                      {!['REJECTED', 'WITHDRAWN', 'OFFERED'].includes(cand.status) && (
                        <button
                          onClick={() => handleAdvanceStatus(cand.id, 'REJECTED')}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded text-[10px] font-bold"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
