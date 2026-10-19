import React, { FormEvent, useState } from 'react';
import { Edit2, ImagePlus, Plus, Search, Trash2, X } from 'lucide-react';
import { HeroImage } from '../../types';
import { useHeroImages } from '../../context/HeroImagesContext';
import { AdminModal } from './AdminModal';
import { useAdminFeedback } from './AdminFeedback';
import { hasAdminPermission } from '../../types';
import { useAuth } from '../../context/AuthContext';

type HeroImageDraft = Omit<HeroImage, 'id'>;

const emptyDraft: HeroImageDraft = {
  image: '',
  heading: '',
  label: '',
  orientation: 'landscape',
  width: 480,
  height: 240,
  borderRadius: 16,
};

const inputClass = 'w-full rounded-xl border border-[#159E37] bg-white px-3 py-2.5 text-sm text-[#344BC2] outline-none focus:border-[#159E37]';
const labelClass = 'block space-y-1.5 text-xs font-semibold text-[#344BC2]';

export const HeroImagesManagement: React.FC = () => {
  const { heroImages, error: contextError, addHeroImage, updateHeroImage, deleteHeroImage } = useHeroImages();
  const { currentUser } = useAuth();
  const { confirm, notify } = useAdminFeedback();
  const [draft, setDraft] = useState<HeroImageDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredHeroImages = heroImages.filter((heroImage) =>
    `${heroImage.heading} ${heroImage.label} ${heroImage.orientation}`
      .toLocaleLowerCase().includes(searchQuery.trim().toLocaleLowerCase()),
  );

  const resetForm = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setIsFormOpen(false);
    setError(null);
  };

  const startEditing = (heroImage: HeroImage) => {
    setDraft({
      image: heroImage.image,
      heading: heroImage.heading,
      label: heroImage.label,
      orientation: heroImage.orientation ?? (heroImage.height > heroImage.width ? 'portrait' : 'landscape'),
      width: heroImage.width,
      height: heroImage.height,
      borderRadius: heroImage.borderRadius,
    });
    setEditingId(heroImage.id);
    setError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      if (editingId) await updateHeroImage(editingId, draft);
      else await addHeroImage(draft);
      notify('success', editingId ? 'Hero image updated.' : 'Hero image added.');
      resetForm();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save hero image.';
      setError(message);
      notify('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImage = (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPG, PNG, WebP, or GIF image no larger than 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = reader.result;
      if (typeof image === 'string') {
        setDraft((previous) => ({ ...previous, image }));
        setError(null);
      }
    };
    reader.onerror = () => setError('Unable to read the selected image.');
    reader.readAsDataURL(file);
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl font-bold font-serif">Hero Section</h3>
          <p className="mt-1 text-xs text-[#344BC2]/70">Manage the banners displayed above the menu heading.</p>
        </div>
        {!isFormOpen && hasAdminPermission(currentUser, 'hero', 'add') && (
          <button
            type="button"
            onClick={() => { setDraft(emptyDraft); setEditingId(null); setError(null); setIsFormOpen(true); }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#159E37] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#107d2b]"
          >
            <Plus className="h-4 w-4" /> Add Hero
          </button>
        )}
      </header>

      {(error || contextError) && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error || contextError}</p>}

      <AdminModal isOpen={isFormOpen} title={editingId ? 'Edit hero image' : 'Add hero image'} onClose={resetForm} maxWidthClass="max-w-3xl">
      {isFormOpen && (
        <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-4 sm:grid-cols-2">
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2">{error}</p>}
          <label className={`${labelClass} sm:col-span-2`}>
            Image (JPG, PNG, WebP, GIF; max 5 MB)
            <input required={!draft.image} className={inputClass} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => {
              handleImage(event.currentTarget.files?.[0]);
              event.currentTarget.value = '';
            }} />
          </label>
          {draft.image && <img src={draft.image} alt="Hero image preview" className="max-h-48 rounded-xl object-contain sm:col-span-2" />}
          <label className={labelClass}>
            Heading
            <input required maxLength={120} className={inputClass} value={draft.heading} onChange={(event) => setDraft({ ...draft, heading: event.target.value })} />
          </label>
          <label className={labelClass}>
            Label
            <input required maxLength={180} className={inputClass} value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
          </label>
          <fieldset className="space-y-2 sm:col-span-2">
            <legend className="text-xs font-semibold text-[#344BC2]">Image orientation</legend>
            <div className="flex flex-wrap gap-4 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="hero-orientation"
                  checked={draft.orientation === 'landscape'}
                  onChange={() => setDraft((previous) => ({ ...previous, orientation: 'landscape', width: 600, height: 288 }))}
                />
                Landscape
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="hero-orientation"
                  checked={draft.orientation === 'portrait'}
                  onChange={() => setDraft((previous) => ({ ...previous, orientation: 'portrait', width: 360, height: 480 }))}
                />
                Portrait
              </label>
            </div>
          </fieldset>
          <label className={labelClass}>
            Width (px)
            <input required type="number" min="100" max="1600" step="1" className={inputClass} value={draft.width} onChange={(event) => setDraft({ ...draft, width: Number(event.target.value) })} />
          </label>
          <label className={labelClass}>
            Height (px)
            <input required type="number" min="80" max="1000" step="1" className={inputClass} value={draft.height} onChange={(event) => setDraft({ ...draft, height: Number(event.target.value) })} />
          </label>
          <label className={labelClass}>
            Corner roundness (px)
            <input required type="number" min="0" max="200" step="1" className={inputClass} value={draft.borderRadius} onChange={(event) => setDraft({ ...draft, borderRadius: Number(event.target.value) })} />
          </label>
          <div className="flex items-end gap-2 sm:col-span-2">
            <button disabled={isSaving} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50 ${editingId ? 'bg-[#344BC2]' : 'bg-[#159E37] hover:bg-[#107d2b]'}`} type="submit">
              {editingId ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isSaving ? 'Saving…' : editingId ? 'Save changes' : 'Add Hero'}
            </button>
            <button disabled={isSaving} type="button" onClick={resetForm} className="inline-flex items-center gap-1 rounded-xl border border-[#159E37] px-4 py-2.5 text-xs font-bold">
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </form>
      )}
      </AdminModal>

      <div className="space-y-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h4 className="text-sm font-bold">Previous Hero Images ({filteredHeroImages.length})</h4>
          {heroImages.length > 0 && (
            <label className="relative block sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#344BC2]/50" />
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search hero images" aria-label="Search hero images" className={`${inputClass} pl-9`} />
            </label>
          )}
        </div>
        {heroImages.length === 0 && (
          <div className="rounded-xl bg-slate-50 p-5 text-center text-sm text-[#344BC2]/65">
            <ImagePlus className="mx-auto mb-2 h-6 w-6" />No hero images added yet.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredHeroImages.map((heroImage) => (
          <article key={heroImage.id} className="flex h-full flex-col justify-between gap-4 rounded-2xl border-2 border-[#159E37] bg-white p-4 text-[#344BC2] shadow-md">
            <img
              src={heroImage.image}
              alt={heroImage.heading}
              style={{ borderRadius: heroImage.borderRadius }}
              className="h-44 w-full object-cover"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <h5 className="font-bold">{heroImage.heading}</h5>
              <p className="text-xs text-[#344BC2]/70">{heroImage.label}</p>
              <p className="mt-1 text-xs text-[#344BC2]/60">{heroImage.orientation ?? (heroImage.height > heroImage.width ? 'portrait' : 'landscape')} · {heroImage.width} × {heroImage.height}px · {heroImage.borderRadius}px roundness</p>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-[#159E37] pt-3">
              {hasAdminPermission(currentUser, 'hero', 'edit') && <button type="button" onClick={() => startEditing(heroImage)} aria-label={`Edit ${heroImage.heading}`} className="flex items-center justify-center gap-1.5 rounded-lg border border-[#159E37] p-2 text-xs font-bold hover:bg-slate-50"><Edit2 className="h-4 w-4" /> Edit</button>}
              {hasAdminPermission(currentUser, 'hero', 'delete') && <button type="button" onClick={() => {
                void (async () => {
                  if (!await confirm('Delete hero image?', `Move "${heroImage.heading}" to deleted records? It will no longer appear in the hero section.`)) return;
                  try {
                    await deleteHeroImage(heroImage.id);
                    notify('success', 'Hero image moved to deleted records.');
                  } catch (deleteError: unknown) {
                    const message = deleteError instanceof Error ? deleteError.message : 'Unable to delete hero image.';
                    setError(message);
                    notify('error', message);
                  }
                })();
              }} aria-label={`Delete ${heroImage.heading}`} className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 p-2 text-xs font-bold text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Delete</button>}
            </div>
          </article>
        ))}
        </div>
      </div>
    </section>
  );
};
