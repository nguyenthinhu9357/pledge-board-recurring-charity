# Contributing

Keep each commit focused on one behavior or documentation concern. Run `npm test`,
`npm run typecheck`, and `npm run lint`; contract changes must also pass Rust tests.

Pull requests should describe donor impact, test evidence, storage compatibility,
Mainnet implications, and rollback. Update `docs/CONTRACT_API.md` for interface
changes. Never replace verified Mainnet evidence with simulated data.
