# payment — SDUI blueprints

Blueprint declarations for the payment module's server-driven UI surfaces.

## Surfaces

### `resources/payment/`

Tenant-facing payment ledger. Customer sees own; admin + finance role see
tenant-wide.

- `list.screen.json` — filterable payment ledger with status chips + risk-score
  indicators + 3DS badges. Filters on status, provider, date range, customer_id,
  invoice_id, currency.
- `view.screen.json` — full detail on one payment: base fields + parent
  invoice + parent intent + payment_method summary + refunds accumulated + open
  disputes + linked transaction + billing snapshot. Includes admin-only "Manual
  capture" action for authorization-hold payments.

### `resources/payment-method/`

Customer-facing saved payment methods. Admin can view + soft-delete tenant-wide.

- `list.screen.json` — grid of saved methods with brand badges + last4 + expiry
  countdown + default toggle. Filter by provider + method_type + is_active.
- `add.screen.json` — SetupIntent flow. Multi-step: (1) pick provider (auto-
  selected if tenant has one default); (2) tokenize via provider SDK; (3)
  billing details form; (4) confirm.
- `remove.screen.json` — confirmation dialog for soft-delete. Warns about
  in-flight intents that would break. Dispatches provider-side detach.

### `resources/payment-intent/`

Live payment intent status. Primarily customer-facing (via own SDK) — admin sees
for support.

- `status.screen.json` — live-updating status view for a specific intent. Shows
  current state + next_action (3DS2 challenge redirect if applicable) + timeline
  of state transitions. Auto-refreshes via websocket
  (customer.{customerId}.payments channel).

### `resources/payment-dispute/`

Admin + finance dispute management surface.

- `list.screen.json` — unresolved-default filter; filterable by provider +
  reason + status. Includes evidence-due-soon badge on rows within 7 days of
  deadline.
- `submit-evidence.screen.json` — evidence review + submission flow. Shows
  auto-collected evidence (from CollectDisputeEvidenceJob) + allows admin to
  override fields + attach uncategorized_text. Dispatches
  SubmitDisputeEvidenceJob.
- `accept.screen.json` — concede-without-fighting flow. Confirmation dialog +
  note textarea. Dispatches refund via refund module + transitions dispute
  status.

### `resources/payment-provider/`

Admin + owner provider config CRUD.

- `list.screen.json` — active providers grid with status chip + circuit- breaker
  badge + last-success indicator + fee estimate.
- `create.screen.json` — multi-step wizard: (1) pick provider from
  entitlement-filtered list; (2) credentials form (per-provider schema from
  data/providers/); (3) tenant-region routing (optional); (4) test event; (5)
  confirm.
- `edit.screen.json` — same fields as create, minus provider slug (immutable).
  Includes "Rotate credentials" flow.
- `test.screen.json` — send a synthetic test payment through the sandbox
  endpoint. Live-updates with result + latency + error details.
- `reconcile.screen.json` — on-demand reconciliation trigger. Shows the last
  reconcile timestamp + drift count history. Dispatches
  ReconcilePaymentIntentsJob.

### `widgets/`

- `payment-status-chip.widget.json` — colour-coded chip for
  payment_intent.status + payment implicit status (has_refund / has_dispute).
- `method-brand-badge.widget.json` — small badge showing card brand icon + last4
  (`•••• 4242`) or wallet name.
- `dispute-status-chip.widget.json` — colour-coded chip for
  payment_dispute.status. Includes evidence-due countdown for needs_response
  state.
- `3ds-badge.widget.json` — small badge showing 3DS2 authentication result
  (authenticated = green shield, rejected = red, bypassed = yellow).
- `risk-score-indicator.widget.json` — visual indicator (0-100 scale) for
  payment.risk_score. Colour-coded (low = green, elevated = amber, highest =
  red).
