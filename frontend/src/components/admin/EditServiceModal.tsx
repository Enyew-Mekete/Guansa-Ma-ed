import React, { useState, useEffect } from 'react';
import { ServiceItem } from '../../types';
import { X, Save } from 'lucide-react';

interface EditServiceModalProps {
  service: ServiceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ServiceItem, 'id'>) => Promise<boolean>;
}

export const EditServiceModal: React.FC<EditServiceModalProps> = ({
  service,
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [titleAmharic, setTitleAmharic] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [featuresStr, setFeaturesStr] = useState('');
  const [iconName, setIconName] = useState('Utensils');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (service) {
      setTitle(service.title);
      setTitleAmharic(service.titleAmharic);
      setTagline(service.tagline);
      setDescription(service.description);
      setBadge(service.badge || '');
      setFeaturesStr(service.features.join('\n'));
      setIconName(service.iconName || 'Utensils');
    } else {
      setTitle('');
      setTitleAmharic('');
      setTagline('');
      setDescription('');
      setBadge('Exclusive');
      setFeaturesStr('Feature 1\nFeature 2\nFeature 3');
      setIconName('Utensils');
    }
  }, [service, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    const features = featuresStr
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSaving(true);
    const saved = await onSave({
      title,
      titleAmharic,
      tagline,
      description,
      badge: badge.trim() || undefined,
      features,
      iconName,
    });
    setIsSaving(false);
    if (saved) onClose();
    else setSaveError('The service could not be saved. Review the error above and try again.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border-2 border-[#159E37] rounded-2xl shadow-2xl p-6 text-[#344BC2] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#159E37] mb-4">
          <div>
            <h3 className="font-bold text-base text-[#344BC2]">
              {service ? `Edit Service: ${service.title}` : 'Add New Cultural Service'}
            </h3>
            <p className="text-[11px] text-[#344BC2]/70 font-medium">Manage culinary & event service</p>
          </div>
          <button onClick={onClose} className="text-[#344BC2]/60 hover:text-[#344BC2] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {saveError && <p role="alert" className="mb-3 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800">{saveError}</p>}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs text-[#344BC2]">
          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">Service Title (English)</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
            />
          </div>

          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">Service Title (Amharic)</label>
            <input
              type="text"
              required
              value={titleAmharic}
              onChange={(e) => setTitleAmharic(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37] font-ethiopic font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#344BC2] font-semibold mb-1">Tagline</label>
              <input
                type="text"
                required
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
              />
            </div>

            <div>
              <label className="block text-[#344BC2] font-semibold mb-1">Badge Tag</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. VIP Luxury"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">Detailed Description</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
            />
          </div>

          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">
              Features (one per line)
            </label>
            <textarea
              rows={3}
              required
              value={featuresStr}
              onChange={(e) => setFeaturesStr(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37] font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#344BC2] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg text-white font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50 ${service ? 'bg-[#344BC2] hover:bg-[#2C40AE]' : 'bg-[#159E37] hover:bg-[#107d2b]'}`}
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>{isSaving ? 'Saving…' : service ? 'Save' : 'Add Service'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
