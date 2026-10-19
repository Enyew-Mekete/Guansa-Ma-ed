import React, { useState, useEffect } from 'react';
import { BrandLogo } from './BrandLogo';
import { BRAND_CONFIG } from '../../config/branding';
import {
  Send,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  Shield,
  Users,
  AlertCircle,
} from 'lucide-react';

interface FooterProps {
  onNavigateTab: (tab: 'home' | 'menu' | 'about' | 'services' | 'news' | 'vacancies' | 'contact' | 'admin') => void;
  onOpenPrivacyPolicy: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab, onOpenPrivacyPolicy }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribersCount, setSubscribersCount] = useState<number>(0);
  const [subscriptionState, setSubscriptionState] = useState<{
    status: 'idle' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch live subscribers count on mount
  useEffect(() => {
    fetch('/api/newsletter/subscribers')
      .then(async (res) => {
        if (!res.ok) throw new Error(`Subscriber count request failed (${res.status}).`);
        return res.json();
      })
      .then((data) => {
        if (data && typeof data.count === 'number') {
          setSubscribersCount(data.count);
        }
      })
      .catch((error: unknown) => {
        console.error('[Newsletter] Unable to load subscriber count.', error);
      });
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscriptionState({ status: 'idle' });

    const trimmed = newsletterEmail.trim().toLowerCase();

    // 1. Strict real email validation pattern
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      setSubscriptionState({
        status: 'error',
        message: 'Please provide a valid, active email address format (e.g. name@gmail.com).',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubscriptionState({
          status: 'error',
          message: data.message || 'Subscription failed. Please check your email.',
        });
        setIsSubmitting(false);
        return;
      }

      // Success! Update the count returned by the database.
      const newCount = typeof data.count === 'number' ? data.count : subscribersCount + 1;
      setSubscribersCount(newCount);

      setSubscriptionState({
        status: 'success',
        message: `Ameseginalehu! You are officially subscribed as reader #${newCount.toLocaleString()}.`,
      });
      setNewsletterEmail('');

      setTimeout(() => {
        setSubscriptionState({ status: 'idle' });
      }, 7000);
    } catch (error) {
      console.error('[Newsletter] Subscription request failed.', error);
      setSubscriptionState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Subscription failed. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="w-full bg-[#344BC2] text-white border-t border-white/15 pt-16 pb-12 transition-colors">
      <div className="w-full px-[3%]">
        {/* 4-Column Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-10 lg:gap-8 pb-12 border-b border-white/10">
          {/* Column 1: Brand & Heritage */}
          <div className="space-y-4">
            <BrandLogo size="md" />
            <p className="text-xs text-white/75 leading-relaxed">
              Guansa Ma'ed ጓንሳ ማዕድ brings the sacred Ethiopian communal dining tradition to life. Founded on {BRAND_CONFIG.foundedDate}, we celebrate authentic highland recipes, freshly milled teff injera, and genuine hospitality.
            </p>
            <div className="pt-2">
              <span className="inline-block text-[11px] font-ethiopic text-white bg-white/5 border border-white/20 px-2.5 py-1 rounded">
                ማዕድ የሚከበረው በፍቅርና በጋራ ነው · Dine Together in Unity
              </span>
            </div>
          </div>

          {/* Column 2: Menu Categories & Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-amber-300 border-b border-amber-400/20 pb-2">
              Culinary Menu & Experience
            </h4>
            <ul className="space-y-2.5 text-xs text-white/80">
              <li>
                <button
                  onClick={() => onNavigateTab('menu')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-amber-400">›</span> Royal Doro Wat (ልዩ የዶሮ ወጥ)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('menu')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-amber-400">›</span> Sizzling Clay Beef Tibs (የፍም ጥብስ)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('menu')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-amber-400">›</span> Rainbow Beyaynetu Vegan (የጾም በያይነቱ)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('menu')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-amber-400">›</span> Buna Coffee Ceremony (ቡና ማፍላት)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('services')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-amber-400">›</span> Catering & Weddings (ኬተሪንግ)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('about')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-amber-400">›</span> Our History & Meaning of Guansa
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('news')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-amber-400">›</span> News & Announcements
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('vacancies')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-amber-400">›</span> Career Opportunities
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Visiting Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-amber-300 border-b border-amber-400/20 pb-2">
              Visit & Contact Us
            </h4>
            <div className="space-y-3 text-xs text-white/80">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{BRAND_CONFIG.location}</span>
              </div>
              
              {/* Primary Mobile Phone */}
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-white/60 mr-1.5">Mobile:</span>
                  <a href={`tel:${BRAND_CONFIG.primaryPhone}`} className="hover:text-white font-mono font-bold text-amber-200">
                    {BRAND_CONFIG.primaryPhone}
                  </a>
                </div>
              </div>

              {/* Secondary Landline Phone */}
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-white/60 mr-1.5">Office:</span>
                  <a href={`tel:${BRAND_CONFIG.secondaryPhone}`} className="hover:text-white font-mono font-bold text-amber-200">
                    {BRAND_CONFIG.secondaryPhone}
                  </a>
                </div>
              </div>

              {/* Official Email */}
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <a href={`mailto:${BRAND_CONFIG.orderEmail}`} className="hover:text-white font-medium">
                  {BRAND_CONFIG.orderEmail}
                </a>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Opening Hours:</p>
                  <p className="text-[11px] text-white/70">{BRAND_CONFIG.hours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Social Media Icons & Newsletter Subscription */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-amber-300 border-b border-amber-400/20 pb-2">
              Social Media & Newsletter
            </h4>
            
            {/* Social Media Icons with Official Brand Icons */}
            <div>
              <p className="text-xs text-white/70 mb-2.5">Connect with our community on social media:</p>
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Official Telegram Channel (https://t.me/En_TechSC) */}
                <a
                  href={BRAND_CONFIG.telegramChannelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-[#229ED9]/20 hover:bg-[#229ED9] text-[#229ED9] hover:text-white border border-[#229ED9]/30 transition-all flex items-center justify-center shadow-sm"
                  title="Official Telegram Channel: @En_TechSC"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
                  </svg>
                </a>

                {/* 2. Direct Order Telegram (https://t.me/Paulos_21) */}
                <a
                  href={BRAND_CONFIG.telegramOrderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/30 transition-all flex items-center justify-center shadow-sm"
                  title="Direct Order Telegram: @Paulos_21"
                >
                  <Send className="w-4 h-4" />
                </a>

                {/* 3. Facebook */}
                <a
                  href={BRAND_CONFIG.socialLinks.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-[#1877F2]/20 hover:bg-[#1877F2] text-[#1877F2] hover:text-white border border-[#1877F2]/30 transition-all flex items-center justify-center shadow-sm"
                  title="Facebook: Guansa Ma'ed"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* 4. Instagram */}
                <a
                  href={BRAND_CONFIG.socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-[#E4405F]/20 hover:bg-[#E4405F] text-[#E4405F] hover:text-white border border-[#E4405F]/30 transition-all flex items-center justify-center shadow-sm"
                  title="Instagram: @guansa_maed"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>

                {/* 5. TikTok */}
                <a
                  href={BRAND_CONFIG.socialLinks.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-slate-900 text-white border border-white/20 transition-all flex items-center justify-center shadow-sm"
                  title="TikTok: @guansamaed"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.27 1.76-.23.99-.04 2.09.6 2.89.62.77 1.63 1.19 2.61 1.14.9-.03 1.76-.47 2.29-1.19.42-.58.59-1.31.59-2.03.02-4.38.01-8.77.02-13.15z" />
                  </svg>
                </a>

                {/* 6. YouTube */}
                <a
                  href={BRAND_CONFIG.socialLinks.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-[#FF0000]/20 hover:bg-[#FF0000] text-[#FF0000] hover:text-white border border-[#FF0000]/30 transition-all flex items-center justify-center shadow-sm"
                  title="YouTube: Guansa Ma'ed Channel"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Newsletter Subscription with Live Counter & Real Email Check */}
            <div className="pt-2">
              {/* Live Real-time Subscribers Counter */}
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-[11px] font-semibold text-white/90">VIP Culinary Newsletter:</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-300 bg-white/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <Users className="w-3 h-3 text-amber-300" />
                  <span>{subscribersCount.toLocaleString()} Subscribers</span>
                </span>
              </div>

              <p className="text-[11px] text-white/70 mb-2">
                Join our verified community for seasonal holiday feasts and tasting invitations:
              </p>

              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex items-center bg-[#344BC2] border-2 border-[#159E37] rounded-xl overflow-hidden focus-within:border-[#159E37]">
                  <input
                    type="email"
                    required
                    placeholder="Enter your active email..."
                    value={newsletterEmail}
                    onChange={(e) => {
                      setNewsletterEmail(e.target.value);
                      if (subscriptionState.status !== 'idle') {
                        setSubscriptionState({ status: 'idle' });
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-transparent text-white placeholder-white/40 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 px-3.5 py-2 text-xs font-bold shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Subscribe"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? '...' : 'Join'}</span>
                  </button>
                </div>

                {/* Status Notifications */}
                {subscriptionState.status === 'success' && (
                  <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[11px] flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>{subscriptionState.message}</span>
                  </div>
                )}

                {subscriptionState.status === 'error' && (
                  <div className="p-2 rounded-lg bg-red-950/80 border border-red-500/50 text-red-300 text-[11px] flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                    <span>{subscriptionState.message}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Privacy Policy Link */}
            <div className="pt-1">
              <button
                onClick={onOpenPrivacyPolicy}
                className="text-xs text-amber-300/80 hover:text-amber-200 underline flex items-center gap-1 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Privacy Policy & Data Security</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-white/70 gap-4 border-t border-white/10 mt-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <p>© {new Date().getFullYear()} Guansa Ma'ed ጓንሳ ማዕድ Restaurant. All rights reserved.</p>
            <span className="hidden sm:inline text-white/40">|</span>
            <p className="text-amber-300 font-semibold tracking-wide">
              Powered By Enyew M. CEO & Founder of En-Tech S.C
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigateTab('about')} className="hover:text-white transition-colors cursor-pointer">
              About Guansa Ma'ed
            </button>
            <span>·</span>
            <button onClick={onOpenPrivacyPolicy} className="hover:text-white transition-colors cursor-pointer">
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
