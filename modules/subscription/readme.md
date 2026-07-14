# subscription

Workspace subscription lifecycle. Wave 5 infrastructure. Wraps `laravel/cashier`.

## 1. What this module owns

| Concern | Owned artefact |
| --- | --- |
| Per-Application plan catalogue | `Plan` (with `default_entitlements` map) |
| Workspace's active subscription | `Subscription` (wraps Cashier's model) |
| Lifecycle audit trail | `SubscriptionEvent` (7-year SOX retention) |
| Cashier webhook consumption | `SyncFromCashierWebhookJob` |
| Grace period beyond provider default | `DunningOrchestrator` binding |
| Metered usage export | `ReportMeteredUsageJob` (calls Cashier's `reportUsage()`) |
| Enterprise contract offline billing | `EnterpriseInvoice` shape (no Cashier) |

## 2. How Application + Workspace + Plan + Subscription + Entitlements interact

```
Application (Academorix Academy)
├── payment_provider: 'stripe' | 'paddle'          ← immutable per-Application choice
├── Plans[]                                        ← catalogue per-Application
│   ├── academy_free            (default_entitlements: { free tier caps })
│   ├── academy_team_monthly    (stripe_price: 'price_xxx',  default_entitlements: { team })
│   ├── academy_team_annual     (stripe_price: 'price_yyy')
│   └── academy_enterprise      (billing_mode: 'invoice',  contract-negotiated)
└── Workspaces[]                                   ← workspaces under this Application
      │
      ├── Cashier's Billable trait                 ← stores stripe_id / pm_type on workspaces table
      │
      ├── Subscription (one active per workspace)  ← THIS MODULE'S entity
      │   ├── plan_id  (references OUR Plan)
      │   ├── provider_subscription_id  (Cashier's stripe_id / paddle_id)
      │   ├── state: trialing / active / past_due / unpaid / canceled / suspended
      │   ├── billing_cycle: monthly / annual / lifetime
      │   ├── trial_ends_at
      │   ├── grace_ends_at   (our extended grace, beyond Cashier's `ends_at`)
      │   └── suspended_at    (feature restrictions kick in)
      │
      ├── SubscriptionEvent[]                       ← audit-material transitions (7y SOX)
      │
      └── Entitlement[]                             ← resolved by entitlements module
          ← Plan.default_entitlements + workspace.entitlement_overrides
```

## 3. Cashier — what it does + what we do

**Cashier owns (payment provider handles under it):**
- Payment method capture (Stripe Elements, Paddle Checkout)
- Recurring charge attempts + Smart Retries + 3DS / SCA
- Dunning emails (branded, configurable in Stripe dashboard)
- Invoice generation, hosted URL, PDF
- Tax calculation (Stripe Tax / Paddle handles VAT as merchant of record)
- Chargebacks + refunds
- Customer portal (`$workspace->redirectToBillingPortal()`)

**We own (via Cashier webhook consumption + our own state):**
- Plan catalogue per Application
- Plan → Entitlement sync (via entitlements module listener)
- Grace period logic beyond provider (7-day past_due banner → 14-day feature restrictions → 21-day full suspension)
- Workspace-state mapping (subscription state → workspace status)
- Metered usage export (call `subscription->reportUsage()` at period end)
- Product emails (upgrade success, cap warnings) via `notifications-mail`
- Enterprise contracts (annual PO invoices, offline processed — bypasses Cashier)

## 4. Provider selection per Application

Each `Application` has a `payment_provider` column set at creation. All workspaces under that Application use the same provider. The `SubscriptionServiceProvider` boots the appropriate Cashier variant based on the resolved Application.

**Config drives Cashier variant:**

```php
// config/cashier.php (Application-aware)
'default_provider' => env('CASHIER_DEFAULT_PROVIDER', 'stripe'),

'providers' => [
    'stripe' => [
        'billable_trait' => \Laravel\Cashier\Billable::class,
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],
    'paddle' => [
        'billable_trait' => \Laravel\Paddle\Billable::class,
        'seller_id' => env('PADDLE_SELLER_ID'),
        'auth_code' => env('PADDLE_AUTH_CODE'),
        'webhook_secret' => env('PADDLE_WEBHOOK_SECRET'),
    ],
],
```

`Workspace` uses both trait bundles as a `union` — the active one resolved via `CashierAdapter` binding at runtime based on `Workspace::application->payment_provider`.

## 5. Grace period (our extension over provider default)

Stripe defaults to 3-day `past_due` → `canceled`. We extend the lifecycle:

| Days past due | Provider state | Our workspace state | User impact |
| ---: | --- | --- | --- |
| 0 | `active` | `active` | Normal |
| 1–7 | `past_due` | `at_risk` | Banner + email reminders |
| 8–14 | `past_due` | `grace` | Feature restrictions (readonly for non-critical features) |
| 15–21 | `unpaid` | `suspended` | Full workspace suspension (login OK, everything else refused) |
| 22+ | `canceled` (Stripe) or forced by us | `cancelled` | Data retained 30d, then archive |

`AdvanceDunningStageJob` scans past_due subscriptions daily and progresses them through the stages.

## 6. Enterprise contracts (offline billing)

Some workspaces sign annual contracts paid via NET-30 PO invoices — not through Stripe. We support this via `Plan.billing_mode = 'invoice'`:

- No Cashier `stripe_id` created
- `Subscription.provider = 'invoice'`
- `EnterpriseInvoice` model tracks PO number, invoice date, due date, paid status
- No payment_method attached; renewal is manual + confirmed via `POST /api/v1/platform/subscriptions/{workspace}/enterprise-invoice`

## 7. Files

Standard blueprint plus `data/plans.json` (seed defaults per business_type).

## 8. What this module does NOT do

- **Doesn't process payments.** Cashier + Stripe/Paddle.
- **Doesn't send payment-failure emails.** Stripe/Paddle native (configurable).
- **Doesn't compute Entitlements.** We fire events; entitlements module reacts.
- **Doesn't own the workspace lifecycle.** Workspace suspension/archival is workspaces module; we set flags via events.
