'use client';

import { CircleCheckBig, Copy, HeartHandshake, Loader2, QrCode as QrIcon } from 'lucide-react';
import QRCode from 'qrcode';
import { useState } from 'react';

const VND_PER_USDC = 26_000;

function vnd(usdc: string): string {
  const n = Number.parseFloat(usdc);
  if (Number.isNaN(n)) return '0 ₫';
  return `${Math.round(n * VND_PER_USDC).toLocaleString('vi-VN')} ₫`;
}

type Created = {
  pledgeId: string;
  sep7Uri: string;
  muxedAddress: string;
  qrDataUrl: string;
};

export function NewPledgeForm({ charities }: { charities: Array<{ id: string; name: string }> }) {
  const [donorName, setDonorName] = useState('');
  const [charityId, setCharityId] = useState(charities[0]?.id ?? '');
  const [amount, setAmount] = useState('30.00');
  const [bond, setBond] = useState('5.00');
  const [cadence, setCadence] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (donorName.trim().length < 2) {
      setError('Please enter your name (at least 2 characters).');
      return;
    }
    if (!charityId) {
      setError('Please choose a charity.');
      return;
    }
    if (!/^\d+(\.\d{1,7})?$/.test(amount) || Number.parseFloat(amount) <= 0) {
      setError('Enter a valid monthly amount greater than zero.');
      return;
    }
    setBusy(true);
    try {
      const nextDue = new Date();
      nextDue.setMonth(nextDue.getMonth() + 1);
      const res = await fetch('/api/pledges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorName: donorName.trim(),
          charityId,
          monthlyAmountUsdc: amount,
          bondAmount: bond || '0',
          cadence,
          nextDue: nextDue.toISOString(),
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'Could not create pledge');
      const pledgeId = json.data.id as string;

      // Fetch the pre-filled SEP-7 URI for this pledge.
      const detailRes = await fetch(`/api/pledges/${pledgeId}`);
      const detailJson = await detailRes.json();
      if (!detailJson.ok) throw new Error(detailJson.error?.message ?? 'Could not load SEP-7 URI');
      const sep7Uri = detailJson.data.sep7Uri as string;
      const muxedAddress = detailJson.data.muxedAddress as string;
      const qrDataUrl = await QRCode.toDataURL(sep7Uri, { width: 240, margin: 1 });

      setCreated({ pledgeId, sep7Uri, muxedAddress, qrDataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div
        className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm"
        data-testid="pledge-success"
      >
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-lg mb-2">
          <CircleCheckBig className="w-6 h-6" aria-hidden="true" />
          Pledge recorded on the board
        </div>
        <p className="text-slate-600 mb-6">
          Scan this SEP-7 QR with your Stellar wallet to fulfill the first cycle. USDC settles to
          the charity&rsquo;s muxed account for clean attribution.
        </p>
        <div className="flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={created.qrDataUrl}
            alt="SEP-7 payment QR code"
            className="rounded-xl border border-purple-100"
            width={240}
            height={240}
          />
          <div className="w-full">
            <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
              <QrIcon className="w-4 h-4" aria-hidden="true" /> SEP-7 payment URI
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-purple-50 text-purple-900 rounded-lg px-3 py-2 break-all">
                {created.sep7Uri}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(created.sep7Uri);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="inline-flex items-center justify-center h-11 w-11 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                aria-label="Copy SEP-7 URI"
              >
                <Copy className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            {copied && <p className="text-xs text-emerald-600 mt-1">Copied to clipboard</p>}
          </div>
          <a
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-purple-600 text-white font-bold text-base hover:bg-purple-700"
          >
            <HeartHandshake className="w-5 h-5" aria-hidden="true" />
            View it on the board
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-purple-100 bg-white p-8 shadow-sm space-y-5"
      data-testid="pledge-form"
    >
      {error && (
        <div
          className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm"
          data-testid="form-error"
        >
          {error}
        </div>
      )}

      <Field label="Your name">
        <input
          type="text"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          placeholder="e.g. Nguyen Thi Lan"
          className="w-full h-11 rounded-lg border border-purple-200 px-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
          data-testid="input-name"
        />
      </Field>

      <Field label="Charity">
        <select
          value={charityId}
          onChange={(e) => setCharityId(e.target.value)}
          className="w-full h-11 rounded-lg border border-purple-200 px-3 text-base text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          data-testid="input-charity"
        >
          {charities.length === 0 && <option value="">No charities seeded</option>}
          {charities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Amount per cycle (USDC)">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-11 rounded-lg border border-purple-200 px-3 text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            data-testid="input-amount"
          />
          <p className="text-xs text-purple-600 font-semibold mt-1">≈ {vnd(amount)}</p>
        </Field>
        <Field label="Bond deposit (USDC)">
          <input
            type="text"
            inputMode="decimal"
            value={bond}
            onChange={(e) => setBond(e.target.value)}
            className="w-full h-11 rounded-lg border border-purple-200 px-3 text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            data-testid="input-bond"
          />
        </Field>
      </div>

      <Field label="Giving cadence">
        <div className="grid grid-cols-3 gap-2">
          {(['monthly', 'quarterly', 'annual'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCadence(c)}
              className={`h-11 rounded-lg text-base font-semibold capitalize border transition-colors ${
                cadence === c
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Field>

      <button
        type="submit"
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-purple-600 text-white font-bold text-base hover:bg-purple-700 disabled:opacity-60 transition-colors"
        data-testid="submit-pledge"
      >
        {busy ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            Registering pledge…
          </>
        ) : (
          <>
            <HeartHandshake className="w-5 h-5" aria-hidden="true" />
            Pledge &amp; get SEP-7 QR
          </>
        )}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
