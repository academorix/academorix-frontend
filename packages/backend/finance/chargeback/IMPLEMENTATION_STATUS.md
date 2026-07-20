# finance/chargeback — Phase 3 implementation status

## Status: SCAFFOLDED — Actions return `null`

## Implementation plan

Chargebacks are dispute lifecycle mirrors from webhooks. The platform does not
INITIATE chargebacks — the customer's bank does. This module OBSERVES chargeback
events (from `WebhookHandler`) and lets tenant admins upload evidence + track
dispute outcomes.

### Actions to fill (6 total)

| Action                   | Contract                                         | Notes                                                                                                                                                   |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ListChargebackAction`   | `GET /api/v1/chargebacks`                        | Read-only. Filters: status, payment_id, created_at range.                                                                                               |
| `ShowChargebackAction`   | `GET /api/v1/chargebacks/{chargeback}`           | Read-only.                                                                                                                                              |
| `UploadEvidenceAction`   | `POST /api/v1/chargebacks/{chargeback}/evidence` | Accept multipart upload (invoice PDF, delivery confirmation, communication logs). Route through `finance/storage`. Once submitted, dispatch to gateway. |
| `SubmitEvidenceAction`   | `POST /api/v1/chargebacks/{chargeback}/submit`   | Send collected evidence to the gateway. Delegates to a provider-specific `SubmitDisputeEvidence` call on the driver.                                    |
| `AcceptChargebackAction` | `POST /api/v1/chargebacks/{chargeback}/accept`   | Concede the dispute — some tenants skip evidence for low-value disputes below their internal threshold. Fires `ChargebackAccepted`.                     |
| Platform view            | `GET /api/v1/platform/chargebacks`               | Cross-tenant platform-admin surface.                                                                                                                    |

### Support services

- `ChargebackEvidenceBuilder` (Actions/Support/) — packages the uploaded files +
  related invoice PDF + communication logs into the gateway- expected shape.
- `ChargebackReconciler` (Services/) — polls provider dispute status for
  submitted evidence.

### Events

- `ChargebackFiled` — dispatched by `WebhookHandler` when a
  `charge.dispute.created` event lands.
- `ChargebackEvidenceUploaded` / `ChargebackEvidenceSubmitted` — admin-initiated
  flows.
- `ChargebackWon` / `ChargebackLost` — final outcomes from provider webhooks.
- `ChargebackAccepted` — admin conceded manually.

### Wallet cascade

`ChargebackLost` triggers a debit against the tenant's wallet for the disputed
amount PLUS the gateway's chargeback fee (typically $15).
