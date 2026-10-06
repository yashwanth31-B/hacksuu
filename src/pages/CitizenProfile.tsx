import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { getApiUrl } from '../lib/api.ts';
import {
  Shield,
  User,
  Bell,
  LogOut,
  Mail,
} from 'lucide-react';

interface CitizenProfileProps {
  navigate: (path: string) => void;
}

export const CitizenProfile: React.FC<CitizenProfileProps> = ({ navigate }) => {
  const { user, profile, logout, getAuthToken } = useAuth();
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const token = await getAuthToken();
      if (!token) return;
      const res = await fetch(getApiUrl('/api/notifications'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotificationsList(await res.json());
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const markNotificationRead = async (id: number) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(getApiUrl(`/api/notifications/${id}/read`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotificationsList((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (e) {
      console.error('Mark read failed:', e);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F9F6EE] py-16 px-4 text-center">
        <div className="max-w-md mx-auto bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-8 shadow-sm">
          <User className="w-12 h-12 text-[#5C6E6A] mx-auto mb-4" />
          <h2 className="text-xl font-serif font-bold text-[#1A2825] mb-2">Sign In Required</h2>
          <p className="text-xs text-[#5C6E6A] mb-6">
            Sign in with Google or resident credentials to view your complaint history and verified notifications.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F6EE] text-[#1A2825] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Card */}
        <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E1D5]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#1B3E36] border-2 border-[#E5A952] flex items-center justify-center text-xl font-serif font-black text-[#FAF9F5] shadow-xs">
                {profile?.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'C'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-serif font-bold text-[#1A2825]">
                    {profile?.displayName || 'Citizen Resident'}
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1B3E36]/10 text-[#1B3E36] border border-[#1B3E36]/20 uppercase font-mono">
                    {profile?.role || 'Citizen'}
                  </span>
                </div>
                <div className="text-xs text-[#5C6E6A] mt-0.5 flex items-center gap-1.5 font-mono">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="px-4 py-2 bg-[#FAF9F5] hover:bg-[#F2EFE7] border border-[#D4CEBF] text-[#8A3B2A] text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Anonymity Banner */}
          <div className="mt-6 bg-[#1B3E36] text-[#FAF9F5] border border-[#274E45] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#E5A952] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider font-mono">
                  PUBLIC RESIDENT ALIAS: <span className="font-mono text-[#E5A952] font-bold">{profile?.anonymousPublicId}</span>
                </div>
                <p className="text-xs text-[#D4CEBF] mt-1 leading-relaxed">
                  All civic issues you submit are stamped publicly with this anonymous ID. Your email and identity remain private.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/track')}
              className="px-4 py-2 bg-[#E5A952] hover:bg-[#d99d45] text-[#102621] text-xs font-bold uppercase tracking-wider rounded-xl shrink-0 cursor-pointer shadow-xs"
            >
              View My Reports
            </button>
          </div>
        </div>

        {/* In-App Notifications Center */}
        <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#1B3E36]" />
              <h2 className="text-lg font-serif font-bold text-[#1A2825]">Notifications Center</h2>
            </div>
            <span className="text-xs text-[#5C6E6A] font-bold font-mono">
              {notificationsList.filter((n) => !n.read).length} UNREAD
            </span>
          </div>

          <div className="space-y-3">
            {loadingNotifs ? (
              <div className="py-8 text-center text-[#5C6E6A] text-xs font-mono">Loading notifications...</div>
            ) : notificationsList.length === 0 ? (
              <div className="py-12 text-center text-[#5C6E6A] text-xs font-mono">
                No notifications yet. You will receive updates when your reports are verified or resolved.
              </div>
            ) : (
              notificationsList.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && markNotificationRead(notif.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    notif.read
                      ? 'bg-[#FFFFFF]/60 border-[#E5E1D5] text-[#5C6E6A]'
                      : 'bg-[#FFFFFF] border-[#1B3E36] text-[#1A2825] shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1A2825]">{notif.title}</span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#E5A952]"></span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#8A9894] font-mono">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-[#5C6E6A]">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
