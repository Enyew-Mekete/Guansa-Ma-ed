/**
 * Guansa Ma'ed Restaurant ጓንሳ ማዕድ
 * Main Application Component
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { MenuProvider } from './context/MenuContext';
import { NewsProvider } from './context/NewsContext';
import { HeroImagesProvider } from './context/HeroImagesContext';
import { AuthProvider } from './context/AuthContext';
import { Header, ActiveTab } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { PrivacyPolicyModal } from './components/common/PrivacyPolicyModal';
import { HeroSection } from './components/home/HeroSection';
import { MenuSection } from './components/menu/MenuSection';
import { AboutSection } from './components/about/AboutSection';
import { ServicesSection } from './components/services/ServicesSection';
import { ContactSection } from './components/contact/ContactSection';
import { NewsPage } from './components/news/NewsPage';
import { VacanciesPage } from './components/vacancies/VacanciesPage';
import { AdminPortal } from './components/admin/AdminPortal';
import { ProductDetailModal } from './components/menu/ProductDetailModal';
import { ApplyToBuyModal } from './components/menu/ApplyToBuyModal';
import { CartDrawer } from './components/menu/CartDrawer';
import { OtpVerificationModal } from './components/admin/OtpVerificationModal';
import { MenuItem } from './types';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item for Product Detail Modal
  const [selectedDetailItem, setSelectedDetailItem] = useState<MenuItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Selected item for Direct Apply To Buy Modal
  const [selectedBuyItem, setSelectedBuyItem] = useState<MenuItem | null>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  // Privacy Policy modal
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const handleOpenDetail = (item: MenuItem) => {
    setSelectedDetailItem(item);
    setIsDetailModalOpen(true);
  };

  const handleApplyToBuy = (item?: MenuItem) => {
    setSelectedBuyItem(item || null);
    setIsBuyModalOpen(true);
  };

  return (
    <div className="min-h-dvh w-full flex flex-col bg-white text-[#344BC2] selection:bg-[#344BC2] selection:text-white transition-colors duration-200">
      {/* 1. Sticky Header with Logo, Navigation, Search, Theme Toggle, Bag, Admin */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenApplyModal={() => handleApplyToBuy()}
      />

      {/* 2. Main Content Area with Smooth Framer Motion Tab Page Transitions */}
      <main className="w-full flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {/* 3D Hero Section next to Header */}
              <HeroSection
                onExploreMenu={() => {
                  setActiveTab('menu');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onApplyToBuy={() => handleApplyToBuy()}
                onOpenAbout={() => {
                  setActiveTab('about');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />

              {/* Featured Food Menu Grid directly accessible on home */}
              <MenuSection
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onOpenDetail={handleOpenDetail}
                onApplyToBuy={handleApplyToBuy}
                isHomePreview
                onExploreMore={() => {
                  setActiveTab('menu');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </motion.div>
          )}

          {activeTab === 'menu' && (
            <motion.div
              key="menu-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <MenuSection
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onOpenDetail={handleOpenDetail}
                onApplyToBuy={handleApplyToBuy}
              />
            </motion.div>
          )}

          {activeTab === 'services' && (
            <motion.div
              key="services-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <ServicesSection
                onContactClick={() => {
                  setActiveTab('contact');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onExploreMenu={() => {
                  setActiveTab('menu');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </motion.div>
          )}

          {activeTab === 'news' && (
            <motion.div
              key="news-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <NewsPage />
            </motion.div>
          )}

          {activeTab === 'vacancies' && (
            <motion.div
              key="vacancies-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <VacanciesPage onOpenPrivacyPolicy={() => setIsPrivacyModalOpen(true)} />
            </motion.div>
          )}

          {activeTab === 'about' && (
            <motion.div
              key="about-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <AboutSection />
            </motion.div>
          )}

          {activeTab === 'contact' && (
            <motion.div
              key="contact-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <ContactSection />
            </motion.div>
          )}

          {activeTab === 'admin' && (
            <motion.div
              key="admin-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <AdminPortal />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. Footer in 4 columns */}
      {activeTab !== 'admin' && (
        <Footer
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenPrivacyPolicy={() => setIsPrivacyModalOpen(true)}
        />
      )}

      {/* Global Modals */}
      <ProductDetailModal
        item={selectedDetailItem}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onApplyToBuy={(item) => handleApplyToBuy(item)}
      />

      <ApplyToBuyModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        singleItem={selectedBuyItem}
      />

      <CartDrawer
        onCheckout={() => {
          setSelectedBuyItem(null);
          setIsBuyModalOpen(true);
        }}
      />

      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* Automated OTP Verification Popup */}
      <OtpVerificationModal />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MenuProvider>
          <NewsProvider>
            <HeroImagesProvider>
              <CartProvider>
                <AppContent />
              </CartProvider>
            </HeroImagesProvider>
          </NewsProvider>
        </MenuProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
