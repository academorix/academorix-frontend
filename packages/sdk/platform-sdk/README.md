# stackra/platform-sdk

Typed Saloon SDK for the Platform service — applications, tenants,
organizations, regions, branches, settings, feature flags, branding, domains,
storage.

Per-service umbrella SDK built on the shared kernel (`stackra/api-sdk`). It
owns the Platform service connector (config `sdk.platform.*`), a typed
`PlatformSdk` client, and a discovery pass scoped to
`#[AsSdkResource(service: 'platform')]`.

## Usage

```php
use Stackra\PlatformSdk\Client\PlatformSdk;

$platform = app(PlatformSdk::class);
$platform->someResource()->find($id);
```

## Resources

Per-module resource packages live under
`apps/platform-service/src/modules/<module>/sdk/` and are auto-discovered.
Scaffold one with:

```bash
./scripts/new-module-sdk.sh platform <module>
```

## Config

`config/platform-sdk.php` (publish tag `platform-sdk-config`). Every value is
env-driven under `SDK_PLATFORM_*` — set at minimum `SDK_PLATFORM_BASE_URL` and
`SDK_PLATFORM_TOKEN`.
