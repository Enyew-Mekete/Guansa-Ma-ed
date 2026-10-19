import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { validateEthiopianPhone } from '../../utils/ethiopianPhone';
import { X, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

interface CreateAdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateAdminUserModal: React.FC<CreateAdminUserModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createAdminUser, accessRoles } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [initialPassword, setInitialPassword] = useState('');
  const [otpEnabled, setOtpEnabled] = useState(true);
  const [assignedRoleId, setAssignedRoleId] = useState('role-default-admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const phoneCheck = validateEthiopianPhone(phone);
    if (!phoneCheck.isValid) {
      setPhoneError(phoneCheck.errorMessage || 'Invalid Ethiopian phone format');
      return;
    }
    setPhoneError(null);

    setIsSubmitting(true);
    const result = await createAdminUser({ name, email, phone, initialPassword, otpEnabled, assignedRoleId: assignedRoleId || undefined });
    setIsSubmitting(false);

    setFeedback(result);

    if (result.success) {
      setTimeout(() => {
        setFeedback(null);
        setName('');
        setEmail('');
        setPhone('');
        setInitialPassword('');
        setOtpEnabled(true);
        setAssignedRoleId('role-default-admin');
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border-2 border-[#159E37] rounded-2xl shadow-2xl p-6 text-[#344BC2]">
        <div className="flex items-center justify-between pb-3 border-b border-[#159E37] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#344BC2] text-amber-300 rounded-lg shadow-sm">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#344BC2]">Super Admin: Create Admin User</h3>
              <p className="text-[11px] text-[#344BC2]/70 font-medium">Grant staff access to menu & orders</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#344BC2]/60 hover:text-[#344BC2] p-1">
            <X className="w-4 h-4" />
          </button>
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

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs text-[#344BC2]">
          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Almaz Hailu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
            />
          </div>

          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g., almaz@guansamaed.et"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
            />
          </div>

          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">
              Ethiopian Mobile Number (for OTP)
            </label>
            <input
              type="tel"
              required
              placeholder="e.g., 0911223344 or +251 91 122 3344"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneError(null);
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] font-mono text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
            />
            {phoneError && <p className="text-[11px] text-red-600 font-medium mt-1">{phoneError}</p>}
          </div>

          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">Access Role</label>
            <select
              value={assignedRoleId}
              onChange={(event) => setAssignedRoleId(event.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2]"
            >
              {accessRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
            <p className="mt-1 text-[11px] text-[#344BC2]/65">Choose a role to restrict which admin areas this user can access.</p>
          </div>

          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">Initial Password</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={initialPassword}
              onChange={(e) => setInitialPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] font-mono font-bold focus:outline-none focus:border-[#159E37]"
            />
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-[#159E37] bg-slate-50 p-3 text-xs font-semibold">
            <input type="checkbox" checked={otpEnabled} onChange={(event) => setOtpEnabled(event.target.checked)} />
            Require email OTP verification at sign-in
          </label>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-[#159E37] hover:bg-[#107d2b] text-white font-bold text-xs transition-colors shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Creating account…' : 'Create Admin Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAdminUserModal;
