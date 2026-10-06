import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Shield,
  User,
  Wrench,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Sparkles,
  ArrowLeft,
  Building2,
} from 'lucide-react';

interface LoginPageProps {
  navigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { login, loginAsPersona, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Invalid email or password.');
    }
  };

  const handlePersonaSelect = async (role: 'admin' | 'worker' | 'citizen') => {
    setError(null);
    setLoading(true);
    const res = await loginAsPersona(role);
    setLoading(false);
    if (res.success) {
      if (role === 'admin') navigate('/admin');
      else if (role === 'worker') navigate('/worker');
      else navigate('/profile');
    } else {
      setError(res.error || 'Could not authenticate persona.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError('Google Sign-In was cancelled or popup was closed. Please try again or use 1-Click Persona login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6EE] text-[#1A2825] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Return to Desk link */}
      <div className="max-w-md w-full mx-auto mb-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C6E6A] hover:text-[#1B3E36] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Resident Desk</span>
        </button>
      </div>

      <div className="max-w-md w-full mx-auto bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl shadow-md overflow-hidden">
        {/* Header Banner */}
        <div className="p-6 bg-[#1B3E36] text-[#FAF9F5] border-b border-[#274E45]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#E5A952] text-[#102621] font-bold text-xl flex items-center justify-center shadow-xs">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-editorial text-xl font-bold tracking-tight">CivicFix</span>
                <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#274E45] text-[#E5A952]">
                  IDENTITY ACCESS
                </span>
              </div>
              <p className="text-[11px] text-[#A0B4AF]">Resident & Urban Operations Sign In</p>
            </div>
          </div>
          <p className="text-xs text-[#E5E1D5] mt-2 leading-relaxed">
            Sign in to access your registered civic complaints, municipal telemetry, and dispatch command services.
          </p>

          {/* Segmented Page Switcher */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-[#274E45]">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-[#E5A952] text-[#102621] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer font-mono uppercase tracking-wider"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="flex-1 py-1.5 text-xs font-bold rounded-lg text-[#A0B4AF] hover:text-[#FAF9F5] hover:bg-[#274E45] flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-mono uppercase tracking-wider"
            >
              <User className="w-3.5 h-3.5" />
              <span>Create Citizen ID</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C6E6A] mb-1 font-mono">
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
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E5E1D5] rounded-xl text-xs text-[#1A2825] focus:outline-none focus:border-[#1B3E36] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C6E6A] font-mono">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-[#A0B4AF]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full pl-9 pr-10 py-2.5 bg-white border border-[#E5E1D5] rounded-xl text-xs text-[#1A2825] focus:outline-none focus:border-[#1B3E36] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#A0B4AF] hover:text-[#1A2825]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin text-[#E5A952]" />}
              <span>Sign In to Account</span>
            </button>
          </form>

          {/* Social Google Provider */}
          <div className="pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-3 rounded-xl border border-[#D5D1C5] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1A2825] transition-colors flex items-center justify-center gap-2.5 cursor-pointer shadow-xs"
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

          {/* Quick Demo Personas Section */}
          <div className="pt-4 border-t border-[#E5E1D5] space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7E9690] font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#E5A952]" />
              <span>1-Click Test Personas</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handlePersonaSelect('admin')}
                className="w-full text-left p-2.5 rounded-xl border border-[#E5E1D5] bg-white hover:border-[#B06D44] hover:bg-amber-50/50 transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-amber-800" />
                  </div>
                  <div className="min-w-0 truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#1A2825]">Municipal Director</span>
                      <span className="px-1 py-0.2 rounded bg-amber-200/60 text-amber-900 font-mono text-[8px] font-bold">ADMIN</span>
                    </div>
                    <div className="text-[10px] text-[#5C6E6A] truncate">admin@ghmc.gov.in</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#A0B4AF] shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handlePersonaSelect('worker')}
                className="w-full text-left p-2.5 rounded-xl border border-[#E5E1D5] bg-white hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4 text-blue-800" />
                  </div>
                  <div className="min-w-0 truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#1A2825]">Field Crew Lead</span>
                      <span className="px-1 py-0.2 rounded bg-blue-200/60 text-blue-900 font-mono text-[8px] font-bold">WORKER</span>
                    </div>
                    <div className="text-[10px] text-[#5C6E6A] truncate">rajesh.kumar@ghmc.gov.in</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#A0B4AF] shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handlePersonaSelect('citizen')}
                className="w-full text-left p-2.5 rounded-xl border border-[#E5E1D5] bg-white hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-emerald-800" />
                  </div>
                  <div className="min-w-0 truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#1A2825]">Verified Resident</span>
                      <span className="px-1 py-0.2 rounded bg-emerald-200/60 text-emerald-900 font-mono text-[8px] font-bold">CITIZEN</span>
                    </div>
                    <div className="text-[10px] text-[#5C6E6A] truncate">priya.sharma@gmail.com</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#A0B4AF] shrink-0" />
              </button>
            </div>
          </div>

          {/* Switch to Sign Up */}
          <div className="text-center pt-3 border-t border-[#E5E1D5] space-y-2">
            <p className="text-xs text-[#5C6E6A]">
              Don't have a verified account yet?{' '}
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="font-bold text-[#1B3E36] hover:text-[#274E45] underline cursor-pointer"
              >
                Create Citizen ID
              </button>
            </p>
            <div>
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="text-[11px] font-semibold text-[#5C6E6A] hover:text-[#1B3E36] underline cursor-pointer transition-colors"
              >
                Explore platform as Guest Resident →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
