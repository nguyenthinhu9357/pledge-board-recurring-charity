# Transaction verification

For each pledge action:

1. Require a successful Stellar Mainnet result.
2. Confirm the invoked contract ID and function.
3. Match donor, charity, amount, pledge identifier, and due ledger.
4. Confirm the expected token transfer for fund, release, or refund.
5. Reject duplicate transaction hashes.
6. Store the hash and final ledger with the pledge record.

Explorer links aid review; application logic must verify ledger parameters directly.
