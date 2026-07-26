import { beforeEach, describe, expect, it, vi } from 'vitest';

const state: { rows: unknown[]; captured: unknown } = { rows: [], captured: null };

vi.mock('@/server/db/client', () => {
  const selectChain = {
    from: () => selectChain,
    where: () => selectChain,
    orderBy: () => Promise.resolve(state.rows),
    then: (resolve: (v: unknown) => void) => resolve(state.rows),
  };
  const insertChain = {
    values: (v: unknown) => {
      state.captured = v;
      return { returning: () => Promise.resolve(state.rows) };
    },
  };
  const updateChain = {
    set: () => ({ where: () => Promise.resolve(undefined) }),
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
  createCharity,
  getCharity,
  listCharities,
  updateCharityTotalPledged,
} from '@/server/service/charity.service';

beforeEach(() => {
  state.rows = [];
  state.captured = null;
});

describe('charity.service', () => {
  it('listCharities returns rows', async () => {
    state.rows = [{ id: 'c1', name: 'Temple Fund' }];
    const out = await listCharities();
    expect(out).toHaveLength(1);
  });

  it('getCharity returns a single charity', async () => {
    state.rows = [{ id: 'c1', name: 'Temple Fund' }];
    const out = await getCharity('c1');
    expect(out.id).toBe('c1');
  });

  it('getCharity throws NOT_FOUND when missing', async () => {
    state.rows = [];
    await expect(getCharity('nope')).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });

  it('createCharity inserts and returns the new row', async () => {
    state.rows = [{ id: 'c2', name: 'New Charity' }];
    const out = await createCharity({ name: 'New Charity', stellarAddress: 'G...' });
    expect(out.id).toBe('c2');
    expect(state.captured).toMatchObject({ name: 'New Charity' });
  });

  it('updateCharityTotalPledged resolves', async () => {
    await expect(updateCharityTotalPledged('c1', '123.00')).resolves.toBeUndefined();
  });
});
