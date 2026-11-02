import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchFeeAnalytics, useActiveBatches, BatchSelect, Card, Loading, ErrorBox,
  inr, inrShort, formatDate, downloadCsv, students,
} from './feeAnalyticsShared';

const STATUS = {
  overdue: { label: 'Overdue', badge: 'bg-orange-100 text-orange-800' },
  week: { label: 'This week', badge: 'bg-yellow-100 text-yellow-800' },
  later: { label: 'Later', badge: 'bg-blue-100 text-blue-800' },
  nodate: { label: 'No date', badge: 'bg-gray-100 text-gray-700' },
};
const FILTERS = ['all', 'overdue', 'week', 'later', 'nodate'];
const AGEING_COLORS = ['bg-orange-300', 'bg-orange-400', 'bg-orange-500', 'bg-orange-600', 'bg-orange-800'];
const PAGE_SIZE = 20;

function statusText(r) {
  if (r.status === 'nodate') return 'No due date';
  const d = r.days_overdue;
  if (d > 0) return `${d} day${d === 1 ? '' : 's'} overdue`;
  if (d === 0) return 'Due today';
  return `Due in ${-d} day${d === -1 ? '' : 's'}`;
}

// Read-only list of students who still owe fees, from the existing FeeStatus data
const FeeCollections = () => {
  const batches = useActiveBatches();
  const [batchId, setBatchId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setData(null);
    setError(null);
    fetchFeeAnalytics('/collections', batchId).then(setData).catch((e) => setError(e.message));
  }, [batchId]);
  useEffect(() => { setPage(1); }, [filter, search, batchId]);

  const rows = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.students.filter((r) => (filter === 'all' || r.status === filter)
      && (!q || (r.name || '').toLowerCase().includes(q) || (r.phone_number || '').includes(q)));
  }, [data, filter, search]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const counts = data ? {
    all: data.students_owing,
    overdue: data.tiles.overdue.students,
    week: data.tiles.week.students,
    later: data.tiles.later.students,
    nodate: data.tiles.nodate.students,
  } : {};
  const maxAgeing = data ? Math.max(1, ...data.ageing.map((g) => g.amount)) : 1;

  const tiles = data ? [
    { key: 'overdue', label: 'Overdue', note: 'next due date passed', color: 'text-orange-700' },
    { key: 'week', label: 'Due this week', note: 'due in the next 7 days', color: 'text-yellow-800' },
    { key: 'later', label: 'Due later', note: 'due after 7 days', color: 'text-blue-800' },
    { key: 'nodate', label: 'No due date set', note: 'set a date in Fee Records', color: 'text-gray-700' },
  ] : [];

  const exportRows = () => downloadCsv(
    `fee-dues-${data.as_of}.csv`,
    ['Student', 'Phone', 'Batch', 'Left to pay', 'Next due date', 'Status'],
    rows.map((r) => [r.name, r.phone_number, r.batch_name, r.remaining, r.next_due_date || '', statusText(r)]),
  );

  return (
    <div className="bg-gray-50 min-h-screen p-3 md:p-6 text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
      <div className="flex flex-wrap justify-between items-end gap-4 mb-5">
        <div>
          <h1 className="text-2xl md:text-[26px] font-bold">Collections</h1>
          {data && (
            <p className="text-sm text-gray-600">
              {inrShort(data.total_outstanding)} still to collect from {students(data.students_owing)} · as of {formatDate(data.as_of)}
            </p>
          )}
        </div>
        <BatchSelect batches={batches} value={batchId} onChange={setBatchId} />
      </div>

      {error && <ErrorBox error={error} />}
      {!data && !error && <Loading />}

      {data && (
        <div className="flex flex-col gap-5">
          <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {tiles.map((t) => {
              const v = data.tiles[t.key];
              const on = filter === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFilter(on ? 'all' : t.key)}
                  aria-pressed={on}
                  className={`text-left bg-white rounded-xl px-4 py-4 shadow-sm ${on ? 'border-2 border-blue-700 ring-4 ring-blue-100' : 'border border-gray-200 hover:border-gray-300'}`}
                >
                  <p className="text-[13px] font-semibold text-gray-600">{t.label}</p>
                  <p className={`text-[26px] font-bold mt-1 ${t.color}`}>{inrShort(v.amount)}</p>
                  <p className="text-xs text-gray-600 mt-1">{students(v.students)} · {t.note}</p>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))' }}>
            <Card title="Overdue by age" subtitle="Days since each student's next due date">
              {data.ageing.map((g, i) => (
                <div key={g.label} className="grid gap-3 items-center text-sm" style={{ gridTemplateColumns: '92px minmax(0,1fr) 76px 84px' }}>
                  <span className="font-semibold">{g.label}</span>
                  <div className="h-[18px] bg-gray-100 rounded overflow-hidden">
                    <div className={`h-[18px] rounded ${AGEING_COLORS[i]}`} style={{ width: `${(g.amount / maxAgeing) * 100}%` }} />
                  </div>
                  <span className="text-right font-bold">{g.amount ? inrShort(g.amount) : '—'}</span>
                  <span className="text-right text-xs text-gray-600">{students(g.students)}</span>
                </div>
              ))}
            </Card>

            <Card title="By due date" subtitle="Remaining fee grouped by next due date">
              <div className="flex flex-col max-h-[360px] overflow-y-auto">
                {data.by_due_date.length === 0 && <p className="text-sm text-gray-600">No due dates set.</p>}
                {data.by_due_date.map((d) => {
                  const r = { status: d.days > 0 ? 'overdue' : (d.days >= -7 ? 'week' : 'later'), days_overdue: d.days };
                  return (
                    <div key={d.date} className="grid gap-2.5 items-center py-2 border-t border-gray-100 first:border-t-0 text-[13px]" style={{ gridTemplateColumns: '104px minmax(0,1fr) 88px 84px' }}>
                      <span className="font-semibold">{formatDate(d.date)}</span>
                      <span><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS[r.status].badge}`}>{statusText(r)}</span></span>
                      <span className="text-right text-gray-600">{students(d.students)}</span>
                      <span className="text-right font-bold">{inrShort(d.amount)}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <Card
            title="Students with dues"
            subtitle="Sorted by days overdue. Click a name to open the student's profile."
            right={(
              <div className="flex flex-wrap gap-2 items-center">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`min-h-[38px] px-3 rounded-full text-[13px] font-semibold border ${filter === f ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-700 border-gray-300'}`}
                  >
                    {f === 'all' ? 'All' : STATUS[f].label} ({counts[f]})
                  </button>
                ))}
                <input
                  type="search"
                  aria-label="Search students"
                  placeholder="Search name or phone"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-h-[38px] px-2.5 border border-gray-300 rounded-lg text-[13px] w-44"
                />
                <button type="button" onClick={exportRows} className="min-h-[38px] px-3.5 rounded-lg border border-gray-300 bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50">
                  Export CSV
                </button>
              </div>
            )}
          >
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide text-left">
                  <tr>
                    <th scope="col" className="px-3.5 py-3">Student</th>
                    <th scope="col" className="px-3.5 py-3">Batch</th>
                    <th scope="col" className="px-3.5 py-3 text-right">Left to pay</th>
                    <th scope="col" className="px-3.5 py-3">Next due</th>
                    <th scope="col" className="px-3.5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 && (
                    <tr><td colSpan={5} className="px-3.5 py-6 text-center text-gray-600">No students match.</td></tr>
                  )}
                  {pageRows.map((r) => (
                    <tr key={r.fee_status_id} className="border-t border-gray-100">
                      <td className="px-3.5 py-2.5">
                        <Link to={`/profile/${r.user_id}`} className="font-semibold text-gray-900 hover:text-blue-700 hover:underline">{r.name || `Student ${r.user_id}`}</Link>
                        <span className="block text-xs text-gray-600">{r.phone_number || 'No phone'}</span>
                      </td>
                      <td className="px-3.5 py-2.5">{r.batch_name}</td>
                      <td className="px-3.5 py-2.5 text-right font-bold">{inr(r.remaining)}</td>
                      <td className="px-3.5 py-2.5">{formatDate(r.next_due_date)}</td>
                      <td className="px-3.5 py-2.5">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS[r.status].badge}`}>{statusText(r)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-gray-600">
              <span>Showing {rows.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}</span>
              <div className="flex gap-2">
                <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="min-h-[34px] px-3 rounded-lg border border-gray-300 bg-white font-semibold disabled:opacity-40">Previous</button>
                <span className="self-center">Page {page} of {pages}</span>
                <button type="button" disabled={page === pages} onClick={() => setPage(page + 1)} className="min-h-[34px] px-3 rounded-lg border border-gray-300 bg-white font-semibold disabled:opacity-40">Next</button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FeeCollections;
