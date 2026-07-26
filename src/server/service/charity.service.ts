import { desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { charities, type NewCharity } from '@/server/db/schema';
import { AppError } from '@/server/lib/http';
import { demoCharities, demoMode, demoUuid } from '@/server/demo-store';

export async function listCharities() {
  if (demoMode()) return demoCharities;
  return db.select().from(charities).orderBy(desc(charities.createdAt));
}

export async function getCharity(id: string) {
  if (demoMode()) {
    const charity = demoCharities.find((item) => item.id === id);
    if (!charity) throw new AppError('NOT_FOUND', 'Charity not found', 404);
    return charity;
  }
  const rows = await db.select().from(charities).where(eq(charities.id, id));
  if (!rows[0]) throw new AppError('NOT_FOUND', 'Charity not found', 404);
  return rows[0];
}

export async function createCharity(data: NewCharity) {
  if (demoMode()) {
    const charity = {
      id: demoUuid(),
      name: data.name,
      description: data.description ?? '',
      stellarAddress: data.stellarAddress,
      category: data.category ?? 'general',
      totalPledged: '0',
      createdAt: new Date(),
    };
    demoCharities.push(charity);
    return charity;
  }
  const rows = await db.insert(charities).values(data).returning();
  return rows[0]!;
}

export async function updateCharityTotalPledged(id: string, totalPledged: string) {
  if (demoMode()) {
    const charity = demoCharities.find((item) => item.id === id);
    if (charity) charity.totalPledged = totalPledged;
    return;
  }
  await db.update(charities).set({ totalPledged }).where(eq(charities.id, id));
}
