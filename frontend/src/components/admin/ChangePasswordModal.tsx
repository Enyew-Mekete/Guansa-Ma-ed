import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { changeOwnPassword, currentUser } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const isPasswordChangeRequired = Boolean(currentUser?.mustChangePassword);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const result = await changeOwnPassword(oldPassword, newPassword, confirmPassword);
    setFeedback(result);

    if (result.success) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border-2 border-[#159E37] rounded-2xl shadow-2xl p-6 text-[#344BC2]">
        <div className="flex items-center justify-between pb-3 border-b border-[#159E37] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#344BC2] text-amber-300 rounded-lg shadow-sm">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#344BC2]">{isPasswordChangeRequired ? 'Set Your New Password' : 'Change Your Password'}</h3>
              <p className="text-[11px] text-[#344BC2]/70 font-medium">{currentUser.name} · {currentUser.assignedRoleName || currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>
          {!isPasswordChangeRequired && <button onClick={onClose} className="text-[#344BC2]/60 hover:text-[#344BC2] p-1">
            <X className="w-4 h-4" />
          </button>}
        </div>

        {isPasswordChangeRequired && (
          <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            {currentUser.passwordChangeReason === 'reset'
              ? 'For account security, change the password provided before continuing.'
              : 'For account security, change the password provided when this account was created before continuing.'}
          </p>
        )}

        {feedback && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 font-medium ${
              feedback.success
                ? 'bg-emerald-50 border border-emerald-400 text-emerald-800'
                : 'bg-red-50 border border-red-400 text-red-800'
            }`}
          >
            {feedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs text-[#344BC2]">
          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">Old (Current) Password</label>
            <input
              type="password"
              required
              placeholder="Enter your existing password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
            />
          </div>

          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">New Password (min 8 characters)</label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
            />
          </div>

          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#344BC2] hover:bg-[#2C40AE] text-white font-bold text-xs transition-colors shadow-md"
            >
              Save & Apply Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
