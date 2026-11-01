import React, { useEffect, useState } from 'react';
import {
  fetchFeeAnalytics, useActiveBatches, BatchSelect, Card, Loading, ErrorBox,
  inrShort, formatDate, monthLabel, downloadCsv, students,
} from './feeAnalyticsShared';

// Read-only overview of the existing fee data (FeeStatus and payment records)
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
  const thisMonth = data ? monthLabel(data.as_of.slice(0, 7)) : '';
  const maxMonth = data ? Math.max(1, ...data.monthly.map((m) => m.amount)) : 1;
  const maxInst = data ? Math.max(1, ...data.installments.map((i) => i.amount)) : 1;

  const exportBatches = () => downloadCsv(
    `fee-batch-summary-${data.as_of}.csv`,
    ['Batch', 'Students', 'Total fee', 'Collected', 'Outstanding', 'Overdue', 'Overdue students', 'Paid in full', '% collected'],
    data.batches.map((b) => [b.batch_name, b.students, b.total, b.collected, b.outstanding, b.overdue, b.overdue_students, b.paid_in_full, b.collected_pct]),
  );

  return (
    <div className="bg-gray-50 min-h-screen p-3 md:p-6 text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
      <div className="flex flex-wrap justify-between items-end gap-4 mb-5">
        <div>
          <h1 className="text-2xl md:text-[26px] font-bold">Fee Dashboard</h1>
          <p className="text-sm text-gray-600">
            {batchId ? (batches.find((b) => String(b.batch_id) === String(batchId)) || {}).batch_name : `${batches.length} active batch${batches.length === 1 ? '' : 'es'}`}
            {data && ` · as of ${formatDate(data.as_of)}`}
          </p>
        </div>
        <BatchSelect batches={batches} value={batchId} onChange={setBatchId} />
      </div>

      {error && <ErrorBox error={error} />}
      {!data && !error && <Loading />}

      {k && (
        <div className="flex flex-col gap-5">
          <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <Kpi label="Total fee" value={inrShort(k.total)} note={students(k.students)} />
            <Kpi label="Collected" value={inrShort(k.collected)} note={`${k.collected_pct}% of total fee`} color="text-blue-700" />
            <Kpi label="Outstanding" value={inrShort(k.outstanding)} note={`${students(k.students_owing)} still owe`} />
            <Kpi label="Overdue" value={inrShort(k.overdue)} note={`${students(k.overdue_students)} past next due date`} color="text-orange-700" />
            <Kpi label="Paid in full" value={`${k.paid_in_full} of ${k.students}`} note={`${k.students ? Math.round((k.paid_in_full / k.students) * 100) : 0}% of students`} />
            <Kpi label={`Collected in ${thisMonth}`} value={inrShort(k.collected_this_month)} note={`${k.payments_this_month} payments · last month ${inrShort(k.collected_last_month)}`} />
          </div>

          <Card title="Collected vs outstanding" right={<span className="text-[13px] text-gray-600">{inrShort(k.collected)} of {inrShort(k.total)} collected</span>}>
            <div className="flex h-[18px] rounded-full overflow-hidden bg-gray-100">
              <div className="bg-blue-600" style={{ width: `${k.total ? (k.collected / k.total) * 100 : 0}%` }} />
              <div className="bg-orange-600" style={{ width: `${k.total ? (k.overdue / k.total) * 100 : 0}%` }} />
              <div className="flex-1 bg-orange-300" />
            </div>
            <div className="flex flex-wrap gap-5 text-[13px] text-gray-700">
              <Legend color="bg-blue-600" label={`Collected ${inrShort(k.collected)}`} />
              <Legend color="bg-orange-600" label={`Overdue ${inrShort(k.overdue)}`} />
              <Legend color="bg-orange-300" label={`Not yet due / no date ${inrShort(Math.max(0, k.outstanding - k.overdue))}`} />
            </div>
          </Card>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))' }}>
            <Card title="Monthly collection" subtitle="From payment dates in Fee Records">
              <div className="overflow-x-auto">
                <div
                  role="img"
                  aria-label="Monthly fee collection bar chart"
                  className="grid gap-2 items-end h-[230px] border-b border-gray-300 min-w-[420px]"
                  style={{ gridTemplateColumns: `repeat(${data.monthly.length}, minmax(0, 1fr))` }}
                >
                  {data.monthly.map((m, i) => (
                    <div key={m.month} className="flex flex-col items-center justify-end gap-1 h-full" title={`${monthLabel(m.month)}: ${inrShort(m.amount)} (${m.payments} payments)`}>
                      <span className="text-[11px] font-semibold text-gray-700">{m.amount ? inrShort(m.amount).replace('₹', '') : ''}</span>
                      <div
                        className={`w-[70%] max-w-[36px] rounded-t ${i === data.monthly.length - 1 ? 'bg-blue-700' : 'bg-blue-300'}`}
                        style={{ height: `${Math.max(m.amount ? 3 : 0, Math.round((m.amount / maxMonth) * 190))}px` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid gap-2 mt-1.5 min-w-[420px]" style={{ gridTemplateColumns: `repeat(${data.monthly.length}, minmax(0, 1fr))` }}>
                  {data.monthly.map((m) => <span key={m.month} className="text-center text-xs text-gray-600">{monthLabel(m.month)}</span>)}
                </div>
              </div>
            </Card>

            <Card title="Collected by installment" subtitle="Grouped by payment title">
              {data.installments.length === 0 && <p className="text-sm text-gray-600">No payments recorded yet.</p>}
              {data.installments.map((i) => (
                <div key={i.name} className="grid gap-3 items-center text-sm" style={{ gridTemplateColumns: '130px minmax(0,1fr) 80px 96px' }}>
                  <span className="font-semibold">{i.name}</span>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-3 bg-blue-600 rounded-full" style={{ width: `${Math.max(1, (i.amount / maxInst) * 100)}%` }} />
                  </div>
                  <span className="text-right font-bold">{inrShort(i.amount)}</span>
                  <span className="text-right text-xs text-gray-600">{i.payments} payments</span>
                </div>
              ))}
              {data.charges.length > 0 && (
                <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                  <span className="text-[13px] font-bold">Charges billed (Other charges)</span>
                  {data.charges.map((c) => (
                    <div key={c.name} className="flex justify-between text-[13px]">
                      <span className="text-gray-700">{c.name} <span className="text-gray-500">· {c.count}</span></span>
                      <span className="font-semibold">{inrShort(c.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card
            title="Batch-wise summary"
            right={(
              <button type="button" onClick={exportBatches} className="min-h-[38px] px-3.5 rounded-lg border border-gray-300 bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50">
                Export CSV
              </button>
            )}
          >
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                  <tr className="text-right">
                    <th scope="col" className="text-left px-3.5 py-3">Batch</th>
                    <th scope="col" className="px-3.5 py-3">Students</th>
                    <th scope="col" className="px-3.5 py-3">Total fee</th>
                    <th scope="col" className="px-3.5 py-3">Collected</th>
                    <th scope="col" className="px-3.5 py-3">Outstanding</th>
                    <th scope="col" className="px-3.5 py-3">Overdue</th>
                    <th scope="col" className="px-3.5 py-3">Paid in full</th>
                    <th scope="col" className="text-left px-3.5 py-3 w-48">% collected</th>
                  </tr>
                </thead>
                <tbody>
                  {data.batches.map((b) => (
                    <tr key={b.batch_id} className="border-t border-gray-100 text-right">
                      <th scope="row" className="text-left px-3.5 py-2.5 font-semibold">{b.batch_name}</th>
                      <td className="px-3.5 py-2.5">{b.students}</td>
                      <td className="px-3.5 py-2.5">{inrShort(b.total)}</td>
                      <td className="px-3.5 py-2.5">{inrShort(b.collected)}</td>
                      <td className="px-3.5 py-2.5">{inrShort(b.outstanding)}</td>
                      <td className="px-3.5 py-2.5 text-orange-700 font-semibold">
                        {inrShort(b.overdue)} <span className="font-normal text-gray-600 text-xs">({b.overdue_students})</span>
                      </td>
                      <td className="px-3.5 py-2.5">{b.paid_in_full}</td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-2 bg-blue-600" style={{ width: `${b.collected_pct}%` }} />
                          </div>
                          <span className="w-12 text-right font-bold">{b.collected_pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.batches.length > 1 && (
                    <tr className="border-t-2 border-gray-300 text-right font-bold bg-gray-50">
                      <th scope="row" className="text-left px-3.5 py-3">Total</th>
                      <td className="px-3.5 py-3">{k.students}</td>
                      <td className="px-3.5 py-3">{inrShort(k.total)}</td>
                      <td className="px-3.5 py-3">{inrShort(k.collected)}</td>
                      <td className="px-3.5 py-3">{inrShort(k.outstanding)}</td>
                      <td className="px-3.5 py-3 text-orange-700">{inrShort(k.overdue)} <span className="font-normal text-gray-600 text-xs">({k.overdue_students})</span></td>
                      <td className="px-3.5 py-3">{k.paid_in_full}</td>
                      <td className="px-3.5 py-3 text-left">{k.collected_pct}%</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const Kpi = ({ label, value, note, color = 'text-gray-900' }) => (
  <div className="bg-white border border-gray-200 rounded-xl px-4 py-4 shadow-sm">
    <p className="text-[13px] font-semibold text-gray-600">{label}</p>
    <p className={`text-[26px] font-bold mt-1 ${color}`}>{value}</p>
    <p className="text-xs text-gray-600 mt-1">{note}</p>
  </div>
);

const Legend = ({ color, label }) => (
  <span className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-sm ${color}`} />{label}</span>
);

export default FeeDashboard;
