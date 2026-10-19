import React, { useState } from 'react';
import { MenuItem } from '../../types';
import { useMenu } from '../../context/MenuContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Star,
  Clock,
  Flame,
  CheckCircle,
  ShoppingBag,
  Send,
  MessageSquare,
  ShieldCheck,
  UtensilsCrossed,
} from 'lucide-react';

interface ProductDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyToBuy: (item: MenuItem) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onApplyToBuy,
}) => {
  const { addReview } = useMenu();
  const { addItem } = useCart();
  const { currentUser } = useAuth();

  // Review form states
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewerName, setReviewerName] = useState<string>(currentUser ? currentUser.name : '');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  if (!isOpen || !item) return null;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      setReviewError('Please write your review comment.');
      return;
    }

    const nameToUse = currentUser
      ? currentUser.name
      : reviewerName.trim() || 'Verified Guest';

    const saved = await addReview(item.id, {
      author: nameToUse,
      rating,
      comment: reviewComment.trim(),
      verifiedCustomer: true,
    });
    if (!saved) {
      setReviewError('Your review could not be saved. Please try again.');
      return;
    }

    setReviewSubmitted(true);
    setReviewComment('');
    setReviewError(null);
    setTimeout(() => setReviewSubmitted(false), 4000);
  };

  const spiceBadgeColor = {
    'None': 'bg-slate-200 text-[#344BC2]',
    'Mild': 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    'Medium': 'bg-amber-100 text-amber-900 border border-amber-300',
    'Hot': 'bg-orange-100 text-orange-900 border border-orange-300',
    'Very Hot': 'bg-red-100 text-red-900 border border-red-300',
  }[item.spiceLevel];

  const stockLabel = {
    in_stock: 'In Stock · ዝግጁ ነው',
    chefs_special: "Chef's Special · የሼፉ ልዩ",
    fresh_today: 'Fresh Today · ዛሬ የተዘጋጀ',
    limited_batch: 'Limited Daily Batch · የተወሰነ ዝግጅት',
    out_of_stock: 'Sold Out · አልቋል',
  }[item.stockStatus];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white border-2 border-[#159E37] rounded-2xl shadow-2xl text-[#344BC2] max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Reverse Sticky Header for High Contrast Distinction */}
        <div className="sticky top-0 z-10 bg-[#344BC2] text-white px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
              {(item.categoryName ?? item.category).toUpperCase()} · ዝርዝር መረጃ
            </span>
            <span className="text-white/40">|</span>
            <span className="text-xs text-white/90">{stockLabel}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Top Split: Image + Essential Purchasing Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Image */}
            <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-100 border-2 border-[#159E37] shadow-inner">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-[#344BC2] text-white px-2.5 py-1 rounded-md text-xs font-semibold shadow">
                {stockLabel}
              </div>
            </div>

            {/* Title, Rating & Pricing */}
            <div className="space-y-3.5">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#344BC2] font-serif">
                  {item.name}
                </h3>
                <h4 className="text-base text-[#159E37] font-ethiopic font-semibold mt-0.5">
                  {item.nameAmharic}
                </h4>
              </div>

              {/* Rating Summary */}
              <div className="flex items-center gap-2 text-xs text-[#344BC2]">
                <div className="flex items-center text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(item.rating)
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-[#344BC2] font-mono">{item.rating}</span>
                <span className="text-[#344BC2]/60">({item.reviewCount} customer reviews)</span>
              </div>

              {/* Price & Serving */}
              <div className="flex items-baseline gap-2 pt-1 border-t border-[#159E37]">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#344BC2] font-mono">
                  {item.price.toLocaleString()} ETB
                </span>
                <span className="text-xs text-[#344BC2]/70 font-medium">includes Teff Injera</span>
              </div>

              {/* Key Quick Badges */}
              <div className="flex flex-wrap gap-2 text-xs pt-1">
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 ${spiceBadgeColor}`}>
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  <span>Spice: {item.spiceLevel}</span>
                </span>

                {item.prepTimeMinutes && (
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-[#344BC2] text-[11px] font-medium flex items-center gap-1 border border-[#159E37]">
                    <Clock className="w-3.5 h-3.5 text-[#344BC2]" />
                    <span>Prep: ~{item.prepTimeMinutes} mins</span>
                  </span>
                )}

                {item.calories && (
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-[#344BC2] text-[11px] font-medium border border-[#159E37]">
                    {item.calories} kcal
                  </span>
                )}
              </div>

              {/* Quantity & Buy Actions */}
              <div className="pt-3 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-100 border border-[#159E37] rounded-lg p-1 text-[#344BC2]">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-2.5 py-1 hover:text-[#344BC2] font-bold"
                    >
                      -
                    </button>
                    <span className="px-3 font-mono font-bold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-2.5 py-1 hover:text-[#344BC2] font-bold"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      addItem(item, quantity);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-lg bg-slate-100 hover:bg-[#344BC2]/10 text-[#344BC2] font-bold text-xs flex items-center justify-center gap-2 border border-[#159E37] transition-all"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#344BC2]" />
                    <span>Add to Bag</span>
                  </button>
                </div>

                {/* Reverse Primary Action */}
                <button
                  onClick={() => {
                    onClose();
                    onApplyToBuy(item);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#344BC2] hover:bg-[#2C40AE] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>Apply to Order</span>
                </button>
              </div>
            </div>
          </div>

          {/* Description & Ingredients */}
          <div className="space-y-3 pt-4 border-t border-[#159E37]">
            <h4 className="text-sm font-bold text-[#344BC2] uppercase tracking-wide">
              Culinary Description & Traditional Preparation
            </h4>
            <p className="text-xs text-[#344BC2]/80 leading-relaxed">
              {item.description}
            </p>

            {item.ingredients && item.ingredients.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-semibold text-[#344BC2]">Authentic Ingredients: </span>
                <span className="text-xs text-[#344BC2]/70 font-medium">
                  {item.ingredients.join(' · ')}
                </span>
              </div>
            )}
          </div>

          {/* Reviews & Star Rating Section */}
          <div className="space-y-5 pt-6 border-t border-[#159E37]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#344BC2]" />
                <h4 className="text-sm font-bold text-[#344BC2] uppercase tracking-wider">
                  Customer Reviews & Star Ratings ({item.reviews.length})
                </h4>
              </div>
              {currentUser && (
                <span className="text-[11px] text-[#344BC2] bg-[#344BC2]/10 px-2 py-0.5 rounded font-bold border border-[#159E37]">
                  Logged in as {currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                </span>
              )}
            </div>

            {/* Review Submission Form */}
            <form
              onSubmit={handleReviewSubmit}
              className="bg-slate-50 border-2 border-[#159E37] rounded-xl p-4 space-y-3 text-[#344BC2]"
            >
              <h5 className="text-xs font-bold text-[#344BC2]">
                Leave a Star Rating & Review
              </h5>

              {/* Star Rating Selector */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#344BC2]/80 font-medium">Your Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          s <= (hoverRating ?? rating)
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-slate-300 hover:text-amber-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-[#344BC2] font-mono">
                  {hoverRating ?? rating} / 5 Stars
                </span>
              </div>

              {/* Reviewer Name (if not logged in) */}
              {!currentUser && (
                <div>
                  <input
                    type="text"
                    placeholder="Your Name (e.g., Almaz Kebede)"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#159E37] text-xs text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
                  />
                </div>
              )}

              {/* Comment Textarea */}
              <div>
                <textarea
                  rows={2}
                  required
                  placeholder="Share your dining experience with this dish (e.g., perfect berbere aroma, tender meat, authentic taste)..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#159E37] text-xs text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
                />
              </div>

              {reviewError && (
                <p className="text-[11px] text-red-600 font-medium">{reviewError}</p>
              )}

              {reviewSubmitted && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold animate-in fade-in">
                  <CheckCircle className="w-4 h-4" />
                  <span>Ameseginalehu! Your review and rating have updated the global product score!</span>
                </div>
              )}

              {/* Reverse Submit Review Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#344BC2] hover:bg-[#2C40AE] text-white font-bold text-xs transition-colors shadow"
                >
                  Submit Review & Star Rating
                </button>
              </div>
            </form>

            {/* Existing Reviews List */}
            <div className="space-y-3">
              {item.reviews.length === 0 ? (
                <p className="text-xs text-[#344BC2]/50 italic py-2">
                  No written reviews yet. Be the first to share your experience!
                </p>
              ) : (
                item.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-[#159E37] space-y-1.5 text-[#344BC2]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#344BC2]">{rev.author}</span>
                        {rev.verifiedCustomer && (
                          <span className="text-[10px] text-emerald-700 flex items-center gap-0.5 font-semibold">
                            <CheckCircle className="w-2.5 h-2.5" /> Verified Dining
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-[#344BC2]/60">
                        <div className="flex items-center text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= rev.rating
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-mono text-[#344BC2]/50">{rev.date}</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#344BC2]/80 leading-relaxed">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
