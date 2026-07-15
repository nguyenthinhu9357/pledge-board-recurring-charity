import { describe, expect, it } from 'vitest';
import { buildSep7PayUri, createMuxedAddress, decodeMuxedAddress } from '@/server/lib/muxed';

const G = 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ';

describe('createMuxedAddress', () => {
  it('encodes a G-address + id into an M-address', () => {
    const m = createMuxedAddress(G, 42n);
    expect(m.startsWith('M')).toBe(true);
  });

  it('round-trips through decodeMuxedAddress', () => {
    const m = createMuxedAddress(G, 12345n);
    const { gAddress, muxedId } = decodeMuxedAddress(m);
    expect(gAddress).toBe(G);
    expect(muxedId).toBe(12345n);
  });

  it('throws on an invalid public key', () => {
    expect(() => createMuxedAddress('not-a-key', 1n)).toThrow();
  });
});

describe('buildSep7PayUri', () => {
  it('builds a web+stellar:pay URI with all params', () => {
    const uri = buildSep7PayUri({
      destination: G,
      amount: '30.00',
      assetCode: 'USDC',
      assetIssuer: G,
      memo: 'PLEDGE:abcd1234',
    });
    expect(uri.startsWith('web+stellar:pay?')).toBe(true);
    expect(uri).toContain('destination=');
    expect(uri).toContain('amount=30.00');
    expect(uri).toContain('asset_code=USDC');
    expect(uri).toContain('memo_type=text');
    expect(uri).toContain('network_passphrase=');
  });

  it('honours a custom memoType', () => {
    const uri = buildSep7PayUri({
      destination: G,
      amount: '1',
      assetCode: 'USDC',
      assetIssuer: G,
      memo: '99',
      memoType: 'id',
    });
    expect(uri).toContain('memo_type=id');
  });
});
