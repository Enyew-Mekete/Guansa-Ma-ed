import React from 'react';
import { MenuItem } from '../../types';
import { useCart } from '../../context/CartContext';
import { Star, ShoppingBag, Send, Flame } from 'lucide-react';

interface MenuCardProps {
  item: MenuItem;
  onOpenDetail: (item: MenuItem) => void;
  onApplyToBuy: (item: MenuItem) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({
  item,
  onOpenDetail,
  onApplyToBuy,
}) => {
  const { addItem } = useCart();

  const stockBadge = {
    in_stock: { label: 'In Stock · ዝግጁ', color: 'bg-[#344BC2] text-white border-[#159E37]' },
    chefs_special: { label: "Chef's Special · የሼፉ", color: 'bg-amber-500 text-slate-950 font-bold border-amber-600' },
    fresh_today: { label: 'Fresh Today · ዛሬ', color: 'bg-emerald-700 text-white border-emerald-800' },
    limited_batch: { label: 'Limited · የተወሰነ', color: 'bg-purple-900 text-white border-purple-950' },
    out_of_stock: { label: 'Sold Out · አልቋል', color: 'bg-red-700 text-white border-red-800' },
  }[item.stockStatus];

  return (
    <div className="group rounded-2xl bg-white border-2 border-[#159E37] overflow-hidden shadow-md hover:shadow-xl hover:border-[#159E37] transition-all duration-300 flex flex-col justify-between text-[#344BC2]">
      {/* Clickable Image & Badge Area */}
      <div
        onClick={() => onOpenDetail(item)}
        className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 cursor-pointer"
      >
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />

        {/* High Contrast Stock Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border shadow-sm ${stockBadge.color}`}>
            {stockBadge.label}
          </span>
        </div>

        {/* Spice Level Indicator */}
        {item.spiceLevel !== 'None' && (
          <div className="absolute top-3 right-3 bg-[#344BC2] text-white px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 shadow-sm border border-white/20">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>{item.spiceLevel}</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div onClick={() => onOpenDetail(item)} className="cursor-pointer space-y-1">
          {/* Category kicker */}
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#b45309]">
            {item.categoryName ?? item.category}
          </span>

          {/* Dish Name */}
          <h3 className="font-bold text-base text-[#344BC2] group-hover:text-[#2C40AE] transition-colors line-clamp-1">
            {item.name}
          </h3>

          {/* Amharic Script Name */}
          <h4 className="text-xs font-ethiopic text-[#159E37] font-semibold">
            {item.nameAmharic}
          </h4>

          {/* Description */}
          <p className="text-xs text-[#344BC2]/75 line-clamp-2 pt-1 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Rating & Review Counter with Price */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-[#159E37]">
          <div className="flex items-center gap-1 text-[#344BC2]">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span className="font-bold font-mono text-[#344BC2] text-xs">{item.rating}</span>
            <span className="text-[#344BC2]/60 text-[11px]">({item.reviewCount})</span>
          </div>

          {/* Reverse Price Box for High Visibility */}
          <div className="text-right">
            <span className="text-base font-extrabold text-[#344BC2] font-mono">
              {item.price.toLocaleString()} ETB
            </span>
          </div>
        </div>

        {/* Action Buttons: Apply to Order & Quick Add */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {/* Reverse Primary Action: Apply to Order */}
          <button
            onClick={() => onApplyToBuy(item)}
            className="w-full py-2.5 px-2.5 rounded-xl bg-[#344BC2] hover:bg-[#2C40AE] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
            title="Place an order via Telegram or Email"
          >
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <span>Apply to Order</span>
          </button>

          {/* Secondary Action: Add to Bag */}
          <button
            onClick={() => addItem(item, 1)}
            className="w-full py-2.5 px-2.5 rounded-xl bg-slate-100 hover:bg-[#344BC2]/10 text-[#344BC2] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#159E37] transition-all active:scale-95"
            title="Add dish to feast bag"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#344BC2]" />
            <span>Add to Bag</span>
          </button>
        </div>
      </div>
    </div>
  );
};
