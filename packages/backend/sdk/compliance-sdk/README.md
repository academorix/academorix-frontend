# academorix/compliance-sdk

Typed Saloon SDK for the Compliance service — DSAR, consent, retention, legal
holds, subprocessors, safeguarding.

Per-service umbrella SDK built on the shared kernel (`academorix/api-sdk`). It
owns the Compliance service connector (config `sdk.compliance.*`), a typed
`ComplianceSdk` client, and a discovery pass scoped to
`#[AsSdkResource(service: 'compliance')]`.

## Usage

```php
use Academorix\ComplianceSdk\Client\ComplianceSdk;

$compliance = app(ComplianceSdk::class);
$compliance->someResource()->find($id);
```

## Resources

Per-module resource packages live under
`apps/compliance-service/src/modules/<module>/sdk/` and are auto-discovered.
Scaffold one with:

```bash
./scripts/new-module-sdk.sh compliance <module>
```

## Config

`config/compliance-sdk.php` (publish tag `compliance-sdk-config`). Every value
is env-driven under `SDK_COMPLIANCE_*` — set at minimum
`SDK_COMPLIANCE_BASE_URL` and `SDK_COMPLIANCE_TOKEN`.
