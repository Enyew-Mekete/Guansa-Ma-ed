import React from 'react';
import { useMenu } from '../../context/MenuContext';
import { BRAND_CONFIG } from '../../config/branding';
import {
  Utensils,
  Coffee,
  CalendarCheck,
  Crown,
  Truck,
  CheckCircle,
  ArrowRight,
  PhoneCall,
  Send,
} from 'lucide-react';

interface ServicesSectionProps {
  onContactClick: () => void;
  onExploreMenu: () => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  onContactClick,
  onExploreMenu,
}) => {
  const { services } = useMenu();

  const getIcon = (name: string) => {
    switch (name) {
      case 'Utensils':
        return <Utensils className="w-6 h-6 text-amber-300" />;
      case 'Coffee':
        return <Coffee className="w-6 h-6 text-amber-300" />;
      case 'CalendarCheck':
        return <CalendarCheck className="w-6 h-6 text-amber-300" />;
      case 'Crown':
        return <Crown className="w-6 h-6 text-amber-300" />;
      case 'Truck':
        return <Truck className="w-6 h-6 text-amber-300" />;
      default:
        return <Utensils className="w-6 h-6 text-amber-300" />;
    }
  };

  return (
    <div className="w-full py-12 px-4 sm:px-6 lg:px-8 space-y-12 bg-white text-[#344BC2]">
      {/* Heading */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-[#b45309] font-mono">
          Cultural Hospitality & Event Solutions · ልዩ አገልግሎቶቻችን
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#344BC2] font-serif">
          Our Signature Culinary Services
        </h2>
        <p className="text-xs sm:text-sm text-[#344BC2]/80 leading-relaxed">
          From intimate Mesob family dinners and authentic Jebena coffee rituals to large-scale holiday banquets and express city delivery across Addis Ababa.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {services.map((srv) => (
          <div
            key={srv.id}
            className="rounded-2xl bg-white border-2 border-[#159E37] p-6 sm:p-7 space-y-5 shadow-md hover:border-[#159E37] hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-[#344BC2]"
          >
            <div className="space-y-4">
              {/* Badge & Icon */}
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-[#344BC2] text-amber-300 shadow-sm">
                  {getIcon(srv.iconName)}
                </div>
                {srv.badge && (
                  <span className="text-[11px] font-bold text-white bg-[#344BC2] px-2.5 py-1 rounded-full shadow-sm">
                    {srv.badge}
                  </span>
                )}
              </div>

              {/* Title & Amharic */}
              <div>
                <h3 className="text-lg font-bold text-[#344BC2] font-serif">{srv.title}</h3>
                <h4 className="text-xs font-ethiopic text-[#159E37] font-semibold mt-0.5">
                  {srv.titleAmharic}
                </h4>
                <p className="text-xs text-[#344BC2]/75 italic mt-1">{srv.tagline}</p>
              </div>

              {/* Description */}
              <p className="text-xs text-[#344BC2]/80 leading-relaxed">{srv.description}</p>

              {/* Feature Checklist */}
              <ul className="space-y-2 pt-2 border-t border-[#159E37]">
                {srv.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-[#344BC2]/85">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Reverse Inquire Action */}
            <div className="pt-4 border-t border-[#159E37]">
              <button
                onClick={onContactClick}
                className="w-full py-2.5 px-3 rounded-xl bg-[#344BC2] hover:bg-[#2C40AE] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <span>Reserve or Inquire</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Direct Booking Callout Banner (High Contrast Reverse Rectangle) */}
      <div className="rounded-3xl bg-[#344BC2] text-white border-2 border-[#159E37] p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
            Planning a Wedding, Holiday Feast, or VIP Gathering?
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white font-serif">
            Let Chef Guansa Wolde Curate Your Culinary Experience
          </h3>
          <p className="text-xs text-white/85 max-w-xl leading-relaxed">
            We provide full on-site setup, traditional servers in cultural Netela attire, live charcoal roasting, and custom Mesob presentations tailored to your celebration.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <a
            href={`tel:${BRAND_CONFIG.primaryPhone.replace(/\s+/g, '')}`}
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call Us: {BRAND_CONFIG.primaryPhone}</span>
          </a>

          <a
            href={`https://t.me/${BRAND_CONFIG.telegramUsername}`}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-white hover:bg-slate-100 text-[#344BC2] font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow"
          >
            <Send className="w-4 h-4 text-[#344BC2]" />
            <span>Chat on Telegram</span>
          </a>
        </div>
      </div>
    </div>
  );
};
