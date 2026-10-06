import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useGPS } from '../context/GPSContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { getApiUrl } from '../lib/api.ts';
import {
  Wrench,
  CheckCircle2,
  Navigation,
  Clock,
  MapPin,
  Camera,
  Award,
  Sparkles,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

interface WorkerDashboardProps {
  navigate: (path: string) => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({ navigate }) => {
  const { user, profile, getAuthToken, loginAsPersona, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const { location: gpsLocation, calculateDistance, formatDistance } = useGPS();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<any | null>(null);

  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionPhoto, setCompletionPhoto] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [auditingAi, setAuditingAi] = useState(false);
  const [aiAuditResult, setAiAuditResult] = useState<any | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) return;
      const res = await fetch(getApiUrl('/api/worker/tasks'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        if (data.length > 0) {
          if (!activeTask) {
            setActiveTask(data[0]);
          } else {
            const current = data.find((t: any) => t.id === activeTask.id);
            if (current) setActiveTask(current);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load worker tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  // Worker workflow actions
  const handleTaskAction = async (taskId: number, action: 'accept' | 'arrived' | 'start') => {
    setActionLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(getApiUrl(`/api/worker/tasks/${taskId}/${action}`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const updated = await res.json();
        const actionLabels: Record<string, string> = {
          accept: 'Assignment Accepted (+5 Credits)',
          arrived: 'On-Site Arrival Marked (+10 Credits)',
          start: 'Work In Progress (+5 Credits)',
        };
        showToast({
          title: 'Status Updated',
          message: actionLabels[action] || `Task updated to ${updated.status}`,
          type: 'success',
        });
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: updated.status } : t)));
        if (activeTask?.id === taskId) {
          setActiveTask((prev: any) => ({ ...prev, status: updated.status }));
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast({
          title: 'Action Failed',
          message: errData.error || `Failed to perform ${action}`,
          type: 'error',
        });
      }
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
      showToast({
        title: 'Error',
        message: `Action ${action} failed due to network error.`,
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit completion evidence
  const handleCompleteTask = async () => {
    if (!activeTask) return;
    const finalNotes = completionNotes.trim() || (completionPhoto ? 'Remediation completed by field response crew with photo evidence.' : '');
    if (!finalNotes) {
      showToast({
        title: 'Notes Required',
        message: 'Please provide completion notes describing the repair work.',
        type: 'error',
      });
      return;
    }
    setActionLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(getApiUrl(`/api/worker/tasks/${activeTask.id}/complete`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          completionNotes: finalNotes,
          completionMediaUrl: completionPhoto,
        }),
      });
      if (res.ok) {
        const updated = await res.json().catch(() => null);
        setShowCompletionModal(false);
        setCompletionNotes('');
        setCompletionPhoto(null);
        setAiAuditResult(null);
        showToast({
          title: 'Work Completed',
          message: 'Resolution proof submitted successfully (+25 Credits). Awaiting supervisor verification.',
          type: 'success',
        });
        setTasks((prev) =>
          prev.map((t) => (t.id === activeTask.id ? { ...t, status: 'COMPLETED', ...(updated || {}) } : t))
        );
        setActiveTask((prev: any) => ({
          ...prev,
          status: 'COMPLETED',
          ...(updated || {}),
        }));
        await fetchTasks();
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast({
          title: 'Submission Failed',
          message: errData.error || 'Failed to submit completion proof.',
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Completion submission failed:', err);
      showToast({
        title: 'Network Error',
        message: 'Could not connect to the server to submit completion.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Supervisor verification action
  const handleVerifyResolution = async (taskId: number, approved: boolean) => {
    setActionLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(getApiUrl(`/api/worker/tasks/${taskId}/verify-resolution`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          approved,
          rejectionReason: approved ? null : 'Resolution evidence was incomplete.',
        }),
      });
      if (res.ok) {
        const updated = await res.json().catch(() => null);
        showToast({
          title: approved ? 'Resolution Approved' : 'Task Reopened',
          message: approved ? 'Issue closed and resolution verified (+50 Credits awarded).' : 'Task reopened for rectification.',
          type: approved ? 'success' : 'info',
        });
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: approved ? 'RESOLVED' : 'REOPENED', ...(updated || {}) } : t)));
        if (activeTask?.id === taskId) {
          setActiveTask((prev: any) => ({ ...prev, status: approved ? 'RESOLVED' : 'REOPENED', ...(updated || {}) }));
        }
        await fetchTasks();
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast({
          title: 'Verification Failed',
          message: errData.error || 'Failed to verify resolution.',
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Resolution verification failed:', err);
      showToast({
        title: 'Network Error',
        message: 'Could not connect to verify resolution.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCompletionPhoto(reader.result as string);
      setAiAuditResult(null); // Reset prior audit for new photo
    };
    reader.readAsDataURL(file);
  };

  const handleRunAiAudit = async () => {
    if (!activeTask || !completionPhoto || auditingAi) return;
    setAuditingAi(true);
    try {
      const token = await getAuthToken();
      const beforeImg = activeTask.media && activeTask.media.length > 0 ? activeTask.media[0].fileUrl : null;
      const res = await fetch(getApiUrl(`/api/worker/tasks/${activeTask.id}/audit-resolution`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          beforeImageBase64: beforeImg,
          afterImageBase64: completionPhoto,
          category: activeTask.category,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAiAuditResult(data.audit);
        showToast({
          title: 'AI Visual Audit Passed',
          message: `${Math.round(data.audit.confidence * 100)}% Confidence: ${data.audit.recommendation}`,
          type: 'success',
        });
        if (!completionNotes.trim()) {
          setCompletionNotes(data.audit.analysis);
        }
      } else {
        showToast({
          title: 'AI Audit Notice',
          message: data.error || 'AI visual audit evaluation unavailable.',
          type: 'error',
        });
      }
    } catch {
      showToast({ title: 'Network Error', message: 'Failed to connect to AI audit service.', type: 'error' });
    } finally {
      setAuditingAi(false);
    }
  };

  const isAuthorizedWorker =
    user &&
    (profile?.role === 'worker' || profile?.role === 'supervisor' || profile?.role === 'admin');

  if (!isAuthorizedWorker) {
    return (
      <div className="min-h-screen bg-[#F9F6EE] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-7 h-7 text-blue-800" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-mono">
            CREW DISPATCH CLEARANCE REQUIRED
          </span>
          <h2 className="text-xl font-serif font-bold text-[#1A2825] mt-2 mb-2">
            Field Response Operations
          </h2>
          <p className="text-xs text-[#5C6E6A] mb-6">
            The Field Response Crew portal is restricted to municipal maintenance staff and contractors. Sign in with crew credentials or authenticate via the Field Crew Lead persona.
          </p>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => loginAsPersona('worker')}
              className="w-full py-2.5 rounded-xl bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Wrench className="w-4 h-4 text-[#E5A952]" />
              <span>Authenticate as Field Crew Lead (1-Click)</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-2.5 rounded-xl border border-[#D5D1C5] bg-white hover:bg-slate-50 text-xs font-bold text-[#1A2825] uppercase tracking-wider transition-colors cursor-pointer"
            >
              Sign In with Credentials
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full text-xs text-[#5C6E6A] hover:text-[#1A2825] py-1 font-medium"
            >
              Return to Resident Desk
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F6EE] text-[#1A2825] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E1D5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#2E6F5E]/10 text-[#1B4D3E] border border-[#A8CEBE] font-mono">
                FIELD RESPONSE OPERATIONS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A2825] mt-1">
              Field Worker & Crew Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#FAF9F5] border border-[#E5E1D5] px-4 py-2 rounded-2xl flex items-center gap-2 shadow-xs">
              <Award className="w-5 h-5 text-[#E5A952]" />
              <div>
                <div className="text-[10px] text-[#5C6E6A] font-bold uppercase font-mono">Performance Credit</div>
                <div className="text-sm font-serif font-bold text-[#1A2825]">Active Dispatch</div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout: Tasks list + Active Task Focus */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Assigned Tasks */}
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-5 space-y-3 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-2">
              Assigned Work Queue ({tasks.length})
            </div>

            {loading ? (
              <div className="py-8 text-center text-[#5C6E6A] text-xs font-mono">Loading queue...</div>
            ) : tasks.length === 0 ? (
              <div className="py-8 text-center text-[#5C6E6A] text-xs font-mono">
                No active tasks currently assigned to this response unit.
              </div>
            ) : (
              tasks.map((task) => {
                const isSelected = activeTask?.id === task.id;
                return (
                  <div
                    key={task.id}
                    onClick={() => setActiveTask(task)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1B3E36]/10 border-[#1B3E36] text-[#1A2825] font-bold shadow-xs'
                        : 'bg-[#FFFFFF] border-[#E5E1D5] hover:border-[#D4CEBF] text-[#1A2825]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-[#1B3E36]">
                        {task.complaintNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#D4CEBF] uppercase font-mono">
                        {task.status}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#1A2825] truncate">{task.title}</div>
                    <div className="text-xs text-[#5C6E6A] truncate mt-0.5">{task.address}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Active Task Details & Action Workflow */}
          <div className="lg:col-span-2 space-y-6">
            {activeTask ? (
              <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E5E1D5]">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#1B3E36]">
                      {activeTask.complaintNumber}
                    </span>
                    <h2 className="text-xl font-serif font-bold text-[#1A2825] mt-0.5">{activeTask.title}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] uppercase font-mono">
                      Status: {activeTask.status}
                    </span>
                  </div>
                </div>

                {/* Location & Navigation */}
                <div className="bg-[#FFFFFF] border border-[#E5E1D5] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[#B06D44] shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-[#1A2825] flex items-center gap-2">
                        <span>{activeTask.address}</span>
                        {calculateDistance(activeTask.latitude, activeTask.longitude) !== null && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E6F2ED] text-[#1B4D3E] border border-[#A8CEBE] font-bold">
                            📍 {formatDistance(calculateDistance(activeTask.latitude, activeTask.longitude))}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#5C6E6A] font-mono mt-0.5">
                        GPS: {activeTask.latitude}, {activeTask.longitude}
                        {gpsLocation && (
                          <span className="text-[#1B3E36] font-bold ml-2">
                            (Your GPS: {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <a
                    href={
                      gpsLocation
                        ? `https://www.google.com/maps/dir/?api=1&origin=${gpsLocation.lat},${gpsLocation.lng}&destination=${activeTask.latitude},${activeTask.longitude}`
                        : `https://www.google.com/maps/dir/?api=1&destination=${activeTask.latitude},${activeTask.longitude}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors self-start sm:self-auto cursor-pointer shadow-xs"
                  >
                    <Navigation className="w-4 h-4 text-[#E5A952]" />
                    <span>Navigate via GPS</span>
                  </a>
                </div>

                {/* Description & Citizen Evidence */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C6E6A] font-mono mb-2">
                    Reported Issue Description
                  </h3>
                  <p className="text-sm text-[#1A2825] leading-relaxed bg-[#FFFFFF] p-4 rounded-2xl border border-[#E5E1D5] shadow-xs">
                    {activeTask.description}
                  </p>
                </div>

                {/* Citizen Evidence Photo */}
                {activeTask.media && activeTask.media.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-2">
                      Citizen Evidence Photos
                    </h3>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {activeTask.media.map((m: any, i: number) => (
                        <div key={i} className="w-36 h-28 rounded-xl overflow-hidden border border-[#D4CEBF] shrink-0 shadow-xs">
                          <img src={m.fileUrl} alt="Evidence" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive Workflow Buttons */}
                <div className="pt-4 border-t border-[#E5E1D5]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C6E6A] font-mono mb-3">
                    Response Unit Field Workflow
                  </h3>

                  <div className="flex flex-wrap gap-3">
                    {(activeTask.status === 'REPORTED' || activeTask.status === 'VERIFIED') && (
                      <button
                        onClick={() => handleTaskAction(activeTask.id, 'accept')}
                        disabled={actionLoading}
                        className="px-6 py-3 bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#E5A952]" />
                        <span>Claim & Accept Dispatch (+5 Credits)</span>
                      </button>
                    )}

                    {activeTask.status === 'ASSIGNED' && (
                      <button
                        onClick={() => handleTaskAction(activeTask.id, 'accept')}
                        disabled={actionLoading}
                        className="px-6 py-3 bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#E5A952]" />
                        <span>Accept Assignment (+5 Credits)</span>
                      </button>
                    )}

                    {activeTask.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleTaskAction(activeTask.id, 'arrived')}
                        disabled={actionLoading}
                        className="px-6 py-3 bg-[#E5A952] hover:bg-[#d99d45] text-[#102621] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Mark On-Site Arrival (+10 Credits)</span>
                      </button>
                    )}

                    {activeTask.status === 'ARRIVED' && (
                      <button
                        onClick={() => handleTaskAction(activeTask.id, 'start')}
                        disabled={actionLoading}
                        className="px-6 py-3 bg-[#527E74] hover:bg-[#43675f] text-[#FAF9F5] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <Wrench className="w-4 h-4" />
                        <span>Commence Active Work (+5 Credits)</span>
                      </button>
                    )}

                    {activeTask.status === 'REOPENED' && (
                      <button
                        onClick={() => handleTaskAction(activeTask.id, 'start')}
                        disabled={actionLoading}
                        className="px-6 py-3 bg-[#B06D44] hover:bg-[#975833] text-[#FAF9F5] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <Wrench className="w-4 h-4" />
                        <span>Resume Remediation Work (+5 Credits)</span>
                      </button>
                    )}

                    {/* Submit Completion Proof available whenever task is not yet completed or resolved */}
                    {activeTask.status !== 'COMPLETED' && activeTask.status !== 'RESOLVED' && (
                      <button
                        onClick={() => setShowCompletionModal(true)}
                        className={`px-6 py-3 text-[#FAF9F5] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-xs cursor-pointer ${
                          activeTask.status === 'IN_PROGRESS'
                            ? 'bg-[#2E6F5E] hover:bg-[#25584b]'
                            : 'bg-[#234B41] hover:bg-[#1B3E36]'
                        }`}
                      >
                        <Camera className="w-4 h-4 text-[#E5A952]" />
                        <span>Submit Completion Proof (+25 Credits)</span>
                      </button>
                    )}

                    {activeTask.status === 'COMPLETED' && (
                      <div className="bg-[#E6F2ED] border border-[#A8CEBE] p-4 rounded-2xl w-full">
                        <div className="flex items-center gap-2 text-[#1B4D3E] text-xs font-bold mb-2 font-mono">
                          <Clock className="w-4 h-4" />
                          <span>WORK SUBMITTED - AWAITING VERIFICATION</span>
                        </div>
                        <p className="text-xs text-[#5C6E6A]">
                          Field evidence uploaded. Final resolution credits (+50 points) will be awarded once inspected by a supervisor or administrator.
                        </p>

                        {(profile?.role === 'admin' || profile?.role === 'supervisor') && (
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => handleVerifyResolution(activeTask.id, true)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-[#2E6F5E] hover:bg-[#25584b] text-[#FAF9F5] text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                            >
                              Approve Resolution (Close Issue)
                            </button>
                            <button
                              onClick={() => handleVerifyResolution(activeTask.id, false)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-[#FFF1E6] hover:bg-[#ffe6d6] text-[#8A3B2A] border border-[#F4C49E] text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                            >
                              Reject & Reopen
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-12 text-center text-[#5C6E6A] text-sm font-mono shadow-xs">
                Select a task from the queue to view details and action workflow.
              </div>
            )}
          </div>
        </div>

        {/* Completion Modal */}
        {showCompletionModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FAF9F5] border border-[#D4CEBF] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
              <h3 className="text-xl font-serif font-bold text-[#1A2825] mb-2">Submit Work Completion Proof</h3>
              <p className="text-xs text-[#5C6E6A] mb-6">
                Upload resolution photos and describe the completed repair work for supervisor verification.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#1A2825] uppercase tracking-wider font-mono">
                      Completion Notes *
                    </label>
                    <span className="text-[10px] text-[#5C6E6A]">Quick-select or type custom notes:</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="e.g. Filled pothole with cold asphalt mix, compacted surface, cleared road debris..."
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#D4CEBF] focus:border-[#1B3E36] rounded-xl p-3 text-sm text-[#1A2825] placeholder-[#8A9894] outline-none resize-none mb-2"
                  />
                  {/* Quick-fill preset chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Road patched with cold asphalt mix and roller compacted',
                      'Stormwater drain desilted and debris choke removed',
                      'Public garbage backlog cleared, bin sanitized',
                      'Streetlight repaired, fixture and wiring operational',
                      'Water pipeline leak sealed and pressure tested',
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCompletionNotes(preset)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-[#E6F2ED] hover:bg-[#d0e7dc] text-[#1B4D3E] border border-[#A8CEBE] font-medium transition-colors cursor-pointer"
                      >
                        + {preset.slice(0, 32)}...
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A2825] uppercase tracking-wider mb-2 font-mono">
                    Resolution Photo Evidence
                  </label>
                  <label className="border-2 border-dashed border-[#D4CEBF] bg-[#FFFFFF] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#1B3E36] transition-colors">
                    <Camera className="w-6 h-6 text-[#1B3E36] mb-2" />
                    <span className="text-xs font-bold text-[#1A2825]">Click to upload completion photo</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>

                  {completionPhoto && (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-28 h-20 rounded-xl overflow-hidden border border-[#D4CEBF] shadow-xs">
                          <img src={completionPhoto} alt="Resolution" className="w-full h-full object-cover" />
                        </div>

                        <button
                          type="button"
                          onClick={handleRunAiAudit}
                          disabled={auditingAi}
                          className="px-4 py-2.5 rounded-xl bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {auditingAi ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-[#E5A952]" />
                              <span>Auditing Evidence...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-[#E5A952]" />
                              <span>Run AI Visual Audit</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* AI Audit Feedback Card */}
                      {aiAuditResult && (
                        <div className="p-3.5 rounded-2xl bg-[#E6F2ED] border border-[#A8CEBE] text-xs text-[#1B4D3E] space-y-2 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1.5 font-mono">
                              <ShieldCheck className="w-4 h-4 text-[#1B4D3E]" />
                              <span>Audit Match: {Math.round(aiAuditResult.confidence * 100)}%</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#1B4D3E] text-[#FAF9F5] text-[10px] font-mono font-bold">
                              {aiAuditResult.recommendation}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#2C4D46] leading-relaxed">
                            {aiAuditResult.analysis}
                          </p>
                          {aiAuditResult.detectedImprovements && aiAuditResult.detectedImprovements.length > 0 && (
                            <div className="pt-2 border-t border-[#A8CEBE]/50 space-y-1">
                              <div className="text-[10px] uppercase font-bold text-[#1B4D3E] font-mono">
                                Detected Improvements:
                              </div>
                              {aiAuditResult.detectedImprovements.map((imp: string, i: number) => (
                                <div key={i} className="text-[11px] flex items-center gap-1.5 text-[#2C4D46]">
                                  <span>✓</span>
                                  <span>{imp}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCompletionModal(false)}
                  className="px-4 py-2 text-[#5C6E6A] hover:text-[#1A2825] text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteTask}
                  disabled={actionLoading || (!completionNotes.trim() && !completionPhoto)}
                  className="px-6 py-2.5 bg-[#2E6F5E] hover:bg-[#25584b] text-[#FAF9F5] font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Resolution Proof'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
