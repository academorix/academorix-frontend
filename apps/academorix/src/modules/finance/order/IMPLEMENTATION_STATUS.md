# finance/order — Phase 3 implementation status

## Status: SCAFFOLDED — Actions return `null`

## Implementation plan

Order is the checkout aggregate — it composes purchasable items into a
priced+adjusted cart, holds it through payment, then splits into an Invoice
(billing) + Membership grants (entitlements) on payment.

### State machine

```
draft ─→ ready ─→ pending_payment ─→ paid ─→ fulfilled
                                     │
                                     └─→ payment_failed ─→ (retry) ─→ pending_payment

              canceled  (from any pre-paid state)
```

### Actions to fill (14 total)

| Action                  | Contract                                      | Notes                                                                                                                                                       |
| ----------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CreateOrderAction`     | `POST /api/v1/orders`                         | Body: `{ customer_id, items: [{purchasable_type, purchasable_id, quantity}] }`. Resolves each purchasable via `PolymorphicResolverInterface`. Draft status. |
| `AddItemAction`         | `POST /api/v1/orders/{order}/items`           | Refused when order is not in `draft`.                                                                                                                       |
| `UpdateItemAction`      | `PATCH /api/v1/orders/{order}/items/{item}`   | Same guard.                                                                                                                                                 |
| `RemoveItemAction`      | `DELETE /api/v1/orders/{order}/items/{item}`  | Same guard.                                                                                                                                                 |
| `ApplyCouponAction`     | `POST /api/v1/orders/{order}/coupons`         | Delegate to `finance/coupon::CouponRedeemer::preview` for validation, THEN redeem AT payment time (not here). Persist a pending redemption reference.       |
| `ApplyCreditAction`     | `POST /api/v1/orders/{order}/credits`         | Reserve wallet credit via `finance/wallet::HoldCredit`. Released on cancel; captured on paid.                                                               |
| `RecomputeTotalsAction` | `POST /api/v1/orders/{order}/recompute`       | Idempotent — recomputes tax + adjustments. Used after coupon/credit changes.                                                                                |
| `ReadyOrderAction`      | `POST /api/v1/orders/{order}/ready`           | draft → ready. Locks the item list.                                                                                                                         |
| `CheckoutAction`        | `POST /api/v1/orders/{order}/checkout`        | ready → pending_payment. Delegates to `finance/payment::CreatePayment` and returns the client_secret for client-side confirmation.                          |
| `PayFromCreditAction`   | `POST /api/v1/orders/{order}/pay-from-credit` | Zero-cash checkout when wallet credit covers the full amount.                                                                                               |
| `CancelOrderAction`     | `POST /api/v1/orders/{order}/cancel`          | From any pre-paid state. Releases wallet holds, releases pending coupon redemptions.                                                                        |
| `ShowOrderAction`       | `GET /api/v1/orders/{order}`                  | Read-only.                                                                                                                                                  |
| `ListOrderAction`       | `GET /api/v1/orders`                          | Read-only. Filters: status, customer_id, created_at range.                                                                                                  |

### Support services

- `PurchasableResolver` (Services/) — polymorphic lookup:
  `{purchasable_type: 'membership_plan', purchasable_id: 'pln_xyz'}` → the
  `MembershipPlan` model + a `PricedSnapshot` DTO (immutable at time of order
  creation).
- `OrderTotalizer` (Actions/Support/) — pure computation combining line prices +
  coupon discount + credit reservation + tax.
- `OrderFulfiller` (Services/) — listens to `PaymentSucceeded` and provisions
  memberships / bookings / passes based on order items.

### Events

- `OrderCreated`, `OrderReadied`, `OrderCheckedOut`, `OrderPaid`,
  `OrderFulfilled`, `OrderCanceled`, `OrderPaymentFailed`.

`OrderPaid` is the cross-module trigger — invoice generation, wallet credit
capture, coupon redemption commit, entitlement provisioning, digital pass
issuance all fan out from it.
