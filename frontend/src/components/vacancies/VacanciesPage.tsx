import React, { useEffect, useMemo, useState } from 'react';
import { FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, GraduationCap, MapPin } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { Vacancy } from '../../types';
import { apiRequest } from '../../utils/api';
import { validateEthiopianPhone } from '../../utils/ethiopianPhone';

const inputClass = 'w-full rounded-lg border border-[#159E37] bg-white px-3 py-2 text-sm';

export const VacanciesPage: React.FC<{ onOpenPrivacyPolicy: () => void }> = ({ onOpenPrivacyPolicy }) => {
  const { vacancies, markVacanciesAsRead, error } = useNews();
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentDataUrl, setAttachmentDataUrl] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [applicationMessage, setApplicationMessage] = useState<{ vacancyId: string; success: boolean; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const visibleVacancies = useMemo(
    () => vacancies.filter((vacancy) => !vacancy.expiresAt || new Date(vacancy.expiresAt).getTime() >= currentTime),
    [currentTime, vacancies],
  );
  const displayedVacancies = selectedVacancyId
    ? visibleVacancies.filter((vacancy) => vacancy.id === selectedVacancyId)
    : showAll ? visibleVacancies : visibleVacancies.slice(0, 3);

  useEffect(() => {
    if (selectedVacancyId) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedVacancyId]);

  const openApplication = (vacancyId: string) => {
    setApplyingTo((current) => current === vacancyId ? null : vacancyId);
    setIsPreviewOpen(false);
    setFormError(null);
    setApplicationMessage(null);
  };

  const toggleDetails = (vacancy: Vacancy) => {
    markVacanciesAsRead(vacancy.id);
    setSelectedVacancyId(vacancy.id);
  };

  const submitApplication = async (event: FormEvent<HTMLFormElement>, vacancy: Vacancy) => {
    event.preventDefault();
    if (!isPreviewOpen) {
      const phoneCheck = validateEthiopianPhone(phone);
      if (!phoneCheck.isValid) {
        setFormError(phoneCheck.errorMessage || 'Enter a valid Ethiopian mobile number.');
        return;
      }
      const numericCgpa = Number(cgpa);
      if (cgpa === '' || !Number.isFinite(numericCgpa) || numericCgpa < 0 || numericCgpa > 4) {
        setFormError('Enter a CGPA from 0.00 to 4.00.');
        return;
      }
      if (!attachmentDataUrl) {
        setFormError('Attach your CV or supporting document as a PDF or image.');
        return;
      }
      if (!acceptedTerms) {
        setFormError('Please accept the Terms & Privacy Policy before continuing.');
        return;
      }
      setFormError(null);
      setIsPreviewOpen(true);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await apiRequest(`/api/vacancies/${encodeURIComponent(vacancy.id)}/applications`, {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email: email || undefined,
          phone,
          cgpa: Number(cgpa),
          attachmentName,
          attachmentDataUrl,
          acceptedTerms,
        }),
      });
      setApplicationMessage({ vacancyId: vacancy.id, success: true, text: 'Your application was received. Thank you for your interest.' });
      setFullName('');
      setEmail('');
      setPhone('');
      setCgpa('');
      setAttachmentName('');
      setAttachmentDataUrl('');
      setAcceptedTerms(false);
      setIsPreviewOpen(false);
      setApplyingTo(null);
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Unable to submit your application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-[60vh] bg-white px-4 py-12 text-[#344BC2] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <header className="space-y-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800">
            <BriefcaseBusiness className="h-4 w-4" /> Join our team
          </span>
          <h1 className="font-serif text-3xl font-extrabold sm:text-4xl">Currently Open Vacancies</h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#344BC2]/70">
            Explore current openings at Guansa Ma'ed. Select See More for the job description and duties.
          </p>
        </header>

        {visibleVacancies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#159E37] bg-slate-50 px-6 py-14 text-center">
            <BriefcaseBusiness className="mx-auto mb-3 h-8 w-8 text-[#344BC2]/50" />
            <h2 className="font-bold">No open vacancies right now</h2>
            <p className="mt-1 text-sm text-[#344BC2]/65">Please check back for future opportunities.</p>
          </div>
        ) : (
          <>
            <div className={selectedVacancyId ? 'space-y-5' : 'grid items-start gap-5 md:grid-cols-3'}>
              {displayedVacancies.map((vacancy) => {
                const detailsOpen = selectedVacancyId === vacancy.id;
                return (
                  <article key={vacancy.id} className={`flex h-full flex-col rounded-2xl border border-[#159E37] bg-white p-6 shadow-sm transition duration-300 hover:shadow-lg ${detailsOpen ? 'w-full p-6 sm:p-10' : 'hover:-translate-y-1'}`}>
                    {detailsOpen && (
                      <button type="button" onClick={() => setSelectedVacancyId(null)} className="mb-6 inline-flex w-fit items-center gap-2 rounded-lg border border-[#159E37] px-4 py-2 text-sm font-bold transition hover:bg-slate-50">
                        <ArrowLeft className="h-4 w-4" /> Back to Open Vacancies
                      </button>
                    )}
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <h2 className="text-xl font-bold">{vacancy.position}</h2>
                        <p className="mt-1 text-sm text-[#344BC2]/70">{vacancy.experience} experience</p>
                      </div>
                      <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                        {vacancy.salaryAsPerScale ? 'As per company scale' : `${vacancy.salaryAmount?.toLocaleString()} ETB`}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 border-y border-[#159E37] py-5">
                      <p className="flex items-start gap-2 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><span><strong>Working location:</strong> {vacancy.workingLocation}</span></p>
                      <p className="flex items-start gap-2 text-sm"><GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><span><strong>Education:</strong> {vacancy.backgroundEducation}</span></p>
                      {vacancy.gradeValue && <p className="text-sm"><strong>Grade:</strong> {vacancy.gradeValue}</p>}
                      <p className="text-sm"><strong>Skills / points:</strong> {vacancy.skills}</p>
                    </div>

                    <p className={`mt-5 whitespace-pre-wrap text-sm leading-relaxed text-[#344BC2]/80 ${detailsOpen ? '' : 'line-clamp-3'}`}>{vacancy.shortDescription}</p>
                    {!detailsOpen && <button type="button" onClick={() => toggleDetails(vacancy)} className="mt-3 w-fit rounded-xl bg-[#344BC2] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0a258f]">See More</button>}
                    {detailsOpen && (
                      <div className="mt-4 space-y-4 rounded-xl bg-slate-50 p-4 text-sm">
                        <div><h3 className="font-bold">Job Description</h3><p className="mt-1 whitespace-pre-wrap leading-relaxed text-[#344BC2]/80">{vacancy.jobDescription || vacancy.shortDescription}</p></div>
                        <div><h3 className="font-bold">Duties and Responsibilities</h3><p className="mt-1 whitespace-pre-wrap leading-relaxed text-[#344BC2]/80">{vacancy.dutiesResponsibilities || 'Please contact us for role-specific responsibilities.'}</p></div>
                      </div>
                    )}

                    {detailsOpen && (
                      <div className="mt-6 rounded-xl bg-slate-50 p-4">
                        <h3 className="text-sm font-bold">How to apply</h3>
                        {vacancy.expiresAt && new Date(vacancy.expiresAt).getTime() < currentTime ? (
                          <p className="mt-2 text-sm font-semibold text-red-700">Applications are closed for this vacancy.</p>
                        ) : vacancy.applicationMethod === 'online' ? (
                          <>
                            <div className="flex flex-wrap items-center gap-4">
                              <button type="button" onClick={() => openApplication(vacancy.id)} className="mt-2 rounded-xl bg-[#344BC2] px-4 py-2 text-sm font-bold text-white">
                                Apply online
                              </button>
                              {vacancy.applicationLink && (
                                <a href={vacancy.applicationLink} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#344BC2] underline decoration-amber-500 underline-offset-4">
                                  External application link <ArrowUpRight className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                            {applyingTo === vacancy.id && (
                        <form onSubmit={(event) => void submitApplication(event, vacancy)} className="mt-4 space-y-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="grid gap-1 text-xs font-semibold">Full Name
                              <input required maxLength={180} disabled={isPreviewOpen} value={fullName} onChange={(event) => setFullName(event.target.value)} className={inputClass} />
                            </label>
                            <label className="grid gap-1 text-xs font-semibold">Ethiopian Phone Number
                              <input required type="tel" maxLength={40} disabled={isPreviewOpen} placeholder="09XXXXXXXX or +251 9XXXXXXXX" value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} />
                            </label>
                            <label className="grid gap-1 text-xs font-semibold">Email <span className="font-normal text-[#344BC2]/60">(Optional)</span>
                              <input type="email" maxLength={254} disabled={isPreviewOpen} value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
                            </label>
                            <label className="grid gap-1 text-xs font-semibold">CGPA (0.00–4.00)
                              <input required type="number" min="0" max="4" step="0.01" disabled={isPreviewOpen} value={cgpa} onChange={(event) => setCgpa(event.target.value)} className={inputClass} />
                            </label>
                            <label className="grid gap-1 text-xs font-semibold">Attach CV / Supporting File (PDF or image, max 4 MB)
                              <input
                                required
                                type="file"
                                disabled={isPreviewOpen}
                                accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
                                className={inputClass}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (!file) return;
                                  if (file.size > 4 * 1024 * 1024 || !['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
                                    setFormError('Choose a PDF, JPG, PNG, WebP, or GIF file no larger than 4 MB.');
                                    event.target.value = '';
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    if (typeof reader.result === 'string') {
                                      setAttachmentName(file.name);
                                      setAttachmentDataUrl(reader.result);
                                      setFormError(null);
                                    }
                                  };
                                  reader.onerror = () => setFormError('Unable to read the selected file.');
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </label>
                          </div>
                          <div className="flex items-start gap-2 text-xs leading-relaxed">
                            <input aria-label="Accept Terms and Privacy Policy" type="checkbox" disabled={isPreviewOpen} checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5" />
                            <p>I accept the <button type="button" onClick={onOpenPrivacyPolicy} className="font-bold underline">Terms &amp; Privacy Policy</button> and consent to the use of my application details for recruitment.</p>
                          </div>
                          {formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}
                          {isPreviewOpen && (
                            <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">
                              <h4 className="font-bold">Preview application</h4>
                              <p><strong>Full Name:</strong> {fullName}</p>
                              <p><strong>Phone:</strong> {validateEthiopianPhone(phone).normalized || phone}</p>
                              <p><strong>Email:</strong> {email || 'Not provided'}</p>
                              <p><strong>CGPA:</strong> {cgpa}</p>
                              <p><strong>Attachment:</strong> {attachmentName}</p>
                              <p><strong>Terms &amp; Privacy:</strong> Accepted</p>
                              <button type="button" onClick={() => setIsPreviewOpen(false)} className="mr-3 mt-1 text-xs font-bold underline">Edit details</button>
                            </div>
                          )}
                          <button disabled={isSubmitting} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">
                            {isSubmitting ? 'Submitting…' : isPreviewOpen ? 'Submit Application' : 'Preview Application'}
                          </button>
                        </form>
                            )}
                          </>
                        ) : (
                          <p className="mt-2 text-sm text-[#344BC2]/75">Please apply in person at {vacancy.workingLocation}.</p>
                        )}
                      </div>
                    )}
                    <p className="mt-auto flex flex-wrap justify-end gap-x-1 pt-4 text-right text-xs">
                      <span className="font-semibold text-emerald-700">Posted {new Date(vacancy.createdAt).toLocaleDateString()}</span>
                      {vacancy.expiresAt && (
                        <span className="font-semibold text-red-700">· Expires {new Date(vacancy.expiresAt).toLocaleDateString()}</span>
                      )}
                    </p>
                    {applicationMessage?.vacancyId === vacancy.id && (
                      <p role="status" className={`mt-3 text-sm ${applicationMessage.success ? 'text-emerald-800' : 'text-red-700'}`}>{applicationMessage.text}</p>
                    )}
                  </article>
                );
              })}
            </div>
            {!selectedVacancyId && visibleVacancies.length > 3 && (
              <div className="text-center">
                <button type="button" onClick={() => setShowAll((current) => !current)} className="rounded-xl border border-[#159E37] px-5 py-2.5 text-sm font-bold text-[#344BC2] transition hover:bg-[#344BC2] hover:text-white">
                  {showAll ? 'Show Less' : `See More (${visibleVacancies.length - 3} more vacancies)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
