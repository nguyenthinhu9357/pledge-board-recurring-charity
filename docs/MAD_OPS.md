# 038 MAD Ops runbook

This helper creates unsigned XDR only; it never signs or broadcasts.

```bash
node scripts/mad-tx.mjs show
node scripts/mad-tx.mjs create-pledge --network testnet --contract <C...> --source <donor-G...> --charity <charity-G...> --id 1 --amount 0.1
node scripts/mad-tx.mjs fund-pledge --network testnet --contract <C...> --source <donor-G...> --id 1
node scripts/mad-tx.mjs release-pledge --network testnet --contract <C...> --source <charity-G...> --id 1
node scripts/mad-tx.mjs status --network testnet --hash <hash>
```

The `release-pledge` source must be the charity address stored in the pledge;
this is an intentional second-party signature. Use a fresh id for each
recurring pledge. Set `--network mainnet` only after the manifest has verified
deployment IDs.
