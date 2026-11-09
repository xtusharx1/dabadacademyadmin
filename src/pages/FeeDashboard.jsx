import React, { useEffect, useState } from 'react';
import {
  fetchFeeAnalytics, useActiveBatches, BatchSelect, Card, Loading, ErrorBox,
  inrShort, formatDate, downloadCsv, students,
} from './feeAnalyticsShared';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthName = (key) => MONTH_NAMES[Number(key.slice(5, 7)) - 1];
const pct = (n) => `${Number(n || 0).toFixed(1)}%`;

// Read-only fee overview for active students in active batches (existing FeeStatus data).
const FeeDashboard = () => {
  const batches = useActiveBatches();
  const [batchId, setBatchId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    fetchFeeAnalytics('/dashboard', batchId).then(setData).catch((e) => setError(e.message));
  }, [batchId]);

  const k = data && data.kpis;
  const notYetDue = k ? Math.max(0, k.outstanding - k.overdue) : 0;
  const session = data && data.session;
  const maxMonth = session ? Math.max(1, ...session.months.map((m) => m.amount)) : 1;

  const exportClasses = () => downloadCsv(
    `class-wise-fee-summary-${data.as_of}.csv`,
    ['Class', 'Students', 'Total', 'Collected', 'Outstanding', 'Collection %'],
    [
      ...data.batches.map((b) => [b.batch_name, b.students, b.total, b.collected, b.outstanding, b.collected_pct]),
      ['TOTAL', k.students, k.total, k.collected, k.outstanding, k.collected_pct],
    ],
  );

  const exportMonthly = () => downloadCsv(
    `monthly-collection-${session.label}.csv`,
    ['Month', 'Actual collection', 'Payments'],
    [...session.months.map((m) => [`${monthName(m.month)} ${m.month.slice(0, 4)}`, m.amount, m.payments]), ['Total', session.total, '']],
  );

  return (
    <div className="bg-gray-50 min-h-screen p-3 md:p-6 text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
      <div className="flex flex-wrap justify-between items-end gap-4 mb-5">
        <div>
          <h1 className="text-2xl md:text-[26px] font-bold">Fee Dashboard</h1>
          <p className="text-sm text-gray-600">
            {batchId ? (batches.find((b) => String(b.batch_id) === String(batchId)) || {}).batch_name : `${batches.length} active batch${batches.length === 1 ? '' : 'es'}`}
            {k && ` · ${students(k.students)} (active only)`}
            {data && ` · as of ${formatDate(data.as_of)}`}
          </p>
        </div>
        <BatchSelect batches={batches} value={batchId} onChange={setBatchId} />
      </div>

      {error && <ErrorBox error={error} />}
      {!data && !error && <Loading />}

      {k && (
        <div className="flex flex-col gap-5">
          {/* 1. Fee Analytics */}
          <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-3">
            <Kpi label="Total Annual Fee Demand" value={inrShort(k.total)} note={`${students(k.students)}`} big />
            <Kpi label="Collected Till Date" value={inrShort(k.collected)} note={`${pct(k.collected_pct)} of demand`} color="text-green-700" big />
            <Kpi label="Outstanding Fee" value={inrShort(k.outstanding)} note={`${students(k.students_owing)} with dues`} color="text-orange-700" big />
          </div>

          <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-3">
            <Kpi label="Overdue" value={inrShort(k.overdue)} note={`${students(k.overdue_students)} past next due date`} color="text-orange-700" />
            <Kpi label="Not yet due" value={inrShort(notYetDue)} note={`${students(k.students_owing - k.overdue_students)} · due later or no date`} />
            <Kpi label="Paid in full" value={`${k.paid_in_full} of ${k.students}`} note="students with nothing left to pay" />
          </div>

          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))' }}>
            {/* 2. Monthly Analytics */}
            <Card
              title="Monthly Analytics"
              subtitle={`Actual collection, session ${session.label} (Apr–Mar)`}
              right={<ExportButton onClick={exportMonthly} />}
            >
              <div className="flex flex-col">
                {session.months.map((m) => (
                  <div key={m.month} className="grid gap-3 items-center py-1.5 border-t border-gray-100 first:border-t-0 text-sm" style={{ gridTemplateColumns: '64px minmax(0,1fr) 96px' }}>
                    <span className="font-semibold">{monthName(m.month)} <span className="text-xs font-normal text-gray-500">{m.month.slice(2, 4)}</span></span>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-3 bg-green-600 rounded-full" style={{ width: `${(m.amount / maxMonth) * 100}%` }} />
                    </div>
                    <span className={`text-right ${m.future ? 'text-gray-400' : 'font-bold'}`}>{m.future ? '—' : inrShort(m.amount)}</span>
                  </div>
                ))}
                <div className="grid gap-3 items-center pt-2.5 mt-1 border-t-2 border-gray-300 text-sm font-bold" style={{ gridTemplateColumns: '64px minmax(0,1fr) 96px' }}>
                  <span>Total</span><span /><span className="text-right">{inrShort(session.total)}</span>
                </div>
              </div>
            </Card>

            {/* 3. Class-wise Fee Flow Summary */}
            <Card title="Class-wise Fee Flow Summary" right={<ExportButton onClick={exportClasses} />}>
              <div className="overflow-x-auto border border-gray-100 rounded-lg">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                    <tr className="text-right">
                      <th scope="col" className="text-left px-2.5 py-3">Class</th>
                      <th scope="col" className="px-2.5 py-3">Students</th>
                      <th scope="col" className="px-2.5 py-3">Total</th>
                      <th scope="col" className="px-2.5 py-3">Collected</th>
                      <th scope="col" className="px-2.5 py-3">Outstanding</th>
                      <th scope="col" className="px-2.5 py-3">Collection %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.batches.map((b) => (
                      <tr key={b.batch_id} className="border-t border-gray-100 text-right">
                        <th scope="row" className="text-left px-2.5 py-2.5 font-semibold">{b.batch_name}</th>
                        <td className="whitespace-nowrap px-2.5 py-2.5">{b.students}</td>
                        <td className="whitespace-nowrap px-2.5 py-2.5">{inrShort(b.total)}</td>
                        <td className="whitespace-nowrap px-2.5 py-2.5 text-green-700 font-semibold">{inrShort(b.collected)}</td>
                        <td className="whitespace-nowrap px-2.5 py-2.5 text-orange-700 font-semibold">{inrShort(b.outstanding)}</td>
                        <td className="whitespace-nowrap px-2.5 py-2.5 font-bold">{pct(b.collected_pct)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-300 text-right font-bold bg-gray-50">
                      <th scope="row" className="text-left px-2.5 py-3">TOTAL</th>
                      <td className="whitespace-nowrap px-2.5 py-3">{k.students}</td>
                      <td className="whitespace-nowrap px-2.5 py-3">{inrShort(k.total)}</td>
                      <td className="whitespace-nowrap px-2.5 py-3 text-green-700">{inrShort(k.collected)}</td>
                      <td className="whitespace-nowrap px-2.5 py-3 text-orange-700">{inrShort(k.outstanding)}</td>
                      <td className="whitespace-nowrap px-2.5 py-3">{pct(k.collected_pct)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

const Kpi = ({ label, value, note, color = 'text-gray-900', big = false }) => (
  <div className={`bg-white border rounded-xl px-4 py-4 shadow-sm ${big ? 'border-gray-300' : 'border-gray-200'}`}>
    <p className="text-[13px] font-semibold text-gray-600">{label}</p>
    <p className={`${big ? 'text-[28px]' : 'text-[24px]'} font-bold mt-1 ${color}`}>{value}</p>
    <p className="text-xs text-gray-600 mt-1">{note}</p>
  </div>
);

const ExportButton = ({ onClick }) => (
  <button type="button" onClick={onClick} className="min-h-[34px] px-3 rounded-lg border border-gray-300 bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50">
    Export CSV
  </button>
);

export default FeeDashboard;
