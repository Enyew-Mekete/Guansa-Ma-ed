import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminUser } from '../../types';
import { X, Key, CheckCircle2, AlertCircle } from 'lucide-react';

interface ResetAdminPasswordModalProps {
  targetUser: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ResetAdminPasswordModal: React.FC<ResetAdminPasswordModalProps> = ({
  targetUser,
  isOpen,
  onClose,
}) => {
  const { resetAdminPasswordBySuperAdmin } = useAuth();
  const [defaultPassword, setDefaultPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen || !targetUser) return null;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    setIsSubmitting(true);
    const result = await resetAdminPasswordBySuperAdmin(targetUser.id, defaultPassword);
    setIsSubmitting(false);
    setFeedback(result);

    if (result.success) {
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
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#344BC2]">Super Admin: Reset Admin Password</h3>
              <p className="text-[11px] text-[#344BC2]/70 font-medium">Target User: {targetUser.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#344BC2]/60 hover:text-[#344BC2] p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Note highlighting the requirement */}
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-[11px] text-[#344BC2] mb-3 font-medium">
          As Super Admin, resetting an admin user's password does not require their old password. You only set the new default password.
        </div>

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

        <form onSubmit={handleReset} className="space-y-3.5 text-xs text-[#344BC2]">
          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">Target Account Email</label>
            <input
              type="text"
              disabled
              value={targetUser.email}
              className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-[#159E37] text-[#344BC2]/70 cursor-not-allowed font-medium"
            />
          </div>

          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">
              New Default Password to Assign
            </label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={defaultPassword}
              onChange={(e) => setDefaultPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] font-mono font-bold focus:outline-none focus:border-[#159E37]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-[#344BC2] hover:bg-[#2C40AE] text-white font-bold text-xs transition-colors shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Set New Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
