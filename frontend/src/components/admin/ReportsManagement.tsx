import React, { FormEvent, useState } from 'react';
import { Download, FileBarChart, Search } from 'lucide-react';
import { apiRequest } from '../../utils/api';

type ReportType = 'overview' | 'orders' | 'feedback' | 'news' | 'users' | 'menu' | 'vacancies' | 'subscriptions' | 'services' | 'hero';
type ReportRecord = Record<string, unknown>;

const reportOptions: { value: ReportType; label: string }[] = [
  { value: 'overview', label: 'All project reports' },
  { value: 'orders', label: 'Customer orders' },
  { value: 'feedback', label: 'Customer feedback' },
  { value: 'news', label: 'News & announcements' },
  { value: 'menu', label: 'Menu items' },
  { value: 'vacancies', label: 'Vacancies' },
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'services', label: 'Services' },
  { value: 'hero', label: 'Hero section' },
  { value: 'users', label: 'User accounts' },
];

const csvValue = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return `"${text.replaceAll('"', '""')}"`;
};

export const ReportsManagement: React.FC = () => {
  const [type, setType] = useState<ReportType>('overview');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setRecords([]);
    setGeneratedAt(null);
    setIsGenerating(true);
    try {
      const params = new URLSearchParams({ type, search: search.trim() });
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const result = await apiRequest<{ records: ReportRecord[]; generatedAt: string }>(`/api/reports?${params.toString()}`);
      setRecords(result.records);
      setGeneratedAt(result.generatedAt);
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : 'Unable to generate report.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCsv = () => {
    if (!records.length) return;
    const headers = [...new Set(records.flatMap((record) => Object.keys(record)))];
    const content = [headers.map(csvValue).join(','), ...records.map((record) => headers.map((header) => csvValue(record[header])).join(','))].join('\r\n');
    const blobUrl = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = `guansa-maed-${type}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  };

  const columns = records.length ? [...new Set(records.flatMap((record) => Object.keys(record)))].slice(0, 8) : [];

  return (
    <section className="space-y-5">
      <header>
        <h3 className="flex items-center gap-2 font-serif text-xl font-bold"><FileBarChart className="h-5 w-5 text-[#159E37]" /> Reports</h3>
        <p className="mt-1 text-xs text-[#344BC2]/70">Generate filtered reports from project records and export the results as CSV.</p>
      </header>
      <form onSubmit={(event) => void generateReport(event)} className="grid gap-3 rounded-2xl border border-[#159E37] bg-white p-4 sm:grid-cols-2 xl:grid-cols-5">
        <label className="space-y-1 text-xs font-semibold">
          Report
          <select value={type} onChange={(event) => setType(event.target.value as ReportType)} className="w-full rounded-lg border border-[#159E37] bg-white px-3 py-2.5 text-sm">
            {reportOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs font-semibold">
          Start date
          <input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} className="w-full rounded-lg border border-[#159E37] px-3 py-2.5 text-sm" />
        </label>
        <label className="space-y-1 text-xs font-semibold">
          End date
          <input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className="w-full rounded-lg border border-[#159E37] px-3 py-2.5 text-sm" />
        </label>
        <label className="space-y-1 text-xs font-semibold xl:col-span-1">
          Search records
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#344BC2]/50" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Keyword" className="w-full rounded-lg border border-[#159E37] py-2.5 pl-9 pr-3 text-sm" />
          </span>
        </label>
        <button type="submit" disabled={isGenerating || Boolean(from && to && from > to)} className="self-end rounded-lg bg-[#344BC2] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {isGenerating ? 'Generating…' : 'Generate Report'}
        </button>
      </form>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {generatedAt && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#344BC2]/70">{records.length.toLocaleString()} records · Generated {new Date(generatedAt).toLocaleString()}</p>
          <button type="button" disabled={!records.length} onClick={downloadCsv} className="inline-flex items-center gap-2 rounded-lg border border-[#159E37] bg-white px-3 py-2 text-xs font-bold disabled:opacity-50"><Download className="h-4 w-4" /> Download CSV</button>
        </div>
      )}
      {generatedAt && records.length === 0 && <p className="rounded-xl border border-dashed border-[#159E37] bg-white p-8 text-center text-sm text-[#344BC2]/65">No matching records were found.</p>}
      {records.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[#159E37] bg-white">
          <table className="w-full min-w-[600px] text-left text-xs">
            <thead className="bg-slate-50">
              <tr>{columns.map((column) => <th key={column} className="whitespace-nowrap px-3 py-3 font-bold capitalize">{column.replaceAll(/([A-Z])/g, ' $1')}</th>)}</tr>
            </thead>
            <tbody>
              {records.slice(0, 100).map((record, index) => (
                <tr key={String(record.id ?? record.orderId ?? index)} className="border-t border-slate-100">
                  {columns.map((column) => <td key={column} className="max-w-xs truncate px-3 py-2.5">{typeof record[column] === 'object' ? JSON.stringify(record[column]) : String(record[column] ?? '—')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {records.length > 100 && <p className="border-t border-slate-100 px-3 py-2 text-xs text-[#344BC2]/65">Showing the first 100 rows. Download the CSV to view all returned records.</p>}
        </div>
      )}
    </section>
  );
};
