'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Briefcase, Building2, User, FileText, CheckCircle2, LogOut } from 'lucide-react';

export function Navbar() {
  const { user, switchRole, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      {/* Demo Switch Banner */}
      <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-brand-500 font-bold">Recruitment Marketplace</span>
          <span className="text-slate-500">&bull;</span>
          <span className="text-slate-400">Verified Companies &amp; Confidential Resumes</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Current Role:</span>
          {user?.role === 'EMPLOYER' ? (
            <button
              onClick={() => switchRole('JOB_SEEKER')}
              className="text-cyan-400 font-bold hover:underline flex items-center gap-1"
            >
              <User className="w-3 h-3" /> Switch to Candidate
            </button>
          ) : (
            <button
              onClick={() => switchRole('EMPLOYER')}
              className="text-cyan-400 font-bold hover:underline flex items-center gap-1"
            >
              <Building2 className="w-3 h-3" /> Switch to Employer
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 leading-tight">Cartly Jobs</h1>
            <p className="text-[11px] text-slate-500">Recruitment Marketplace</p>
          </div>
        </Link>

        <nav className="flex items-center gap-6 text-xs font-semibold text-slate-600">
          <Link href="/" className="hover:text-indigo-600 transition">
            Explore Openings
          </Link>

          {user?.role === 'JOB_SEEKER' && (
            <Link href="/applications" className="hover:text-indigo-600 transition flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>My Applications</span>
            </Link>
          )}

          {user?.role === 'EMPLOYER' && (
            <Link
              href="/employer"
              className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Employer ATS Pipeline</span>
            </Link>
          )}

          {user && (
            <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
              <span className="text-slate-800">{user.name}</span>
              <button onClick={logout} className="text-slate-400 hover:text-slate-600" title="Sign Out">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
