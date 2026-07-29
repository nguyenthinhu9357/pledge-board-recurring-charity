# Mainnet operations

Before release, verify the Public Network passphrase, pledge contract ID, native XLM
SAC address, Horizon/RPC endpoints, and Vercel environment. Run web and Rust tests,
type checking, lint, and a production build.

Daily checks cover app availability, open and funded pledges, deadlines approaching,
failed release/refund calls, and the latest successful contract event. Administrative
wallets remain external and should hold only the balance needed for operations.
