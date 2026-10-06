import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useGPS } from '../context/GPSContext.tsx';
import { getApiUrl } from '../lib/api.ts';
import {
  Wrench,
  CheckCircle2,
  Navigation,
  Clock,
  MapPin,
  Camera,
  Award,
} from 'lucide-react';

interface WorkerDashboardProps {
  navigate: (path: string) => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = () => {
  const { user, profile, getAuthToken } = useAuth();
  const { location: gpsLocation, calculateDistance, formatDistance } = useGPS();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<any | null>(null);

  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionPhoto, setCompletionPhoto] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
        if (data.length > 0 && !activeTask) {
          setActiveTask(data[0]);
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
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: updated.status } : t)));
        if (activeTask?.id === taskId) {
          setActiveTask((prev: any) => ({ ...prev, status: updated.status }));
        }
      }
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit completion evidence
  const handleCompleteTask = async () => {
    if (!activeTask || !completionNotes.trim()) return;
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
          completionNotes,
          completionMediaUrl: completionPhoto,
        }),
      });
      if (res.ok) {
        setShowCompletionModal(false);
        setCompletionNotes('');
        setCompletionPhoto(null);
        await fetchTasks();
      }
    } catch (err) {
      console.error('Completion submission failed:', err);
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
        await fetchTasks();
      }
    } catch (err) {
      console.error('Resolution verification failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCompletionPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

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

                    {activeTask.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => setShowCompletionModal(true)}
                        className="px-6 py-3 bg-[#2E6F5E] hover:bg-[#25584b] text-[#FAF9F5] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
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
                  <label className="block text-xs font-bold text-[#1A2825] uppercase tracking-wider mb-2 font-mono">
                    Completion Notes *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Filled pothole with cold asphalt mix, compacted surface, cleared road debris..."
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#D4CEBF] focus:border-[#1B3E36] rounded-xl p-3 text-sm text-[#1A2825] placeholder-[#8A9894] outline-none resize-none"
                  />
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
                    <div className="mt-3 w-28 h-20 rounded-xl overflow-hidden border border-[#D4CEBF] shadow-xs">
                      <img src={completionPhoto} alt="Resolution" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCompletionModal(false)}
                  className="px-4 py-2 text-[#5C6E6A] hover:text-[#1A2825] text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteTask}
                  disabled={actionLoading || !completionNotes.trim()}
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
