import React, { useEffect, useState } from 'react';
import {
  fetchFeeAnalytics, useActiveBatches, BatchSelect, Card, Loading, ErrorBox,
  inrShort, formatDate, downloadCsv, students,
} from './feeAnalyticsShared';

// Read-only overview of fee still to be collected (existing FeeStatus data).
// Shows only the amount left to collect; total fee and collected amounts are not shown.
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
  const maxBatch = data ? Math.max(1, ...data.batches.map((b) => b.outstanding)) : 1;

  const exportBatches = () => downloadCsv(
    `fee-left-by-batch-${data.as_of}.csv`,
    ['Batch', 'Students', 'Students with dues', 'Left to collect', 'Overdue', 'Overdue students', 'Not yet due', 'Paid in full'],
    data.batches.map((b) => [
      b.batch_name, b.students, b.students - b.paid_in_full, b.outstanding, b.overdue, b.overdue_students,
      Math.max(0, b.outstanding - b.overdue), b.paid_in_full,
    ]),
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
            <Kpi label="Left to collect" value={inrShort(k.outstanding)} note={`${students(k.students_owing)} with dues`} />
            <Kpi label="Overdue" value={inrShort(k.overdue)} note={`${students(k.overdue_students)} past next due date`} color="text-orange-700" />
            <Kpi label="Not yet due" value={inrShort(notYetDue)} note={`${students(k.students_owing - k.overdue_students)} · due later or no date`} />
            <Kpi label="Paid in full" value={`${k.paid_in_full} of ${k.students}`} note="students with nothing left to pay" />
          </div>

          <Card title="Left to collect" right={<span className="text-[13px] text-gray-600">{inrShort(k.outstanding)} in total</span>}>
            <div className="flex h-[18px] rounded-full overflow-hidden bg-gray-100">
              <div className="bg-orange-600" style={{ width: `${k.outstanding ? (k.overdue / k.outstanding) * 100 : 0}%` }} />
              <div className="flex-1 bg-orange-300" />
            </div>
            <div className="flex flex-wrap gap-5 text-[13px] text-gray-700">
              <Legend color="bg-orange-600" label={`Overdue ${inrShort(k.overdue)}`} />
              <Legend color="bg-orange-300" label={`Not yet due / no date ${inrShort(notYetDue)}`} />
            </div>
          </Card>

          <Card title="Left to collect by batch" subtitle="Darker part is overdue">
            {data.batches.map((b) => (
              <div key={b.batch_id} className="grid gap-3 items-center text-sm" style={{ gridTemplateColumns: 'minmax(140px, 200px) minmax(0,1fr) 84px' }}>
                <span className="font-semibold">{b.batch_name}</span>
                <div className="h-3.5 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-3.5 bg-orange-600" style={{ width: `${(b.overdue / maxBatch) * 100}%` }} />
                  <div className="h-3.5 bg-orange-300" style={{ width: `${(Math.max(0, b.outstanding - b.overdue) / maxBatch) * 100}%` }} />
                </div>
                <span className="text-right font-bold">{inrShort(b.outstanding)}</span>
              </div>
            ))}
          </Card>

          <Card
            title="Batch-wise summary"
            right={(
              <button type="button" onClick={exportBatches} className="min-h-[38px] px-3.5 rounded-lg border border-gray-300 bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50">
                Export CSV
              </button>
            )}
          >
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                  <tr className="text-right">
                    <th scope="col" className="text-left px-3.5 py-3">Batch</th>
                    <th scope="col" className="px-3.5 py-3">Students</th>
                    <th scope="col" className="px-3.5 py-3">With dues</th>
                    <th scope="col" className="px-3.5 py-3">Left to collect</th>
                    <th scope="col" className="px-3.5 py-3">Overdue</th>
                    <th scope="col" className="px-3.5 py-3">Not yet due</th>
                    <th scope="col" className="px-3.5 py-3">Paid in full</th>
                  </tr>
                </thead>
                <tbody>
                  {data.batches.map((b) => (
                    <tr key={b.batch_id} className="border-t border-gray-100 text-right">
                      <th scope="row" className="text-left px-3.5 py-2.5 font-semibold">{b.batch_name}</th>
                      <td className="px-3.5 py-2.5">{b.students}</td>
                      <td className="px-3.5 py-2.5">{b.students - b.paid_in_full}</td>
                      <td className="px-3.5 py-2.5 font-bold">{inrShort(b.outstanding)}</td>
                      <td className="px-3.5 py-2.5 text-orange-700 font-semibold">
                        {inrShort(b.overdue)} <span className="font-normal text-gray-600 text-xs">({b.overdue_students})</span>
                      </td>
                      <td className="px-3.5 py-2.5">{inrShort(Math.max(0, b.outstanding - b.overdue))}</td>
                      <td className="px-3.5 py-2.5">{b.paid_in_full}</td>
                    </tr>
                  ))}
                  {data.batches.length > 1 && (
                    <tr className="border-t-2 border-gray-300 text-right font-bold bg-gray-50">
                      <th scope="row" className="text-left px-3.5 py-3">Total</th>
                      <td className="px-3.5 py-3">{k.students}</td>
                      <td className="px-3.5 py-3">{k.students_owing}</td>
                      <td className="px-3.5 py-3">{inrShort(k.outstanding)}</td>
                      <td className="px-3.5 py-3 text-orange-700">{inrShort(k.overdue)} <span className="font-normal text-gray-600 text-xs">({k.overdue_students})</span></td>
                      <td className="px-3.5 py-3">{inrShort(notYetDue)}</td>
                      <td className="px-3.5 py-3">{k.paid_in_full}</td>
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
