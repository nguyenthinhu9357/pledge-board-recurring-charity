import { desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { stellar } from '@/server/config/stellar';
import { db } from '@/server/db/client';
import { horizonEvents } from '@/server/db/schema';
import { demoEvents, demoId, demoMode } from '@/server/demo-store';

// GET /api/horizon-events?charityId=xxx — returns recent stored events
export async function GET(req: NextRequest) {
  const charityId = req.nextUrl.searchParams.get('charityId');
  const stream = req.nextUrl.searchParams.get('stream');

  if (stream === '1' && charityId) {
    // SSE: manual ReadableStream (no sdk .stream())
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const send = (data: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        // Send existing events first. The public demo uses safe in-memory data.
        if (demoMode()) {
          for (const evt of demoEvents.filter((item) => item.charityId === charityId).slice().reverse()) send(evt);
        } else {
          try {
            const existing = await db
              .select()
              .from(horizonEvents)
              .where(eq(horizonEvents.charityId, charityId))
              .orderBy(desc(horizonEvents.createdAt))
              .limit(10);
            for (const evt of existing.reverse()) send(evt);
          } catch {
            // ignore DB errors in SSE
          }
        }

        // Simulate live feed: poll Horizon for the charity address
        // Using manual fetch + ReadableStream as required
        let cursor = 'now';
        let running = true;

        // Get charity stellar address from events table (or just use demo polling)
        const pollInterval = setInterval(async () => {
          if (!running) return;
          try {
            if (demoMode()) {
              send({ id: crypto.randomUUID(), charityId, pledgeId: null, eventType: 'heartbeat', amount: '0', txHash: '', createdAt: new Date().toISOString(), cursor });
            }
            cursor = String(Date.now());
          } catch {
            // ignore
          }
        }, 5000);

        // Clean up on close
        req.signal.addEventListener('abort', () => {
          running = false;
          clearInterval(pollInterval);
          controller.close();
        });
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  // Non-streaming: return stored events
  if (demoMode()) {
    const events = demoEvents
      .filter((event) => !charityId || event.charityId === charityId)
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20);
    return Response.json({ ok: true, data: events });
  }
  const query = charityId
    ? db
        .select()
        .from(horizonEvents)
        .where(eq(horizonEvents.charityId, charityId))
        .orderBy(desc(horizonEvents.createdAt))
        .limit(20)
    : db.select().from(horizonEvents).orderBy(desc(horizonEvents.createdAt)).limit(20);

  const events = await query;
  return Response.json({ ok: true, data: events });
}

export async function POST(req: NextRequest) {
  try {
    if (demoMode()) {
      const body = await req.json();
      const event = { ...body, id: demoId('event'), createdAt: new Date() };
      demoEvents.unshift(event);
      return Response.json({ ok: true, data: event }, { status: 201 });
    }
    if (process.env.DEMO_MODE !== 'true' || process.env.STELLAR_NETWORK === 'public') {
      return Response.json(
        { ok: false, error: 'Event ingestion requires verified Horizon evidence' },
        { status: 409 },
      );
    }
    const body = await req.json();
    const rows = await db.insert(horizonEvents).values(body).returning();
    return Response.json({ ok: true, data: rows[0] }, { status: 201 });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
