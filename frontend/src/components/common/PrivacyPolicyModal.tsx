import React from 'react';
import { X, ShieldCheck, Lock, PhoneCall, Mail } from 'lucide-react';
import { BRAND_CONFIG } from '../../config/branding';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border-2 border-[#159E37] rounded-2xl shadow-2xl p-6 sm:p-8 text-[#344BC2] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#159E37] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#344BC2] text-amber-300 shadow">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-[#344BC2]">Privacy Policy & Order Security</h3>
              <p className="text-xs text-[#344BC2]/70 font-medium">Guansa Ma'ed ጓንሳ ማዕድ Restaurant Policy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#344BC2]/10 text-[#344BC2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 text-xs text-[#344BC2]/85 leading-relaxed">
          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#344BC2] flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#b45309]" /> 1. Customer Order Data & Identification
            </h4>
            <p>
              When you submit an order or click "Apply to Order" on our website, we collect your Full Name, Ethiopian Phone Number (Ethio Telecom or Safaricom), optional Email address, and dining delivery instructions. This information is strictly utilized to process, prepare, and deliver your culinary order.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#344BC2] flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-[#b45309]" /> 2. Telegram & Email Dispatch Communication
            </h4>
            <p>
              In accordance with Ethiopian commercial dining practices, orders are routed directly to our kitchen dispatch channel on Telegram (<span className="text-[#344BC2] font-bold">@{BRAND_CONFIG.telegramUsername}</span>) and official email (<span className="text-[#344BC2] font-bold">{BRAND_CONFIG.orderEmail}</span>). Your generated unique Order ID allows prompt tracking without exposing your private payment credentials.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#344BC2] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#b45309]" /> 3. One-Time Passcode (OTP) Administrative Protection
            </h4>
            <p>
              Our internal administrative and management consoles are safeguarded by mandatory two-step OTP verification dispatched exclusively to verified Ethiopian mobile numbers and registered staff emails. No customer data is sold, rented, or shared with third-party advertisers.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#344BC2] flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-[#b45309]" /> 4. Inquiries & Updates
            </h4>
            <p>
              If you have any questions regarding your data or wish to cancel an order, please contact our management team directly at <a href={`mailto:${BRAND_CONFIG.supportEmail}`} className="text-[#344BC2] font-bold underline">{BRAND_CONFIG.supportEmail}</a> or by phone at <span className="font-mono font-bold text-[#344BC2]">{BRAND_CONFIG.primaryPhone}</span>.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#159E37] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#344BC2] hover:bg-[#2C40AE] text-white font-bold text-xs transition-colors shadow-md"
          >
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
};
