import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Smartphone,
  Mail,
  KeyRound,
  X,
  AlertCircle,
  Clock,
  RotateCw,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const OtpVerificationModal: React.FC = () => {
  const { activeOtpChallenge, verifyOtp, resendOtp, cancelOtp, error, clearError } = useAuth();
  const [otpInput, setOtpInput] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(300);
  const [resendNotification, setResendNotification] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!activeOtpChallenge) return;
    setOtpInput('');
    setSecondsRemaining(Math.max(0, Math.floor((activeOtpChallenge.expiresAt - Date.now()) / 1000)));

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((activeOtpChallenge.expiresAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeOtpChallenge]);

  if (!activeOtpChallenge) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.length < 6 || isVerifying) return;
    setIsVerifying(true);
    await verifyOtp(otpInput.trim());
    setIsVerifying(false);
  };

  const handleResend = async () => {
    const challenge = await resendOtp();
    if (challenge) {
      setResendNotification('A new OTP passcode was accepted for delivery.');
      setTimeout(() => setResendNotification(null), 4000);
    }
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border-2 border-[#159E37] rounded-3xl shadow-2xl p-6 sm:p-8 text-[#344BC2] max-h-[95vh] overflow-y-auto">
        {/* Reverse Header for High Contrast & Visual Clarity */}
        <div className="flex items-center justify-between pb-4 border-b border-[#159E37]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#344BC2] text-amber-300 shadow">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[#344BC2]">Two-Factor OTP Verification</h3>
              <p className="text-[11px] text-[#344BC2]/70 font-medium">Email OTP with optional SMS notification</p>
            </div>
          </div>

          <button
            onClick={cancelOtp}
            className="p-1 rounded-lg bg-slate-100 hover:bg-[#344BC2]/10 text-[#344BC2] transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          <p className="text-xs text-[#344BC2]/85 leading-relaxed">
            A secure 6-digit passcode was sent by email for{' '}
            <strong className="text-[#344BC2] font-bold">{activeOtpChallenge.user.name}</strong>. Check your email inbox; an SMS may also be available if configured.
          </p>

          {/* Delivery Channels with Direct Inbox Launch Buttons */}
          <div className="space-y-2.5 text-xs">
            {/* 1. Phone SMS Channel */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-[#159E37] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-[#344BC2]/70 font-semibold uppercase tracking-wider">SMS Inbox (Ethio Telecom):</p>
                  <p className="font-mono font-bold text-[#344BC2] truncate">{activeOtpChallenge.sentPhone}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`sms:${activeOtpChallenge.sentPhone}?body=Guansa%20Maed%20OTP`}
                  className="px-2.5 py-1.5 rounded-lg bg-[#344BC2] hover:bg-[#2C40AE] text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all"
                  title="Open Phone Messages App"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Open SMS</span>
                </a>
              </div>
            </div>

            {/* 2. Email Channel */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-[#159E37] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-blue-100 text-[#344BC2]">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-[#344BC2]/70 font-semibold uppercase tracking-wider">Email Inbox (Gmail):</p>
                  <p className="font-bold text-[#344BC2] truncate">{activeOtpChallenge.sentEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href="https://mail.google.com/mail/u/0/#search/Guansa"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all"
                  title="Open Gmail Inbox to search for OTP"
                >
                  <Mail className="w-3 h-3" />
                  <span>Open Gmail</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>

          {resendNotification && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{resendNotification}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[#344BC2] mb-1">
                Enter 6-Digit Passcode from Message Inbox
              </label>

              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="------"
                  value={otpInput}
                  onChange={(e) => {
                    setOtpInput(e.target.value.replace(/\D/g, ''));
                    clearError();
                  }}
                  className="w-full text-center text-2xl font-mono tracking-[0.4em] font-bold py-2.5 px-3 rounded-xl bg-slate-50 border-2 border-[#159E37] text-[#344BC2] focus:outline-none focus:border-[#159E37]"
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-300 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={otpInput.length < 6 || isVerifying}
              className="w-full py-3 rounded-xl bg-[#344BC2] hover:bg-[#2C40AE] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-300" />
              <span>{isVerifying ? 'Verifying…' : 'Verify & Access Dashboard'}</span>
            </button>
          </form>

          {/* Expiration Timer & Resend */}
          <div className="flex items-center justify-between text-xs text-[#344BC2]/70 pt-2 border-t border-[#159E37]">
            <span className="flex items-center gap-1 font-mono font-medium">
              <Clock className="w-3.5 h-3.5 text-[#344BC2]" />
              <span>Expires in: {timeFormatted}</span>
            </span>

            <button
              type="button"
              onClick={handleResend}
              className="text-[#344BC2] hover:text-[#2C40AE] font-bold flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              <span>Resend Code</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
