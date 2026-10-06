import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { getApiUrl } from '../lib/api.ts';
import {
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Building2,
  ArrowRight,
} from 'lucide-react';

interface TrackComplaintProps {
  navigate: (path: string) => void;
  initialComplaintNumber?: string;
}

const WORKFLOW_STEPS = [
  'REPORTED',
  'VERIFIED',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'RESOLVED',
];

export const TrackComplaint: React.FC<TrackComplaintProps> = ({
  initialComplaintNumber = '',
}) => {
  const { user, getAuthToken } = useAuth();
  const [complaintNumber, setComplaintNumber] = useState(initialComplaintNumber);
  const [activeTab, setActiveTab] = useState<'search' | 'my-reports'>('search');
  const [complaint, setComplaint] = useState<any>(null);
  const [myComplaints, setMyComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComplaint = async (num: string) => {
    if (!num) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl(`/api/public/complaints/${encodeURIComponent(num.trim())}`));
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Complaint not found');
      }
      setComplaint(data);
    } catch (err: any) {
      setError(err.message || 'Failed to locate complaint.');
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialComplaintNumber) {
      setComplaintNumber(initialComplaintNumber);
      fetchComplaint(initialComplaintNumber);
    }
  }, [initialComplaintNumber]);

  // Load user's reports if logged in and tab clicked
  useEffect(() => {
    if (activeTab === 'my-reports' && user) {
      const loadMine = async () => {
        try {
          const token = await getAuthToken();
          if (!token) return;
          const res = await fetch(getApiUrl('/api/my-complaints'), {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setMyComplaints(data);
          }
        } catch {
          // ignore
        }
      };
      loadMine();
    }
  }, [activeTab, user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintNumber.trim()) return;
    fetchComplaint(complaintNumber.trim());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'text-[#1B4D3E] bg-[#E6F2ED] border-[#A8CEBE]';
      case 'IN_PROGRESS':
      case 'ASSIGNED':
      case 'ACCEPTED':
      case 'ARRIVED':
        return 'text-[#92400E] bg-[#FEF3C7] border-[#FDE68A]';
      case 'VERIFIED':
        return 'text-[#1B3E36] bg-[#1B3E36]/10 border-[#1B3E36]/30';
      case 'REJECTED':
        return 'text-[#8A3B2A] bg-[#FFF1E6] border-[#F4C49E]';
      default:
        return 'text-[#5C6E6A] bg-[#FAF9F5] border-[#D4CEBF]';
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6EE] text-[#1A2825] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-1">
            CIVIC RESOLUTION AUDIT
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1A2825] mb-2">Track Civic Complaint</h1>
          <p className="text-[#5C6E6A] text-sm max-w-lg mx-auto">
            Enter your unique complaint reference code (e.g. CF-27A81C4D) for real-time status and verification proofs.
          </p>
        </div>

        {/* Tab switch */}
        {user && (
          <div className="flex justify-center mb-6">
            <div className="bg-[#FAF9F5] border border-[#D4CEBF] p-1 rounded-2xl flex gap-1 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab('search')}
                className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'search'
                    ? 'bg-[#1B3E36] text-[#FAF9F5] shadow-xs'
                    : 'text-[#5C6E6A] hover:text-[#1A2825]'
                }`}
              >
                Track by ID
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('my-reports')}
                className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'my-reports'
                    ? 'bg-[#1B3E36] text-[#FAF9F5] shadow-xs'
                    : 'text-[#5C6E6A] hover:text-[#1A2825]'
                }`}
              >
                My Reported Complaints
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        {activeTab === 'search' && (
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto mb-10">
            <div className="bg-[#FAF9F5] border border-[#D4CEBF] focus-within:border-[#1B3E36] focus-within:ring-1 focus-within:ring-[#1B3E36] rounded-2xl p-2 flex items-center gap-2 shadow-sm transition-all">
              <div className="pl-3 text-[#5C6E6A]">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="CF-XXXXXXXX"
                value={complaintNumber}
                onChange={(e) => setComplaintNumber(e.target.value.toUpperCase())}
                className="flex-1 bg-transparent border-none text-base text-[#1A2825] placeholder-[#8A9894] outline-none uppercase font-mono tracking-wider font-bold"
              />
              <button
                type="submit"
                disabled={loading || !complaintNumber.trim()}
                className="px-6 py-2.5 bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-40 shadow-xs"
              >
                {loading ? 'Searching...' : 'Track'}
              </button>
            </div>
          </form>
        )}

        {/* My Reports View */}
        {activeTab === 'my-reports' && (
          <div className="space-y-3 mb-10">
            {myComplaints.length === 0 ? (
              <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-2xl p-8 text-center text-[#5C6E6A] text-sm shadow-xs">
                You haven't reported any issues from this account yet.
              </div>
            ) : (
              myComplaints.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setActiveTab('search');
                    setComplaintNumber(c.complaintNumber);
                    fetchComplaint(c.complaintNumber);
                  }}
                  className="bg-[#FAF9F5] border border-[#E5E1D5] hover:border-[#1B3E36] rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-[#1B3E36]">{c.complaintNumber}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#1A2825]">{c.title}</div>
                    <div className="text-xs text-[#5C6E6A]">{c.category} • {c.address}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#5C6E6A]" />
                </div>
              ))
            )}
          </div>
        )}

        {error && (
          <div className="bg-[#FFF1E6] border border-[#F4C49E] text-[#8A3B2A] rounded-2xl p-6 text-center text-sm mb-8 font-medium">
            {error}
          </div>
        )}

        {/* Complaint Detailed View */}
        {complaint && (
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E5E1D5] gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xl font-extrabold text-[#1B3E36]">
                    {complaint.complaintNumber}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border uppercase ${getStatusColor(complaint.status)}`}>
                    {complaint.status}
                  </span>
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#1A2825]">{complaint.title}</h2>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-xs text-[#5C6E6A] uppercase font-mono font-bold">Public Anonymity Label</div>
                <div className="text-xs font-mono font-bold text-[#2E6F5E]">
                  {complaint.anonymousPublicId}
                </div>
              </div>
            </div>

            {/* Lifecycle Progress Stepper */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#5C6E6A] font-mono mb-4">
                RESOLUTION LIFECYCLE PROGRESS
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {WORKFLOW_STEPS.map((st, i) => {
                  const currentIdx = WORKFLOW_STEPS.indexOf(
                    complaint.status === 'COMPLETED' ? 'COMPLETED' : complaint.status
                  );
                  const isDone = i <= currentIdx;
                  const isCurrent = complaint.status === st;

                  return (
                    <div
                      key={st}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? 'bg-[#1B3E36] text-[#FAF9F5] border-[#1B3E36] font-bold shadow-xs'
                          : isDone
                          ? 'bg-[#E6F2ED] border-[#A8CEBE] text-[#1B4D3E]'
                          : 'bg-[#FFFFFF] border-[#E5E1D5] text-[#8A9894]'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider">{st.replace('_', ' ')}</div>
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5 mx-auto mt-1" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#FFFFFF] border border-[#E5E1D5] rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 text-[#5C6E6A] text-xs font-mono uppercase font-bold mb-1">
                  <Building2 className="w-4 h-4 text-[#1B3E36]" />
                  <span>Responsible Department</span>
                </div>
                <div className="text-sm font-bold text-[#1A2825]">{complaint.department}</div>
                <div className="text-[11px] text-[#5C6E6A]">{complaint.municipality}</div>
              </div>

              <div className="bg-[#FFFFFF] border border-[#E5E1D5] rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 text-[#5C6E6A] text-xs font-mono uppercase font-bold mb-1">
                  <MapPin className="w-4 h-4 text-[#B06D44]" />
                  <span>Approximate Location</span>
                </div>
                <div className="text-sm font-bold text-[#1A2825] truncate">{complaint.address}</div>
                <div className="text-[11px] text-[#5C6E6A]">{complaint.ward}</div>
              </div>

              <div className="bg-[#FFFFFF] border border-[#E5E1D5] rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 text-[#5C6E6A] text-xs font-mono uppercase font-bold mb-1">
                  <Calendar className="w-4 h-4 text-[#2E6F5E]" />
                  <span>Reported Timestamp</span>
                </div>
                <div className="text-sm font-bold text-[#1A2825]">
                  {new Date(complaint.createdAt).toLocaleDateString()}
                </div>
                <div className="text-[11px] text-[#5C6E6A]">
                  {new Date(complaint.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-[#FFFFFF] border border-[#E5E1D5] rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[#5C6E6A] font-mono mb-2">
                Problem Description
              </div>
              <p className="text-sm text-[#1A2825] leading-relaxed font-normal">{complaint.description}</p>
            </div>

            {/* Before / After Evidence Photos */}
            {complaint.media && complaint.media.length > 0 && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-3">
                  PHOTOGRAPHIC EVIDENCE & RESOLUTION PROOF
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {complaint.media.map((m: any, idx: number) => (
                    <div key={idx} className="bg-[#FFFFFF] border border-[#E5E1D5] rounded-2xl p-3 shadow-xs">
                      <div className="flex items-center justify-between text-xs text-[#5C6E6A] mb-2 font-bold font-mono uppercase">
                        <span>{m.stage === 'COMPLETION' ? 'Resolution Verification Photo' : 'Initial Citizen Report Photo'}</span>
                        <span className="text-[10px] text-[#8A9894]">{new Date(m.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="w-full h-48 rounded-xl overflow-hidden bg-[#FAF9F5] border border-[#D4CEBF]">
                        <img src={m.fileUrl} alt="Evidence" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit & Workflow Timeline */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-4">
                VERIFIED MUNICIPAL AUDIT HISTORY
              </div>
              <div className="space-y-3">
                {complaint.history?.map((h: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 bg-[#FFFFFF] border border-[#E5E1D5] p-3.5 rounded-xl shadow-xs"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#1B3E36]/10 text-[#1B3E36] flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1A2825] uppercase tracking-wider font-mono">
                          Status Transition: {h.newStatus}
                        </span>
                        <span className="text-[10px] text-[#8A9894] font-mono">
                          {new Date(h.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#5C6E6A] mt-1">{h.reason}</p>
                      <span className="text-[10px] text-[#8A9894] mt-1 block font-mono">
                        Actioned By: {h.changedBy}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
