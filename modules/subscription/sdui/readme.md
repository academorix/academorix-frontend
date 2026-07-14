# subscription — SDUI blueprints

## Surfaces

### `screens/`

Workspace-facing.

- `subscription-page.screen.json` — the "My Subscription" landing page. Shows current plan, state, next invoice, invoice history, cancel button, plan-swap CTA.
- `checkout.screen.json` — the plan-comparison + checkout flow. Renders `plan-comparison-card` widgets side by side, POST /checkout on button, redirect to Cashier session URL.

### `resources/plan/`

Platform-admin plan catalogue CRUD.

- `list.screen.json` — filterable by Application + tier + is_public.
- `create.screen.json` / `edit.screen.json` — form for the ~15 Plan fields. `default_entitlements` rendered as a repeater linked to the entitlement registry.
- `show.screen.json` — read-only view + active_subscription_count + archive button.

### `resources/subscription/`

Platform-admin cross-workspace visibility.

- `list.screen.json` — filterable by state + tier + Application. Sortable by MRR, days_past_due.
- `show.screen.json` — full subscription detail + SubscriptionEvent timeline + force-state action.

### `widgets/`

- `plan-comparison-card.widget.json` — a single plan card (price, features, CTA). Used in checkout + pricing pages.
- `subscription-state-chip.widget.json` — colour-coded chip for the 8 states. Used in every list + detail page.
