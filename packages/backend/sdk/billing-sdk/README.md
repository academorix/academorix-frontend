# academorix/billing-sdk

Typed Saloon SDK for the Billing service — subscriptions, plans, invoices, licenses, usage, entitlements.

Per-service umbrella SDK built on the shared kernel (`academorix/api-sdk`).
It owns the Billing service connector (config `sdk.billing.*`), a typed
`BillingSdk` client, and a discovery pass scoped to
`#[AsSdkResource(service: 'billing')]`.

## Usage

```php
use Academorix\BillingSdk\Client\BillingSdk;

$billing = app(BillingSdk::class);
$billing->someResource()->find($id);
```

## Resources

Per-module resource packages live under
`apps/billing-service/src/modules/<module>/sdk/` and are auto-discovered.
Scaffold one with:

```bash
./scripts/new-module-sdk.sh billing <module>
```

## Config

`config/billing-sdk.php` (publish tag `billing-sdk-config`). Every value is
env-driven under `SDK_BILLING_*` — set at minimum `SDK_BILLING_BASE_URL` and
`SDK_BILLING_TOKEN`.
