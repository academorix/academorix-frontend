# finance/payout — Phase 3 implementation status

## Status: SCAFFOLDED — Actions return `null`

## Implementation plan

Payouts are Stripe Connect Balance settlements to tenant bank accounts.
The platform observes payouts via webhook (`payout.paid`, `payout.failed`)
and mirrors them into `payouts` for tenant admin visibility + accounting
export. This module does NOT initiate payouts — Stripe auto-payout on
the configured schedule handles that.

### Actions to fill (3 total)

| Action                            | Contract                                                 | Notes                                                                            |
| --------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `ListPayoutAction`                | `GET /api/v1/payouts`                                    | Read-only. Filters: status, arrival_at range.                                    |
| `ShowPayoutAction`                | `GET /api/v1/payouts/{payout}`                           | Read-only.                                                                       |
| `ReconcilePayoutAction`           | `POST /api/v1/payouts/{payout}/reconcile`                | Cross-check against Stripe — fetches the payout's transactions + attaches them. |

### Support services

- `PayoutReconciler` (Services/) — for a given payout, pull the balance
  transactions via `StripeGatewayDriver::retrieveConnectBalance` diff
  and persist a per-transaction breakdown (charge / refund / fee /
  chargeback fee). Enables full accounting export.

### Events

- `PayoutCreated` — from webhook.
- `PayoutPaid` — settled to bank.
- `PayoutFailed` — bank rejected the deposit.
- `PayoutReconciled` — admin ran the reconcile action.
