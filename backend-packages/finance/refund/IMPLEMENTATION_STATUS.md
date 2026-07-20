# finance/refund — Phase 3 implementation status

## Status: SCAFFOLDED — Actions return `null`

## Implementation plan

Two refund pathways:
1. **Gateway refund** — reverse the original charge via
   `PaymentGatewayInterface::refund()`. Money returns to the customer's
   original payment method.
2. **Wallet credit** — issue store credit via `finance/wallet`. Money
   stays in the platform; customer applies it to a future purchase.

The choice is a per-tenant policy setting (`refund.policy` in `settings`).
The action reads the policy and dispatches to the right path.

### Actions to fill (10 total)

| Action                            | Contract                                                | Notes                                                                                                                                                                            |
| --------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CreateRefundAction`              | `POST /api/v1/refunds`                                  | Body: `{ payment_id, amount_minor, reason, method: 'gateway' | 'wallet' }`. Delegates to the chosen path in a transaction.                                                       |
| `ShowRefundAction`                | `GET /api/v1/refunds/{refund}`                          | Read-only.                                                                                                                                                                       |
| `ListRefundAction`                | `GET /api/v1/refunds`                                   | Filters: status, payment_id, customer_id.                                                                                                                                        |
| `CancelPendingRefundAction`       | `POST /api/v1/refunds/{refund}/cancel`                  | Only for `pending` gateway refunds — some providers allow this for a short window.                                                                                              |
| `SyncRefundStatusAction`          | `POST /api/v1/refunds/{refund}/sync`                    | Reconciliation path — pull latest status from the provider.                                                                                                                     |

### Support services

- `RefundOrchestrator` (Actions/Support/) — routes to gateway vs wallet
  based on the tenant's policy setting.
- `WalletCreditIssuer` (Services/) — thin wrapper over
  `finance/wallet::AdjustAction` semantics for the wallet-credit path.
- `RefundReconciler` (Services/) — background job that re-reads provider
  refund status for pending refunds every 10 minutes.

### Events to dispatch

- `RefundRequested` — the customer/admin initiated a refund.
- `RefundProcessed` — provider accepted the refund (money in transit).
- `RefundSucceeded` — money returned to the customer.
- `RefundFailed` — provider declined (rare — insufficient balance in
  the platform's Stripe Connect account).
- `RefundIssued` — fired for both paths at commit; downstream consumers
  (finance/invoice, finance/coupon) subscribe.

### Coupon clawback cascade

`RefundIssued` triggers `ProcessCouponClawbackJob` for every
`CouponRedemption` that pointed at the refunded invoice. See
`finance/coupon::ClawbackHandler` for the reversal path.

### Idempotency

Every refund request carries an `Idempotency-Key` header. A retry of the
same key returns the cached response — never issues a duplicate refund.
