import React from 'react';
import { Hero3DCanvas } from './Hero3DCanvas';
import { BRAND_CONFIG, BRAND_ASSETS } from '../../config/branding';
import {
  Utensils,
  Send,
  Coffee,
  Sparkles,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface HeroSectionProps {
  onExploreMenu: () => void;
  onApplyToBuy: () => void;
  onOpenAbout: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreMenu,
  onApplyToBuy,
  onOpenAbout,
}) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-12 lg:pb-20 bg-white text-[#344BC2] border-b border-[#159E37]">
      {/* Subtle warm Ethiopian golden glow in background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-400/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Brand Story & Conversion CTAs (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Reverse Kicker Badge for High Contrast Accessibility */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#344BC2] text-white shadow-sm border border-[#159E37]">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-semibold font-ethiopic text-white">
                የኢትዮጵያ ባህላዊ ማዕድ እና የከፍታዎች መስተንግዶ
              </span>
            </div>

            {/* Display Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#344BC2] font-serif leading-[1.15]">
              Taste the Sacred Communal Feast at{' '}
              <span className="text-[#b45309] underline decoration-[#344BC2]/40 decoration-wavy decoration-2">
                Guansa Ma'ed
              </span>{' '}
              <span className="font-ethiopic text-2xl sm:text-4xl text-[#159E37] block sm:inline mt-1 sm:mt-0 font-bold">
                (ጓንሳ ማዕድ)
              </span>
            </h1>

            {/* Body copy */}
            <p className="text-sm sm:text-base text-[#344BC2]/85 max-w-2xl leading-relaxed mx-auto lg:mx-0 font-normal">
              Guansa Ma'ed - ጓንሳ ማዕድ is Top 10 Restaurant in Ethiopia, Guansa is more than a restaurant; it is a destination where tradition, community, and exceptional Ethiopian cuisine come together. From signature dishes to the cherished Jebena coffee ceremony, every experience reflects our passion for heritage, quality, and hospitality.            </p>

            {/* Interactive Primary CTAs (High Contrast Reverse Styling) */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={onExploreMenu}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#344BC2] hover:bg-[#2C40AE] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#344BC2]/20 transition-all active:scale-95 cursor-pointer"
              >
                <Utensils className="w-4 h-4 text-amber-300" />
                <span>Explore Menu & Apply to Order</span>
              </button>

              <button
                onClick={onApplyToBuy}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-[#344BC2] font-bold text-sm flex items-center justify-center gap-2 border-2 border-[#159E37] transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4 text-[#344BC2]" />
                <span>Quick Order (Telegram / Email)</span>
              </button>
            </div>

            {/* Reverse High Contrast Stat Rectangles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#159E37] text-left">
              <div className="p-3 rounded-xl bg-[#344BC2] text-white shadow-md border border-[#159E37]">
                <div className="flex items-center gap-1.5 text-amber-300 mb-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold text-white/80">Founded</span>
                </div>
                <p className="text-xs font-bold text-white">{BRAND_CONFIG.foundedDate}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#344BC2] text-white shadow-md border border-[#159E37]">
                <div className="flex items-center gap-1.5 text-amber-300 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold text-white/80">Authenticity</span>
                </div>
                <p className="text-xs font-bold text-white">100% Pure Teff</p>
              </div>

              <div className="p-3 rounded-xl bg-[#344BC2] text-white shadow-md border border-[#159E37]">
                <div className="flex items-center gap-1.5 text-amber-300 mb-0.5">
                  <Coffee className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold text-white/80">Ceremony</span>
                </div>
                <p className="text-xs font-bold text-white">Daily Buna Ritual</p>
              </div>

              <div className="p-3 rounded-xl bg-[#344BC2] text-white shadow-md border border-[#159E37]">
                <div className="flex items-center gap-1.5 text-amber-300 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold text-white/80">Rating</span>
                </div>
                <p className="text-xs font-bold text-amber-300 font-mono">4.9 ★ / 5.0</p>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Mesob Interactive WebGL Canvas (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-3xl bg-slate-50 border-2 border-[#159E37] shadow-xl p-2 relative overflow-hidden">
              <Hero3DCanvas />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
