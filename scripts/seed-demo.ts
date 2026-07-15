/**
 * Seed demo data for Janji — recurring charity pledge board.
 * Persona: Nguyen Thi Lan (Vietnam market vendor) and her giving circle.
 * Run: pnpm run seed  (after pnpm run db:push)
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { charities, fulfillments, horizonEvents, pledges } from '../src/server/db/schema';

const pool = new Pool({ connectionString: process.env.DRIZZLE_DATABASE_URL });
const db = drizzle(pool);

// Testnet charity G-address (demo only — testnet, safe to publish).
const CHARITY_ADDRESS = 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ';

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log('[seed] clearing existing rows…');
  await db.delete(fulfillments);
  await db.delete(horizonEvents);
  await db.delete(pledges);
  await db.delete(charities);

  console.log('[seed] inserting charity…');
  const [charity] = await db
    .insert(charities)
    .values({
      name: 'Chua Vinh Nghiem Temple Fund',
      description:
        'Monthly alms and community meals at Vinh Nghiem Pagoda, Ho Chi Minh City. Funded by recurring pledges from market traders and neighbours.',
      stellarAddress: CHARITY_ADDRESS,
      category: 'faith',
      totalPledged: '0',
    })
    .returning();

  console.log('[seed] inserting pledges…');
  const pledgeRows = await db
    .insert(pledges)
    .values([
      {
        donorName: 'Nguyen Thi Lan',
        charityId: charity.id,
        monthlyAmountUsdc: '30.00',
        bondAmount: '5.00',
        cadence: 'monthly',
        nextDue: daysFromNow(12),
        fulfillmentCount: 2,
        status: 'active',
      },
      {
        donorName: 'Tran Van Minh',
        charityId: charity.id,
        monthlyAmountUsdc: '50.00',
        bondAmount: '10.00',
        cadence: 'monthly',
        nextDue: daysFromNow(1),
        fulfillmentCount: 2,
        status: 'active',
      },
      {
        donorName: 'Pham Thi Hoa',
        charityId: charity.id,
        monthlyAmountUsdc: '20.00',
        bondAmount: '5.00',
        cadence: 'monthly',
        nextDue: daysFromNow(-3),
        fulfillmentCount: 1,
        status: 'active',
      },
      {
        donorName: 'Le Quoc Anh',
        charityId: charity.id,
        monthlyAmountUsdc: '100.00',
        bondAmount: '20.00',
        cadence: 'quarterly',
        nextDue: daysFromNow(20),
        fulfillmentCount: 2,
        status: 'active',
      },
      {
        donorName: 'Vo Thi Mai',
        charityId: charity.id,
        monthlyAmountUsdc: '15.00',
        bondAmount: '3.00',
        cadence: 'monthly',
        nextDue: daysFromNow(8),
        fulfillmentCount: 0,
        status: 'active',
      },
      {
        donorName: 'Dang Hoang Long',
        charityId: charity.id,
        monthlyAmountUsdc: '40.00',
        bondAmount: '8.00',
        cadence: 'monthly',
        nextDue: daysFromNow(30),
        fulfillmentCount: 5,
        status: 'paused',
      },
      {
        donorName: 'Bui Thi Thu',
        charityId: charity.id,
        monthlyAmountUsdc: '25.00',
        bondAmount: '5.00',
        cadence: 'annual',
        nextDue: daysFromNow(60),
        fulfillmentCount: 1,
        status: 'cancelled',
      },
    ])
    .returning();

  // Update charity total_pledged from active pledges.
  const activeTotal = pledgeRows
    .filter((p) => p.status === 'active')
    .reduce((acc, p) => acc + Number.parseFloat(p.monthlyAmountUsdc), 0);
  await pool.query('UPDATE charities SET total_pledged = $1 WHERE id = $2', [
    activeTotal.toFixed(2),
    charity.id,
  ]);

  console.log('[seed] inserting fulfillments…');
  const fulfillmentValues = [];
  for (const p of pledgeRows) {
    for (let i = 0; i < p.fulfillmentCount; i++) {
      const when = new Date();
      when.setMonth(when.getMonth() - (p.fulfillmentCount - i));
      fulfillmentValues.push({
        pledgeId: p.id,
        amountUsdc: p.monthlyAmountUsdc,
        txHash: `seed${Math.random().toString(16).slice(2, 14)}`,
        cycleLabel: when.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        fulfilledAt: when,
      });
    }
  }
  if (fulfillmentValues.length > 0) {
    await db.insert(fulfillments).values(fulfillmentValues);
  }

  console.log('[seed] inserting horizon events…');
  await db.insert(horizonEvents).values([
    {
      charityId: charity.id,
      pledgeId: pledgeRows[0].id,
      eventType: 'payment',
      amount: '30.00',
      txHash: 'seedevt0001abcd',
    },
    {
      charityId: charity.id,
      pledgeId: pledgeRows[1].id,
      eventType: 'payment',
      amount: '50.00',
      txHash: 'seedevt0002efgh',
    },
  ]);

  console.log(
    `[seed] done: 1 charity, ${pledgeRows.length} pledges, ${fulfillmentValues.length} fulfillments`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
