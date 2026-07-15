import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { created, fromError, ok } from '@/server/lib/http';
import { createCharity, listCharities } from '@/server/service/charity.service';

const createSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).default(''),
  stellarAddress: z.string().min(10),
  category: z.string().default('general'),
});

export async function GET() {
  try {
    const data = await listCharities();
    return ok(data);
  } catch (err) {
    return fromError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = createSchema.parse(await req.json());
    const charity = await createCharity(body);
    return created(charity);
  } catch (err) {
    return fromError(err);
  }
}
