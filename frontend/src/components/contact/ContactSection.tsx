import React, { useState } from 'react';
import { BRAND_CONFIG } from '../../config/branding';
import { validateFeedbackPhone } from '../../utils/ethiopianPhone';
import { isValidEmailAddress } from '../../utils/email';
import { apiRequest } from '../../utils/api';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const ContactSection: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneCheck = validateFeedbackPhone(phone);
    if (!phoneCheck.isValid) {
      setPhoneError(phoneCheck.errorMessage || 'Please provide a valid Ethiopian mobile phone number');
      return;
    }
    const normalizedEmail = email.trim();
    if (normalizedEmail && !isValidEmailAddress(normalizedEmail)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setPhoneError(null);
    setEmailError(null);
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await apiRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ fullName: name.trim(), phone: phoneCheck.normalized, email: normalizedEmail || undefined, description: notes.trim() }),
      });
      setIsSuccess(true);
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
      setTimeout(() => setIsSuccess(false), 6000);
    } catch (requestError) {
      setSubmitError(requestError instanceof Error ? requestError.message : 'Unable to send your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full py-12 px-4 sm:px-6 lg:px-8 space-y-12 bg-white text-[#344BC2]">
      {/* Title */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-[#b45309] font-mono">
          Get in Touch · አድራሻችንና መስተንግዶ
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#344BC2] font-serif">
          Visit Us or Reserve Your Table
        </h2>
        <p className="text-xs sm:text-sm text-[#344BC2]/80 leading-relaxed">
          Visit us at {BRAND_CONFIG.location}, or send a table reservation and catering inquiry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Contact Cards & Locations (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main restaurant location */}
          <div className="p-6 rounded-2xl bg-[#344BC2] text-white border border-[#159E37] space-y-3 shadow-xl">
            <div className="flex items-center gap-2.5 text-amber-300">
              <MapPin className="w-5 h-5 shrink-0" />
              <h4 className="font-bold text-white text-sm">{BRAND_CONFIG.location}</h4>
            </div>
            <p className="text-xs text-white/85 leading-relaxed">
              {BRAND_CONFIG.location}
            </p>
            <div className="text-[11px] text-white font-ethiopic pt-1">
              ኒብ ኢንተርናሽናል · 3ኛ ፎቅ
            </div>
          </div>

          {/* Location */}
          <div className="p-6 rounded-2xl bg-slate-50 text-[#344BC2] border-2 border-[#159E37] space-y-3 shadow-md">
            <div className="flex items-center gap-2.5 text-[#344BC2]">
              <MapPin className="w-5 h-5 shrink-0 text-[#b45309]" />
              <h4 className="font-bold text-[#344BC2] text-sm">Visit Guansa Ma'ed</h4>
            </div>
            <p className="text-xs text-[#344BC2]/80 leading-relaxed">
              {BRAND_CONFIG.location}
            </p>
            <div className="text-[11px] text-[#159E37] font-ethiopic font-semibold pt-1">
              ኒብ ኢንተርናሽናል · 3ኛ ፎቅ
            </div>
          </div>

          {/* Quick Communication Details */}
          <div className="p-6 rounded-2xl bg-white border-2 border-[#159E37] space-y-3 text-xs text-[#344BC2] shadow-md">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#344BC2] shrink-0" />
              <div>
                <p className="text-[#344BC2]/60 text-[10px]">Mobile & Direct Orders:</p>
                <a href={`tel:${BRAND_CONFIG.primaryPhone}`} className="font-mono text-[#344BC2] hover:underline font-bold text-sm">
                  {BRAND_CONFIG.primaryPhone}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-[#159E37]">
              <Phone className="w-4 h-4 text-[#344BC2] shrink-0" />
              <div>
                <p className="text-[#344BC2]/60 text-[10px]">Addis Ababa Landline Office:</p>
                <a href={`tel:${BRAND_CONFIG.secondaryPhone}`} className="font-mono text-[#344BC2] hover:underline font-bold text-sm">
                  {BRAND_CONFIG.secondaryPhone}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-[#159E37]">
              <Mail className="w-4 h-4 text-[#344BC2] shrink-0" />
              <div>
                <p className="text-[#344BC2]/60 text-[10px]">Official Restaurant Email:</p>
                <a href={`mailto:${BRAND_CONFIG.orderEmail}`} className="text-[#344BC2] font-semibold hover:underline">
                  {BRAND_CONFIG.orderEmail}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-[#159E37]">
              <Clock className="w-4 h-4 text-[#344BC2] shrink-0" />
              <div>
                <p className="text-[#344BC2]/60 text-[10px]">Service Hours:</p>
                <p className="text-[#344BC2] font-medium">{BRAND_CONFIG.hours}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Table Reservation Form (7 cols) */}
        <div className="lg:col-span-7 bg-white text-[#344BC2] border-2 border-[#159E37] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-serif text-[#344BC2]">
              Reserve a Table or Inquire for Catering
            </h3>
            <p className="text-xs text-[#344BC2]/75">
              Send your reservation or catering inquiry. Your feedback is securely saved for our team.
            </p>
          </div>

          {isSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-600 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-700" />
              <span className="font-semibold">Your feedback has been received. Our team will contact you.</span>
            </div>
          )}
          {submitError && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{submitError}</p>}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#344BC2] font-semibold mb-1">
                  Your Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Bethlehem Tesfaye"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
                />
              </div>

              <div>
                <label className="block text-[#344BC2] font-semibold mb-1">
                  Ethiopian Phone Number <span className="text-red-600">*</span>
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
                  className={`w-full px-3 py-2.5 rounded-xl bg-slate-50 border font-mono text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none ${
                    phoneError ? 'border-red-500' : 'border-[#159E37] focus:border-[#159E37]'
                  }`}
                />
                {phoneError && (
                  <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
                    <span>{phoneError}</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <div>
                <label className="block text-[#344BC2] font-semibold mb-1">
                  Email Address <span className="text-[#344BC2]/50">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl bg-slate-50 border text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none ${
                    emailError ? 'border-red-500' : 'border-[#159E37] focus:border-[#159E37]'
                  }`}
                />
                {emailError && <p role="alert" className="mt-1 text-[11px] font-medium text-red-600">{emailError}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[#344BC2] font-semibold mb-1">
                Description <span className="text-red-600">*</span>
              </label>
              <textarea
              required
              maxLength={3000}
              rows={3}
              placeholder="Tell us about your reservation, catering inquiry, or feedback..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
              />
            </div>

            {/* Reverse Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl bg-[#344BC2] hover:bg-[#2C40AE] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-amber-300" />
                <span>{isSubmitting ? 'Sending…' : 'Send Feedback'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
