# finance/invoice — Phase 3 implementation status

## Status: SCAFFOLDED — Actions return `null`

## Implementation plan

Invoices are aggregate objects: an `Invoice` has many `InvoiceLine`s and carries
a status (`draft` / `open` / `paid` / `void` / `uncollectible`). Every write
happens inside a `DB::transaction` so the aggregate stays consistent.

### Actions to fill (28 total)

Standard CRUD + these domain-specific actions:

| Action                    | Contract                                         | Notes                                                                                                                                                |
| ------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CreateInvoiceAction`     | `POST /api/v1/invoices`                          | Compute lines + tax + adjustments (coupon, credit, discount). Sums to `amount_due`. Persist Invoice + InvoiceLines + Adjustments in one transaction. |
| `IssueInvoiceAction`      | `POST /api/v1/invoices/{invoice}/issue`          | Draft → Open. Dispatch `InvoiceIssued`. Trigger PDF render (via `finance/storage`) + email delivery.                                                 |
| `PayInvoiceAction`        | `POST /api/v1/invoices/{invoice}/pay`            | Delegate to `finance/payment::CreatePayment`, wire `payments.invoice_id`. Idempotent — safe to retry.                                                |
| `VoidInvoiceAction`       | `POST /api/v1/invoices/{invoice}/void`           | Mark void; refund any partial payment; adjust `finance/transaction` ledger.                                                                          |
| `MarkUncollectibleAction` | `POST /api/v1/invoices/{invoice}/uncollectible`  | Admin bad-debt write-off path.                                                                                                                       |
| `RenderInvoicePdfAction`  | `GET /api/v1/invoices/{invoice}/pdf`             | Render via a `PdfRenderer` service (browserless / DomPDF). Streamed response.                                                                        |
| `AddInvoiceLineAction`    | `POST /api/v1/invoices/{invoice}/lines`          | Refused when invoice is not in `draft` status.                                                                                                       |
| `UpdateInvoiceLineAction` | `PATCH /api/v1/invoices/{invoice}/lines/{line}`  | Same guard.                                                                                                                                          |
| `DeleteInvoiceLineAction` | `DELETE /api/v1/invoices/{invoice}/lines/{line}` | Same guard.                                                                                                                                          |
| `SendInvoiceEmailAction`  | `POST /api/v1/invoices/{invoice}/send`           | Route through `notifications::Dispatch`.                                                                                                             |

### Support services

- `InvoiceCalculator` (Actions/Support/) — pure computation folding lines +
  tax + discounts into a total.
- `InvoiceLineFactory` (Actions/Support/) — builds a line from a polymorphic
  purchasable (Membership plan, Pass, Booking, DayPass, ...).
- `PdfRenderer` (Services/) — Blade template + DomPDF (or browserless
  chrome-headless) → PDF stored in `finance/storage` bucket → signed URL.
- `InvoiceIssuer` (Services/) — orchestrates issue + PDF + email as one
  atomic-ish workflow (each step idempotent).

### Events to dispatch

- `InvoiceCreated` — after successful transaction commit.
- `InvoiceIssued` — draft → open. Triggers PDF render + email.
- `InvoicePaid` — payment succeeded. Wallet + entitlement listeners fire.
- `InvoiceVoided` — void path. Refund cascade.
- `InvoiceRefunded` — partial or full refund arrived from `finance/refund`.
- `InvoiceMarkedUncollectible` — bad-debt write-off.

### Coupon integration

At line creation, call `CouponRedeemerInterface::redeem` INSIDE the
invoice-creation transaction. This gives atomic invoice-plus-redemption commit
semantics (the redeemer joins the outer transaction).

### Tax integration

At line creation, call `TaxCalculator::compute` for each line and persist a
per-line `tax_amount_minor` snapshot — so downstream refunds know exactly how
much tax to reverse.
