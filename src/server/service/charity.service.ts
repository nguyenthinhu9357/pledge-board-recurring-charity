import { desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { charities, type NewCharity } from '@/server/db/schema';
import { AppError } from '@/server/lib/http';

export async function listCharities() {
  return db.select().from(charities).orderBy(desc(charities.createdAt));
}

export async function getCharity(id: string) {
  const rows = await db.select().from(charities).where(eq(charities.id, id));
  if (!rows[0]) throw new AppError('NOT_FOUND', 'Charity not found', 404);
  return rows[0];
}

export async function createCharity(data: NewCharity) {
  const rows = await db.insert(charities).values(data).returning();
  return rows[0]!;
}

export async function updateCharityTotalPledged(id: string, totalPledged: string) {
  await db.update(charities).set({ totalPledged }).where(eq(charities.id, id));
}
