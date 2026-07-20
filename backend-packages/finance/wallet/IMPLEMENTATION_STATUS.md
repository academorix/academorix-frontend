# finance/wallet — Phase 3 implementation status

## Status: PARTIAL — Adjust + Transactions actions landed; core services pending

## What landed

- `AdjustAction` (POST /wallets/{wallet}/adjust) — admin ledger correction
  with atomic wallet-lock + immutable transaction row + lifetime credit /
  debit rollup.
- `TransactionsTransactionAction` (GET /wallets/{wallet}/transactions) —
  reverse-chronological wallet-scoped ledger.
- `AdjustWalletRequestData` DTO with signed-amount + reason + source-type
  whitelist.

## What's pending

### Services to implement

- `WalletFactory` (Services/) — the "get or create" gate. `Model A` says
  we mirror Stripe Connect Balance — the wallet row appears when the
  first `PaymentSucceeded` for the tenant lands, keyed by
  `(owner_type, owner_id, kind, currency)`.
- `WalletReconciler` (Services/, nightly job) — pulls the tenant's Stripe
  Connect Balance via `StripeGatewayDriver::retrieveConnectBalance` and
  cross-checks against `wallets.balance_minor`. Any drift → alert +
  quarantine.
- `PointsEarnRuleEngine` (Services/) — for `kind = points` wallets;
  computes earned points per payment based on tenant-configured rules
  (e.g., "1 point per $1 spent, 2x on Sundays").
- `PointsRedemptionCalculator` (Services/) — inverse of the earn engine;
  converts point balance to a redemption value at checkout.

### Actions to fill

Standard CRUD actions (List/Show for Wallet + WalletHold) are already
scaffolded but return `null`. They need:

- `ListWalletAction` — `paginate` via the repository. `#[Filterable('*')]`
  already active.
- `ShowWalletAction` — `findOrFail` via repository.
- `ListWalletHoldAction` / `ShowWalletHoldAction` — same shape.

These are trivial — the pattern from the tenancy `Show`/`List` actions
carries over unchanged.

### Wallet-hold flow (deferred to `finance/order` build-out)

`WalletHold` rows are pending balance reservations created at checkout
(`Order::ApplyCredit`) and resolved on paid / canceled. The action wiring
belongs in `finance/order`, but the reservation model + `HoldCreditService`
belong here.
