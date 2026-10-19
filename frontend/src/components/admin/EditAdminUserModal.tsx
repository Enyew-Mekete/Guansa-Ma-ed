import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminUser } from '../../types';
import { validateEthiopianPhone } from '../../utils/ethiopianPhone';
import { X, Edit2, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

interface EditAdminUserModalProps {
  isOpen: boolean;
  user: AdminUser | null;
  onClose: () => void;
}

export const EditAdminUserModal: React.FC<EditAdminUserModalProps> = ({
  isOpen,
  user,
  onClose,
}) => {
  const { updateAdminUser, accessRoles } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [assignedRoleId, setAssignedRoleId] = useState('role-default-admin');
  const [otpEnabled, setOtpEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
      setAssignedRoleId(user.assignedRoleId ?? 'role-default-admin');
      setOtpEnabled(user.otpEnabled);
      setIsSubmitting(false);
      setFeedback(null);
      setPhoneError(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const phoneCheck = validateEthiopianPhone(phone);
    if (!phoneCheck.isValid) {
      setPhoneError(phoneCheck.errorMessage || 'Invalid Ethiopian phone format.');
      return;
    }
    setPhoneError(null);

    setIsSubmitting(true);
    const result = await updateAdminUser(user.id, {
      name,
      email,
      phone,
      otpEnabled,
      assignedRoleId,
    });
    setIsSubmitting(false);

    setFeedback(result);

    if (result.success) {
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1500);
    }
  };

  const isPrimarySuperAdmin = user.id === 'usr-superadmin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border-2 border-[#159E37] rounded-2xl shadow-2xl p-6 text-[#344BC2]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#159E37] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#344BC2] text-amber-300 rounded-lg shadow-sm">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#344BC2]">Edit Administrative Account</h3>
              <p className="text-[11px] text-[#344BC2]/70 font-medium">Update profile, phone & access level</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#344BC2]/60 hover:text-[#344BC2] p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback message */}
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

        {/* Edit Form */}
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
              placeholder="e.g., admin@guansamaed.et"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
            />
          </div>

          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">
              Ethiopian Phone (+251 9... / 09... / 011...)
            </label>
            <input
              type="text"
              required
              placeholder="0911223344"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneError(null);
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 font-mono focus:outline-none focus:border-[#159E37]"
            />
            {phoneError && (
              <p className="text-[11px] text-red-600 mt-1">{phoneError}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[#344BC2] font-semibold mb-1">
              <Shield className="w-3.5 h-3.5 text-[#344BC2]" /> Access Role
            </label>
            <select
              required
              value={assignedRoleId}
              onChange={(event) => setAssignedRoleId(event.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2]"
            >
              {accessRoles.map((accessRole) => <option key={accessRole.id} value={accessRole.id}>{accessRole.name}</option>)}
            </select>
            <p className="mt-1 text-[11px] text-[#344BC2]/65">Select and assign one of the roles defined in Role Management.</p>
          </div>

          {!isPrimarySuperAdmin && (
            <label className="flex items-center gap-2 rounded-lg border border-[#159E37] bg-slate-50 p-3 text-xs font-semibold">
              <input type="checkbox" checked={otpEnabled} onChange={(event) => setOtpEnabled(event.target.checked)} />
              Require email OTP verification at sign-in
            </label>
          )}

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#159E37]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#344BC2] font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#344BC2] hover:bg-[#2C40AE] text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-300" />
              <span>{isSubmitting ? 'Saving…' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAdminUserModal;
