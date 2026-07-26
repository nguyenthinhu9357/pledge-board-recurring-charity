import { beforeEach, describe, expect, it, vi } from 'vitest';

const q: { results: unknown[][]; updates: unknown[] } = { results: [], updates: [] };
function nextResult(): unknown[] {
  return q.results.shift() ?? [];
}

vi.mock('@/server/db/client', () => {
  const selectChain = {
    from: () => selectChain,
    where: () => selectChain,
    orderBy: () => Promise.resolve(nextResult()),
    then: (resolve: (v: unknown) => void) => resolve(nextResult()),
  };
  const insertChain = {
    values: () => ({ returning: () => Promise.resolve(nextResult()) }),
  };
  const updateChain = {
    set: (v: unknown) => {
      q.updates.push(v);
      return { where: () => Promise.resolve(undefined) };
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

import {
  getFulfillment,
  listFulfillments,
  recordFulfillment,
} from '@/server/service/fulfillment.service';

beforeEach(() => {
  q.results = [];
  q.updates = [];
});

describe('fulfillment.service', () => {
  it('listFulfillments with pledgeId', async () => {
    q.results = [[{ id: 'f1' }]];
    expect(await listFulfillments('p1')).toHaveLength(1);
  });

  it('listFulfillments without pledgeId', async () => {
    q.results = [[{ id: 'f1' }, { id: 'f2' }]];
    expect(await listFulfillments()).toHaveLength(2);
  });

  it('recordFulfillment inserts, increments count, advances nextDue', async () => {
    const now = new Date();
    q.results = [
      [{ id: 'f1', pledgeId: 'p1' }], // insert returning
      [{ id: 'p1', fulfillmentCount: 2, nextDue: now }], // pledge lookup
    ];
    const out = await recordFulfillment({
      pledgeId: 'p1',
      amountUsdc: '30.00',
      cycleLabel: 'Jun 2026',
    });
    expect(out.id).toBe('f1');
    expect(q.updates[0]).toMatchObject({ fulfillmentCount: 3 });
  });

  it('recordFulfillment tolerates a missing pledge', async () => {
    q.results = [[{ id: 'f2', pledgeId: 'gone' }], []];
    const out = await recordFulfillment({
      pledgeId: 'gone',
      amountUsdc: '10.00',
      cycleLabel: 'Jul 2026',
    });
    expect(out.id).toBe('f2');
    expect(q.updates).toHaveLength(0);
  });

  it('getFulfillment returns a row', async () => {
    q.results = [[{ id: 'f1' }]];
    expect((await getFulfillment('f1')).id).toBe('f1');
  });

  it('getFulfillment throws NOT_FOUND', async () => {
    q.results = [[]];
    await expect(getFulfillment('x')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
