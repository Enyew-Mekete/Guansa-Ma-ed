import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquareText, Search } from 'lucide-react';
import { CustomerFeedback } from '../../types';
import { apiRequest } from '../../utils/api';

export const CustomerFeedbackManagement: React.FC = () => {
  const [feedback, setFeedback] = useState<CustomerFeedback[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredFeedback = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return feedback.filter((entry) =>
      `${entry.fullName} ${entry.phone} ${entry.email ?? ''} ${entry.description}`
        .toLocaleLowerCase().includes(query),
    );
  }, [feedback, searchQuery]);

  useEffect(() => {
    let mounted = true;
    apiRequest<{ feedback: CustomerFeedback[] }>('/api/feedback')
      .then((result) => {
        if (mounted) setFeedback(result.feedback);
      })
      .catch((loadError: unknown) => {
        console.error('[Feedback] Unable to load customer feedback.', loadError);
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Unable to load feedback.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return (
    <section className="space-y-5">
      <header>
        <h3 className="text-xl font-bold font-serif">Customer Feedback &amp; Inquiries</h3>
        <p className="mt-1 text-xs text-[#344BC2]/70">Reservation and catering requests submitted from the website.</p>
      </header>
      {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {!isLoading && feedback.length > 0 && (
        <label className="relative block max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#344BC2]/50" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by name, phone, email, or message" aria-label="Search customer feedback" className="w-full rounded-xl border border-[#159E37] bg-white py-2.5 pl-9 pr-3 text-sm" />
        </label>
      )}
      {isLoading ? (
        <p className="rounded-xl bg-slate-50 p-5 text-sm text-[#344BC2]/70">Loading feedback…</p>
      ) : feedback.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#159E37] bg-slate-50 px-6 py-12 text-center">
          <MessageSquareText className="mx-auto mb-3 h-8 w-8 text-[#344BC2]/50" />
          <p className="font-semibold">No customer feedback yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#159E37]">
          <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
            <thead className="bg-[#344BC2] text-xs uppercase text-white">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Phone Number</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#344BC2]/10">
              {filteredFeedback.map((entry, index) => (
                <tr key={entry.id} className="align-top hover:bg-amber-50/50">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-bold">{entry.fullName}</td>
                  <td className="whitespace-nowrap px-4 py-3"><a className="underline" href={`tel:${entry.phone}`}>{entry.phone}</a></td>
                  <td className="px-4 py-3">{entry.email ? <a className="underline" href={`mailto:${entry.email}`}>{entry.email}</a> : 'Not provided'}</td>
                  <td className="max-w-xl whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed">{entry.description}</td>
                </tr>
              ))}
              {filteredFeedback.length === 0 && <tr><td className="px-4 py-6 text-center text-sm text-[#344BC2]/60" colSpan={5}>No feedback matches your search.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
