import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useGPS } from '../context/GPSContext.tsx';
import { getApiUrl } from '../lib/api.ts';
import {
  FileText,
  MapPin,
  Search,
  BarChart3,
  Shield,
  Wrench,
  Bell,
  LogIn,
  LogOut,
  User,
  Menu,
  X,
  Compass,
  Home,
  CheckCircle2,
  Radio,
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, profile, openAuthModal, logout, getAuthToken } = useAuth();
  const { isTracking, toggleTracking, status: gpsStatus } = useGPS();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;
        const res = await fetch(getApiUrl('/api/notifications'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const notifs = await res.json();
          const unread = notifs.filter((n: any) => !n.read).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleNav = (p: string) => {
    navigate(p);
    setMobileMenuOpen(false);
  };

  const civicLinks = [
    { label: 'Resident Desk', path: '/report', icon: FileText, badge: 'New Case' },
    { label: 'Civic Overview', path: user ? '/' : '/home', icon: Home },
    { label: 'Incident Map', path: '/map', icon: MapPin },
    { label: 'Track Open Case', path: '/track', icon: Search },
    { label: 'City Transparency', path: '/transparency', icon: BarChart3 },
  ];

  const opsLinks: { label: string; path: string; icon: any }[] = [];
  if (profile?.role === 'admin') {
    opsLinks.push({ label: 'Municipal Command', path: '/admin', icon: Shield });
  }
  if (profile?.role === 'admin' || profile?.role === 'worker' || profile?.role === 'supervisor') {
    opsLinks.push({ label: 'Field Response Crew', path: '/worker', icon: Wrench });
  }

  const navContent = (
    <div className="flex flex-col h-full bg-[#1B3E36] text-[#F9F6EE] border-r border-[#274E45] select-none">
      {/* 1. Header & Brand */}
      <div className="p-5 border-b border-[#274E45]">
        <div
          onClick={() => handleNav('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          {/* Prominent Golden-Ochre 'C' Badge */}
          <div className="w-10 h-10 rounded-xl bg-[#E5A952] text-[#102621] font-bold text-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
            C
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-editorial text-xl font-bold tracking-tight text-[#FAF9F5]">
                CivicFix
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#274E45] text-[#E5A952] border border-[#274E45]">
                Gov
              </span>
            </div>
            <p className="text-[10px] tracking-wider uppercase text-[#A0B4AF] font-medium truncate">
              CITY RESPONSE NETWORK
            </p>
          </div>
        </div>

        {/* GPS Sensor Quick Status */}
        <div className="mt-4 pt-3 border-t border-[#274E45] flex items-center justify-between text-[11px] text-[#A0B4AF]">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                gpsStatus === 'active' || isTracking
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-[#E5A952]'
              }`}
            />
            {isTracking ? 'GPS Synchronized' : 'Location Telemetry'}
          </span>
          <button
            type="button"
            onClick={toggleTracking}
            className="text-[10px] uppercase font-semibold text-[#E5A952] hover:underline"
          >
            {isTracking ? 'Stop' : 'Engage'}
          </button>
        </div>
      </div>

      {/* 2. Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Section: CIVIC SERVICES */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#7E9690]">
            CIVICFIX
          </div>
          <nav className="space-y-1">
            {civicLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNav(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#E5A952] text-[#102621] font-semibold shadow-sm'
                      : 'text-[#E5E1D5] hover:bg-[#274E45] hover:text-[#FFFFFF]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-[#102621]' : 'text-[#A0B4AF]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && !isActive && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-[#274E45] text-[#E5A952] px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section: CITY OPERATIONS */}
        {opsLinks.length > 0 && (
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#7E9690]">
              CITY OPERATIONS
            </div>
            <nav className="space-y-1">
              {opsLinks.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleNav(item.path)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#E5A952] text-[#102621] font-semibold shadow-sm'
                        : 'text-[#E5E1D5] hover:bg-[#274E45] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-[#102621]' : 'text-[#A0B4AF]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* User Notifications button if logged in */}
        {user ? (
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#7E9690]">
              DISPATCH NOTICES
            </div>
            <button
              type="button"
              onClick={() => handleNav('/profile')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                currentPath === '/profile'
                  ? 'bg-[#E5A952] text-[#102621] font-semibold'
                  : 'text-[#E5E1D5] hover:bg-[#274E45] hover:text-[#FFFFFF]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bell
                  className={`w-4 h-4 ${
                    currentPath === '/profile' ? 'text-[#102621]' : 'text-[#A0B4AF]'
                  }`}
                />
                <span>Activity & Notices</span>
              </div>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-[#E5A952] text-[#102621] px-1.5 py-0.2 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        ) : (
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#7E9690]">
              RESIDENT ACCESS
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleNav('/login')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentPath === '/login'
                    ? 'bg-[#E5A952] text-[#102621] font-semibold shadow-sm'
                    : 'text-[#E5E1D5] hover:bg-[#274E45] hover:text-[#FFFFFF]'
                }`}
              >
                <LogIn className={`w-4 h-4 ${currentPath === '/login' ? 'text-[#102621]' : 'text-[#A0B4AF]'}`} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => handleNav('/signup')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentPath === '/signup' || currentPath === '/register'
                    ? 'bg-[#E5A952] text-[#102621] font-semibold shadow-sm'
                    : 'text-[#E5E1D5] hover:bg-[#274E45] hover:text-[#FFFFFF]'
                }`}
              >
                <User className={`w-4 h-4 ${currentPath === '/signup' || currentPath === '/register' ? 'text-[#102621]' : 'text-[#A0B4AF]'}`} />
                <span>Create Citizen ID</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Section: Systems Operational & Resident Access */}
      <div className="p-3 border-t border-[#274E45]">
        <div className="bg-[#142F29] border border-[#274E45] rounded-xl p-3 space-y-2.5">
          {/* Status badge */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#A0B4AF] font-medium">Status</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1B3E36] text-[#A7F3D0] border border-[#274E45] text-[10px] font-semibold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Systems operational
            </span>
          </div>

          {/* Resident Access Row */}
          <div className="pt-2 border-t border-[#274E45]/80 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#7E9690]">
                  {user ? 'Verified Access' : 'Resident Access'}
                </span>
                {profile?.role && (
                  <span
                    className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded font-mono ${
                      profile.role === 'admin'
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        : profile.role === 'worker'
                        ? 'bg-blue-400/20 text-blue-300 border border-blue-400/30'
                        : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                    }`}
                  >
                    {profile.role === 'admin' ? 'ADMIN' : profile.role === 'worker' ? 'CREW' : 'RESIDENT'}
                  </span>
                )}
              </div>
              <div className="text-xs font-semibold text-[#FAF9F5] truncate">
                {user ? profile?.displayName || profile?.anonymousPublicId || user.email : 'Guest Whistleblower'}
              </div>
            </div>

            {user ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openAuthModal('personas')}
                  title="Switch Persona / Role"
                  className="px-1.5 py-1 rounded bg-[#274E45] text-[#E5A952] text-[9px] font-bold uppercase tracking-wider hover:bg-[#326156] transition-colors"
                >
                  Switch
                </button>
                <button
                  type="button"
                  onClick={logout}
                  title="Log Out"
                  className="p-1.5 rounded-lg text-[#A0B4AF] hover:text-rose-300 hover:bg-[#274E45] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleNav('/login')}
                  className="px-2.5 py-1 rounded-lg bg-[#E5A952] text-[#102621] text-[10px] font-bold uppercase tracking-wider hover:bg-[#F3BA6A] transition-colors shadow-sm cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('/signup')}
                  className="px-2 py-1 rounded-lg bg-[#274E45] text-[#FAF9F5] text-[10px] font-bold uppercase tracking-wider hover:bg-[#326156] transition-colors cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top App Bar (< md screens) */}
      <div className="md:hidden sticky top-0 z-40 bg-[#1B3E36] text-[#F9F6EE] border-b border-[#274E45] px-4 py-3 flex items-center justify-between shadow-md">
        <div
          onClick={() => handleNav('/')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-[#E5A952] text-[#102621] font-bold text-lg flex items-center justify-center">
            C
          </div>
          <div>
            <span className="font-editorial text-lg font-bold text-[#FAF9F5]">CivicFix</span>
            <span className="ml-1 text-[9px] uppercase tracking-wider text-[#A0B4AF]">Network</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <button
              type="button"
              onClick={() => handleNav('/profile')}
              className="p-2 rounded-lg bg-[#274E45] text-[#FAF9F5]"
            >
              <User className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleNav('/login')}
                className="px-2.5 py-1 rounded bg-[#E5A952] text-[#102621] text-[10px] font-bold uppercase shadow-sm cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleNav('/signup')}
                className="px-2 py-1 rounded bg-[#274E45] text-[#FAF9F5] text-[10px] font-bold uppercase cursor-pointer"
              >
                Register
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-[#274E45] text-[#F9F6EE]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop Left Sidebar (>= md screens) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 flex-shrink-0 z-30">
        {navContent}
      </aside>
    </>
  );
};
