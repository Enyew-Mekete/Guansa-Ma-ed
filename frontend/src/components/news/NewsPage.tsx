import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Bell, MapPin, Newspaper, Search } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { NewsPost } from '../../types';

const DiscountDates: React.FC<{ post: NewsPost }> = ({ post }) => {
  if (!post.startDate && !post.endDate) return null;
  const formatDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString();
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
      {post.startDate && <span className="text-emerald-800">Starts {formatDate(post.startDate)}</span>}
      {post.endDate && <span className="text-rose-700">Ends {formatDate(post.endDate)}</span>}
    </div>
  );
};

export const NewsPage: React.FC = () => {
  const { newsPosts, markNewsAsRead, error } = useNews();
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredNewsPosts = newsPosts.filter((post) =>
    `${post.title} ${post.category} ${post.description} ${post.discountItem ?? ''}`
      .toLocaleLowerCase().includes(searchQuery.trim().toLocaleLowerCase()),
  );

  useEffect(() => {
    if (selectedPost) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedPost]);

  return (
    <section className="min-h-[60vh] bg-white px-4 py-12 text-[#344BC2] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <header className="space-y-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800">
            <Bell className="h-4 w-4" /> Restaurant updates
          </span>
          <h1 className="font-serif text-3xl font-extrabold sm:text-4xl">News & Announcements</h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#344BC2]/70">
            The latest menu additions, discounts, branch and location updates, gallery highlights, and restaurant notices.
          </p>
        </header>
        {!selectedPost && newsPosts.length > 0 && (
          <label className="relative mx-auto block max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#344BC2]/50" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search announcements" aria-label="Search news and announcements" className="w-full rounded-xl border border-[#159E37] bg-white py-2.5 pl-9 pr-3 text-sm" />
          </label>
        )}

        {selectedPost ? (
          <article className="mx-auto max-w-4xl space-y-6 rounded-2xl border border-[#159E37] bg-white p-6 shadow-sm sm:p-10">
            <button type="button" onClick={() => setSelectedPost(null)} className="inline-flex items-center gap-2 rounded-lg border border-[#159E37] px-4 py-2 text-sm font-bold transition hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" /> Back to News &amp; Announcements
            </button>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-900">{selectedPost.category}</span>
              <time className="text-xs text-[#344BC2]/60" dateTime={selectedPost.createdAt}>{new Date(selectedPost.createdAt).toLocaleDateString()}</time>
            </div>
            <h2 className="font-serif text-3xl font-extrabold sm:text-4xl">{selectedPost.title}</h2>
            {selectedPost.imageDataUrl && <img src={selectedPost.imageDataUrl} alt={selectedPost.title} className="max-h-[70vh] w-full rounded-xl object-contain" />}
            {selectedPost.category === 'Discount' && (
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-lg font-bold text-amber-900">{selectedPost.discountPercent}% off {selectedPost.discountItem}</p>
                <DiscountDates post={selectedPost} />
              </div>
            )}
            <p className="whitespace-pre-wrap text-base leading-8 text-[#344BC2]/85">{selectedPost.description}</p>
            {selectedPost.location && <p className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4 text-amber-700" />{selectedPost.location}</p>}
            {selectedPost.link && <a href={selectedPost.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold underline decoration-amber-500 underline-offset-4">More information <ArrowUpRight className="h-4 w-4" /></a>}
          </article>
        ) : filteredNewsPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#159E37] bg-slate-50 px-6 py-14 text-center">
            <Newspaper className="mx-auto mb-3 h-8 w-8 text-[#344BC2]/50" />
            <h2 className="font-bold">{newsPosts.length ? 'No announcements match your search' : 'No news at the moment'}</h2>
            <p className="mt-1 text-sm text-[#344BC2]/65">{newsPosts.length ? 'Try a different keyword.' : "Please check back for future updates from Guansa Ma'ed."}</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {filteredNewsPosts.map((post) => (
              <article key={post.id} className="rounded-2xl border border-[#159E37] bg-white p-6 shadow-sm">
                {post.imageDataUrl && <img src={post.imageDataUrl} alt={post.title} className="mb-4 max-h-64 w-full rounded-xl object-cover" loading="lazy" />}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-900">{post.category}</span>
                  <time className="text-xs text-[#344BC2]/60" dateTime={post.createdAt}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </time>
                </div>
                <h2 className="text-lg font-bold">{post.title}</h2>
                {post.category === 'Discount' && (
                  <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2">
                    <p className="text-sm font-bold text-amber-900">{post.discountPercent}% off {post.discountItem}</p>
                    <DiscountDates post={post} />
                  </div>
                )}
                <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-[#344BC2]/80">{post.description}</p>
                {post.location && (
                  <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#344BC2]/75">
                    <MapPin className="h-4 w-4 shrink-0 text-amber-700" /> {post.location}
                  </p>
                )}
                {post.link && (
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#344BC2] underline decoration-amber-500 underline-offset-4"
                  >
                    More information <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    if (await markNewsAsRead(post.id)) setSelectedPost(post);
                  }}
                  className="mt-4 inline-flex items-center rounded-lg bg-[#344BC2] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#2C40AE]"
                >
                  See More
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
