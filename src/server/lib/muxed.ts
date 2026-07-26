import { Account, MuxedAccount, StrKey } from '@stellar/stellar-sdk';

/**
 * Encode a pledge_id (numeric) into a muxed account address (SEP-23 / MuxedAccount).
 * The charity's G-address is the base; the pledge_id becomes the muxed ID.
 */
export function createMuxedAddress(gAddress: string, pledgeId: bigint): string {
  if (!StrKey.isValidEd25519PublicKey(gAddress)) {
    throw new Error(`Invalid Stellar public key: ${gAddress}`);
  }
  // MuxedAccount.fromAddress only parses existing M-addresses, so build one
  // from the charity's G-address (base) plus the pledge id as the muxed id.
  const muxed = new MuxedAccount(new Account(gAddress, '0'), pledgeId.toString());
  return muxed.accountId();
}

/**
 * Decode a muxed M-address back to { gAddress, muxedId }.
 */
export function decodeMuxedAddress(mAddress: string): { gAddress: string; muxedId: bigint } {
  const muxed = MuxedAccount.fromAddress(mAddress, '0');
  return {
    gAddress: muxed.baseAccount().accountId(),
    muxedId: BigInt(muxed.id()),
  };
}

/**
 * Build a SEP-7 pay URI for a pledge fulfillment.
 */
export function buildSep7PayUri(params: {
  destination: string;
  amount: string;
  assetCode: string;
  assetIssuer: string;
  memo: string;
  memoType?: string;
  networkPassphrase?: string;
}): string {
  const {
    destination,
    amount,
    assetCode,
    assetIssuer,
    memo,
    memoType = 'text',
    networkPassphrase = 'Test SDF Network ; September 2015',
  } = params;
  const base = 'web+stellar:pay';
  const q = new URLSearchParams({
    destination,
    amount,
    asset_code: assetCode,
    asset_issuer: assetIssuer,
    memo,
    memo_type: memoType,
    network_passphrase: networkPassphrase,
  });
  return `${base}?${q.toString()}`;
}
