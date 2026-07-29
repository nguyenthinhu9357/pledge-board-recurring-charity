# Data model

- Charity: display name, verified public address, status, and verification time.
- Pledge: identifier, donor, charity, amount, due ledger, and lifecycle state.
- Funding proof: transaction hash, ledger, amount, and token.
- Resolution proof: release, refund, or cancellation hash and final state.

Amounts use integer stroops. Pledge IDs and transaction hashes are unique. Public
profile data is separated from immutable on-chain evidence.
