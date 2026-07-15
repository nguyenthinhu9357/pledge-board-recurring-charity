import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { created, fromError, ok } from '@/server/lib/http';
import { listFulfillments, recordFulfillment } from '@/server/service/fulfillment.service';

const createSchema = z.object({
  pledgeId: z.string().uuid(),
  amountUsdc: z.string().regex(/^\d+(\.\d{1,7})?$/),
  txHash: z.string().default(''),
  cycleLabel: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const pledgeId = req.nextUrl.searchParams.get('pledgeId') ?? undefined;
    const data = await listFulfillments(pledgeId);
    return ok(data);
  } catch (err) {
    return fromError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = createSchema.parse(await req.json());
    const fulfillment = await recordFulfillment(body);
    return created(fulfillment);
  } catch (err) {
    return fromError(err);
  }
}
