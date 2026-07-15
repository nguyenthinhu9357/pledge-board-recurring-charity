import { and, desc, eq, sql } from 'drizzle-orm';
import { stellar } from '@/server/config/stellar';
import { db } from '@/server/db/client';
import { charities, fulfillments, type NewPledge, pledges } from '@/server/db/schema';
import { AppError } from '@/server/lib/http';
import { buildSep7PayUri, createMuxedAddress } from '@/server/lib/muxed';

export async function listPledges(charityId?: string) {
  if (charityId) {
    return db
      .select()
      .from(pledges)
      .where(eq(pledges.charityId, charityId))
      .orderBy(desc(pledges.createdAt));
  }
  return db.select().from(pledges).orderBy(desc(pledges.createdAt));
}

export async function getPledge(id: string) {
  const rows = await db.select().from(pledges).where(eq(pledges.id, id));
  if (!rows[0]) throw new AppError('NOT_FOUND', 'Pledge not found', 404);
  return rows[0];
}

export async function createPledge(data: NewPledge) {
  const rows = await db.insert(pledges).values(data).returning();
  const pledge = rows[0]!;

  // Update charity total_pledged
  const charityPledges = await db
    .select({ amount: pledges.monthlyAmountUsdc })
    .from(pledges)
    .where(and(eq(pledges.charityId, data.charityId!), eq(pledges.status, 'active')));

  // monthlyAmountUsdc is a decimal USDC string (e.g. "30.00"), not stroops.
  const total = charityPledges.reduce((acc, p) => acc + Number.parseFloat(p.amount), 0);
  await db
    .update(charities)
    .set({ totalPledged: total.toFixed(2) })
    .where(eq(charities.id, data.charityId!));

  return pledge;
}

export async function updatePledgeStatus(id: string, status: 'active' | 'paused' | 'cancelled') {
  const rows = await db.update(pledges).set({ status }).where(eq(pledges.id, id)).returning();
  if (!rows[0]) throw new AppError('NOT_FOUND', 'Pledge not found', 404);
  return rows[0];
}

export async function getPledgeWithSep7(id: string) {
  const pledge = await getPledge(id);

  // Get charity address
  const charityRows = await db.select().from(charities).where(eq(charities.id, pledge.charityId));
  const charity = charityRows[0];
  if (!charity) throw new AppError('NOT_FOUND', 'Charity not found', 404);

  // Build muxed address for this pledge
  const pledgeIndex = BigInt('0x' + pledge.id.replace(/-/g, '').slice(0, 16));
  let muxedAddress = charity.stellarAddress;
  try {
    muxedAddress = createMuxedAddress(charity.stellarAddress, pledgeIndex);
  } catch {
    muxedAddress = charity.stellarAddress;
  }

  // Amount in USDC (stored as bigint-string in stroops equivalent, display as USDC)
  // monthlyAmountUsdc is stored as actual USDC string like "30.77"
  const sep7Uri = buildSep7PayUri({
    destination: muxedAddress,
    amount: pledge.monthlyAmountUsdc,
    assetCode: stellar.usdcAssetCode,
    assetIssuer: stellar.usdcIssuer,
    memo: `PLEDGE:${pledge.id.slice(0, 8)}`,
    memoType: 'text',
  });

  return { pledge, charity, muxedAddress, sep7Uri };
}

export async function getFulfillmentStats(charityId: string) {
  const allPledges = await db.select().from(pledges).where(eq(pledges.charityId, charityId));

  const active = allPledges.filter((p) => p.status === 'active');
  const now = new Date();
  const overdue = active.filter((p) => new Date(p.nextDue) < now);
  const dueSoon = active.filter((p) => {
    const dueDate = new Date(p.nextDue);
    const diffMs = dueDate.getTime() - now.getTime();
    return diffMs > 0 && diffMs < 2 * 24 * 60 * 60 * 1000;
  });

  const allFulfillments = await db
    .select({ pledgeId: fulfillments.pledgeId })
    .from(fulfillments)
    .where(
      sql`${fulfillments.pledgeId} IN (SELECT id FROM pledges WHERE charity_id = ${charityId})`,
    );

  const totalDue = active.length;
  const fulfilled = allFulfillments.length;
  const rate = totalDue > 0 ? Math.round((fulfilled / (totalDue * 2)) * 100) : 0;

  const totalPledgedUsdc = active.reduce((acc, p) => acc + parseFloat(p.monthlyAmountUsdc), 0);

  return {
    totalPledges: allPledges.length,
    activePledges: active.length,
    overdueCount: overdue.length,
    dueSoonCount: dueSoon.length,
    fulfillmentRate: Math.min(rate, 100),
    totalPledgedUsdc: totalPledgedUsdc.toFixed(2),
  };
}
