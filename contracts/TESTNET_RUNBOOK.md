# 038 Testnet runbook

Build `contracts/commitment/`, then prepare unsigned upload, deploy and
initialize transactions. Simulate/assemble before each external Freighter
signature. After confirmation, copy only the verified contract ID and hashes to
`commitment/deployment.json`; do not add signer secrets.
