import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ShieldCheck,
  User,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface SignupPageProps {
  navigate: (path: string) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ navigate }) => {
  const { register, loginWithGoogle } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [municipalityId, setMunicipalityId] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const municipalities = [
    { id: 1, name: 'Greater Hyderabad Municipal Corporation (GHMC)' },
    { id: 2, name: 'Bruhat Bengaluru Mahanagara Palike (BBMP)' },
    { id: 3, name: 'Municipal Corporation of Delhi (MCD)' },
    { id: 4, name: 'Brihanmumbai Municipal Corporation (BMC)' },
    { id: 5, name: 'Greater Chennai Corporation (GCC)' },
  ];

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
    if (res.success) {
      navigate('/profile');
    } else {
      setError(res.error || 'Failed to create account.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/profile');
    } catch (err: any) {
      setError('Google Sign-In was cancelled or popup was closed. Please try again.');
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
                  CITIZEN REGISTRY
                </span>
              </div>
              <p className="text-[11px] text-[#A0B4AF]">Verified Resident Account Creation</p>
            </div>
          </div>
          <p className="text-xs text-[#E5E1D5] mt-2 leading-relaxed">
            Register your Citizen ID to lodge verifiable civic reports, monitor response crews, and safeguard your community infrastructure.
          </p>

          {/* Segmented Page Switcher */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-[#274E45]">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 py-1.5 text-xs font-bold rounded-lg text-[#A0B4AF] hover:text-[#FAF9F5] hover:bg-[#274E45] flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-mono uppercase tracking-wider"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-[#E5A952] text-[#102621] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer font-mono uppercase tracking-wider"
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

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C6E6A] mb-1 font-mono">
                Full Legal Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-[#A0B4AF]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E1D5] rounded-xl text-xs text-[#1A2825] focus:outline-none focus:border-[#1B3E36] transition-colors"
                />
              </div>
            </div>

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
                  placeholder="e.g. priya.sharma@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E1D5] rounded-xl text-xs text-[#1A2825] focus:outline-none focus:border-[#1B3E36] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C6E6A] mb-1 font-mono">
                Password (min. 6 characters)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-[#A0B4AF]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="w-full pl-9 pr-10 py-2 bg-white border border-[#E5E1D5] rounded-xl text-xs text-[#1A2825] focus:outline-none focus:border-[#1B3E36] transition-colors"
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
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C6E6A] mb-1 font-mono">
                Phone Number (Optional for SMS Dispatch Alerts)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-[#A0B4AF]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98480 00000"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E1D5] rounded-xl text-xs text-[#1A2825] focus:outline-none focus:border-[#1B3E36] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C6E6A] mb-1 font-mono">
                Primary Municipality
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 w-4 h-4 text-[#A0B4AF]" />
                <select
                  value={municipalityId}
                  onChange={(e) => setMunicipalityId(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E1D5] rounded-xl text-xs text-[#1A2825] focus:outline-none focus:border-[#1B3E36] transition-colors cursor-pointer"
                >
                  {municipalities.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Privacy Protection Callout */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-[11px] text-[#1B3E36] leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-[#2E6F5E] shrink-0" />
                <span>Civic Privacy Guaranteed</span>
              </div>
              <p className="text-[10px] text-[#5C6E6A]">
                Your personal details are never displayed on public map markers. Reports are associated with a pseudo-anonymous identifier (e.g. <span className="font-mono font-bold text-[#1B3E36]">Citizen #CF-8101</span>).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-3"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin text-[#E5A952]" />}
              <span>Register Verified Citizen ID</span>
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

          {/* Switch to Sign In */}
          <div className="text-center pt-3 border-t border-[#E5E1D5] space-y-2">
            <p className="text-xs text-[#5C6E6A]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-bold text-[#1B3E36] hover:text-[#274E45] underline cursor-pointer"
              >
                Sign In
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
