import React from 'react';
import { BRAND_CONFIG, BRAND_ASSETS } from '../../config/branding';

interface BrandLogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: 'sm' | 'md' | 'lg';
  englishOnly?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  showSubtitle = true,
  size = 'md',
  englishOnly = false,
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12 sm:h-14 sm:w-14',
  }[size];

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-lg sm:text-2xl',
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none group cursor-pointer ${className}`}>
      <img
        src={BRAND_ASSETS.logo}
        alt="Guansa Ma'ed logo"
        className={`${sizeClasses} shrink-0 object-contain transition-transform duration-300 group-hover:scale-105`}
      />

      {/* Brand Typographic Identity (English & optional Amharic) */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span className={`font-bold tracking-tight text-white ${titleSizes} font-serif`}>
            {BRAND_CONFIG.name}
          </span>
          {!englishOnly && (
            <span className="font-semibold text-white font-ethiopic text-sm md:text-base">
              {BRAND_CONFIG.nameAmharic}
            </span>
          )}
        </div>
        {showSubtitle && (
          <span className="text-[10px] md:text-xs text-amber-200/80 tracking-wider uppercase font-medium">
            {englishOnly ? 'Restaurant' : 'Restaurant · ሬስቶራንት'}
          </span>
        )}
      </div>
    </div>
  );
};
