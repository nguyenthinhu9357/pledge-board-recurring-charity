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

## Mainnet deployment

- Contract: `CAMFL3HZIVSFYZH3HEBV6NLPQNK4LNQVWT6PUYXWE3JEL7YT4QEVWHGT`
- Verified flow: `initialize -> create_pledge -> fund`
- Create pledge: [`10132ab480bfea0c88ce2383b0576883490bc0510d822d7bf844fc6a49a4a59b`](https://stellar.expert/explorer/public/tx/10132ab480bfea0c88ce2383b0576883490bc0510d822d7bf844fc6a49a4a59b)
- Fund pledge: [`ec0ab47a9bc969f46ebd840df02132b523e3c9c8ed4d37eb6ba5eed2f0aa869e`](https://stellar.expert/explorer/public/tx/ec0ab47a9bc969f46ebd840df02132b523e3c9c8ed4d37eb6ba5eed2f0aa869e)

The verified pledge is funded with 0.1 XLM. `release` requires the charity
wallet signature; `refund` becomes available after the due ledger.
