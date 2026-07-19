# order

Order model as parent aggregate to Invoice. Represents an "intent to purchase"
that composes multiple line items (products, memberships, passes, coupons) with
totals, adjustments, and split-payment resolution.

Per DL-2 (tasks.md): Orders reference `finance/wallet` (for credit/points
application), `finance/coupon` (for discount codes), `finance/invoice` (once
the order commits and generates an invoice), and `finance/payment` (for the
gateway charge). The Order is the source of truth for what the customer
intended to buy — the Invoice mirrors what actually happened for accounting.

## Owned tables

- `orders` — one row per checkout attempt. Belongs to Tenant + Branch (nullable,
  cascade). References the buyer (owner_type/owner_id polymorphic — usually
  `guardian`).
- `order_lines` — line items on an order. Each line references what was
  purchased (polymorphic `purchasable_type`/`purchasable_id` — Product,
  MembershipPlan, PassPackage, EventTicket, ClinicSession).
- `order_adjustments` — coupon / credit / manual-discount / tax / fee rows
  applied to an order. Signed (positive = fee, negative = discount).

## State machine

```
draft -> pending -> paid -> fulfilled
                 \-> partially_paid -> paid
                 \-> abandoned (auto on ttl expiry)
                 \-> cancelled (manual by staff or buyer)
                 \-> refunded (after gateway refund)
```

## Cross-references

- `finance/invoice` — created on `order.paid` (or `order.partially_paid`).
- `finance/payment` — attaches to the order via `order.transactions[]`.
- `finance/wallet` — line item deductions applied as `wallet_hold` rows during
  checkout; converted to `wallet_transaction` on commit.
- `finance/coupon` — coupon code applied as one order_adjustment row.
- `notifications/notifications` — `OrderPaidNotification` on the state
  transition.
