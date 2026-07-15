import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { created, fromError, ok } from '@/server/lib/http';
import { createPledge, listPledges } from '@/server/service/pledge.service';

const createSchema = z.object({
  donorName: z.string().min(2).max(100),
  charityId: z.string().uuid(),
  monthlyAmountUsdc: z.string().regex(/^\d+(\.\d{1,7})?$/),
  bondAmount: z.string().default('0'),
  cadence: z.enum(['monthly', 'quarterly', 'annual']).default('monthly'),
  nextDue: z.string().datetime(),
});

export async function GET(req: NextRequest) {
  try {
    const charityId = req.nextUrl.searchParams.get('charityId') ?? undefined;
    const data = await listPledges(charityId);
    return ok(data);
  } catch (err) {
    return fromError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = createSchema.parse(await req.json());
    const pledge = await createPledge({
      ...body,
      nextDue: new Date(body.nextDue),
    });
    return created(pledge);
  } catch (err) {
    return fromError(err);
  }
}
