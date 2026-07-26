import { describe, expect, it } from 'vitest';
import { stroopsToUsdc, usdcToStroops, usdcToVnd, VND_PER_USDC } from '@/server/lib/bigint';

describe('bigint usdc helpers', () => {
  it('converts stroops to usdc whole number', () => {
    expect(stroopsToUsdc('300000000')).toBe('30');
  });

  it('converts stroops to usdc with fraction trimmed', () => {
    expect(stroopsToUsdc('305000000')).toBe('30.5');
  });

  it('accepts bigint input', () => {
    expect(stroopsToUsdc(10_000_000n)).toBe('1');
  });

  it('converts usdc decimal string to stroops', () => {
    expect(usdcToStroops('30.5')).toBe(305_000_000n);
  });

  it('pads fractional usdc correctly', () => {
    expect(usdcToStroops('1.1234567')).toBe(11_234_567n);
  });

  it('handles integer usdc', () => {
    expect(usdcToStroops('5')).toBe(50_000_000n);
  });
});

describe('usdcToVnd', () => {
  it('formats a usdc amount as VND with dong sign', () => {
    const out = usdcToVnd('1');
    expect(out).toContain('₫');
    expect(out).toContain(VND_PER_USDC.toLocaleString('vi-VN'));
  });

  it('rounds and scales by rate', () => {
    expect(usdcToVnd('2')).toBe(`${(2 * VND_PER_USDC).toLocaleString('vi-VN')} ₫`);
  });

  it('returns zero for invalid input', () => {
    expect(usdcToVnd('abc')).toBe('0 ₫');
  });
});
