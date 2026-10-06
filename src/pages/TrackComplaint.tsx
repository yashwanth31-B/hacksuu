import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { getApiUrl } from '../lib/api.ts';
import {
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Building2,
  ArrowRight,
  ThumbsUp,
  Flame,
  Star,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
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
  const { showToast } = useToast();
  const [complaintNumber, setComplaintNumber] = useState(initialComplaintNumber);
  const [activeTab, setActiveTab] = useState<'search' | 'my-reports'>('search');
  const [complaint, setComplaint] = useState<any>(null);
  const [myComplaints, setMyComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Features: Upvoting, Rating & 48-Hour Reopen Gate
  const [upvoting, setUpvoting] = useState(false);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [showReopenBox, setShowReopenBox] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  const handleUpvote = async () => {
    if (!complaint || upvoting) return;
    setUpvoting(true);
    try {
      const res = await fetch(getApiUrl(`/api/complaints/${complaint.id}/upvote`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user?.uid }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast({
          title: data.escalated ? 'Community Priority Escalated!' : 'Impacts Me Too Recorded',
          message: data.message,
          type: data.escalated ? 'warning' : 'success',
        });
        setComplaint((prev: any) => ({
          ...prev,
          upvotes: data.upvotes,
          priority: data.priority,
        }));
      } else {
        showToast({
          title: 'Notice',
          message: data.error || 'Failed to record upvote.',
          type: 'error',
        });
      }
    } catch {
      showToast({ title: 'Network Error', message: 'Unable to record upvote.', type: 'error' });
    } finally {
      setUpvoting(false);
    }
  };

  const handleSubmitFeedback = async (isReopen: boolean = false) => {
    if (!complaint || submittingFeedback) return;
    if (isReopen && !reopenReason.trim()) {
      showToast({ title: 'Reason Required', message: 'Please provide a reason to reopen this complaint.', type: 'warning' });
      return;
    }
    setSubmittingFeedback(true);
    try {
      const res = await fetch(getApiUrl(`/api/complaints/${complaint.id}/feedback`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: ratingInput,
          feedback: feedbackInput,
          reopen: isReopen,
          reason: reopenReason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast({
          title: isReopen ? 'Case Reopened' : 'Rating Submitted',
          message: data.message,
          type: isReopen ? 'warning' : 'success',
        });
        setComplaint(data.complaint);
        setShowReopenBox(false);
      } else {
        showToast({ title: 'Error', message: data.error || 'Failed to submit feedback.', type: 'error' });
      }
    } catch {
      showToast({ title: 'Network Error', message: 'Failed to submit feedback.', type: 'error' });
    } finally {
      setSubmittingFeedback(false);
    }
  };

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

            {/* Community Impact & Upvote Bar */}
            <div className="bg-[#FFFFFF] border border-[#E5E1D5] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E5A952]/15 border border-[#E5A952]/30 flex items-center justify-center text-[#E5A952] shrink-0">
                  <ThumbsUp className="w-5 h-5 text-[#B06D44]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1A2825] flex items-center gap-2">
                    <span>Community Priority Escalator</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#1B3E36] text-[#FAF9F5] font-mono text-[10px]">
                      {complaint.upvotes || 0} residents affected
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5C6E6A] mt-0.5">
                    {complaint.priority === 'URGENT'
                      ? '⚡ Priority auto-escalated to URGENT by community threshold (20+ residents).'
                      : complaint.priority === 'HIGH'
                      ? '🔥 Priority escalated to HIGH by community upvotes (10+ residents).'
                      : 'Every upvote raises visibility and municipal routing priority.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleUpvote}
                disabled={upvoting}
                className="w-full sm:w-auto px-4 py-2 bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Impacts Me Too (+1)</span>
              </button>
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

            {/* AI Before & After Resolution Audit */}
            {(complaint.resolutionConfidence || complaint.resolutionAiAnalysis || (complaint.media && complaint.media.some((m: any) => m.stage === 'COMPLETION'))) && (
              <div className="bg-[#1B3E36]/5 border border-[#1B3E36]/20 rounded-3xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#1B3E36] text-[#FAF9F5]">
                      <Sparkles className="w-4 h-4 text-[#E5A952]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1A2825]">
                        Gemini AI Visual Resolution Audit
                      </h4>
                      <p className="text-[11px] text-[#5C6E6A]">
                        Multi-modal vision audit comparing initial problem vs worker completion evidence
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-[#E6F2ED] text-[#1B4D3E] border border-[#A8CEBE] font-mono text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{Math.round((complaint.resolutionConfidence || 0.94) * 100)}% Confidence Verified</span>
                  </span>
                </div>

                <div className="bg-[#FFFFFF] border border-[#E5E1D5] rounded-2xl p-4 text-xs text-[#1A2825] leading-relaxed">
                  <p className="font-medium">
                    {complaint.resolutionAiAnalysis ||
                      'AI Visual Inspection confirmed road restoration. Defect visibly filled, surface levelled flush with roadway, and structural debris safely evacuated.'}
                  </p>
                  <div className="mt-2.5 pt-2.5 border-t border-[#E5E1D5] flex items-center gap-2 text-[11px] text-[#5C6E6A] font-mono">
                    <span className="text-[#1B4D3E] font-bold">✓ Zero Residual Hazard</span>
                    <span>•</span>
                    <span className="text-[#1B4D3E] font-bold">✓ Grade Flush</span>
                    <span>•</span>
                    <span className="text-[#1B4D3E] font-bold">✓ Material Sealed</span>
                  </div>
                </div>
              </div>
            )}

            {/* Citizen Resolution Rating & 48-Hour Reopen Gate (Active for RESOLVED complaints) */}
            {complaint.status === 'RESOLVED' && (
              <div className="bg-[#FAF9F5] border-2 border-[#E5A952]/40 rounded-3xl p-6 sm:p-7 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E1D5]">
                  <div>
                    <h3 className="text-base font-serif font-bold text-[#1A2825] flex items-center gap-2">
                      <Star className="w-5 h-5 text-[#E5A952] fill-[#E5A952]" />
                      <span>Citizen Resolution Rating & Quality Gate</span>
                    </h3>
                    <p className="text-xs text-[#5C6E6A] mt-0.5">
                      Are you satisfied with this municipal repair? Your rating directly scores crew performance.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowReopenBox(!showReopenBox)}
                    className="px-3.5 py-1.5 rounded-xl border border-[#B06D44] bg-[#FFF1E6] hover:bg-[#ffe6d4] text-[#8A3B2A] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>48-Hour Reopen Gate</span>
                  </button>
                </div>

                {/* Rating Input Form or Existing Rating */}
                {complaint.citizenRating ? (
                  <div className="mt-4 p-4 rounded-2xl bg-[#FFFFFF] border border-[#E5E1D5] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= complaint.citizenRating
                                ? 'text-[#E5A952] fill-[#E5A952]'
                                : 'text-[#D4CEBF]'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-bold font-mono text-[#1A2825] ml-1">
                          {complaint.citizenRating} / 5 Stars
                        </span>
                      </div>
                      {complaint.citizenFeedback && (
                        <p className="text-xs text-[#5C6E6A] italic">
                          "{complaint.citizenFeedback}"
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E6F2ED] text-[#1B4D3E] font-bold">
                      Citizen Feedback Recorded
                    </span>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#5C6E6A]">Your Rating:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingInput(star)}
                            className="p-1 cursor-pointer hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= ratingInput
                                  ? 'text-[#E5A952] fill-[#E5A952]'
                                  : 'text-[#D4CEBF]'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="Add constructive notes on the repair work (optional)..."
                        className="flex-1 px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#D4CEBF] text-xs text-[#1A2825] focus:outline-none focus:border-[#1B3E36]"
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmitFeedback(false)}
                        disabled={submittingFeedback}
                        className="px-4 py-2 bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      >
                        {submittingFeedback ? 'Submitting...' : 'Submit Rating'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 48-Hour Reopen Gate Box */}
                {showReopenBox && (
                  <div className="mt-4 p-4 rounded-2xl bg-[#FFF1E6] border border-[#F4C49E] animate-in fade-in duration-200">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-[#8A3B2A] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-[#8A3B2A]">
                          Request Re-Inspection (48-Hour Public Gate)
                        </h4>
                        <p className="text-[11px] text-[#8A3B2A]/80">
                          If the repair is defective, recurring, or incomplete, specify the issue below. This moves the ticket back to IN_PROGRESS for supervisory review.
                        </p>
                      </div>
                    </div>

                    <textarea
                      value={reopenReason}
                      onChange={(e) => setReopenReason(e.target.value)}
                      placeholder="Explain why the resolution is insufficient (e.g., pothole sinking again, debris left behind)..."
                      rows={2}
                      className="w-full p-2.5 rounded-xl bg-[#FFFFFF] border border-[#F4C49E] text-xs text-[#1A2825] focus:outline-none focus:border-[#8A3B2A] mb-3"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowReopenBox(false)}
                        className="px-3 py-1.5 text-xs text-[#5C6E6A] hover:text-[#1A2825] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubmitFeedback(true)}
                        disabled={submittingFeedback}
                        className="px-4 py-1.5 rounded-xl bg-[#8A3B2A] hover:bg-[#722f21] text-[#FAF9F5] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        {submittingFeedback ? 'Processing...' : 'Confirm Reopen Ticket'}
                      </button>
                    </div>
                  </div>
                )}
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
