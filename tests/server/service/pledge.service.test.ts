import { beforeEach, describe, expect, it, vi } from 'vitest';

// Queue of results returned by successive terminal query calls (select/insert/update).
const q: { results: unknown[][]; updates: unknown[] } = { results: [], updates: [] };

function nextResult(): unknown[] {
  return q.results.shift() ?? [];
}

vi.mock('@/server/db/client', () => {
  const selectChain = {
    from: () => selectChain,
    where: () => selectChain,
    orderBy: () => Promise.resolve(nextResult()),
    // allow awaiting the builder directly (no orderBy)
    then: (resolve: (v: unknown) => void) => resolve(nextResult()),
  };
  const insertChain = {
    values: () => ({ returning: () => Promise.resolve(nextResult()) }),
  };
  const updateChain = {
    set: (v: unknown) => {
      q.updates.push(v);
      return {
        where: () => ({ returning: () => Promise.resolve(nextResult()) }),
      };
    },
  };
  return {
    db: {
      select: () => selectChain,
      insert: () => insertChain,
      update: () => updateChain,
    },
  };
});

vi.mock('@/server/config/stellar', () => ({
  stellar: {
    usdcAssetCode: 'USDC',
    usdcIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  },
}));

import {
  createPledge,
  getFulfillmentStats,
  getPledge,
  getPledgeWithSep7,
  listPledges,
  updatePledgeStatus,
} from '@/server/service/pledge.service';

const G = 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ';

beforeEach(() => {
  q.results = [];
  q.updates = [];
});

function daysFromNow(d: number) {
  const t = new Date();
  t.setDate(t.getDate() + d);
  return t;
}

describe('pledge.service', () => {
  it('listPledges with charityId', async () => {
    q.results = [[{ id: 'p1' }]];
    const out = await listPledges('c1');
    expect(out).toHaveLength(1);
  });

  it('listPledges without charityId', async () => {
    q.results = [[{ id: 'p1' }, { id: 'p2' }]];
    const out = await listPledges();
    expect(out).toHaveLength(2);
  });

  it('getPledge returns a row', async () => {
    q.results = [[{ id: 'p1' }]];
    expect((await getPledge('p1')).id).toBe('p1');
  });

  it('getPledge throws NOT_FOUND', async () => {
    q.results = [[]];
    await expect(getPledge('x')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('createPledge inserts and updates charity total', async () => {
    q.results = [
      [{ id: 'p1', charityId: 'c1', monthlyAmountUsdc: '30.00' }], // insert returning
      [{ amount: '30' }, { amount: '20' }], // active pledges for total
    ];
    const out = await createPledge({
      donorName: 'Lan',
      charityId: 'c1',
      monthlyAmountUsdc: '30.00',
      nextDue: daysFromNow(10),
    });
    expect(out.id).toBe('p1');
    expect(q.updates[0]).toMatchObject({ totalPledged: '50.00' });
  });

  it('updatePledgeStatus returns updated row', async () => {
    q.results = [[{ id: 'p1', status: 'paused' }]];
    const out = await updatePledgeStatus('p1', 'paused');
    expect(out.status).toBe('paused');
  });

  it('updatePledgeStatus throws NOT_FOUND', async () => {
    q.results = [[]];
    await expect(updatePledgeStatus('x', 'active')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('getPledgeWithSep7 builds a SEP-7 uri and muxed address', async () => {
    q.results = [
      [{ id: 'abcdef12-3456-7890-abcd-ef1234567890', charityId: 'c1', monthlyAmountUsdc: '30.00' }],
      [{ id: 'c1', stellarAddress: G }],
    ];
    const out = await getPledgeWithSep7('abcdef12-3456-7890-abcd-ef1234567890');
    expect(out.sep7Uri).toContain('web+stellar:pay');
    expect(out.muxedAddress.length).toBeGreaterThan(0);
  });

  it('getPledgeWithSep7 throws when charity missing', async () => {
    q.results = [
      [{ id: 'abcdef12-3456-7890-abcd-ef1234567890', charityId: 'c1', monthlyAmountUsdc: '30.00' }],
      [],
    ];
    await expect(getPledgeWithSep7('abcdef12-3456-7890-abcd-ef1234567890')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('getFulfillmentStats computes rate, overdue, dueSoon', async () => {
    q.results = [
      [
        { status: 'active', nextDue: daysFromNow(-2), monthlyAmountUsdc: '30.00' }, // overdue
        { status: 'active', nextDue: daysFromNow(1), monthlyAmountUsdc: '20.00' }, // due soon
        { status: 'active', nextDue: daysFromNow(20), monthlyAmountUsdc: '50.00' }, // on track
        { status: 'paused', nextDue: daysFromNow(5), monthlyAmountUsdc: '10.00' },
      ],
      [{ pledgeId: 'a' }, { pledgeId: 'b' }, { pledgeId: 'c' }], // fulfillments
    ];
    const stats = await getFulfillmentStats('c1');
    expect(stats.totalPledges).toBe(4);
    expect(stats.activePledges).toBe(3);
    expect(stats.overdueCount).toBe(1);
    expect(stats.dueSoonCount).toBe(1);
    expect(stats.fulfillmentRate).toBeGreaterThanOrEqual(0);
    expect(stats.totalPledgedUsdc).toBe('100.00');
  });

  it('getFulfillmentStats with no active pledges yields 0 rate', async () => {
    q.results = [[], []];
    const stats = await getFulfillmentStats('c1');
    expect(stats.fulfillmentRate).toBe(0);
    expect(stats.activePledges).toBe(0);
  });
});
