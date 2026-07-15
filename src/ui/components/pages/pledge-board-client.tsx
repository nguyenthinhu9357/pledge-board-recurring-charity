'use client';

import {
  CircleCheckBig,
  CircleDot,
  Clock,
  HeartHandshake,
  Loader2,
  PauseCircle,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';

export type PledgeCardData = {
  id: string;
  donorName: string;
  charityId: string;
  monthlyAmountUsdc: string;
  bondAmount: string;
  cadence: string;
  nextDue: string;
  fulfillmentCount: number;
  status: string;
  createdAt: string;
};

const VND_PER_USDC = 26_000;

function usdcToVnd(usdcStr: string): string {
  const usdc = Number.parseFloat(usdcStr);
  if (Number.isNaN(usdc)) return '0 ₫';
  return `${Math.round(usdc * VND_PER_USDC).toLocaleString('vi-VN')} ₫`;
}

type PledgeState = 'overdue' | 'due-soon' | 'on-track' | 'paused' | 'cancelled';

function deriveState(p: PledgeCardData, justFulfilled: boolean): PledgeState {
  if (p.status === 'paused') return 'paused';
  if (p.status === 'cancelled') return 'cancelled';
  if (justFulfilled) return 'on-track';
  const due = new Date(p.nextDue).getTime();
  const now = Date.now();
  if (due < now) return 'overdue';
  if (due - now < 2 * 24 * 60 * 60 * 1000) return 'due-soon';
  return 'on-track';
}

const STATE_META: Record<PledgeState, { label: string; badge: string; Icon: typeof CircleDot }> = {
  overdue: { label: 'Overdue', badge: 'bg-red-100 text-red-700 border-red-200', Icon: Clock },
  'due-soon': {
    label: 'Due soon',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    Icon: Clock,
  },
  'on-track': {
    label: 'On track',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Icon: CircleDot,
  },
  paused: {
    label: 'Paused',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    Icon: PauseCircle,
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-slate-100 text-slate-500 border-slate-200',
    Icon: XCircle,
  },
};

export function PledgeBoardClient({
  pledges,
  charityId,
  initialRate,
}: {
  pledges: PledgeCardData[];
  charityId?: string;
  initialRate?: number;
}) {
  const [rows, setRows] = useState<PledgeCardData[]>(pledges);
  const [fulfilledIds, setFulfilledIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live fulfillment rate: fulfilled cycles vs active pledges (capped at 100%)
  const rate = useMemo(() => {
    const active = rows.filter((p) => p.status === 'active');
    if (active.length === 0) return initialRate ?? 0;
    const totalCycles = active.reduce((acc, p) => acc + p.fulfillmentCount, 0);
    const expected = active.length * 2;
    const pct = expected > 0 ? Math.round((totalCycles / expected) * 100) : 0;
    return Math.min(pct, 100);
  }, [rows, initialRate]);

  async function fulfill(p: PledgeCardData) {
    setBusyId(p.id);
    setError(null);
    try {
      const cycle = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const res = await fetch('/api/fulfillments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pledgeId: p.id,
          amountUsdc: p.monthlyAmountUsdc,
          txHash: `demo${Math.random().toString(16).slice(2, 14)}`,
          cycleLabel: cycle,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'Fulfillment failed');

      // Optimistic live update: bump count, advance due date, flip badge.
      setRows((prev) =>
        prev.map((row) =>
          row.id === p.id
            ? {
                ...row,
                fulfillmentCount: row.fulfillmentCount + 1,
                nextDue: new Date(
                  new Date(row.nextDue).setMonth(new Date(row.nextDue).getMonth() + 1),
                ).toISOString(),
              }
            : row,
        ),
      );
      setFulfilledIds((prev) => new Set(prev).add(p.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fulfillment failed');
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div
        className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50 p-12 text-center"
        data-testid="empty-state"
      >
        <HeartHandshake className="w-10 h-10 text-purple-400 mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">No pledges on the board yet</h3>
        <p className="text-slate-600 max-w-md mx-auto">
          Be the first to make a public commitment. Bond a small USDC deposit and choose a giving
          cadence — your pledge will appear here for the whole community to see.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Live fulfillment rate banner — the wow counter */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white p-5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6" aria-hidden="true" />
          <div>
            <div className="text-sm text-purple-100">Community fulfillment rate (live)</div>
            <div className="text-xs text-purple-200">Updates the instant a gift settles</div>
          </div>
        </div>
        <div className="text-4xl font-bold tabular-nums" data-testid="live-rate">
          {rate}%
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <h2 className="text-xl font-bold text-slate-900 mb-4">Pledge board</h2>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        data-testid="pledge-grid"
      >
        {rows.map((p) => {
          const just = fulfilledIds.has(p.id);
          const state = deriveState(p, just);
          const meta = STATE_META[state];
          const canFulfill = p.status === 'active';
          return (
            <article
              key={p.id}
              className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm flex flex-col"
              data-testid="pledge-card"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-slate-900">{p.donorName}</div>
                  <div className="text-xs text-slate-500 capitalize">{p.cadence} giving</div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.badge}`}
                  data-testid="status-badge"
                >
                  <meta.Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  {meta.label}
                </span>
              </div>

              <div className="mb-1">
                <span className="text-2xl font-bold text-slate-900">
                  USDC {Number.parseFloat(p.monthlyAmountUsdc).toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-purple-700 font-semibold mb-4">
                ≈ {usdcToVnd(p.monthlyAmountUsdc)} / cycle
              </div>

              <div className="text-xs text-slate-500 space-y-1 mb-4">
                <div>
                  Cycles fulfilled:{' '}
                  <span className="font-semibold text-slate-700" data-testid="fulfill-count">
                    {p.fulfillmentCount}
                  </span>
                </div>
                <div>
                  Bond locked:{' '}
                  <span className="font-semibold text-slate-700">USDC {p.bondAmount}</span>
                </div>
                <div>Next due: {new Date(p.nextDue).toLocaleDateString('en-GB')}</div>
              </div>

              {canFulfill ? (
                <button
                  type="button"
                  onClick={() => fulfill(p)}
                  disabled={busyId === p.id}
                  className="mt-auto inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-purple-600 text-white font-semibold text-base hover:bg-purple-700 disabled:opacity-60 transition-colors"
                  data-testid="fulfill-btn"
                >
                  {busyId === p.id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                      Settling…
                    </>
                  ) : just ? (
                    <>
                      <CircleCheckBig className="w-5 h-5" aria-hidden="true" />
                      Give again
                    </>
                  ) : (
                    <>
                      <HeartHandshake className="w-5 h-5" aria-hidden="true" />
                      Fulfill now
                    </>
                  )}
                </button>
              ) : (
                <div className="mt-auto h-11 inline-flex items-center justify-center text-sm text-slate-500 font-medium">
                  {p.status === 'paused' ? 'Pledge paused' : 'Pledge cancelled'}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p className="sr-only" data-charity-id={charityId}>
        Pledge board for charity {charityId}
      </p>
    </div>
  );
}
