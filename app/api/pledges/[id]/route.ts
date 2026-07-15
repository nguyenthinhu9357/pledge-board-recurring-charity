import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { fromError, ok } from '@/server/lib/http';
import { getPledgeWithSep7, updatePledgeStatus } from '@/server/service/pledge.service';

const patchSchema = z.object({
  status: z.enum(['active', 'paused', 'cancelled']),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await getPledgeWithSep7(id);
    return ok(data);
  } catch (err) {
    return fromError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = patchSchema.parse(await req.json());
    const pledge = await updatePledgeStatus(id, body.status);
    return ok(pledge);
  } catch (err) {
    return fromError(err);
  }
}
