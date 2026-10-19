import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  ShoppingBag,
  LogIn,
  Menu as MenuIcon,
  X,
  User,
} from 'lucide-react';
import { useNews } from '../../context/NewsContext';

export type ActiveTab = 'home' | 'menu' | 'about' | 'services' | 'news' | 'vacancies' | 'contact' | 'admin';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenApplyModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
}) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { currentUser, accessRoles } = useAuth();
  const { unreadCount } = useNews();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentRoleLabel = currentUser?.role === 'SUPER_ADMIN'
    ? 'Super Admin'
    : currentUser?.assignedRoleName ||
      accessRoles.find((role) => role.id === currentUser?.assignedRoleId)?.name ||
      'Admin';

  // English-only navigation links for Header (Amharic words removed from Header only)
  const navLinks: { id: ActiveTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'menu', label: 'Menu' },
    { id: 'services', label: 'Services' },
    { id: 'news', label: 'News' },
    { id: 'vacancies', label: 'Vacancies' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val && activeTab !== 'menu') {
      setActiveTab('menu');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#344BC2] backdrop-blur-md border-b border-white/15 text-white transition-colors duration-200 shadow-lg shadow-black/15">
      {/* 
        Full window responsive container:
        Logo has 3% left margin from the end of the header width.
        Menu buttons and actions have 3% right margin from the right side.
        Full computable across mobile, tablet, and minimized windows.
      */}
      <div className="w-full px-[3%] h-20 sm:h-24 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Brand Logo (3% margin from left border, English-only branding) */}
        <div onClick={() => handleNavClick('home')} className="shrink-0 flex items-center">
          <BrandLogo size="lg" englishOnly={true} />
        </div>

        {/* Right Side: Desktop / Tablet Navigation & Action Controls (3% margin from right border) */}
        <div className="hidden lg:flex min-w-0 items-center gap-1 xl:gap-3">
          <nav className="flex min-w-0 items-center gap-0 text-xs font-medium xl:gap-1 xl:text-sm">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-2 py-2 rounded-xl transition-all duration-200 whitespace-nowrap font-medium text-xs cursor-pointer xl:px-4 xl:py-2.5 xl:text-sm ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.id === 'news' && unreadCount > 0 && (
                    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-white" aria-label={`${unreadCount} new updates`}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Search Bar / Engine Input */}
          <div className="relative flex items-center">
            {isSearchOpen ? (
              <div className="flex items-center bg-[#344BC2] border-2 border-[#159E37] rounded-xl px-2.5 py-1.5 shadow-inner transition-all w-48 xl:w-60">
                <Search className="w-4 h-4 text-amber-400 shrink-0 mr-2" />
                <input
                  type="text"
                  placeholder="Search dishes, drinks..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoFocus
                  className="w-full bg-transparent text-xs text-white placeholder-white/50 focus:outline-none"
                />
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="text-white/50 hover:text-white ml-1 p-0.5 cursor-pointer"
                  title="Close search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsSearchOpen(true);
                  if (activeTab !== 'menu') setActiveTab('menu');
                }}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-[#159E37] flex items-center gap-1.5 text-xs cursor-pointer"
                title="Search Food Menu"
              >
                <Search className="w-4 h-4 text-amber-300" />
                <span className="hidden xl:inline text-white/85">Search</span>
              </button>
            )}
          </div>

          {/* Bag / Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 text-sm cursor-pointer xl:p-3"
            title="Open Order Bag"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden xl:inline">Bag</span>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#159E37] shadow">
                {totalItems}
              </span>
            )}
          </button>

          {/* Sign-in / Portal Button */}
          <button
            onClick={() => handleNavClick('admin')}
            className={`p-2 rounded-xl text-sm font-semibold transition-all border flex items-center gap-1.5 cursor-pointer xl:p-3 ${
              activeTab === 'admin'
                ? 'bg-white text-[#344BC2] border-white shadow-md'
                : 'bg-white/10 text-white/90 border-white/15 hover:bg-white/20'
            }`}
            title="Admin & Super Admin Portal"
          >
            {currentUser ? (
              <>
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden max-w-24 truncate xl:inline">{currentRoleLabel}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-amber-300" />
                <span>Sign in</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile / Tablet / Minimized Window Actions (3% margin from right border) */}
        <div className="flex lg:hidden items-center gap-2">
          {/* Mobile Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-xl bg-amber-500 text-slate-950 cursor-pointer shadow-sm"
            title="Open Order Bag"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#159E37]">
                {totalItems}
              </span>
            )}
          </button>

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (English Only, Responsive across all devices) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#344BC2] border-t border-white/15 px-[3%] pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
          {/* Mobile Search Engine */}
          <div className="flex items-center bg-white/10 border border-[#159E37] rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-amber-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search dishes, drinks..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-transparent text-xs text-white placeholder-white/50 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-white/60">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.id === 'news' && unreadCount > 0 && (
                    <span className="ml-auto mr-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-white/15 flex items-center justify-between">
            <button
              onClick={() => handleNavClick('admin')}
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 text-white font-medium text-xs flex items-center justify-center gap-2 border border-white/20 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>{currentUser ? `Admin Portal (${currentRoleLabel})` : 'Sign in'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
