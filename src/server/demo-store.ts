/** Safe in-memory data for the public Janji hackathon preview. */

export type DemoCharity = {
  id: string;
  name: string;
  description: string;
  stellarAddress: string;
  category: string;
  totalPledged: string;
  createdAt: Date;
};

export type DemoPledge = {
  id: string;
  donorName: string;
  charityId: string;
  monthlyAmountUsdc: string;
  bondAmount: string;
  cadence: 'monthly' | 'quarterly' | 'annual';
  nextDue: Date;
  fulfillmentCount: number;
  status: 'active' | 'paused' | 'cancelled';
  createdAt: Date;
};

export type DemoFulfillment = {
  id: string;
  pledgeId: string;
  amountUsdc: string;
  txHash: string;
  cycleLabel: string;
  fulfilledAt: Date;
};

export type DemoEvent = {
  id: string;
  charityId: string;
  pledgeId: string | null;
  eventType: string;
  amount: string;
  txHash: string;
  createdAt: Date;
};

const charityAddress = 'GDUJC233ZSHRW453LC3BBROX73BZAYFIFP6XFNAS6VGXCYDVIXQ6BIR2';
const charityId = '55555555-5555-4555-8555-555555555555';

export const demoCharities: DemoCharity[] = [
  {
    id: charityId,
    name: 'Saigon Community Kitchen',
    description: 'Monthly meals and emergency food support for families in Ho Chi Minh City.',
    stellarAddress: charityAddress,
    category: 'food-security',
    totalPledged: '396.00',
    createdAt: new Date('2026-06-01T08:00:00.000Z'),
  },
];

export const demoPledges: DemoPledge[] = [
  { id: '66666666-6666-4666-8666-666666666661', donorName: 'Nguyen Thi Lan', charityId, monthlyAmountUsdc: '30.00', bondAmount: '5.00', cadence: 'monthly', nextDue: new Date('2026-07-24T08:00:00.000Z'), fulfillmentCount: 1, status: 'active', createdAt: new Date('2026-06-01T09:00:00.000Z') },
  { id: '66666666-6666-4666-8666-666666666662', donorName: 'Minh Tran', charityId, monthlyAmountUsdc: '45.00', bondAmount: '5.00', cadence: 'monthly', nextDue: new Date('2026-07-27T08:00:00.000Z'), fulfillmentCount: 0, status: 'active', createdAt: new Date('2026-06-02T09:00:00.000Z') },
  { id: '66666666-6666-4666-8666-666666666663', donorName: 'Sofia Reyes', charityId, monthlyAmountUsdc: '75.00', bondAmount: '10.00', cadence: 'monthly', nextDue: new Date('2026-08-15T08:00:00.000Z'), fulfillmentCount: 2, status: 'active', createdAt: new Date('2026-06-03T09:00:00.000Z') },
  { id: '66666666-6666-4666-8666-666666666664', donorName: 'Anika Patel', charityId, monthlyAmountUsdc: '60.00', bondAmount: '8.00', cadence: 'monthly', nextDue: new Date('2026-07-20T08:00:00.000Z'), fulfillmentCount: 1, status: 'active', createdAt: new Date('2026-06-04T09:00:00.000Z') },
  { id: '66666666-6666-4666-8666-666666666665', donorName: 'Thao Nguyen', charityId, monthlyAmountUsdc: '50.00', bondAmount: '5.00', cadence: 'monthly', nextDue: new Date('2026-08-10T08:00:00.000Z'), fulfillmentCount: 2, status: 'active', createdAt: new Date('2026-06-05T09:00:00.000Z') },
  { id: '66666666-6666-4666-8666-666666666666', donorName: 'Daniel Lim', charityId, monthlyAmountUsdc: '86.00', bondAmount: '10.00', cadence: 'monthly', nextDue: new Date('2026-08-05T08:00:00.000Z'), fulfillmentCount: 2, status: 'active', createdAt: new Date('2026-06-06T09:00:00.000Z') },
  { id: '66666666-6666-4666-8666-666666666667', donorName: 'Bao Nguyen', charityId, monthlyAmountUsdc: '50.00', bondAmount: '5.00', cadence: 'monthly', nextDue: new Date('2026-08-20T08:00:00.000Z'), fulfillmentCount: 2, status: 'active', createdAt: new Date('2026-06-07T09:00:00.000Z') },
];

export const demoFulfillments: DemoFulfillment[] = [
  { id: 'fulfill-1', pledgeId: demoPledges[0].id, amountUsdc: '30.00', txHash: 'a'.repeat(64), cycleLabel: 'Jun 2026', fulfilledAt: new Date('2026-06-24T08:00:00.000Z') },
  { id: 'fulfill-2', pledgeId: demoPledges[2].id, amountUsdc: '75.00', txHash: 'b'.repeat(64), cycleLabel: 'Jun 2026', fulfilledAt: new Date('2026-06-15T08:00:00.000Z') },
  { id: 'fulfill-3', pledgeId: demoPledges[2].id, amountUsdc: '75.00', txHash: 'c'.repeat(64), cycleLabel: 'Jul 2026', fulfilledAt: new Date('2026-07-15T08:00:00.000Z') },
];

export const demoEvents: DemoEvent[] = [
  { id: 'event-1', charityId, pledgeId: demoPledges[2].id, eventType: 'payment', amount: '75.00', txHash: 'b'.repeat(64), createdAt: new Date('2026-07-15T08:00:00.000Z') },
  { id: 'event-2', charityId, pledgeId: demoPledges[0].id, eventType: 'payment', amount: '30.00', txHash: 'a'.repeat(64), createdAt: new Date('2026-06-24T08:00:00.000Z') },
];

export function demoMode() {
  return process.env.DEMO_MODE === 'true' || (process.env.NODE_ENV !== 'test' && !process.env.DRIZZLE_DATABASE_URL);
}

export function demoId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function demoUuid() {
  return crypto.randomUUID();
}

export function demoTxHash() {
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`.repeat(4).slice(0, 64);
}
