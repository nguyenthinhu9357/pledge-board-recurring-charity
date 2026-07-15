import { desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { fulfillments, type NewFulfillment, pledges } from '@/server/db/schema';
import { AppError } from '@/server/lib/http';

export async function listFulfillments(pledgeId?: string) {
  if (pledgeId) {
    return db
      .select()
      .from(fulfillments)
      .where(eq(fulfillments.pledgeId, pledgeId))
      .orderBy(desc(fulfillments.fulfilledAt));
  }
  return db.select().from(fulfillments).orderBy(desc(fulfillments.fulfilledAt));
}

export async function recordFulfillment(data: NewFulfillment) {
  const rows = await db.insert(fulfillments).values(data).returning();
  const fulfillment = rows[0]!;

  // Increment pledge fulfillment count and advance next_due by ~1 month
  const pledgeRows = await db.select().from(pledges).where(eq(pledges.id, data.pledgeId!));
  const pledge = pledgeRows[0];
  if (pledge) {
    const nextDue = new Date(pledge.nextDue);
    nextDue.setMonth(nextDue.getMonth() + 1);
    await db
      .update(pledges)
      .set({
        fulfillmentCount: pledge.fulfillmentCount + 1,
        nextDue,
      })
      .where(eq(pledges.id, pledge.id));
  }

  return fulfillment;
}

export async function getFulfillment(id: string) {
  const rows = await db.select().from(fulfillments).where(eq(fulfillments.id, id));
  if (!rows[0]) throw new AppError('NOT_FOUND', 'Fulfillment not found', 404);
  return rows[0];
}
