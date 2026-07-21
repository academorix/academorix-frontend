# Migration guide — cross-app HTTP → `stackra/api-sdk`

## For consumers replacing hand-rolled HTTP calls

**Before** — ad-hoc Guzzle / Http facade:

```php
$response = Http::withToken(config('services.api.token'))
    ->timeout(10)
    ->retry(3, 200)
    ->get(config('services.api.url') . '/api/v1/tenancy/tenants/' . $id);

if ($response->failed()) {
    throw new RuntimeException('Tenant lookup failed: ' . $response->status());
}

$tenant = $response->json();
$name   = $tenant['name'] ?? null;
```

**After** — typed SDK call:

```php
$tenant = $this->api->tenancy()->find($id);
$name   = $tenant->name;   // TenantData::$name — typed
```

Gains:

- One shared connector across the whole consumer app — auth, timeout, retry
  configured in one place.
- Correlation-id automatically threaded to `apps/api`'s logs.
- Typed exceptions per HTTP status (401/403/404/422/429/5xx).
- Mockable at the container level for tests (no HTTP fakes).

## For module owners exposing a new SDK resource

1. Create the SDK sibling composer package under
   `apps/api/src/modules/<yourmodule>/sdk/`:

   ```
   sdk/
   ├── composer.json                     # name: stackra-api/<yourmodule>-sdk
   └── src/
       ├── <Module>SdkResource.php       # #[AsSdkResource(name: '<yourmodule>')]
       ├── Data/*.php                    # Wire-visible DTOs
       ├── Enums/*.php                   # Wire-visible enums
       ├── Requests/*.php                # One Saloon Request per endpoint
       └── Exceptions/*.php              # Optional domain-specific exceptions
   ```

2. Have the meta-SDK depend on it — add
   `"stackra-api/<yourmodule>-sdk": "@dev"` to
   `packages/sdk/api-sdk/composer.json`'s `require`.

3. Run `composer dump-autoload` in every consuming app so the collector rebuilds
   its index.

4. Consumers get `$api->{$yourmodule}()` automatically at the next boot.

## For controllers on the server side

The server SHOULD import the wire shapes from the SDK sibling so server + client
can't drift:

```php
namespace Stackra\Tenancy\Controllers;

use Stackra\ApiTenancySdk\Data\TenantData;   // <- from the SDK sibling
use Stackra\Tenancy\Services\TenantService;

final class TenantController
{
    public function show(string $id, TenantService $service): TenantData
    {
        return TenantData::from($service->find($id));
    }
}
```

The DTO is defined once, consumed by both sides.

## Rollout order

1. Ship `packages/sdk/api-sdk/` (this package).
2. Extract wire shapes from `apps/api/src/modules/tenancy/src/Data/*` into
   `apps/api/src/modules/tenancy/sdk/src/Data/*` (namespace
   `Stackra\ApiTenancySdk\Data\*`).
3. Ship `TenancySdkResource` with `#[AsSdkResource(name: 'tenancy')]`.
4. Register the sibling in `packages/sdk/api-sdk/composer.json`'s `require`.
5. Bump `apps/ai-service/composer.json` to require `stackra/api-sdk` and use
   `$this->api->tenancy()` for cross-service calls.
6. Repeat 2-4 for every other module that has a public HTTP surface (`access`,
   `ai`, …).
