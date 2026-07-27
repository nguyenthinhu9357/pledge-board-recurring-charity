# Mainnet readiness

Concept: recurring charity pledges with transparent payment and recipient reconciliation.

Current evidence: the project contains recurring/charity concepts and local-tested Soroban XLM artifacts under `contracts/pledge-board/` and `contracts/commitment/`, but no verified Testnet/Mainnet deployment or chain-backed pledge transition evidence.

Required gates: choose the contract or payment model, require donor signatures, verify each payment on Horizon, make recurring jobs idempotent, add reconciliation and an incident runbook.

Status: **not mainnet-ready**. Demo seed execution is blocked on public network unless `DEMO_MODE=true`.

## Contract work in this revision

`contracts/pledge-board/` adds a local-tested native-XLM SAC contract and an
unsigned-XDR helper. Testnet and Mainnet deployment fields remain empty because
this revision does not sign or broadcast.
