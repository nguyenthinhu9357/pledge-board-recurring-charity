'use client';

import { Activity, Radio } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type FeedEvent = {
  id: string;
  eventType: string;
  amount: string;
  txHash: string;
  createdAt: string;
};

export function LiveEventFeed({ charityId }: { charityId: string }) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [live, setLive] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const controller = new AbortController();

    async function run() {
      try {
        const res = await fetch(`/api/horizon-events?charityId=${charityId}&stream=1`, {
          signal: controller.signal,
        });
        if (!res.body) return;
        setLive(true);
        // Manual SSE parsing over a ReadableStream (no sdk .stream()).
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';
          for (const part of parts) {
            const line = part.split('\n').find((l) => l.startsWith('data: '));
            if (!line) continue;
            try {
              const evt = JSON.parse(line.slice(6)) as FeedEvent;
              setEvents((prev) => [evt, ...prev].slice(0, 8));
            } catch {
              // ignore malformed chunk
            }
          }
        }
      } catch {
        setLive(false);
      }
    }
    run();
    return () => controller.abort();
  }, [charityId]);

  return (
    <section className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Radio
          className={`w-5 h-5 ${live ? 'text-emerald-500' : 'text-slate-400'}`}
          aria-hidden="true"
        />
        <h2 className="text-lg font-bold text-slate-900">Horizon live feed</h2>
        <span
          className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
            live ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {live ? 'streaming' : 'connecting…'}
        </span>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-slate-500">
          Waiting for on-chain activity. Settlement and heartbeat events from Stellar Horizon appear
          here in real time via server-sent events.
        </p>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-3 text-sm border-b border-purple-50 pb-2 last:border-0"
            >
              <Activity className="w-4 h-4 text-purple-500 flex-shrink-0" aria-hidden="true" />
              <span className="font-medium text-slate-700 capitalize">{e.eventType}</span>
              {Number.parseFloat(e.amount) > 0 && (
                <span className="text-purple-700 font-semibold">USDC {e.amount}</span>
              )}
              <span className="ml-auto text-xs text-slate-400">
                {new Date(e.createdAt).toLocaleTimeString('en-GB')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
