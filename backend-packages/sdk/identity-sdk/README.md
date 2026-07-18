# academorix/identity-sdk

Typed Saloon SDK for the Identity service — auth, MFA, sessions, OAuth clients, service accounts, JWKS.

Per-service umbrella SDK built on the shared kernel (`academorix/api-sdk`).
It owns the Identity service connector (config `sdk.identity.*`), a typed
`IdentitySdk` client, and a discovery pass scoped to
`#[AsSdkResource(service: 'identity')]`.

## Usage

```php
use Academorix\IdentitySdk\Client\IdentitySdk;

$identity = app(IdentitySdk::class);
$identity->someResource()->find($id);
```

## Resources

Per-module resource packages live under
`apps/identity-service/src/modules/<module>/sdk/` and are auto-discovered.
Scaffold one with:

```bash
./scripts/new-module-sdk.sh identity <module>
```

## Config

`config/identity-sdk.php` (publish tag `identity-sdk-config`). Every value is
env-driven under `SDK_IDENTITY_*` — set at minimum `SDK_IDENTITY_BASE_URL` and
`SDK_IDENTITY_TOKEN`.
