import React, { FormEvent, useMemo, useState } from 'react';
import { Download, Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import { NewsCategory, NewsPost, Vacancy, VacancyApplication } from '../../types';
import { useNews } from '../../context/NewsContext';
import { apiRequest } from '../../utils/api';
import { AdminModal } from './AdminModal';
import { useAdminFeedback } from './AdminFeedback';
import { hasAdminPermission } from '../../types';
import { useAuth } from '../../context/AuthContext';

const inputClass = 'w-full rounded-xl border border-[#159E37] bg-white px-3 py-2.5 text-sm text-[#344BC2] outline-none focus:border-[#159E37]';
const labelClass = 'block space-y-1.5 text-xs font-semibold text-[#344BC2]';
const newsCategories: NewsCategory[] = [
  'Food Menu',
  'Discount',
  'Location Change',
  'New Branch',
  'Gallery',
  'Directives / Rules',
  'General Update',
];

type NewsDraft = Omit<NewsPost, 'id' | 'createdAt'>;
const emptyNewsDraft: NewsDraft = {
  title: '', category: 'General Update', description: '', location: '', link: '',
  discountPercent: undefined, discountItem: '', startDate: '', endDate: '', imageDataUrl: undefined,
};

export const NewsManagement: React.FC = () => {
  const { newsPosts, addNewsPost, updateNewsPost, deleteNewsPost } = useNews();
  const { currentUser } = useAuth();
  const { confirm, notify } = useAdminFeedback();
  const [draft, setDraft] = useState<NewsDraft>(emptyNewsDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return newsPosts.filter((post) =>
      `${post.title} ${post.category} ${post.description} ${post.discountItem ?? ''}`
        .toLocaleLowerCase().includes(query),
    );
  }, [newsPosts, searchQuery]);

  const editPost = (post: NewsPost) => {
    setDraft({
      title: post.title,
      category: post.category,
      description: post.description,
      location: post.location ?? '',
      link: post.link ?? '',
      imageDataUrl: post.imageDataUrl,
      discountPercent: post.discountPercent,
      discountItem: post.discountItem ?? '',
      startDate: post.startDate ?? '',
      endDate: post.endDate ?? '',
    });
    setEditingId(post.id);
    setIsFormOpen(true);
  };

  const cancelEdit = () => {
    setDraft(emptyNewsDraft);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const post = {
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      location: draft.location?.trim() || undefined,
      link: draft.link?.trim() || undefined,
      discountItem: draft.category === 'Discount' ? draft.discountItem?.trim() : undefined,
      discountPercent: draft.category === 'Discount' ? Number(draft.discountPercent) : undefined,
      startDate: draft.category === 'Discount' ? draft.startDate || undefined : undefined,
      endDate: draft.category === 'Discount' ? draft.endDate || undefined : undefined,
    };
    try {
      if (editingId) await updateNewsPost(editingId, post);
      else await addNewsPost(post);
      notify('success', editingId ? 'News post updated.' : 'News post published.');
      cancelEdit();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save news post.');
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <header>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-bold font-serif">News & Announcements</h3>
            <p className="mt-1 text-xs text-[#344BC2]/70">Publish menu, discount, branch, gallery, location, and policy updates for visitors.</p>
          </div>
          {!isFormOpen && hasAdminPermission(currentUser, 'news', 'add') && (
            <button
              type="button"
              onClick={() => {
                setDraft(emptyNewsDraft);
                setEditingId(null);
                setError(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#159E37] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#107d2b]"
            >
              <Plus className="h-4 w-4" /> Add New Post
            </button>
          )}
        </div>
      </header>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <AdminModal isOpen={isFormOpen} title={editingId ? 'Edit news post' : 'Add news post'} onClose={cancelEdit} maxWidthClass="max-w-4xl">
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2">{error}</p>}
        <label className={labelClass}>
          Title
          <input className={inputClass} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required maxLength={120} />
        </label>
        <label className={labelClass}>
          Category
          <select className={inputClass} value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as NewsCategory })}>
            {newsCategories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        {draft.category === 'Discount' && (
          <>
            <label className={labelClass}>
              Discount percentage
              <input className={inputClass} type="number" min="1" max="100" step="1" required value={draft.discountPercent ?? ''} onChange={(event) => setDraft({ ...draft, discountPercent: event.target.value === '' ? undefined : Number(event.target.value) })} />
            </label>
            <label className={labelClass}>
              Discounted item
              <input className={inputClass} required maxLength={160} value={draft.discountItem ?? ''} onChange={(event) => setDraft({ ...draft, discountItem: event.target.value })} placeholder="Dish or product name" />
            </label>
            <label className={labelClass}>
              Start date
              <input className={inputClass} type="date" required value={draft.startDate ?? ''} max={draft.endDate || undefined} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} />
            </label>
            <label className={labelClass}>
              End date (optional)
              <input className={inputClass} type="date" min={draft.startDate || undefined} value={draft.endDate ?? ''} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} />
            </label>
          </>
        )}
        <label className={`${labelClass} sm:col-span-2`}>
          Details
          <textarea className={inputClass} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} required rows={4} maxLength={3000} />
        </label>
        <label className={labelClass}>
          Location (optional)
          <input className={inputClass} value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} maxLength={180} />
        </label>
        <label className={labelClass}>
          Information or gallery link (optional)
          <input className={inputClass} type="url" placeholder="https://" value={draft.link} onChange={(event) => setDraft({ ...draft, link: event.target.value })} />
        </label>
        <label className={labelClass}>
          News photo (JPG, PNG, WebP, GIF; max 2 MB)
          <input
            className={inputClass}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (file.size > 2 * 1024 * 1024) {
                setError('News photos must be 2 MB or smaller.');
                event.target.value = '';
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === 'string') {
                  setDraft((previous) => ({ ...previous, imageDataUrl: reader.result as string }));
                  setError(null);
                }
              };
              reader.onerror = () => setError('Unable to read the selected news photo.');
              reader.readAsDataURL(file);
            }}
          />
        </label>
        {draft.imageDataUrl && <img src={draft.imageDataUrl} alt="News post preview" className="max-h-40 rounded-xl object-contain" />}
        <div className="flex gap-2 sm:col-span-2">
          <button className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white ${editingId ? 'bg-[#344BC2]' : 'bg-[#159E37] hover:bg-[#107d2b]'}`} type="submit">
            {editingId ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingId ? 'Save changes' : 'Publish news'}
          </button>
          <button type="button" onClick={cancelEdit} className="inline-flex items-center gap-1 rounded-xl border border-[#159E37] px-4 py-2.5 text-xs font-bold"><X className="h-4 w-4" /> Cancel</button>
        </div>
      </form>
      </AdminModal>

      <div className="order-1 space-y-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h4 className="text-sm font-bold">Published posts ({filteredPosts.length})</h4>
          <label className="relative block sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#344BC2]/50" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search news posts" aria-label="Search news posts" className={`${inputClass} pl-9`} />
          </label>
        </div>
        {newsPosts.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-[#344BC2]/65">No posts published yet.</p>}
        {newsPosts.length > 0 && filteredPosts.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-[#344BC2]/65">No news posts match your search.</p>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredPosts.map((post) => (
          <article key={post.id} className="flex h-full flex-col justify-between gap-4 rounded-2xl border-2 border-[#159E37] bg-white p-4 text-[#344BC2] shadow-md">
            <div className="space-y-2">
              {post.imageDataUrl && <img src={post.imageDataUrl} alt="" className="h-40 w-full rounded-xl object-cover" />}
              <span className="text-[10px] font-bold uppercase text-amber-800">{post.category}</span>
              <h5 className="font-bold">{post.title}</h5>
              <p className="line-clamp-3 text-xs leading-relaxed text-[#344BC2]/70">{post.description}</p>
              <p className="text-[11px] text-[#344BC2]/55">{new Date(post.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-[#159E37] pt-3">
              {hasAdminPermission(currentUser, 'news', 'edit') && <button type="button" onClick={() => editPost(post)} aria-label={`Edit ${post.title}`} className="flex items-center justify-center gap-1.5 rounded-lg border border-[#159E37] p-2 text-xs font-bold hover:bg-slate-50"><Edit2 className="h-4 w-4" /> Edit</button>}
              {hasAdminPermission(currentUser, 'news', 'delete') && <button type="button" onClick={() => {
                void (async () => {
                  if (!await confirm('Delete news post?', `Move "${post.title}" to deleted records? It will no longer appear on the website.`)) return;
                  try {
                    await deleteNewsPost(post.id);
                    notify('success', 'News post moved to deleted records.');
                  } catch (deleteError: unknown) {
                    const message = deleteError instanceof Error ? deleteError.message : 'Unable to delete news post.';
                    setError(message);
                    notify('error', message);
                  }
                })();
              }} aria-label={`Delete ${post.title}`} className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 p-2 text-xs font-bold text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Delete</button>}
            </div>
          </article>
        ))}
        </div>
      </div>
    </div>
  );
};

type VacancyDraft = {
  position: string;
  experience: string;
  gradeValue: string;
  salaryAmount: string;
  salaryAsPerScale: boolean;
  workingLocation: string;
  backgroundEducation: string;
  skills: string;
  shortDescription: string;
  jobDescription: string;
  dutiesResponsibilities: string;
  applicationMethod: Vacancy['applicationMethod'];
  applicationLink: string;
  expiresAt: string;
};

const emptyVacancyDraft: VacancyDraft = {
  position: '',
  experience: '',
  gradeValue: '',
  salaryAmount: '',
  salaryAsPerScale: true,
  workingLocation: '',
  backgroundEducation: '',
  skills: '',
  shortDescription: '',
  jobDescription: '',
  dutiesResponsibilities: '',
  applicationMethod: 'in_person',
  applicationLink: '',
  expiresAt: '',
};

export const VacancyManagement: React.FC = () => {
  const { vacancies, addVacancy, updateVacancy, deleteVacancy } = useNews();
  const { currentUser } = useAuth();
  const { confirm, notify } = useAdminFeedback();
  const [draft, setDraft] = useState<VacancyDraft>(emptyVacancyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<Record<string, VacancyApplication[]>>({});
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
  const [loadingApplicationsId, setLoadingApplicationsId] = useState<string | null>(null);
  const grades = useMemo(
    () => [...new Set(vacancies.map((vacancy) => vacancy.gradeValue?.trim()).filter((grade): grade is string => Boolean(grade)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [vacancies],
  );
  const filteredVacancies = useMemo(
    () => vacancies.filter((vacancy) =>
      (!selectedGrade || vacancy.gradeValue?.trim() === selectedGrade) &&
      `${vacancy.position} ${vacancy.workingLocation} ${vacancy.backgroundEducation} ${vacancy.skills} ${vacancy.gradeValue ?? ''}`
        .toLocaleLowerCase().includes(searchQuery.trim().toLocaleLowerCase()),
    ),
    [searchQuery, selectedGrade, vacancies],
  );

  const editVacancy = (vacancy: Vacancy) => {
    setDraft({
      position: vacancy.position,
      experience: vacancy.experience,
      gradeValue: vacancy.gradeValue ?? '',
      salaryAmount: vacancy.salaryAmount?.toString() ?? '',
      salaryAsPerScale: vacancy.salaryAsPerScale,
      workingLocation: vacancy.workingLocation,
      backgroundEducation: vacancy.backgroundEducation,
      skills: vacancy.skills,
      shortDescription: vacancy.shortDescription,
      jobDescription: vacancy.jobDescription ?? vacancy.shortDescription,
      dutiesResponsibilities: vacancy.dutiesResponsibilities ?? '',
      applicationMethod: vacancy.applicationMethod,
      applicationLink: vacancy.applicationLink ?? '',
      expiresAt: vacancy.expiresAt?.slice(0, 10) ?? '',
    });
    setEditingId(vacancy.id);
    setIsFormOpen(true);
  };

  const cancelEdit = () => {
    setDraft(emptyVacancyDraft);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const vacancy: Omit<Vacancy, 'id' | 'createdAt'> = {
      position: draft.position.trim(),
      experience: draft.experience.trim(),
      gradeValue: draft.gradeValue.trim() || undefined,
      salaryAsPerScale: draft.salaryAsPerScale,
      salaryAmount: draft.salaryAsPerScale ? undefined : Number(draft.salaryAmount),
      workingLocation: draft.workingLocation.trim(),
      backgroundEducation: draft.backgroundEducation.trim(),
      skills: draft.skills.trim(),
      shortDescription: draft.shortDescription.trim(),
      jobDescription: draft.jobDescription.trim(),
      dutiesResponsibilities: draft.dutiesResponsibilities.trim(),
      applicationMethod: draft.applicationMethod,
      applicationLink: draft.applicationMethod === 'online' ? draft.applicationLink.trim() : undefined,
      expiresAt: draft.expiresAt ? `${draft.expiresAt}T23:59:59.999Z` : undefined,
    };
    try {
      if (editingId) await updateVacancy(editingId, vacancy);
      else await addVacancy(vacancy);
      notify('success', editingId ? 'Vacancy updated.' : 'Vacancy published.');
      cancelEdit();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save vacancy.');
    }
  };

  const toggleApplications = async (vacancyId: string) => {
    if (applications[vacancyId]) {
      setApplications((previous) => {
        const next = { ...previous };
        delete next[vacancyId];
        return next;
      });
      return;
    }
    setLoadingApplicationsId(vacancyId);
    setError(null);
    try {
      const result = await apiRequest<{ applications: VacancyApplication[] }>(
        `/api/vacancies/${encodeURIComponent(vacancyId)}/applications`,
      );
      setApplications((previous) => ({ ...previous, [vacancyId]: result.applications }));
      setApplicationCounts((previous) => ({ ...previous, [vacancyId]: result.applications.length }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load vacancy applications.');
    } finally {
      setLoadingApplicationsId(null);
    }
  };

  const exportApplications = (vacancy: Vacancy, vacancyApplications: VacancyApplication[]) => {
    const headers = ['Application ID', 'Position', 'Grade value', 'Full name', 'Phone', 'Email', 'CGPA', 'Applied at', 'Terms accepted', 'Attachment name'];
    const rows = vacancyApplications.map((application) => [
      application.id,
      vacancy.position,
      vacancy.gradeValue ?? '',
      application.fullName,
      application.phone,
      application.email ?? '',
      application.cgpa?.toString() ?? '',
      application.appliedAt,
      application.acceptedTerms ? 'Yes' : 'No',
      application.attachmentName ?? '',
    ]);
    const toCsvCell = (value: string) => {
      const safeValue = /^[\t\r ]*[=+\-@]/.test(value) ? `'${value}` : value;
      return `"${safeValue.replaceAll('"', '""')}"`;
    };
    const csv = [headers, ...rows].map((row) => row.map(toCsvCell).join(',')).join('\r\n');
    const file = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${vacancy.position.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'vacancy'}-applicants.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-bold font-serif">Vacancy Management</h3>
            <p className="mt-1 text-xs text-[#344BC2]/70">Create job posts, set an expiry date, and review applicants and their contact details.</p>
          </div>
          {!isFormOpen && hasAdminPermission(currentUser, 'vacancies', 'add') && (
            <button
              type="button"
              onClick={() => {
                setDraft(emptyVacancyDraft);
                setEditingId(null);
                setError(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#159E37] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#107d2b]"
            >
              <Plus className="h-4 w-4" /> Add new Vacancy
            </button>
          )}
        </div>
      </header>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <AdminModal isOpen={isFormOpen} title={editingId ? 'Edit vacancy' : 'Post a new vacancy'} onClose={cancelEdit} maxWidthClass="max-w-4xl">
      {isFormOpen && <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2">{error}</p>}
        <label className={labelClass}>
          Position
          <input className={inputClass} value={draft.position} onChange={(event) => setDraft({ ...draft, position: event.target.value })} required maxLength={120} />
        </label>
        <label className={labelClass}>
          Application deadline (optional)
          <input className={inputClass} type="date" value={draft.expiresAt} onChange={(event) => setDraft({ ...draft, expiresAt: event.target.value })} />
        </label>
        <label className={labelClass}>
          Experience required
          <input className={inputClass} placeholder="e.g. 2 years, or entry level" value={draft.experience} onChange={(event) => setDraft({ ...draft, experience: event.target.value })} required maxLength={120} />
        </label>
        <label className={labelClass}>
          Grade value (optional)
          <input className={inputClass} placeholder="e.g. Grade 5 or 5" value={draft.gradeValue} onChange={(event) => setDraft({ ...draft, gradeValue: event.target.value })} maxLength={80} />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold">Salary</legend>
          <div className="flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-2"><input type="radio" checked={draft.salaryAsPerScale} onChange={() => setDraft({ ...draft, salaryAsPerScale: true })} /> As per company scale</label>
            <label className="flex items-center gap-2"><input type="radio" checked={!draft.salaryAsPerScale} onChange={() => setDraft({ ...draft, salaryAsPerScale: false })} /> Set amount (ETB)</label>
          </div>
          {!draft.salaryAsPerScale && <input className={inputClass} type="number" min="0" step="0.01" placeholder="Salary amount in ETB" value={draft.salaryAmount} onChange={(event) => setDraft({ ...draft, salaryAmount: event.target.value })} required />}
        </fieldset>
        <label className={labelClass}>
          Working location
          <input className={inputClass} value={draft.workingLocation} onChange={(event) => setDraft({ ...draft, workingLocation: event.target.value })} required maxLength={180} />
        </label>
        <label className={labelClass}>
          Background education
          <input className={inputClass} value={draft.backgroundEducation} onChange={(event) => setDraft({ ...draft, backgroundEducation: event.target.value })} required maxLength={240} />
        </label>
        <label className={labelClass}>
          Skills / grade or points
          <input className={inputClass} value={draft.skills} onChange={(event) => setDraft({ ...draft, skills: event.target.value })} required maxLength={500} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Short description
          <textarea className={inputClass} value={draft.shortDescription} onChange={(event) => setDraft({ ...draft, shortDescription: event.target.value })} required rows={4} maxLength={2000} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Job Description
          <textarea className={inputClass} value={draft.jobDescription} onChange={(event) => setDraft({ ...draft, jobDescription: event.target.value })} required rows={4} maxLength={3000} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Duties and Responsibilities
          <textarea className={inputClass} value={draft.dutiesResponsibilities} onChange={(event) => setDraft({ ...draft, dutiesResponsibilities: event.target.value })} required rows={5} maxLength={4000} />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold">Application method</legend>
          <div className="flex gap-4 text-xs">
            <label className="flex items-center gap-2"><input type="radio" checked={draft.applicationMethod === 'in_person'} onChange={() => setDraft({ ...draft, applicationMethod: 'in_person' })} /> In person</label>
            <label className="flex items-center gap-2"><input type="radio" checked={draft.applicationMethod === 'online'} onChange={() => setDraft({ ...draft, applicationMethod: 'online' })} /> Online</label>
          </div>
          {draft.applicationMethod === 'online' && (
            <input className={inputClass} type="url" placeholder="External application link (optional)" value={draft.applicationLink} onChange={(event) => setDraft({ ...draft, applicationLink: event.target.value })} />
          )}
        </fieldset>
        <div className="flex items-end gap-2">
          <button className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white ${editingId ? 'bg-[#344BC2]' : 'bg-[#159E37] hover:bg-[#107d2b]'}`} type="submit">
            {editingId ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingId ? 'Save changes' : 'Post Vacancy'}
          </button>
          <button type="button" onClick={cancelEdit} className="inline-flex items-center gap-1 rounded-xl border border-[#159E37] px-4 py-2.5 text-xs font-bold"><X className="h-4 w-4" /> Cancel</button>
        </div>
      </form>}
      </AdminModal>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm font-bold">Previous vacancies ({filteredVacancies.length})</h4>
          <div className="flex flex-wrap items-center gap-3">
          <label className="relative block min-w-52 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#344BC2]/50" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search vacancies" aria-label="Search vacancies" className={`${inputClass} pl-9`} />
          </label>
          {grades.length > 0 && (
            <label className="flex items-center gap-2 text-xs font-semibold">
              Filter by grade
              <select className={`${inputClass} w-auto min-w-36`} value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value)}>
                <option value="">All grades</option>
                {grades.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
              </select>
            </label>
          )}
          </div>
        </div>
        {vacancies.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-[#344BC2]/65">No vacancies published yet.</p>}
        {vacancies.length > 0 && filteredVacancies.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-[#344BC2]/65">No vacancies match this grade.</p>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredVacancies.map((vacancy) => (
          <article key={vacancy.id} className="flex flex-col justify-between gap-4 rounded-2xl border-2 border-[#159E37] bg-white p-4 text-[#344BC2] shadow-md">
            <div className="space-y-2">
              <h5 className="font-bold">{vacancy.position}</h5>
              <p className="text-xs text-[#344BC2]/70">
                <span className="font-semibold text-emerald-700">Posted {new Date(vacancy.createdAt).toLocaleDateString()}</span>
                {' · '}{vacancy.workingLocation} · {vacancy.applicationMethod === 'online' ? 'Online application' : 'In person'}
                {vacancy.gradeValue && ` · Grade ${vacancy.gradeValue}`}
                {vacancy.expiresAt && (
                  <span className="font-semibold text-red-700">
                    {' · '}{new Date(vacancy.expiresAt) < new Date() ? 'Expired' : 'Expires'} {new Date(vacancy.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </p>
              <p className="line-clamp-3 text-xs leading-relaxed text-[#344BC2]/75">{vacancy.shortDescription}</p>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-[#159E37] pt-3">
              {vacancy.applicationMethod === 'online' && (
                <button type="button" onClick={() => void toggleApplications(vacancy.id)} className="rounded-lg border border-[#159E37] px-3 py-2 text-xs font-semibold hover:bg-slate-50">
                  {loadingApplicationsId === vacancy.id
                    ? 'Loading…'
                    : applications[vacancy.id]
                      ? 'Hide applicants'
                      : `View applicants${applicationCounts[vacancy.id] !== undefined ? ` (${applicationCounts[vacancy.id]})` : ''}`}
                </button>
              )}
              {hasAdminPermission(currentUser, 'vacancies', 'edit') && <button type="button" onClick={() => editVacancy(vacancy)} aria-label={`Edit ${vacancy.position}`} className="rounded-lg border border-[#159E37] p-2 hover:bg-slate-50"><Edit2 className="h-4 w-4" /></button>}
              {hasAdminPermission(currentUser, 'vacancies', 'delete') && <button type="button" onClick={() => {
                void (async () => {
                  if (!await confirm('Delete vacancy?', `Move "${vacancy.position}" to deleted records? The vacancy will be hidden, and applicant records will be retained.`)) return;
                  try {
                    await deleteVacancy(vacancy.id);
                    notify('success', 'Vacancy moved to deleted records. Applicant records were retained.');
                  } catch (deleteError: unknown) {
                    const message = deleteError instanceof Error ? deleteError.message : 'Unable to delete vacancy.';
                    setError(message);
                    notify('error', message);
                  }
                })();
              }} aria-label={`Delete ${vacancy.position}`} className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>}
            </div>
            {applications[vacancy.id] && (
              <div className="w-full border-t border-[#159E37] pt-3 sm:col-span-2 xl:col-span-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h6 className="text-sm font-bold">Applicants ({applications[vacancy.id].length})</h6>
                  <button
                    type="button"
                    onClick={() => exportApplications(vacancy, applications[vacancy.id])}
                    disabled={applications[vacancy.id].length === 0}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#159E37] px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" /> Export CSV
                  </button>
                </div>
                {applications[vacancy.id].length === 0 ? (
                  <p className="text-xs text-[#344BC2]/65">No applications received yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-[#159E37]">
                    <table className="w-full min-w-[1050px] border-collapse text-left text-xs">
                      <thead className="bg-slate-100 text-[#344BC2]">
                        <tr>
                          <th className="px-3 py-2 font-bold">Application ID</th>
                          <th className="px-3 py-2 font-bold">Full Name</th>
                          <th className="px-3 py-2 font-bold">Phone Number</th>
                          <th className="px-3 py-2 font-bold">Email</th>
                          <th className="px-3 py-2 font-bold">CGPA</th>
                          <th className="px-3 py-2 font-bold">Applied Date &amp; Time</th>
                          <th className="px-3 py-2 font-bold">Attached File</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#344BC2]/10">
                        {applications[vacancy.id].map((application) => (
                          <tr key={application.id} className="align-top">
                            <td className="px-3 py-2 font-mono" title={application.id}>{application.id}</td>
                            <td className="px-3 py-2">{application.fullName}</td>
                            <td className="px-3 py-2"><a className="underline" href={`tel:${application.phone}`}>{application.phone}</a></td>
                            <td className="px-3 py-2">{application.email ? <a className="underline" href={`mailto:${application.email}`}>{application.email}</a> : 'Not provided'}</td>
                            <td className="px-3 py-2">{application.cgpa?.toFixed(2) ?? 'Not provided'}</td>
                            <td className="whitespace-nowrap px-3 py-2">{new Date(application.appliedAt).toLocaleString()}</td>
                            <td className="px-3 py-2">
                              {application.attachmentDataUrl
                                ? <a className="font-bold text-[#344BC2] underline" href={application.attachmentDataUrl} download={application.attachmentName}>{application.attachmentName ?? 'Download file'}</a>
                                : 'Not available'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
        </div>
      </div>
    </div>
  );
};
