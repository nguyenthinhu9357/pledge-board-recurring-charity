# Pledge lifecycle

`OPEN` is created but not funded. `FUNDED` means the exact XLM amount is held by the
contract. `PAID` is terminal after authorized charity release. A post-deadline refund
is terminal and returns funds to the donor. Eligible unfunded pledges may be
cancelled.

Clients should derive actions from contract state, not local timestamps alone. Every
transition is idempotent from the user's perspective: after an ambiguous submission,
query the ledger before signing another transaction.
