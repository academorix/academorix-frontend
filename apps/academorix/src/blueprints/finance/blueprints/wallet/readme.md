# wallet

Unified ledger for non-cash entitlements: **cash-balance mirror, prepaid store
credit, and loyalty points**. One table serves all three via a `kind`
discriminator (per DL-2 in tasks.md).

## Model A — non-custodial mirror

Academorix does **not** hold customer funds. The wallet ledger is a mirror of
balances that live at the payment gateway (Stripe Connect Balance) OR are
already-earned entitlements (credits, points). Money movement always transits
the gateway; we ledger it locally for fast reads + off-line-tolerant UX.

Rejected Model B (custodial): holding funds triggers money-transmitter licensing
(state-by-state US, EMI in EU, DFSA in UAE). Not on the roadmap.

## Three wallet kinds

- `cash` — mirror of the tenant's Stripe Connect Balance in a given currency.
  One wallet per (owner, currency). Reconciled nightly against Stripe.
- `credit` — prepaid store credit issued by the tenant (gift cards, refund
  credits, promotional grants). Currency-denominated. Loses value on
  cancellation (see below).
- `points` — loyalty currency. Unit is "point" (dimensionless). Convertible to
  credit at a tenant-configured ratio via redemption flow.

## Owned tables

- `wallets` — one per (owner_type, owner_id, kind, currency). Balance is
  materialized (running sum) but reconciled against transactions nightly.
- `wallet_transactions` — every debit/credit. Immutable. Composed reference to
  the source (order, refund, manual_adjustment).
- `wallet_holds` — reserved balance during in-progress orders. Prevents
  over-spending during checkout. Settled or released on order state transition.

## Cross-references

- `finance/order` — order_adjustments of kind='credit' create wallet_holds at
  checkout, wallet_transactions on `OrderPaid`.
- `finance/refund` — refunds may issue wallet credit instead of gateway refund.
- `finance/gateway` — cash-wallet reconciliation via Stripe Connect balance API.
- `finance/marketplace-fee` — points-earning rules trigger on orders (fee tier).
