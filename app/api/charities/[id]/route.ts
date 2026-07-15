import type { NextRequest } from 'next/server';
import { fromError, ok } from '@/server/lib/http';
import { getCharity } from '@/server/service/charity.service';
import { getFulfillmentStats } from '@/server/service/pledge.service';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const charity = await getCharity(id);
    const stats = await getFulfillmentStats(id);
    return ok({ charity, stats });
  } catch (err) {
    return fromError(err);
  }
}
