# Mainnet readiness

Concept: recurring charity pledges with transparent payment and recipient reconciliation.

Current evidence: the pledge-board Soroban contract is deployed and initialized on Stellar Public Mainnet. A real `create_pledge` and `fund` flow has been verified with native XLM SAC, including the `pledge_funded` event.

Required gates for the full recurring-charity product remain: use external signing, verify each incoming/outgoing destination and amount, make retries idempotent, and collect a charity signature for `release` or wait for the due ledger for `refund`.

Status: **functional Mainnet pledge flow verified; the public app remains a hackathon demo and does not custody or sign user funds**.

## Contract work in this revision

`contracts/pledge-board/` contains the native-XLM SAC contract and unsigned-XDR
helper. Mainnet deployment and functional transaction evidence are recorded in
`contracts/pledge-board/deployment.json`.
