# Janji — Pledge Board / Recurring Charity

Janji turns a charitable intention into a public recurring pledge. Donors choose a monthly USDC amount, see the commitment on a shared board, receive due-date signals, and can open a pre-filled SEP-7 payment QR for the next cycle.

## Live demo

Production URL: https://janji-038.vercel.app

Public repository: https://github.com/nguyenthinhu9357/pledge-board-recurring-charity

The hosted preview uses a safe in-memory demo store, so it does not require PostgreSQL, a funded wallet, or private keys. Demo writes are process-local and labelled as simulated. The real Stellar surface remains in the codebase as the next external-wallet step.

## Screenshots

![Janji landing page](screen-shot/01-landing.jpg)
![Pledge board](screen-shot/02-main.jpg)
![New pledge form](screen-shot/03-action.jpg)
![SEP-7 QR result](screen-shot/04-detail.jpg)
![Mobile pledge board](screen-shot/06-mobile.jpg)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3001. Leave `DRIZZLE_DATABASE_URL` unset or set `DEMO_MODE=true` for the public-style preview.

Validation commands:

```bash
npm test
npm run test:e2e
npm run screenshots
```

## Stellar surface

- Horizon recurring payment intent and proof
- Soroban charity/policy boundary where required
- Due-pledge keeper and provider/event reconciliation

## Readiness status

This repository is in hackathon readiness hardening. Demo event ingestion is restricted to demo mode. No mainnet deployment or payment proof is claimed.

See [`docs/MAINNET_READINESS.md`](docs/MAINNET_READINESS.md).

## Local demo

Use disposable testnet accounts and local environment variables. Follow the scripts in `package.json` and never commit signer or provider credentials.

## Mainnet gate

Mainnet requires donor-signed payments, charity verification, exact Horizon proof, idempotent recurring schedules, and independently authenticated event ingestion.
