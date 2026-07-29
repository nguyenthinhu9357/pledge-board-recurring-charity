# Refund runbook

1. Confirm the pledge is funded and not already released or refunded.
2. Compare the current ledger with the contract due ledger.
3. Verify the donor wallet is connected on Mainnet.
4. Simulate `refund` and review the contract, pledge ID, and transfer destination.
5. Sign once and wait for a final transaction result.
6. Verify the XLM transfer and store the successful hash.

If submission is ambiguous, query the hash and pledge state before retrying.
