# academorix/access-sdk

Typed Saloon SDK for the Access service — roles, permissions, policies, scopes, groups, invitations.

Per-service umbrella SDK built on the shared kernel (`academorix/api-sdk`).
It owns the Access service connector (config `sdk.access.*`), a typed
`AccessSdk` client, and a discovery pass scoped to
`#[AsSdkResource(service: 'access')]`.

## Usage

```php
use Academorix\AccessSdk\Client\AccessSdk;

$access = app(AccessSdk::class);
$access->someResource()->find($id);
```

## Resources

Per-module resource packages live under
`apps/access-service/src/modules/<module>/sdk/` and are auto-discovered.
Scaffold one with:

```bash
./scripts/new-module-sdk.sh access <module>
```

## Config

`config/access-sdk.php` (publish tag `access-sdk-config`). Every value is
env-driven under `SDK_ACCESS_*` — set at minimum `SDK_ACCESS_BASE_URL` and
`SDK_ACCESS_TOKEN`.
