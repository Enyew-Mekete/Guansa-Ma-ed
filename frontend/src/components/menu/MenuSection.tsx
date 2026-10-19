import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MenuItem, MenuType, StockStatus } from '../../types';
import { MenuCard } from './MenuCard';
import { useMenu } from '../../context/MenuContext';
import { useHeroImages } from '../../context/HeroImagesContext';
import { Coffee, Search, Utensils } from 'lucide-react';

type MenuSelection = MenuType | 'all';

interface MenuSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenDetail: (item: MenuItem) => void;
  onApplyToBuy: (item: MenuItem) => void;
  isHomePreview?: boolean;
  onExploreMore?: () => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenDetail,
  onApplyToBuy,
  isHomePreview = false,
  onExploreMore,
}) => {
  const { menuItems, menuCategories, error } = useMenu();
  const { heroImages, error: heroImagesError } = useHeroImages();
  const [menuType, setMenuType] = useState<MenuSelection>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'price_low' | 'price_high' | 'rating'>('popular');

  const categories = menuType === 'all'
    ? menuCategories
    : menuCategories.filter((category) => category.menuType === menuType);
  const menuItemCount = menuItems.filter((item) => menuType === 'all' || item.menuType === menuType).length;

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (menuType !== 'all' && item.menuType !== menuType) return false;
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Stock status filter
      if (stockFilter === 'in_stock' && item.stockStatus === 'out_of_stock') {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = item.name.toLowerCase().includes(q);
        const amharicMatch = item.nameAmharic.toLowerCase().includes(q);
        const descMatch = item.description.toLowerCase().includes(q);
        const categoryMatch = item.categoryName?.toLowerCase().includes(q) ||
          item.categoryNameAmharic?.toLowerCase().includes(q);
        const ingMatch = item.ingredients?.some((ing) => ing.toLowerCase().includes(q));
        if (!nameMatch && !amharicMatch && !descMatch && !categoryMatch && !ingMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [menuItems, menuType, selectedCategory, stockFilter, searchQuery, sortBy]);
  const displayedItems = isHomePreview ? filteredItems.slice(0, 4) : filteredItems;

  return (
    <section className="w-full py-12 px-4 sm:px-6 lg:px-8 space-y-8 bg-white text-[#344BC2]">
      {error && <p role="alert" className="mx-auto max-w-5xl rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {heroImagesError && <p role="alert" className="mx-auto max-w-5xl rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{heroImagesError}</p>}
      {!isHomePreview && heroImages.length > 0 && (
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-start justify-items-center gap-4 sm:grid-cols-2 lg:gap-6">
          {heroImages.map((heroImage) => (
            <figure key={heroImage.id} className="w-full text-center">
              <img
                src={heroImage.image}
                alt={heroImage.heading}
                style={{
                  width: '100%',
                  maxWidth: `${heroImage.width}px`,
                  height: `${heroImage.height}px`,
                  borderRadius: `${heroImage.borderRadius}px`,
                }}
                className="mx-auto bg-slate-50 object-contain shadow-md transition-transform duration-500 hover:scale-[1.02]"
                loading="lazy"
              />
              <figcaption className="mt-2">
                <h3 className="font-serif text-base font-bold text-[#344BC2]">{heroImage.heading}</h3>
                <p className="text-xs text-[#344BC2]/70">{heroImage.label}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {/* Title & Cultural Heading with scroll entrance animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mx-auto max-w-3xl space-y-2 text-center"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-[#b45309] font-mono">
          {menuType === 'food'
            ? 'Authentic Highland Recipes · ትክክለኛ የሀገር ባህል'
            : menuType === 'drink'
              ? 'Traditional Ethiopian Drinks · ባህላዊ መጠጦች'
              : "Traditional Ethiopian Food & Drinks · ባህላዊ ምግብና መጠጥ"}
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#344BC2] font-serif">
          {isHomePreview
            ? 'Menu Highlights · የምግብ እና መጠጥ ምርጥ ምርጫ'
            : menuType === 'food'
            ? 'Our Traditional Food Menu · የምግብ ዝርዝር'
            : menuType === 'drink'
              ? 'Our Drink Menu · የመጠጥ ዝርዝር'
              : 'Our Menu · የምግብና መጠጥ ዝርዝር'}
        </h2>
        <p className="text-xs sm:text-sm text-[#344BC2]/80 leading-relaxed">
          {menuType === 'food'
            ? 'Every dish is prepared using heirloom spices from the Ethiopian highlands, organic teff injera, and pure clarified butter (Niter Kibbeh).'
            : menuType === 'drink'
              ? 'Explore traditional Ethiopian coffee, beverages, and refreshing drinks.'
              : 'Explore traditional Ethiopian food, coffee, beverages, and refreshing drinks.'} Apply to buy instantly via Telegram and Email.
        </p>
      </motion.div>

      {!isHomePreview && <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex shrink-0 items-center gap-3 text-sm font-bold text-[#344BC2]">
          <span>Menu</span>
          <select
            value={menuType}
            onChange={(event) => {
              setMenuType(event.target.value as MenuSelection);
              setSelectedCategory('all');
            }}
            className="rounded-lg border border-[#159E37] bg-white px-3 py-2"
            aria-label="Choose menu"
          >
            <option value="all">All Menu</option>
            <option value="food">Food Menu</option>
            <option value="drink">Drink Menu</option>
          </select>
        </label>
        <label className="flex w-full items-center gap-3 rounded-2xl border-2 border-[#159E37] bg-slate-50 px-4 py-3 text-sm shadow-sm focus-within:border-[#159E37] sm:ml-auto sm:max-w-md">
          <Search className="h-5 w-5 shrink-0 text-[#344BC2]/60" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={`Search ${menuType === 'food' ? 'dishes' : menuType === 'drink' ? 'drinks' : 'food and drinks'}, ingredients, or category…`}
            aria-label={`Search ${menuType === 'all' ? 'all' : menuType} menu`}
            className="w-full bg-transparent text-[#344BC2] outline-none placeholder:text-[#344BC2]/50"
          />
        </label>
      </div>}

      {/* Filter & Controls Toolbar */}
      {!isHomePreview && <div className="space-y-4">
        {/* Category Tabs with Reverse Active Buttons for High Contrast */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', name: menuType === 'food' ? 'All Food' : menuType === 'drink' ? 'All Drinks' : 'All Menu', nameAmharic: 'ሁሉም' },
            ...categories,
          ].map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#344BC2] text-white shadow-md font-bold'
                    : 'bg-slate-100 text-[#344BC2] hover:bg-[#344BC2]/10 border border-[#159E37]'
                }`}
              >
                <span>{cat.name}</span>
                {cat.nameAmharic && (
                  <span className={`text-[10px] font-ethiopic ${isActive ? 'text-white' : 'text-[#159E37]'}`}>
                    ({cat.nameAmharic})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sub-bar: Search Info, Stock Filter, and Sorting */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border-2 border-[#159E37] text-xs text-[#344BC2]">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-[#344BC2]/80">
              Showing <strong className="text-[#344BC2] font-mono font-bold">{filteredItems.length}</strong> of{' '}
              <strong className="text-[#344BC2] font-mono font-bold">{menuItemCount}</strong> {menuType === 'food' ? 'food items' : menuType === 'drink' ? 'drinks' : 'menu items'}
            </span>

            {searchQuery && (
              <span className="text-[11px] bg-[#344BC2] text-white px-2 py-0.5 rounded font-medium">
                Keyword: "{searchQuery}"
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* In-Stock Only Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-[#344BC2] hover:text-[#2C40AE] font-medium">
              <input
                type="checkbox"
                checked={stockFilter === 'in_stock'}
                onChange={(e) => setStockFilter(e.target.checked ? 'in_stock' : 'all')}
                className="rounded border-[#159E37] text-[#344BC2] focus:ring-0"
              />
              <span className="text-[11px]">In Stock Only</span>
            </label>

            <span className="text-[#344BC2]/30">|</span>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#344BC2]/70 text-[11px] font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-[#159E37] rounded-lg px-2.5 py-1 text-[11px] text-[#344BC2] font-medium focus:outline-none focus:border-[#159E37]"
              >
                <option value="popular">Recommended / Featured</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Highest Customer Rating</option>
              </select>
            </div>
          </div>
        </div>
      </div>}

      {/* Product Grid with Framer Motion Scroll-Triggered Entrance Animations */}
      {displayedItems.length === 0 ? (
        <div className="bg-slate-50 border-2 border-[#159E37] rounded-2xl p-12 text-center space-y-4 text-[#344BC2]">
          <div className="w-16 h-16 rounded-full bg-[#344BC2]/10 flex items-center justify-center mx-auto text-[#344BC2] border border-[#159E37]">
            {menuType === 'drink' ? <Coffee className="w-8 h-8" /> : <Utensils className="w-8 h-8" />}
          </div>
            <h3 className="text-lg font-bold text-[#344BC2]">No {menuType === 'food' ? 'food items' : menuType === 'drink' ? 'drinks' : 'menu items'} matched your search</h3>
          <p className="text-xs text-[#344BC2]/70 max-w-sm mx-auto">
            Try another search or choose a different category.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setStockFilter('all');
            }}
            className="px-5 py-2.5 rounded-xl bg-[#344BC2] hover:bg-[#2C40AE] text-white font-bold text-xs transition-colors shadow-md cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <motion.div
          key={`${selectedCategory}-${stockFilter}-${sortBy}-${searchQuery}`}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 sm:gap-8"
        >
          {displayedItems.map((item) => (
            <motion.div
              key={item.id}
              variants={{
                hidden: { opacity: 0, y: 32, scale: 0.98 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  },
                },
              }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="h-full flex flex-col"
            >
              <MenuCard
                item={item}
                onOpenDetail={onOpenDetail}
                onApplyToBuy={onApplyToBuy}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
      {isHomePreview && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onExploreMore}
            className="rounded-xl bg-[#159E37] px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#107d2b]"
          >
            Explore more
          </button>
        </div>
      )}
    </section>
  );
};
