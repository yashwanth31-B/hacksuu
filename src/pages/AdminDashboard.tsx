import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { CivicMap } from '../components/CivicMap.tsx';
import { getApiUrl } from '../lib/api.ts';
import {
  Shield,
  Search,
  Plus,
  Trash2,
  Lock,
  AlertTriangle,
  Download,
} from 'lucide-react';

interface AdminDashboardProps {
  navigate: (path: string) => void;
}

type AdminTab =
  | 'overview'
  | 'complaints'
  | 'map'
  | 'verification'
  | 'crews'
  | 'fraud'
  | 'duplicates'
  | 'administrators'
  | 'audit'
  | 'health';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigate }) => {
  const { user, profile, getAuthToken, loginAsPersona, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Stats & Complaints
  const [stats, setStats] = useState<any>(null);
  const [complaintsList, setComplaintsList] = useState<any[]>([]);
  const [crewsList, setCrewsList] = useState<any[]>([]);
  const [fraudList, setFraudList] = useState<any[]>([]);
  const [duplicateList, setDuplicateList] = useState<any[]>([]);
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [, setLoading] = useState(true);

  // Selected item modal
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [assignCrewId, setAssignCrewId] = useState<string>('');
  const [actionReason, setActionReason] = useState<string>('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminOpError, setAdminOpError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Parallel fetch
      const [sRes, cRes, crRes, aRes] = await Promise.all([
        fetch(getApiUrl('/api/public/stats')),
        fetch(getApiUrl('/api/admin/complaints?limit=150'), { headers }),
        fetch(getApiUrl('/api/crews')),
        fetch(getApiUrl('/api/admin/administrators'), { headers }),
      ]);

      if (sRes.ok) setStats(await sRes.json());
      if (cRes.ok) setComplaintsList(await cRes.json());
      if (crRes.ok) setCrewsList(await crRes.json());
      if (aRes.ok) setAdminsList(await aRes.json());
    } catch (e) {
      console.error('Failed to load admin overview:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [user]);

  // Tab specific fetches
  useEffect(() => {
    const fetchTabData = async () => {
      const token = await getAuthToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'fraud') {
        const res = await fetch(getApiUrl('/api/admin/fraud'), { headers });
        if (res.ok) setFraudList(await res.json());
      } else if (activeTab === 'duplicates') {
        const res = await fetch(getApiUrl('/api/admin/duplicates'), { headers });
        if (res.ok) setDuplicateList(await res.json());
      } else if (activeTab === 'administrators') {
        const res = await fetch(getApiUrl('/api/admin/administrators'), { headers });
        if (res.ok) setAdminsList(await res.json());
      } else if (activeTab === 'audit') {
        const res = await fetch(getApiUrl('/api/admin/audit-logs'), { headers });
        if (res.ok) setAuditLogsList(await res.json());
      } else if (activeTab === 'health') {
        const res = await fetch(getApiUrl('/api/admin/system-health'), { headers });
        if (res.ok) setHealthStatus(await res.json());
      }
    };
    fetchTabData();
  }, [activeTab]);

  // Verify / Reject complaint
  const handleVerifyComplaint = async (id: number, action: 'VERIFY' | 'REJECT') => {
    try {
      const token = await getAuthToken();
      const res = await fetch(getApiUrl(`/api/admin/complaints/${id}/verify`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, reason: actionReason }),
      });
      if (res.ok) {
        setActionReason('');
        setSelectedComplaint(null);
        await fetchOverview();
      }
    } catch (e) {
      console.error('Verification failed:', e);
    }
  };

  // Assign crew
  const handleAssignCrew = async (id: number) => {
    if (!assignCrewId) return;
    try {
      const token = await getAuthToken();
      const res = await fetch(getApiUrl(`/api/admin/complaints/${id}/assign`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ crewId: Number(assignCrewId) }),
      });
      if (res.ok) {
        setAssignCrewId('');
        setSelectedComplaint(null);
        await fetchOverview();
      }
    } catch (e) {
      console.error('Assign failed:', e);
    }
  };

  // Add Administrator
  const handleAddAdmin = async () => {
    setAdminOpError(null);
    if (!newAdminEmail.trim()) return;
    try {
      const token = await getAuthToken();
      const res = await fetch(getApiUrl('/api/admin/administrators'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: newAdminEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminOpError(data.error || 'Failed to add administrator');
        return;
      }
      setNewAdminEmail('');
      setAdminsList((prev) => [data, ...prev]);
    } catch (err: any) {
      setAdminOpError(err.message || 'Network error');
    }
  };

  // Remove Administrator
  const handleRemoveAdmin = async (email: string) => {
    setAdminOpError(null);
    try {
      const token = await getAuthToken();
      const res = await fetch(getApiUrl(`/api/admin/administrators/${encodeURIComponent(email)}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminOpError(data.error || 'Failed to remove administrator');
        return;
      }
      setAdminsList((prev) => prev.filter((a) => a.email !== email));
    } catch (err: any) {
      setAdminOpError(err.message || 'Network error');
    }
  };

  // Filter complaints
  const filteredComplaints = complaintsList.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.complaintNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F9F6EE] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-amber-800" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono">
            COMMAND CLEARANCE REQUIRED
          </span>
          <h2 className="text-xl font-serif font-bold text-[#1A2825] mt-2 mb-2">
            Municipal Command Portal
          </h2>
          <p className="text-xs text-[#5C6E6A] mb-6">
            The Civic Operations Command Center is restricted to authorized municipal directors. Sign in with administrative credentials or authenticate via the verified Administrator persona.
          </p>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => loginAsPersona('admin')}
              className="w-full py-2.5 rounded-xl bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Shield className="w-4 h-4 text-[#E5A952]" />
              <span>Authenticate as Municipal Admin (1-Click)</span>
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E5E1D5] gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#B06D44]/10 text-[#B06D44] border border-[#B06D44]/20 font-mono">
                MUNICIPAL AUTHORITY PORTAL
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A2825] mt-1">
              CivicFix Operations Command
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={getApiUrl('/api/admin/export-csv')}
              download="civicfix_municipal_export.csv"
              className="px-3.5 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#FAF9F5] border border-[#D4CEBF] text-[#1B3E36] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-[#E5A952]" />
              <span>Export CSV Audit</span>
            </a>

            <div className="flex items-center gap-2 text-xs text-[#5C6E6A]">
              <Shield className="w-4 h-4 text-[#1B3E36]" />
              <span>Authenticated Administrator: <strong className="text-[#1A2825]">{user?.email}</strong></span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[#E5E1D5] text-xs font-bold uppercase tracking-wider font-mono">
          {[
            { id: 'overview', label: 'Overview & KPIs' },
            { id: 'complaints', label: `Complaints (${complaintsList.length})` },
            { id: 'map', label: 'Admin Live Map' },
            { id: 'verification', label: 'Verification' },
            { id: 'crews', label: 'Response Crews' },
            { id: 'fraud', label: 'Fraud Review' },
            { id: 'duplicates', label: 'Duplicate Check' },
            { id: 'administrators', label: 'Admin Accounts' },
            { id: 'audit', label: 'Audit Logs' },
            { id: 'health', label: 'System Health' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#1B3E36] text-[#FAF9F5] shadow-xs'
                  : 'text-[#5C6E6A] hover:text-[#1A2825] hover:bg-[#FAF9F5]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-5 shadow-xs">
                <div className="text-xs font-bold text-[#5C6E6A] uppercase font-mono">Total Reports</div>
                <div className="text-3xl font-serif font-black text-[#1A2825] mt-1">{stats?.total ?? 0}</div>
              </div>
              <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-5 shadow-xs">
                <div className="text-xs font-bold text-[#5C6E6A] uppercase font-mono">Pending Review</div>
                <div className="text-3xl font-serif font-black text-[#B06D44] mt-1">{stats?.pending ?? 0}</div>
              </div>
              <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-5 shadow-xs">
                <div className="text-xs font-bold text-[#5C6E6A] uppercase font-mono">Active Dispatched</div>
                <div className="text-3xl font-serif font-black text-[#1B3E36] mt-1">{stats?.inProgress ?? 0}</div>
              </div>
              <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-5 shadow-xs">
                <div className="text-xs font-bold text-[#5C6E6A] uppercase font-mono">Permanently Resolved</div>
                <div className="text-3xl font-serif font-black text-[#2E6F5E] mt-1">{stats?.resolved ?? 0}</div>
              </div>
            </div>

            {/* Quick Actions & Recent Queue */}
            <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-serif font-bold text-[#1A2825]">Recent Intake Reports</h2>
                <button
                  onClick={() => setActiveTab('complaints')}
                  className="text-xs font-mono font-bold text-[#1B3E36] hover:underline cursor-pointer"
                >
                  VIEW ALL COMPLAINTS →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F0E6] text-[#5C6E6A] font-mono font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Ref ID</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Title</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Reported</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D5]">
                    {complaintsList.slice(0, 6).map((c) => (
                      <tr key={c.id} className="hover:bg-[#FFFFFF]">
                        <td className="p-3 font-mono font-bold text-[#1B3E36]">{c.complaintNumber}</td>
                        <td className="p-3 font-semibold text-[#1A2825]">{c.category}</td>
                        <td className="p-3 text-[#1A2825] max-w-xs truncate">{c.title}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#D4CEBF] uppercase font-bold text-[10px] text-[#1A2825]">
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-[10px] uppercase text-[#B06D44] font-mono">
                            {c.priority}
                          </span>
                        </td>
                        <td className="p-3 text-[#5C6E6A]">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedComplaint(c)}
                            className="px-2.5 py-1 bg-[#FAF9F5] hover:bg-[#F2EFE7] border border-[#D4CEBF] text-[#1A2825] font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPLAINTS MANAGEMENT */}
        {activeTab === 'complaints' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-2xl p-4 flex flex-wrap items-center gap-3 shadow-xs">
              <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-[#FFFFFF] border border-[#D4CEBF] rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-[#5C6E6A]" />
                <input
                  type="text"
                  placeholder="Search by ID, keyword, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-xs text-[#1A2825] placeholder-[#8A9894] outline-none w-full"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#FFFFFF] border border-[#D4CEBF] text-xs text-[#1A2825] font-mono rounded-xl px-3 py-2 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="REPORTED">Reported</option>
                <option value="VERIFIED">Verified</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#FFFFFF] border border-[#D4CEBF] text-xs text-[#1A2825] font-mono rounded-xl px-3 py-2 outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="Pothole">Pothole</option>
                <option value="Garbage">Garbage</option>
                <option value="Road Damage">Road Damage</option>
                <option value="Streetlight">Streetlight</option>
                <option value="Drainage">Drainage</option>
                <option value="Water Leakage">Water Leakage</option>
              </select>
            </div>

            {/* Complaints Table */}
            <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F0E6] text-[#5C6E6A] font-mono font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Complaint ID</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Title & Location</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Priority</th>
                      <th className="p-3.5">Reported By</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D5]">
                    {filteredComplaints.map((c) => (
                      <tr key={c.id} className="hover:bg-[#FFFFFF]">
                        <td className="p-3.5 font-mono font-bold text-[#1B3E36]">{c.complaintNumber}</td>
                        <td className="p-3.5 font-semibold text-[#1A2825]">{c.category}</td>
                        <td className="p-3.5 max-w-sm">
                          <div className="font-semibold text-[#1A2825] truncate">{c.title}</div>
                          <div className="text-[11px] text-[#5C6E6A] truncate">{c.address}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#D4CEBF] uppercase font-bold text-[10px] text-[#1A2825]">
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-[10px] uppercase text-[#B06D44] font-mono">
                            {c.priority}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-[#2E6F5E]">{c.anonymousPublicId}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedComplaint(c)}
                            className="px-3 py-1.5 bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-xs"
                          >
                            Inspect & Assign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADMIN LIVE MAP */}
        {activeTab === 'map' && (
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 shadow-xs">
            <div className="mb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-1">
                GEOGRAPHIC COMMAND
              </div>
              <h2 className="text-lg font-serif font-bold text-[#1A2825]">Administrative GIS City Map</h2>
              <p className="text-xs text-[#5C6E6A]">
                Click any issue marker to view details and execute immediate field crew assignment.
              </p>
            </div>
            <CivicMap
              complaints={complaintsList}
              heightClass="h-[600px]"
              onSelectComplaint={(c) => setSelectedComplaint(c)}
            />
          </div>
        )}

        {/* TAB 4: RESOLUTION VERIFICATION */}
        {activeTab === 'verification' && (
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 shadow-xs">
            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-1">
                COMPLETION AUDIT
              </div>
              <h2 className="text-lg font-serif font-bold text-[#1A2825]">Supervisory Resolution Verification</h2>
              <p className="text-xs text-[#5C6E6A]">
                Review completed field repairs and verified photos before granting permanent closure.
              </p>
            </div>

            <div className="space-y-4">
              {complaintsList
                .filter((c) => c.status === 'COMPLETED')
                .map((comp) => (
                  <div
                    key={comp.id}
                    className="bg-[#FFFFFF] border border-[#E5E1D5] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-[#1B3E36]">
                          {comp.complaintNumber}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E6F2ED] text-[#1B4D3E] border border-[#A8CEBE] uppercase font-mono">
                          COMPLETED
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#1A2825]">{comp.title}</h3>
                      <p className="text-xs text-[#5C6E6A]">{comp.address}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedComplaint(comp)}
                        className="px-4 py-2 bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                      >
                        Inspect Proof
                      </button>
                    </div>
                  </div>
                ))}
              {complaintsList.filter((c) => c.status === 'COMPLETED').length === 0 && (
                <div className="py-12 text-center text-[#5C6E6A] text-xs font-mono">
                  No completed jobs currently awaiting verification.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: RESPONSE CREWS */}
        {activeTab === 'crews' && (
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-1">
              FIELD UNITS
            </div>
            <h2 className="text-lg font-serif font-bold text-[#1A2825] mb-2">Municipal Field Response Crews</h2>
            <p className="text-xs text-[#5C6E6A] mb-6">
              Assigned response units responsible for executing civil repairs and maintenance.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {crewsList.map((crew) => (
                <div key={crew.id} className="bg-[#FFFFFF] border border-[#E5E1D5] p-5 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-[#5C6E6A]">Crew #{crew.id}</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2E6F5E]"></span>
                  </div>
                  <h3 className="text-sm font-bold text-[#1A2825]">{crew.crewName}</h3>
                  <div className="text-xs text-[#5C6E6A] mt-1 font-mono">Status: Active Service</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: FRAUD REVIEW */}
        {activeTab === 'fraud' && (
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-1">
              RISK HEURISTICS
            </div>
            <h2 className="text-lg font-serif font-bold text-[#1A2825] mb-2">Spam & Fraud Review Queue</h2>
            <p className="text-xs text-[#5C6E6A] mb-6">
              Heuristic and AI flagged submissions requiring human verification.
            </p>

            <div className="space-y-3">
              {fraudList.map((flag) => (
                <div
                  key={flag.id}
                  className="bg-[#FFFFFF] border border-[#E5E1D5] p-4 rounded-2xl flex items-center justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFF1E6] text-[#8A3B2A] border border-[#F4C49E] uppercase font-mono">
                        Risk: {flag.riskLevel}
                      </span>
                      <span className="text-xs text-[#5C6E6A]">Confidence: {Math.round(flag.confidence * 100)}%</span>
                    </div>
                    <div className="text-xs font-bold text-[#1A2825]">{flag.detectedType}</div>
                  </div>
                  <div className="text-xs text-[#5C6E6A] font-mono">{flag.reviewStatus}</div>
                </div>
              ))}
              {fraudList.length === 0 && (
                <div className="py-12 text-center text-[#5C6E6A] text-xs font-mono">
                  Zero active fraud or spam flags detected.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: DUPLICATES */}
        {activeTab === 'duplicates' && (
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-1">
              GEO-SPATIAL CLUSTERING
            </div>
            <h2 className="text-lg font-serif font-bold text-[#1A2825] mb-2">Proximity Duplicate Reports</h2>
            <p className="text-xs text-[#5C6E6A] mb-6">
              Reports automatically flagged for high spatial and category proximity.
            </p>

            <div className="space-y-3">
              {duplicateList.map((dup) => (
                <div
                  key={dup.id}
                  className="bg-[#FFFFFF] border border-[#E5E1D5] p-4 rounded-2xl flex items-center justify-between text-xs shadow-xs"
                >
                  <div>
                    <span className="text-[#1A2825] font-bold font-mono">Complaint #{dup.complaintId}</span>
                    <span className="text-[#5C6E6A] ml-2">Potential Duplicate of #{dup.possibleDuplicateId}</span>
                  </div>
                  <div className="text-[#B06D44] font-bold font-mono">{Math.round(dup.similarityScore * 100)}% Match</div>
                </div>
              ))}
              {duplicateList.length === 0 && (
                <div className="py-12 text-center text-[#5C6E6A] text-xs font-mono">
                  No pending duplicate records to review.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 8: ADMINISTRATOR MANAGEMENT */}
        {activeTab === 'administrators' && (
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E1D5]">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-1">
                  ACCESS CONTROL
                </div>
                <h2 className="text-lg font-serif font-bold text-[#1A2825]">Administrator Management</h2>
                <p className="text-xs text-[#5C6E6A]">
                  Manage authorized municipal administrator email accounts. Server-side verified.
                </p>
              </div>
            </div>

            {/* Add Administrator Form */}
            <div className="bg-[#FFFFFF] border border-[#E5E1D5] rounded-2xl p-5 shadow-xs">
              <label className="block text-xs font-bold text-[#1A2825] uppercase tracking-wider mb-2 font-mono">
                Authorize New Administrator Email
              </label>
              <div className="flex gap-2 max-w-md">
                <input
                  type="email"
                  placeholder="new.admin@municipality.gov"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="flex-1 bg-[#FAF9F5] border border-[#D4CEBF] focus:border-[#1B3E36] rounded-xl px-3.5 py-2 text-xs text-[#1A2825] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddAdmin}
                  className="px-4 py-2 bg-[#E5A952] hover:bg-[#d99d45] text-[#102621] text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Authorize</span>
                </button>
              </div>

              {adminOpError && (
                <div className="mt-3 text-[#8A3B2A] bg-[#FFF1E6] border border-[#F4C49E] p-2 rounded-lg text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{adminOpError}</span>
                </div>
              )}
            </div>

            {/* Administrator Emails List */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#5C6E6A] font-mono mb-2">
                Currently Authorized Administrators ({adminsList.length})
              </div>
              {adminsList.map((adm) => (
                <div
                  key={adm.id || adm.email}
                  className="bg-[#FFFFFF] border border-[#E5E1D5] rounded-xl px-4 py-3 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-[#1B3E36]" />
                    <span className="text-xs font-bold text-[#1A2825]">{adm.email}</span>
                    <span className="text-[10px] text-[#5C6E6A] font-mono">Added by: {adm.addedBy}</span>
                  </div>

                  {adminsList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAdmin(adm.email)}
                      className="text-[#8A9894] hover:text-[#B06D44] p-1.5 transition-colors cursor-pointer"
                      title="Revoke Admin Access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-1">
              RECORD OF RECORD
            </div>
            <h2 className="text-lg font-serif font-bold text-[#1A2825] mb-2">Protected Municipal Audit Trail</h2>
            <p className="text-xs text-[#5C6E6A] mb-6">
              Immutable server-side logs recording administrative assignments, verifications, and permissions.
            </p>

            <div className="space-y-2 font-mono text-xs">
              {auditLogsList.map((log) => (
                <div
                  key={log.id}
                  className="bg-[#FFFFFF] border border-[#E5E1D5] p-3 rounded-xl flex items-center justify-between shadow-xs"
                >
                  <div>
                    <span className="text-[#1B3E36] font-bold">[{log.action}]</span>
                    <span className="text-[#1A2825] ml-2 font-semibold">{log.entityType} ({log.entityId})</span>
                    <span className="text-[#5C6E6A] ml-2">by {log.actorId}</span>
                  </div>
                  <span className="text-[10px] text-[#8A9894]">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
              {auditLogsList.length === 0 && (
                <div className="py-12 text-center text-[#5C6E6A] text-xs">No audit logs recorded yet.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 10: SYSTEM HEALTH */}
        {activeTab === 'health' && (
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-1">
                TELEMETRY & STATUS
              </div>
              <h2 className="text-lg font-serif font-bold text-[#1A2825]">System Infrastructure Health</h2>
              <p className="text-xs text-[#5C6E6A]">
                Live connection monitoring for database, authentication, maps, and AI vision services.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#FFFFFF] border border-[#E5E1D5] rounded-2xl p-5 flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-xs text-[#5C6E6A] font-medium font-mono uppercase">Relational Database</div>
                  <div className="text-base font-serif font-bold text-[#1A2825]">PostgreSQL / Supabase</div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-[#E6F2ED] text-[#1B4D3E] border border-[#A8CEBE]">
                  {healthStatus?.database || 'CONNECTED'}
                </span>
              </div>

              <div className="bg-[#FFFFFF] border border-[#E5E1D5] rounded-2xl p-5 flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-xs text-[#5C6E6A] font-medium font-mono uppercase">Authentication Authority</div>
                  <div className="text-base font-serif font-bold text-[#1A2825]">Firebase & Google OAuth</div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-[#E6F2ED] text-[#1B4D3E] border border-[#A8CEBE]">
                  {healthStatus?.authentication || 'CONNECTED'}
                </span>
              </div>

              <div className="bg-[#FFFFFF] border border-[#E5E1D5] rounded-2xl p-5 flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-xs text-[#5C6E6A] font-medium font-mono uppercase">GIS & Map Engine</div>
                  <div className="text-base font-serif font-bold text-[#1A2825]">MapLibre GL & Vector Tiles</div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-[#E6F2ED] text-[#1B4D3E] border border-[#A8CEBE]">
                  {healthStatus?.maps || 'CONFIGURED'}
                </span>
              </div>

              <div className="bg-[#FFFFFF] border border-[#E5E1D5] rounded-2xl p-5 flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-xs text-[#5C6E6A] font-medium font-mono uppercase">Civic AI Computer Vision</div>
                  <div className="text-base font-serif font-bold text-[#1A2825]">Gemini AI Vision</div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-[#1B3E36]/10 text-[#1B3E36] border border-[#1B3E36]/20">
                  {healthStatus?.ai || 'CONFIGURED'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action / Inspect Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FAF9F5] border border-[#D4CEBF] rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
              <div className="flex items-start justify-between pb-4 border-b border-[#E5E1D5]">
                <div>
                  <span className="font-mono text-xs font-bold text-[#1B3E36]">
                    {selectedComplaint.complaintNumber}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#1A2825] mt-0.5">{selectedComplaint.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="text-[#5C6E6A] hover:text-[#1A2825] p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-[#1A2825] bg-[#FFFFFF] p-4 rounded-xl border border-[#E5E1D5] leading-relaxed shadow-xs">
                {selectedComplaint.description}
              </div>

              {selectedComplaint.media && selectedComplaint.media.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-2">
                    Evidence Photos
                  </div>
                  <div className="flex gap-3 overflow-x-auto">
                    {selectedComplaint.media.map((m: any, i: number) => (
                      <div key={i} className="w-36 h-28 rounded-xl overflow-hidden border border-[#D4CEBF] shrink-0 shadow-xs">
                        <img src={m.fileUrl} alt="Evidence" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action 1: Verify or Reject */}
              <div className="bg-[#FFFFFF] border border-[#E5E1D5] p-4 rounded-2xl space-y-3 shadow-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-[#1A2825] font-mono">
                  Report Verification
                </div>
                <input
                  type="text"
                  placeholder="Verification note / reason for decision..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#D4CEBF] focus:border-[#1B3E36] rounded-xl px-3.5 py-2 text-xs text-[#1A2825] outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerifyComplaint(selectedComplaint.id, 'VERIFY')}
                    className="px-4 py-2 bg-[#2E6F5E] hover:bg-[#25584b] text-[#FAF9F5] text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-xs"
                  >
                    Verify Report
                  </button>
                  <button
                    onClick={() => handleVerifyComplaint(selectedComplaint.id, 'REJECT')}
                    className="px-4 py-2 bg-[#FFF1E6] hover:bg-[#ffe6d6] border border-[#F4C49E] text-[#8A3B2A] text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Reject Invalid Report
                  </button>
                </div>
              </div>

              {/* Action 2: Crew Assignment */}
              <div className="bg-[#FFFFFF] border border-[#E5E1D5] p-4 rounded-2xl space-y-3 shadow-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-[#1A2825] font-mono">
                  Dispatch Field Crew
                </div>
                <div className="flex gap-2">
                  <select
                    value={assignCrewId}
                    onChange={(e) => setAssignCrewId(e.target.value)}
                    className="flex-1 bg-[#FAF9F5] border border-[#D4CEBF] text-xs text-[#1A2825] rounded-xl px-3 py-2 outline-none font-mono"
                  >
                    <option value="">Select Response Crew...</option>
                    {crewsList.map((cr) => (
                      <option key={cr.id} value={cr.id}>
                        {cr.crewName}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAssignCrew(selectedComplaint.id)}
                    disabled={!assignCrewId}
                    className="px-4 py-2 bg-[#E5A952] hover:bg-[#d99d45] text-[#102621] text-xs font-bold uppercase tracking-wider rounded-xl disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    Dispatch Crew
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="px-5 py-2 bg-[#FAF9F5] hover:bg-[#F2EFE7] border border-[#D4CEBF] text-[#1A2825] text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
