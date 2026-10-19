import React, { useState } from 'react';
import { MenuItem, OrderItem, Order } from '../../types';
import { validateEthiopianPhone, generateOrderId } from '../../utils/ethiopianPhone';
import { BRAND_CONFIG } from '../../config/branding';
import { useMenu } from '../../context/MenuContext';
import { useCart } from '../../context/CartContext';
import {
  X,
  Send,
  Mail,
  CheckCircle2,
  AlertCircle,
  Copy,
  ShoppingBag,
} from 'lucide-react';

interface ApplyToBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  singleItem?: MenuItem | null;
}

export const ApplyToBuyModal: React.FC<ApplyToBuyModalProps> = ({
  isOpen,
  onClose,
  singleItem,
}) => {
  const { addOrder } = useMenu();
  const { items: cartItems, clearCart, totalPrice } = useCart();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [diningOption, setDiningOption] = useState<'dine_in' | 'pickup' | 'delivery'>('dine_in');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(1);

  // Validation states
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneOperator, setPhoneOperator] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  // Completed order state
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const purchaseItems: OrderItem[] = singleItem
    ? [{ item: singleItem, quantity: orderQuantity }]
    : cartItems.length > 0
    ? cartItems
    : [];

  const calculatedTotal = singleItem
    ? singleItem.price * orderQuantity
    : totalPrice;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (val.trim()) {
      const check = validateEthiopianPhone(val);
      if (check.isValid) {
        setPhoneError(null);
        setPhoneOperator(check.operator || 'Ethiopian Carrier');
      } else {
        setPhoneError(check.errorMessage || 'Invalid Ethiopian format');
        setPhoneOperator(null);
      }
    } else {
      setPhoneError(null);
      setPhoneOperator(null);
    }
  };

  const validateForm = (): boolean => {
    let valid = true;
    if (!fullName.trim()) {
      setNameError('Full name is required');
      valid = false;
    } else {
      setNameError(null);
    }

    const phoneCheck = validateEthiopianPhone(phone);
    if (!phoneCheck.isValid) {
      setPhoneError(phoneCheck.errorMessage || 'Must be a valid Ethiopian phone number (e.g. 0911234567 or +251 91 123 4567)');
      valid = false;
    } else {
      setPhoneError(null);
    }

    return valid;
  };

  const constructOrderDetails = (orderId: string, validatedPhone: string, order?: Order) => {
    const orderItems = order?.items ?? purchaseItems;
    const itemsSummary = orderItems
      .map((it) => `- ${it.item.name} (${it.item.nameAmharic}) x${it.quantity} = ${it.item.price * it.quantity} ETB`)
      .join('\n');

    const selectedDiningOption = order?.diningOption ?? diningOption;
    const diningSummary = selectedDiningOption === 'delivery'
      ? `Delivery to: ${order?.deliveryAddress || deliveryAddress || 'Address specified in description'}`
      : selectedDiningOption === 'pickup'
      ? `Express Pickup at ${BRAND_CONFIG.location}`
      : 'Dine-In Reservation at Mesob Dining Room';
    const name = order?.customerName ?? fullName.trim();
    const notes = order?.description ?? description.trim();
    const total = order?.totalAmount ?? calculatedTotal;
    const orderDate = order?.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString();

    return `🍽️ GUANSA MA'ED RESTAURANT ORDER
-----------------------------------
📋 Order ID: ${orderId}
👤 Customer Name: ${name}
📱 Phone: ${validatedPhone}
${order?.email || email.trim() ? `✉️ Email: ${order?.email || email.trim()}\n` : ''}
📍 Service Option: ${diningSummary}
📝 Special Instructions: ${notes || 'No special requests'}

🛒 ITEMS ORDERED:
${itemsSummary}

💰 TOTAL AMOUNT: ${total.toLocaleString()} ETB
⏰ Date: ${orderDate}
-----------------------------------
Please confirm our order preparation and estimated time. Ameseginalehu!`;
  };

  const handleSubmitOrder = async () => {
    if (isSubmitting || !validateForm()) return;
    setOrderError(null);

    const phoneValidation = validateEthiopianPhone(phone);
    const normalizedPhone = phoneValidation.normalized || phone;
    const newOrderId = generateOrderId();

    const newOrder: Order = {
      orderId: newOrderId,
      customerName: fullName.trim(),
      phone: normalizedPhone,
      email: email.trim() || undefined,
      description: description.trim(),
      diningOption,
      deliveryAddress: diningOption === 'delivery' ? deliveryAddress.trim() : undefined,
      items: purchaseItems,
      totalAmount: calculatedTotal,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    const savedOrder = await addOrder(newOrder);
    setIsSubmitting(false);
    if (!savedOrder) {
      setOrderError('Your order could not be saved. Please try again before sending it.');
      return;
    }
    setCompletedOrder(savedOrder);

    if (!singleItem) {
      clearCart();
    }
  };

  const handleCopyReceipt = () => {
    if (!completedOrder) return;
    const text = constructOrderDetails(completedOrder.orderId, completedOrder.phone, completedOrder);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  const handleResetAndClose = () => {
    setCompletedOrder(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setDescription('');
    setDeliveryAddress('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white border-2 border-[#159E37] rounded-2xl shadow-2xl p-5 sm:p-7 text-[#344BC2] max-h-[92vh] overflow-y-auto">
        {/* Reverse Header for High Contrast & Visual Clarity */}
        <div className="flex items-center justify-between border-b border-[#159E37] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#344BC2] text-amber-300 shadow">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#344BC2]">
                {completedOrder ? 'Order Dispatched Successfully' : 'Apply to Order · የትዕዛዝ ማመልከቻ'}
              </h3>
              <p className="text-[11px] text-[#344BC2]/70 font-medium">
                Guansa Ma'ed ጓንሳ ማዕድ · Online Order Submission
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#344BC2]/10 text-[#344BC2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* State A: Success Confirmation / Receipt */}
        {completedOrder ? (
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            <div className="rounded-xl border-2 border-[#159E37] bg-[#159E37]/10 p-4 text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#159E37]/15 text-[#159E37]">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-[#0b5c22]">Order #{completedOrder.orderId} Saved</h4>
              <p className="mx-auto max-w-md text-xs text-[#0b5c22]">
                Your order is safely recorded in our order history. Continue to Telegram or email to send the order details to Guansa Ma'ed.
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="bg-slate-50 border border-[#159E37] rounded-xl p-4 space-y-2 text-xs text-[#344BC2]">
              <div className="flex justify-between items-center pb-2 border-b border-[#159E37]">
                <span className="text-[#344BC2]/60 font-semibold">Order ID:</span>
                <span className="font-mono font-bold text-[#344BC2]">{completedOrder.orderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#344BC2]/60 font-semibold">Customer:</span>
                <span className="font-bold text-[#344BC2]">{completedOrder.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#344BC2]/60 font-semibold">Phone:</span>
                <span className="font-mono text-[#344BC2] font-bold">{completedOrder.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#344BC2]/60 font-semibold">Total Amount:</span>
                <span className="text-sm font-bold text-[#344BC2] font-mono">
                  {completedOrder.totalAmount.toLocaleString()} ETB
                </span>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="space-y-2 pt-2">
              <p className="text-xs text-center text-[#344BC2]/70 font-medium">
                Click below to open in your app or client:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`https://t.me/${BRAND_CONFIG.telegramUsername}?text=${encodeURIComponent(constructOrderDetails(completedOrder.orderId, completedOrder.phone, completedOrder))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Save &amp; Continue to Telegram</span>
                </a>

                <a
                  href={`mailto:${BRAND_CONFIG.orderEmail}?subject=${encodeURIComponent(`[Guansa Ma'ed Order] #${completedOrder.orderId} - ${completedOrder.customerName}`)}&body=${encodeURIComponent(constructOrderDetails(completedOrder.orderId, completedOrder.phone, completedOrder))}`}
                  className="w-full py-3 px-4 rounded-xl bg-[#344BC2] hover:bg-[#2C40AE] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <Mail className="w-4 h-4 text-amber-300" />
                  <span>Save &amp; Continue to Email</span>
                </a>
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  onClick={handleCopyReceipt}
                  className="text-xs text-[#344BC2] hover:text-[#2C40AE] font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-[#344BC2]" />
                  <span>{copiedText ? 'Copied to Clipboard!' : 'Copy Order Text'}</span>
                </button>

                <button
                  onClick={handleResetAndClose}
                  className="rounded-xl bg-[#159E37] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-[#107d2b]"
                >
                  Done / Close
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* State B: Purchase Form */
          <div className="space-y-4 text-xs text-[#344BC2]">
            {orderError && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{orderError}</p>}
            {/* Items Summary Strip */}
            <div className="bg-slate-50 border border-[#159E37] rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between font-bold text-[#344BC2] border-b border-[#159E37] pb-1.5">
                <span>Selected Dish / Items:</span>
                <span className="font-mono">{calculatedTotal.toLocaleString()} ETB</span>
              </div>
              
              {singleItem ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={singleItem.image}
                      alt={singleItem.name}
                      className="w-11 h-11 rounded-lg object-cover border border-[#159E37]"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="font-bold text-[#344BC2]">{singleItem.name}</p>
                      <p className="text-[11px] text-[#159E37] font-ethiopic font-semibold">{singleItem.nameAmharic}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white border border-[#159E37] rounded-lg px-2 py-1">
                    <button
                      type="button"
                      onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                      className="text-[#344BC2] hover:text-[#2C40AE] font-bold px-1"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-[#344BC2]">{orderQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setOrderQuantity(orderQuantity + 1)}
                      className="text-[#344BC2] hover:text-[#2C40AE] font-bold px-1"
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : purchaseItems.length > 0 ? (
                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                  {purchaseItems.map((entry) => (
                    <div key={entry.item.id} className="flex justify-between items-center text-[11px]">
                      <span className="text-[#344BC2] font-medium">
                        {entry.item.name} <span className="text-[#344BC2]/50">x{entry.quantity}</span>
                      </span>
                      <span className="font-mono font-bold text-[#344BC2]">
                        {(entry.item.price * entry.quantity).toLocaleString()} ETB
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#b45309] font-medium">No items selected. Please choose from our menu.</p>
              )}
            </div>

            {/* Form Fields */}
            <form onSubmit={(e) => { e.preventDefault(); void handleSubmitOrder(); }} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-[#344BC2] font-semibold mb-1">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Abebe Bikila"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37] text-xs"
                />
                {nameError && <p className="text-[11px] text-red-600 font-medium mt-1">{nameError}</p>}
              </div>

              {/* Ethiopian Phone Number (Required & Strictly Validated) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[#344BC2] font-semibold">
                    Phone Number (Ethiopian format only) <span className="text-red-600">*</span>
                  </label>
                  {phoneOperator && (
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded border border-emerald-300">
                      ✓ {phoneOperator}
                    </span>
                  )}
                </div>
                <input
                  type="tel"
                  required
                  placeholder="e.g., 0911234567, 0712345678, or +251 91 123 4567"
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`w-full px-3 py-2 rounded-lg bg-slate-50 border text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none text-xs font-mono ${
                    phoneError ? 'border-red-500' : 'border-[#159E37] focus:border-[#159E37]'
                  }`}
                />
                {phoneError ? (
                  <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
                    <span>{phoneError}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-[#344BC2]/60 mt-1 font-medium">
                    Accepts Ethio Telecom (09 / +251 9) and Safaricom (07 / +251 7).
                  </p>
                )}
              </div>

              {/* Email Address (Optional) */}
              <div>
                <label className="block text-[#344BC2] font-semibold mb-1">
                  Email Address <span className="text-[#344BC2]/50">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g., abebe@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37] text-xs"
                />
              </div>

              {/* Dining Option */}
              <div>
                <label className="block text-[#344BC2] font-semibold mb-1">
                  Dining & Delivery Option
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiningOption('dine_in')}
                    className={`py-2 px-2 rounded-lg text-[11px] border text-center transition-all ${
                      diningOption === 'dine_in'
                        ? 'bg-[#344BC2] text-white border-[#159E37] font-bold shadow'
                        : 'bg-slate-100 text-[#344BC2] border-[#159E37] hover:bg-[#344BC2]/10'
                    }`}
                  >
                    Dine-In
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiningOption('pickup')}
                    className={`py-2 px-2 rounded-lg text-[11px] border text-center transition-all ${
                      diningOption === 'pickup'
                        ? 'bg-[#344BC2] text-white border-[#159E37] font-bold shadow'
                        : 'bg-slate-100 text-[#344BC2] border-[#159E37] hover:bg-[#344BC2]/10'
                    }`}
                  >
                    Takeaway Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiningOption('delivery')}
                    className={`py-2 px-2 rounded-lg text-[11px] border text-center transition-all ${
                      diningOption === 'delivery'
                        ? 'bg-[#344BC2] text-white border-[#159E37] font-bold shadow'
                        : 'bg-slate-100 text-[#344BC2] border-[#159E37] hover:bg-[#344BC2]/10'
                    }`}
                  >
                    Hot Delivery
                  </button>
                </div>
              </div>

              {/* Delivery Address (if Delivery selected) */}
              {diningOption === 'delivery' && (
                <div>
                  <label className="block text-[#344BC2] font-semibold mb-1">
                    Delivery Address in Addis Ababa <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Street, building, and apartment in Addis Ababa"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37] text-xs"
                  />
                </div>
              )}

              {/* Description / Special Instructions */}
              <div>
                <label className="block text-[#344BC2] font-semibold mb-1">
                  Description / Spice Preference / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Extra berbere on the side, slightly warm (leb-leb) kitfo, 4 extra injeras..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37] text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || purchaseItems.length === 0}
                className="w-full rounded-xl bg-[#344BC2] px-4 py-3 text-xs font-bold text-white shadow-lg transition-colors hover:bg-[#2C40AE] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Saving order…' : 'Submit & Confirm Order'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
