import { desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { fulfillments, type NewFulfillment, pledges } from '@/server/db/schema';
import { AppError } from '@/server/lib/http';
import { demoFulfillments, demoId, demoMode, demoPledges, demoTxHash } from '@/server/demo-store';

export async function listFulfillments(pledgeId?: string) {
  if (demoMode()) return pledgeId ? demoFulfillments.filter((item) => item.pledgeId === pledgeId) : demoFulfillments;
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
  if (demoMode()) {
    const pledge = demoPledges.find((item) => item.id === data.pledgeId);
    if (!pledge) throw new AppError('NOT_FOUND', 'Pledge not found', 404);
    const fulfillment = {
      id: demoId('fulfillment'),
      pledgeId: data.pledgeId,
      amountUsdc: data.amountUsdc,
      txHash: data.txHash || demoTxHash(),
      cycleLabel: data.cycleLabel,
      fulfilledAt: new Date(),
    };
    demoFulfillments.unshift(fulfillment);
    pledge.fulfillmentCount += 1;
    pledge.nextDue = new Date(pledge.nextDue);
    pledge.nextDue.setMonth(pledge.nextDue.getMonth() + 1);
    return fulfillment;
  }
  if (process.env.NODE_ENV !== 'test' && (process.env.DEMO_MODE !== 'true' || process.env.STELLAR_NETWORK === 'public')) {
    throw new AppError('CONFLICT', 'Charity fulfillment requires a verified payment proof', 409);
  }
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
  if (demoMode()) {
    const fulfillment = demoFulfillments.find((item) => item.id === id);
    if (!fulfillment) throw new AppError('NOT_FOUND', 'Fulfillment not found', 404);
    return fulfillment;
  }
  const rows = await db.select().from(fulfillments).where(eq(fulfillments.id, id));
  if (!rows[0]) throw new AppError('NOT_FOUND', 'Fulfillment not found', 404);
  return rows[0];
}
