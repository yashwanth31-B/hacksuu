import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../lib/api.ts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Download,
} from 'lucide-react';

interface TransparencyDashboardProps {
  navigate: (path: string) => void;
}

export const TransparencyDashboard: React.FC<TransparencyDashboardProps> = () => {
  const [stats, setStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [statsRes, leadRes] = await Promise.all([
          fetch(getApiUrl('/api/public/stats')),
          fetch(getApiUrl('/api/crews/leaderboard')),
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (leadRes.ok) setLeaderboard(await leadRes.json());
      } catch (err) {
        console.error('Failed to load transparency dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F6EE] text-[#1A2825] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B3E36]/10 text-[#1B3E36] border border-[#1B3E36]/20 text-xs font-bold uppercase tracking-wider font-mono">
            <BarChart3 className="w-3.5 h-3.5 text-[#E5A952]" />
            <span>OPEN CIVIC GOVERNANCE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1A2825]">
            Public Transparency Dashboard
          </h1>
          <p className="text-[#5C6E6A] text-sm leading-relaxed max-w-2xl mx-auto">
            Real-time public audit of municipal responsiveness, field resolution metrics, and department accountability across all zones.
          </p>

          <div className="pt-1 flex justify-center">
            <a
              href={getApiUrl('/api/public/export-csv')}
              download="civicfix_transparency_data.csv"
              className="px-4 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#FAF9F5] border border-[#D4CEBF] text-[#1B3E36] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-[#E5A952]" />
              <span>Download Open Civic Data (.CSV)</span>
            </a>
          </div>
        </div>

        {/* Primary Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#5C6E6A] uppercase font-mono">Total Registered</span>
              <AlertTriangle className="w-4 h-4 text-[#1B3E36]" />
            </div>
            <div className="text-3xl font-serif font-black text-[#1A2825]">{stats?.total ?? 0}</div>
            <div className="text-[11px] text-[#8A9894] font-mono mt-1">100% database verified</div>
          </div>

          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#5C6E6A] uppercase font-mono">Resolution Rate</span>
              <TrendingUp className="w-4 h-4 text-[#2E6F5E]" />
            </div>
            <div className="text-3xl font-serif font-black text-[#2E6F5E]">{stats?.resolutionRate ?? 0}%</div>
            <div className="text-[11px] text-[#8A9894] font-mono mt-1">{stats?.resolved ?? 0} closed cases</div>
          </div>

          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#5C6E6A] uppercase font-mono">Active Field Work</span>
              <Clock className="w-4 h-4 text-[#B06D44]" />
            </div>
            <div className="text-3xl font-serif font-black text-[#B06D44]">{stats?.inProgress ?? 0}</div>
            <div className="text-[11px] text-[#8A9894] font-mono mt-1">Dispatched response units</div>
          </div>

          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#5C6E6A] uppercase font-mono">Avg. Turnaround</span>
              <CheckCircle2 className="w-4 h-4 text-[#1B3E36]" />
            </div>
            <div className="text-3xl font-serif font-black text-[#1A2825]">{stats?.avgResolutionHours ?? 24}h</div>
            <div className="text-[11px] text-[#8A9894] font-mono mt-1">Report to verified fix</div>
          </div>
        </div>

        {/* Category Breakdown & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Distribution */}
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-1">
              MUNICIPAL SERVICE LINES
            </div>
            <h2 className="text-xl font-serif font-bold text-[#1A2825] mb-1">Issues By Civic Category</h2>
            <p className="text-xs text-[#5C6E6A] mb-6">Distribution across municipal operations and ward zones.</p>

            <div className="space-y-4">
              {stats?.categories?.map((cat: any) => {
                const total = stats.total || 1;
                const pct = Math.round((cat.count / total) * 100);

                return (
                  <div key={cat.category}>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-[#1A2825]">{cat.category}</span>
                      <span className="text-[#5C6E6A] font-mono">{cat.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-[#E5E1D5] h-2 rounded-full overflow-hidden border border-[#D4CEBF]">
                      <div
                        className="bg-[#1B3E36] h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Auditable Field Crew Credits Leaderboard */}
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-1">
                  FIELD AUDIT SCORES
                </div>
                <h2 className="text-xl font-serif font-bold text-[#1A2825]">Crew Performance Credits</h2>
              </div>
              <Award className="w-5 h-5 text-[#E5A952]" />
            </div>
            <p className="text-xs text-[#5C6E6A] mb-6">
              Auditable credit points awarded solely for verified on-site arrival and verified completed repairs.
            </p>

            <div className="space-y-3">
              {leaderboard.map((crew, idx) => (
                <div
                  key={crew.id}
                  className="bg-[#FFFFFF] border border-[#E5E1D5] p-4 rounded-2xl flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#FAF9F5] border border-[#D4CEBF] font-mono text-xs font-bold text-[#1B3E36] flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#1A2825]">{crew.crewName}</div>
                      <div className="text-[11px] text-[#5C6E6A]">
                        {crew.completedJobs} Verified Fixes • {crew.rating} ★ Rating
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-mono font-extrabold text-[#B06D44]">
                      +{crew.points} pts
                    </div>
                    <div className="text-[10px] text-[#8A9894] uppercase font-bold font-mono">Earned Credits</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
