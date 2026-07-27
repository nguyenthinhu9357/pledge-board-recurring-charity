# Janji pledge-board contract

Minimal recurring-charity pledge contract using native XLM SAC. A donor creates
and funds a pledge; the charity address releases the funded amount to itself.
If the due ledger passes before release, the donor can refund. Open pledges can
be cancelled.

```text
OPEN -> FUNDED -> PAID
  |       |
  v       v
CANCELLED REFUNDED (after due ledger)
```

## Verify locally

```bash
cargo test --manifest-path contracts/pledge-board/Cargo.toml
PATH="$HOME/.rustup/toolchains/stable-aarch64-apple-darwin/bin:$PATH" \
  cargo build --manifest-path contracts/pledge-board/Cargo.toml \
  --target wasm32v1-none --release
```

The asset is fixed at initialization and should be the network's native XLM
SAC. The donor signs create/fund; the charity signs release. No private key is
handled by the contract scripts.
