import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Search } from 'lucide-react';
import { apiRequest } from '../../utils/api';

interface NewsletterSubscriber {
  email: string;
  subscribedAt: string;
}

export const NewsletterSubscribersManagement: React.FC = () => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailSearch, setEmailSearch] = useState('');
  const [dateSearch, setDateSearch] = useState('');

  const filteredSubscribers = useMemo(() => subscribers.filter((subscriber) => {
    const matchesEmail = subscriber.email.toLowerCase().includes(emailSearch.trim().toLowerCase());
    const matchesDate = !dateSearch || subscriber.subscribedAt.slice(0, 10) === dateSearch;
    return matchesEmail && matchesDate;
  }), [subscribers, emailSearch, dateSearch]);

  useEffect(() => {
    let mounted = true;
    apiRequest<{ subscribers: NewsletterSubscriber[] }>('/api/newsletter/subscribers/list')
      .then(({ subscribers: savedSubscribers }) => {
        if (mounted) setSubscribers(savedSubscribers);
      })
      .catch((loadError: unknown) => {
        console.error('[Newsletter] Unable to load subscriber records.', loadError);
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Unable to load subscribers.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return (
    <section className="space-y-5">
      <header>
        <h3 className="text-xl font-bold font-serif">Newsletter Subscribers</h3>
        <p className="mt-1 text-xs text-[#344BC2]/70">Subscriber email addresses and subscription timestamps saved in Neon.</p>
      </header>
      {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {isLoading ? (
        <p className="rounded-xl bg-slate-50 p-5 text-sm text-[#344BC2]/70">Loading subscriber records…</p>
      ) : subscribers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#159E37] bg-slate-50 px-6 py-12 text-center">
          <Mail className="mx-auto mb-3 h-8 w-8 text-[#344BC2]/50" />
          <p className="font-semibold">No subscribers yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 rounded-2xl border border-[#159E37] bg-slate-50 p-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl border border-[#159E37] bg-white px-3">
              <Search className="h-4 w-4 text-[#344BC2]/55" />
              <input type="search" value={emailSearch} onChange={(event) => setEmailSearch(event.target.value)} placeholder="Search by email" aria-label="Search subscribers by email" className="w-full py-2.5 text-sm outline-none" />
            </label>
            <label className="grid gap-1 text-xs font-semibold">
              Search by subscription date
              <input type="date" value={dateSearch} onChange={(event) => setDateSearch(event.target.value)} className="rounded-xl border border-[#159E37] bg-white px-3 py-2 text-sm font-normal" />
            </label>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[#159E37]">
            <div className="bg-[#344BC2] px-4 py-3 text-sm font-bold text-white">
              Number of Subscribers are: {subscribers.length}+
            </div>
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-[#344BC2]/65">
                <tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Subscribed</th></tr>
              </thead>
              <tbody className="divide-y divide-[#344BC2]/10">
                {filteredSubscribers.map((subscriber, index) => (
                  <tr key={subscriber.email} className="hover:bg-amber-50/50">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3"><a className="font-semibold text-[#344BC2] underline" href={`mailto:${subscriber.email}`}>{subscriber.email}</a></td>
                    <td className="px-4 py-3"><time className="text-xs text-[#344BC2]/70" dateTime={subscriber.subscribedAt}>{new Date(subscriber.subscribedAt).toLocaleString()}</time></td>
                  </tr>
                ))}
                {filteredSubscribers.length === 0 && <tr><td className="px-4 py-6 text-center text-sm text-[#344BC2]/60" colSpan={3}>No subscribers match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
