import React from 'react';
import { useCart } from '../../context/CartContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout }) => {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    totalPrice,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l-2 border-[#159E37] text-[#344BC2] shadow-2xl flex flex-col">
          {/* Reverse Header for High Contrast */}
          <div className="p-5 bg-[#344BC2] text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-lg text-amber-300">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Your Feast Bag · የትዕዛዝ ማዕድ</h3>
                <p className="text-[11px] text-amber-200 font-medium">
                  {items.length} unique item{items.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-white">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-[#344BC2]/60">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-[#344BC2]/40 border border-[#159E37]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-[#344BC2]">Your feast bag is empty</p>
                <p className="text-xs max-w-xs text-[#344BC2]/70 font-medium">
                  Explore our authentic wats, sizzling tibs, and traditional Buna coffee ceremony dishes to begin.
                </p>
              </div>
            ) : (
              items.map(({ item, quantity }) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-slate-50 border border-[#159E37] p-3 rounded-xl shadow-sm text-[#344BC2]"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover shrink-0 border border-[#159E37]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#344BC2] truncate">{item.name}</h4>
                    <p className="text-[11px] text-[#159E37] font-ethiopic font-semibold truncate">{item.nameAmharic}</p>
                    <p className="text-xs font-mono font-bold text-[#344BC2] mt-0.5">
                      {item.price.toLocaleString()} ETB
                    </p>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center bg-white rounded-md border border-[#159E37] shadow-xs">
                        <button
                          onClick={() => updateQuantity(item.id, quantity - 1)}
                          className="p-1 hover:text-[#2C40AE] text-[#344BC2]"
                          title="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono font-bold text-[#344BC2]">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, quantity + 1)}
                          className="p-1 hover:text-[#2C40AE] text-[#344BC2]"
                          title="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[#344BC2]/40 hover:text-red-600 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-5 border-t-2 border-[#159E37] bg-slate-50 space-y-3 text-[#344BC2]">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#344BC2]/75 font-medium">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-[#344BC2]">{totalPrice.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between text-[#344BC2]/75 font-medium">
                  <span>Traditional Mesob Table & Teff Injera:</span>
                  <span className="text-emerald-700 font-bold">Included</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#344BC2] pt-2 border-t border-[#159E37]">
                  <span>Total Amount:</span>
                  <span className="font-mono text-base font-extrabold text-[#344BC2]">
                    {totalPrice.toLocaleString()} ETB
                  </span>
                </div>
              </div>

              {/* Reverse Primary Checkout Button */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onCheckout();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#344BC2] hover:bg-[#2C40AE] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  <span>Apply to Order</span>
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                </button>

                <button
                  onClick={clearCart}
                  className="w-full text-center text-[11px] text-[#344BC2]/60 hover:text-[#344BC2] font-semibold pt-1"
                >
                  Clear Bag
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
