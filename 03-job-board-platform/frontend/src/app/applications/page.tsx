'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { FileText, CheckCircle2, Clock, AlertCircle, Building2, Calendar, ShieldCheck } from 'lucide-react';

export default function CandidateApplicationsPage() {
  const { user, token } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadApplications();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/seeker/applications', {}, token!);
      setApplications(data);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return <span className="bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">APPLIED</span>;
      case 'REVIEWED':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">UNDER REVIEW</span>;
      case 'SHORTLISTED':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">SHORTLISTED</span>;
      case 'INTERVIEW':
        return <span className="bg-amber-50 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">INTERVIEW SCHEDULED</span>;
      case 'OFFERED':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">OFFER EXTENDED</span>;
      case 'REJECTED':
      case 'WITHDRAWN':
        return <span className="bg-rose-50 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">{status}</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">{status}</span>;
    }
  };

  if (!token) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900">Sign in to track your career applications</h2>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Candidate Application Tracker</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review stage advancement, verified interview invites, and ATS feedback notes
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading your applications...</div>
      ) : applications.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 bg-white rounded-xl p-8 space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">You haven't submitted any applications yet.</p>
          <Link
            href="/"
            className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
          >
            Explore Active Positions
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{app.jobTitle}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-semibold text-slate-700">{app.companyName}</span>
                    <span>&bull;</span>
                    <span>Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div>
                  {getStatusBadge(app.status)}
                </div>
              </div>

              {/* Keyword Skill Match Preview */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-700">Skill Compatibility Score:</span>{' '}
                  <span className="font-bold text-indigo-600 font-mono text-sm">{app.matchScore}%</span>
                  <span className="text-[10px] text-slate-400 ml-2">({app.engineType})</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Attached: <strong>{app.resumeFileName}</strong>
                </div>
              </div>

              {/* Status Timeline History */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                  Status Audit Trail
                </span>
                <div className="space-y-2 border-l-2 border-indigo-200 pl-3 ml-1 text-xs">
                  {app.history?.map((h: any) => (
                    <div key={h.id} className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{h.toStatus}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(h.timestamp).toLocaleString()} by {h.changedBy}
                        </span>
                      </div>
                      {h.note && (
                        <p className="text-slate-600 text-[11px] italic">"{h.note}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
