import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ShieldCheck, Plus, Trash2, AlertCircle, CheckCircle2, Lock, ArrowRight } from 'lucide-react';

export const FirstTimeAdminSetup: React.FC = () => {
  const { user, completeInitialSetup } = useAuth();
  const [emails, setEmails] = useState<string[]>([user?.email || 'pathiwadarishi@gmail.com']);
  const [newEmail, setNewEmail] = useState('');
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleAddEmail = () => {
    setError(null);
    const clean = newEmail.trim().toLowerCase();
    if (!clean) return;
    if (!emailRegex.test(clean)) {
      setError(`"${newEmail}" is not a valid email address.`);
      return;
    }
    if (emails.includes(clean)) {
      setError(`"${clean}" has already been added.`);
      return;
    }
    setEmails([...emails, clean]);
    setNewEmail('');
  };

  const handleRemoveEmail = (index: number) => {
    if (emails.length === 1) {
      setError('At least one administrator email address is required.');
      return;
    }
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleProceedToConfirm = () => {
    setError(null);
    if (emails.length === 0) {
      setError('Please add at least one administrator email address.');
      return;
    }
    for (const em of emails) {
      if (!emailRegex.test(em)) {
        setError(`Invalid email address: ${em}`);
        return;
      }
    }
    setStep('confirm');
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await completeInitialSetup(emails);
      if (!res.success) {
        setError(res.error || 'Failed to save administrator configuration.');
        setStep('input');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setStep('input');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6EE] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#FAF9F5] border border-[#D4CEBF] rounded-2xl shadow-xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#1B3E36]/10 border border-[#1B3E36]/20 flex items-center justify-center text-[#1B3E36]">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#B06D44]/10 text-[#B06D44] border border-[#B06D44]/20 uppercase tracking-wider font-mono">
                INITIAL SECURITY PROVISIONING
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#1A2825] mt-1">Set Up CivicFix Administrator</h1>
          </div>
        </div>

        {step === 'input' ? (
          <div>
            <p className="text-[#5C6E6A] text-sm mb-6 leading-relaxed">
              To secure the civic infrastructure platform, please designate the authorized administrator email addresses.
              Administrators hold full municipal oversight, including issue verification, crew assignment, and security audit logs.
            </p>

            <div className="bg-[#FFFFFF] border border-[#E5E1D5] rounded-xl p-4 mb-6 shadow-xs">
              <label className="block text-xs font-bold text-[#1A2825] uppercase tracking-wider mb-2 font-mono">
                Authorized Administrator Emails
              </label>

              {/* Email List */}
              <div className="space-y-2 mb-4">
                {emails.map((em, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-[#FAF9F5] border border-[#D4CEBF] rounded-lg px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-2 text-[#1A2825] text-sm font-medium">
                      <Lock className="w-4 h-4 text-[#1B3E36]" />
                      <span className="font-mono text-xs">{em}</span>
                      {idx === 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#E6F2ED] text-[#1B4D3E] border border-[#A8CEBE] rounded font-bold font-mono">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    {emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(idx)}
                        className="text-[#8A9894] hover:text-[#B06D44] p-1 transition-colors cursor-pointer"
                        title="Remove email"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Input */}
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="admin@municipality.gov"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEmail();
                    }
                  }}
                  className="flex-1 bg-[#FAF9F5] border border-[#D4CEBF] focus:border-[#1B3E36] rounded-lg px-3.5 py-2 text-xs text-[#1A2825] placeholder-[#8A9894] outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="px-3.5 py-2 bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-[#FFF1E6] border border-[#F4C49E] rounded-xl p-3 mb-6 text-[#8A3B2A] text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#5C6E6A] font-mono">
                Setup will lock permanently after confirmation.
              </span>
              <button
                type="button"
                onClick={handleProceedToConfirm}
                className="px-5 py-2.5 bg-[#E5A952] hover:bg-[#d99d45] text-[#102621] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>Save Administrator Emails</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-[#FAF9F5] border border-[#D4CEBF] rounded-xl p-4 mb-6 shadow-xs">
              <div className="flex items-center gap-2 text-[#B06D44] font-bold text-xs uppercase tracking-wider font-mono mb-3">
                <AlertCircle className="w-4 h-4" />
                <span>Please Confirm Administrator Assignment</span>
              </div>
              <p className="text-[#5C6E6A] text-sm mb-4">
                These email addresses will have administrator access to CivicFix:
              </p>
              <ul className="space-y-2 mb-2">
                {emails.map((em, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E5E1D5] px-3 py-2 rounded-lg text-[#1B3E36] text-xs font-bold font-mono"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E6F5E]" />
                    <span>{em}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-[#5C6E6A] mt-4 leading-relaxed font-mono">
                Once saved, this initial setup will be closed. Only existing administrators will be able to modify administrative accounts via the secure Operations Command panel.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-[#FFF1E6] border border-[#F4C49E] rounded-xl p-3 mb-6 text-[#8A3B2A] text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep('input')}
                disabled={submitting}
                className="px-4 py-2 text-[#5C6E6A] hover:text-[#1A2825] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="px-6 py-2.5 bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span>Saving Configuration...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#E5A952]" />
                    <span>Confirm & Continue</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
