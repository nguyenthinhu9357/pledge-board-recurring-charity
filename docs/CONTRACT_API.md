# Pledge-board contract API

Mainnet contract: `CAMFL3HZIVSFYZH3HEBV6NLPQNK4LNQVWT6PUYXWE3JEL7YT4QEVWHGT`

- `initialize(admin, token)` configures the administrator and native XLM SAC.
- `create_pledge(...)` creates an open pledge with donor, charity, amount, and due
  ledger.
- `fund(...)` transfers the pledged amount into contract custody.
- `release(...)` transfers a funded pledge to the designated charity.
- `refund(...)` returns funds after the deadline when allowed.
- `cancel(...)` closes an eligible unfunded pledge.

Amounts are integer stroops. State changes require the documented signer.
