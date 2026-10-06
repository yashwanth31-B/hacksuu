import React, { useState, useEffect } from 'react';
import { useAuth, AuthModalTab } from '../context/AuthContext.tsx';
import {
  Shield,
  User,
  Wrench,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    openAuthModal,
    login,
    register,
    loginAsPersona,
    loginWithGoogle,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthModalTab>(authModalTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [municipalityId, setMunicipalityId] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(authModalTab);
    setError(null);
    setSuccessMsg(null);
  }, [authModalTab, isAuthModalOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Invalid email or password.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await register({
      name,
      email,
      password,
      phone,
      municipalityId,
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to create account.');
    }
  };

  const handlePersonaSelect = async (role: 'admin' | 'worker' | 'citizen') => {
    setError(null);
    setLoading(true);
    const res = await loginAsPersona(role);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Could not authenticate persona.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError('Google Sign-In was cancelled or popup was closed. You can also use 1-Click Persona login below.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#102621]/70 backdrop-blur-xs transition-opacity"
        onClick={closeAuthModal}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 bg-[#1B3E36] text-[#FAF9F5] relative border-b border-[#274E45]">
          <button
            type="button"
            onClick={closeAuthModal}
            className="absolute top-5 right-5 p-2 rounded-xl text-[#A0B4AF] hover:text-[#FAF9F5] hover:bg-[#274E45] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-[#E5A952] text-[#102621] font-bold text-lg flex items-center justify-center shadow-xs">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-editorial text-lg font-bold tracking-tight">CivicFix</span>
                <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#274E45] text-[#E5A952]">
                  IDENTITY ACCESS
                </span>
              </div>
              <p className="text-[11px] text-[#A0B4AF]">Municipal Operations & Resident Portal</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-[#274E45]">
            <button
              type="button"
              onClick={() => { setActiveTab('personas'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'personas'
                  ? 'bg-[#E5A952] text-[#102621]'
                  : 'text-[#A0B4AF] hover:bg-[#274E45] hover:text-[#FAF9F5]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Personas</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'signin'
                  ? 'bg-[#E5A952] text-[#102621]'
                  : 'text-[#A0B4AF] hover:bg-[#274E45] hover:text-[#FAF9F5]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-[#E5A952] text-[#102621]'
                  : 'text-[#A0B4AF] hover:bg-[#274E45] hover:text-[#FAF9F5]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Create ID</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: 1-CLICK PERSONAS */}
          {activeTab === 'personas' && (
            <div className="space-y-3.5">
              <div className="text-xs text-[#5C6E6A]">
                Select a verified operational persona to immediately experience full platform capabilities:
              </div>

              {/* Persona: Admin */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handlePersonaSelect('admin')}
                className="w-full text-left p-3.5 rounded-2xl border border-[#E5E1D5] bg-[#FFFFFF] hover:border-[#1B3E36] hover:bg-[#1B3E36]/5 transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                    <Shield className="w-5 h-5 text-amber-800" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1A2825]">Municipal Command</span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-200/60 text-amber-900 font-mono text-[9px] font-bold">
                        ADMIN
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5C6E6A]">Dir. K. Ramanathan (admin@ghmc.gov.in)</div>
                    <div className="text-[10px] text-amber-800 font-medium">Access: /admin, Triage, Crew Routing, AI Fraud</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#A0B4AF] group-hover:text-[#1B3E36] group-hover:translate-x-1 transition-all" />
              </button>

              {/* Persona: Field Worker */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handlePersonaSelect('worker')}
                className="w-full text-left p-3.5 rounded-2xl border border-[#E5E1D5] bg-[#FFFFFF] hover:border-[#1B3E36] hover:bg-[#1B3E36]/5 transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                    <Wrench className="w-5 h-5 text-blue-800" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1A2825]">Field Response Crew</span>
                      <span className="px-1.5 py-0.2 rounded bg-blue-200/60 text-blue-900 font-mono text-[9px] font-bold">
                        WORKER
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5C6E6A]">Rajesh Kumar (rajesh.kumar@ghmc.gov.in)</div>
                    <div className="text-[10px] text-blue-800 font-medium">Access: /worker, GPS Telemetry, Task Resolution</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#A0B4AF] group-hover:text-[#1B3E36] group-hover:translate-x-1 transition-all" />
              </button>

              {/* Persona: Citizen */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handlePersonaSelect('citizen')}
                className="w-full text-left p-3.5 rounded-2xl border border-[#E5E1D5] bg-[#FFFFFF] hover:border-[#1B3E36] hover:bg-[#1B3E36]/5 transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                    <User className="w-5 h-5 text-emerald-800" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1A2825]">Verified Resident</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-200/60 text-emerald-900 font-mono text-[9px] font-bold">
                        CITIZEN
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5C6E6A]">Priya Sharma (priya.sharma@gmail.com)</div>
                    <div className="text-[10px] text-emerald-800 font-medium">Access: /report, /profile, Anonymous Case Filing</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#A0B4AF] group-hover:text-[#1B3E36] group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          )}

          {/* TAB 2: SIGN IN */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C6E6A] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-[#A0B4AF]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. resident@civicfix.gov"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E1D5] rounded-xl text-xs text-[#1A2825] focus:outline-none focus:border-[#1B3E36]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C6E6A] mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-[#A0B4AF]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-10 py-2 bg-white border border-[#E5E1D5] rounded-xl text-xs text-[#1A2825] focus:outline-none focus:border-[#1B3E36]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#A0B4AF] hover:text-[#1A2825]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin text-[#E5A952]" />}
                <span>Authenticate Resident / Staff</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-xs text-[#5C6E6A] hover:text-[#1B3E36] font-medium"
                >
                  Need a Citizen Account? <span className="font-bold text-[#E5A952] underline">Create ID</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C6E6A] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-[#A0B4AF]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E1D5] rounded-xl text-xs text-[#1A2825] focus:outline-none focus:border-[#1B3E36]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C6E6A] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-[#A0B4AF]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. resident@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E1D5] rounded-xl text-xs text-[#1A2825] focus:outline-none focus:border-[#1B3E36]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C6E6A] mb-1">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-[#A0B4AF]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create secure password"
                    className="w-full pl-9 pr-10 py-2 bg-white border border-[#E5E1D5] rounded-xl text-xs text-[#1A2825] focus:outline-none focus:border-[#1B3E36]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#A0B4AF] hover:text-[#1A2825]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C6E6A] mb-1">
                  Phone Number (Optional for SMS updates)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-[#A0B4AF]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98480 00000"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E1D5] rounded-xl text-xs text-[#1A2825] focus:outline-none focus:border-[#1B3E36]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin text-[#E5A952]" />}
                <span>Register Verified Citizen ID</span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className="text-xs text-[#5C6E6A] hover:text-[#1B3E36] font-medium"
                >
                  Already have an account? <span className="font-bold text-[#1B3E36] underline">Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* Social Google Provider Button */}
          <div className="pt-3 border-t border-[#E5E1D5]">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-2 px-3 rounded-xl border border-[#D5D1C5] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1A2825] transition-colors flex items-center justify-center gap-2.5 cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
