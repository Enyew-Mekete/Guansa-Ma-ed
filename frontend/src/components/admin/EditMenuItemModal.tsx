import React, { useState, useEffect } from 'react';
import { MenuItem, MenuCategory, MenuType, StockStatus } from '../../types';
import { BRAND_ASSETS } from '../../config/branding';
import { ImagePlus, X, Save } from 'lucide-react';

interface EditMenuItemModalProps {
  item: MenuItem | null;
  categories: MenuCategory[];
  defaultMenuType: MenuType;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<MenuItem, 'id' | 'rating' | 'reviewCount' | 'reviews'>) => Promise<boolean>;
}

export const EditMenuItemModal: React.FC<EditMenuItemModalProps> = ({
  item,
  categories,
  defaultMenuType,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [nameAmharic, setNameAmharic] = useState('');
  const [price, setPrice] = useState(500);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(BRAND_ASSETS.doroWat);
  const [imageError, setImageError] = useState('');
  const [stockStatus, setStockStatus] = useState<StockStatus>('in_stock');
  const [spiceLevel, setSpiceLevel] = useState<'Mild' | 'Medium' | 'Hot' | 'Very Hot' | 'None'>('Medium');
  const [ingredientsStr, setIngredientsStr] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const menuType = item?.menuType ?? defaultMenuType;

  useEffect(() => {
    setImageError('');
    if (item) {
      setName(item.name);
      setNameAmharic(item.nameAmharic);
      setPrice(item.price);
      setCategory(item.category);
      setDescription(item.description);
      setImage(item.image);
      setStockStatus(item.stockStatus);
      setSpiceLevel(item.spiceLevel);
      setIngredientsStr(item.ingredients ? item.ingredients.join(', ') : '');
    } else {
      setName('');
      setNameAmharic('');
      setPrice(450);
      setCategory(categories.find((entry) => entry.menuType === defaultMenuType)?.id ?? '');
      setDescription('');
      setImage(BRAND_ASSETS.doroWat);
      setStockStatus('in_stock');
      setSpiceLevel('Medium');
      setIngredientsStr('Highland Spices, Pure Teff Injera');
    }
  }, [item, isOpen, categories, defaultMenuType]);

  if (!isOpen) return null;

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    setImageError('');

    if (!file.type.startsWith('image/')) {
      setImageError('Choose an image file, such as JPG, PNG, or WebP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setImageError('Choose an image smaller than 10 MB.');
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width * bitmap.height > 40000000) {
        bitmap.close();
        setImageError('This image has too many pixels. Choose a smaller image.');
        return;
      }

      const maxDimension = 1200;
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        bitmap.close();
        throw new Error('Could not prepare the selected image.');
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();

      const compressedImage = canvas.toDataURL('image/jpeg', 0.8);
      if (compressedImage.length > 1_500_000) {
        setImageError('The image could not be compressed enough. Choose a smaller image.');
        return;
      }

      setImage(compressedImage);
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : 'Could not read the selected image.'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    const ingredients = ingredientsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSaving(true);
    const saved = await onSave({
      name,
      nameAmharic,
      price: Number(price),
      menuType,
      category,
      description,
      image,
      stockStatus,
      spiceLevel,
      ingredients,
    });
    setIsSaving(false);
    if (saved) onClose();
    else setSaveError('The menu item could not be saved. Review the error above and try again.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border-2 border-[#159E37] rounded-2xl shadow-2xl p-6 text-[#344BC2] max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#159E37] mb-4">
          <div>
            <h3 className="font-bold text-lg text-[#344BC2]">
              {item ? `Edit Menu Item: ${item.name}` : 'Add New Menu Item'}
            </h3>
            <p className="text-[11px] text-[#344BC2]/70 font-medium">
              Update pricing, photo, description, category, and stock status
            </p>
          </div>
          <button onClick={onClose} className="text-[#344BC2]/60 hover:text-[#344BC2] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {saveError && <p role="alert" className="mb-3 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800">{saveError}</p>}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs text-[#344BC2]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#344BC2] font-semibold mb-1">Item Name (English)</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Special Derek Tibs"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
              />
            </div>

            <div>
              <label className="block text-[#344BC2] font-semibold mb-1">Item Name (Amharic / ፊደል)</label>
              <input
                type="text"
                required
                value={nameAmharic}
                onChange={(e) => setNameAmharic(e.target.value)}
                placeholder="e.g., ልዩ ድርቅ ጥብስ"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37] font-ethiopic font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-[#344BC2] font-semibold mb-1">Price (ETB)</label>
              <input
                type="number"
                required
                min={1}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] font-mono font-bold focus:outline-none focus:border-[#159E37]"
              />
            </div>

            <div>
              <label className="block text-[#344BC2] font-semibold mb-1">Category</label>
              <select
                value={category}
                required
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] font-medium focus:outline-none focus:border-[#159E37]"
              >
                {categories.filter((entry) => entry.menuType === menuType).map((entry) => (
                  <option key={entry.id} value={entry.id}>{entry.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#344BC2] font-semibold mb-1">Stock Status</label>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as StockStatus)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] font-medium focus:outline-none focus:border-[#159E37]"
              >
                <option value="in_stock">In Stock (ዝግጁ)</option>
                <option value="chefs_special">Chef's Special (ልዩ)</option>
                <option value="fresh_today">Fresh Today (ዛሬ የተዘጋጀ)</option>
                <option value="limited_batch">Limited Batch</option>
                <option value="out_of_stock">Out of Stock (አልቋል)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#344BC2] font-semibold mb-1">Spice Level</label>
              <select
                value={spiceLevel}
                onChange={(e) => setSpiceLevel(e.target.value as MenuItem['spiceLevel'])}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] font-medium focus:outline-none focus:border-[#159E37]"
              >
                <option value="None">None (ለስላሳ)</option>
                <option value="Mild">Mild (መጠነኛ)</option>
                <option value="Medium">Medium (መካከለኛ)</option>
                <option value="Hot">Hot (የሚያቃጥል)</option>
                <option value="Very Hot">Very Hot (ሚጥሚጣ/በርበሬ የበዛው)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#344BC2] font-semibold mb-1">
                Ingredients (comma separated)
              </label>
              <input
                type="text"
                value={ingredientsStr}
                onChange={(e) => setIngredientsStr(e.target.value)}
                placeholder="Highland beef, rosemary, garlic..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">Culinary Description</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of preparation, taste, and serving..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
            />
          </div>

          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">
              Food Photo
            </label>
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <img
                src={image}
                alt="Dish preview"
                className="w-32 h-24 rounded-lg object-cover border border-[#159E37] bg-slate-100"
              />
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#344BC2] hover:bg-[#2C40AE] text-white font-semibold cursor-pointer">
                  <ImagePlus className="w-4 h-4" />
                  Choose image from folder
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      void handleImageUpload(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                </label>
                <p className="text-[10px] text-[#344BC2]/65">
                  JPG, PNG, or WebP; up to 10 MB. The image is resized for browser storage.
                </p>
                {imageError && (
                  <p role="alert" className="text-[11px] font-semibold text-red-700">
                    {imageError}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Pick from High-Res Culinary Photos */}
            <div className="flex flex-wrap gap-2 pt-2 items-center">
              <span className="text-[10px] text-[#344BC2]/60 font-medium">Quick Pick Asset:</span>
              <button
                type="button"
                onClick={() => setImage(BRAND_ASSETS.doroWat)}
                className="text-[10px] bg-slate-100 hover:bg-[#344BC2]/10 border border-[#159E37] px-2 py-0.5 rounded text-[#344BC2] font-bold"
              >
                Doro Wat
              </button>
              <button
                type="button"
                onClick={() => setImage(BRAND_ASSETS.sizzlingTibs)}
                className="text-[10px] bg-slate-100 hover:bg-[#344BC2]/10 border border-[#159E37] px-2 py-0.5 rounded text-[#344BC2] font-bold"
              >
                Sizzling Tibs
              </button>
              <button
                type="button"
                onClick={() => setImage(BRAND_ASSETS.kitfoSpecial)}
                className="text-[10px] bg-slate-100 hover:bg-[#344BC2]/10 border border-[#159E37] px-2 py-0.5 rounded text-[#344BC2] font-bold"
              >
                Kitfo Special
              </button>
              <button
                type="button"
                onClick={() => setImage(BRAND_ASSETS.beyaynetu)}
                className="text-[10px] bg-slate-100 hover:bg-[#344BC2]/10 border border-[#159E37] px-2 py-0.5 rounded text-[#344BC2] font-bold"
              >
                Beyaynetu Platter
              </button>
              <button
                type="button"
                onClick={() => setImage(BRAND_ASSETS.bunaCeremony)}
                className="text-[10px] bg-slate-100 hover:bg-[#344BC2]/10 border border-[#159E37] px-2 py-0.5 rounded text-[#344BC2] font-bold"
              >
                Buna Ceremony
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#344BC2] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-5 py-2 rounded-xl text-white font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50 ${item ? 'bg-[#344BC2] hover:bg-[#2C40AE]' : 'bg-[#159E37] hover:bg-[#107d2b]'}`}
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>{isSaving ? 'Saving…' : item ? 'Save Changes' : 'Add to Menu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
