import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';

// Shared helpers for the read-only Fee Dashboard and Collections pages

export async function fetchFeeAnalytics(path, batchId) {
  const qs = batchId ? `?batch_id=${encodeURIComponent(batchId)}` : '';
  const res = await fetch(`${API_BASE}/api/fee-analytics${path}${qs}`);
  if (!res.ok) throw new Error(`Could not load fee data (${res.status})`);
  return res.json();
}

export const students = (n) => `${n} student${n === 1 ? '' : 's'}`;

export const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

// ₹2.13 Cr / ₹68.6 L / ₹94,000
export function inrShort(n) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)} L`;
  return inr(v);
}

export function formatDate(d) {
  if (!d) return '—';
  return new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

export function downloadCsv(filename, header, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useActiveBatches() {
  const [batches, setBatches] = useState([]);
  useEffect(() => {
    fetchFeeAnalytics('/batches').then(setBatches).catch(() => setBatches([]));
  }, []);
  return batches;
}

export const BatchSelect = ({ batches, value, onChange }) => (
  <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
    Batch
    <select
      className="min-h-[38px] px-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">All active batches</option>
      {batches.map((b) => <option key={b.batch_id} value={b.batch_id}>{b.batch_name}</option>)}
    </select>
  </label>
);

export const Card = ({ title, subtitle, right, children }) => (
  <section className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3.5">
    {(title || right) && (
      <div className="flex flex-wrap justify-between items-start gap-2">
        <div>
          <h2 className="text-[17px] font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-[13px] text-gray-600">{subtitle}</p>}
        </div>
        {right}
      </div>
    )}
    {children}
  </section>
);

export const Loading = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
  </div>
);

export const ErrorBox = ({ error }) => (
  <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg">{error}</div>
);
