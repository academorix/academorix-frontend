# academorix/api-sdk

Typed, attribute-driven SDK for the `apps/api` HTTP surface. Built on
[Saloon v3](https://docs.saloon.dev). Every domain module ships its own sibling
SDK package under `apps/api/src/modules/<domain>/sdk/`; this package
auto-discovers them at boot so `$api->tenancy()->find($id)` resolves without a
hard-coded resource list.

## Install

The consuming app requires the meta-package which transitively pulls in every
module's SDK sibling:

```bash
composer require academorix/api-sdk
```

Environment setup (usually in `.env` / doppler):

```dotenv
SDK_API_BASE_URL=https://api.academorix.com
SDK_API_TOKEN=<sanctum-personal-access-token>
SDK_API_AUTH_STRATEGY=bearer                 # or "api-key" / "none"
```

Optionally publish the config for env-specific overrides:

```bash
php artisan vendor:publish --tag=sdk-api-config
```

## Use

```php
use Academorix\ApiSdk\Contracts\ApiClientInterface;

final class ComplianceMiddleware
{
    public function __construct(
        private readonly ApiClientInterface $api,
    ) {}

    public function handle(Request $req, Closure $next): mixed
    {
        // Discovered via `#[AsSdkResource(name: 'tenancy')]` on
        // Academorix\ApiTenancySdk\TenancySdkResource — no hard
        // reference on this end.
        $tenant = $this->api->tenancy()->find($this->currentTenantId());

        //  $tenant is Academorix\ApiTenancySdk\Data\TenantData
        //  — the wire shape lives in the module's SDK sibling.

        return $next($req);
    }
}
```

Property access works too:

```php
$this->api->tenancy->find($id);
```

Explicit lookup for dynamic dispatch:

```php
$tenant = $this->api->resource('tenancy')->find($id);
```

## Architecture

```
┌───────────────────────────────┐
│   Consumer (any Laravel app)  │
│   → ApiClientInterface        │
└───────────────┬───────────────┘
                │  __call($name)
                ▼
┌───────────────────────────────┐
│   ApiClient (facade)          │
│   → SdkResourceRegistry       │
└───────────────┬───────────────┘
                │  discovered at boot via
                │  #[AsSdkResource]
                ▼
┌───────────────────────────────┐
│   Module SDK Resource         │
│   (extends BaseSdkResource)   │
│   → send Saloon Request       │
└───────────────┬───────────────┘
                │  send()
                ▼
┌───────────────────────────────┐
│   ApiConnector (Saloon v3)    │
│   • Bearer/ApiKey/None auth   │
│   • CorrelationIdMiddleware   │
│   • RetryOnServerErrorMW      │
│   • LogRequestMiddleware      │
│   • ThrowOnFailureMiddleware  │
└───────────────┬───────────────┘
                │
                ▼   HTTP + typed exceptions
```

## Adding a new module resource

Inside your module's SDK sibling (e.g.
`apps/api/src/modules/<domain>/sdk/src/`):

```php
namespace Academorix\ApiTenancySdk;

use Academorix\ApiSdk\Attributes\AsSdkResource;
use Academorix\ApiSdk\Resources\BaseSdkResource;
use Academorix\ApiTenancySdk\Data\TenantData;
use Academorix\ApiTenancySdk\Requests\FindTenantRequest;

#[AsSdkResource(name: 'tenancy')]
final class TenancySdkResource extends BaseSdkResource
{
    public function find(string $id): TenantData
    {
        return $this->connector()->send(new FindTenantRequest($id))->dtoOrFail();
    }
}
```

Every `Request` extends `Academorix\ApiSdk\Requests\BaseSdkRequest` or Saloon's
`Saloon\Http\Request` directly:

```php
namespace Academorix\ApiTenancySdk\Requests;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\ApiTenancySdk\Data\TenantData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

final class FindTenantRequest extends BaseSdkRequest
{
    protected Method $method = Method::GET;

    public function __construct(
        public readonly string $tenantId,
    ) {}

    public function resolveEndpoint(): string
    {
        return "/api/v1/tenancy/tenants/{$this->tenantId}";
    }

    public function createDtoFromResponse(Response $response): TenantData
    {
        return TenantData::from($response->json());
    }
}
```

Nothing else to wire — `composer dump-autoload` rebuilds the attribute index,
discovery runs at the next boot, and `$api->tenancy()->find($id)` starts
working.

## Exception handling

Every failure surfaces as a typed exception:

```php
use Academorix\ApiSdk\Exceptions\{
    ApiRequestException,
    AuthenticationException,
    AuthorizationException,
    NetworkException,
    RateLimitException,
    ResourceNotFoundException,
    ServerException,
    ValidationException,
};

try {
    $tenant = $api->tenancy()->find($id);
} catch (ResourceNotFoundException) {
    // 404 — the tenant doesn't exist
} catch (ValidationException $e) {
    // 422 — inspect $e->errors() for the per-field map
} catch (RateLimitException $e) {
    // 429 — $e->retryAfterSeconds() tells you when to try again
} catch (AuthenticationException) {
    // 401 — token invalid / expired
} catch (AuthorizationException) {
    // 403 — token valid, not permitted
} catch (ServerException | NetworkException) {
    // 5xx / transport — the retry middleware already tried a few
    // times; treat as a transient failure
} catch (ApiRequestException $e) {
    // Any SDK failure (base class)
}
```

## Testing

Bind the fake in your test bootstrap:

```php
beforeEach(function () {
    config(['sdk.api.fake' => true]);
});

it('reads the tenant', function () {
    $api = app(ApiClientInterface::class);
    assert($api instanceof ApiFake);

    $api->stub('tenancy', new class extends BaseSdkResource {
        public function find(string $id): TenantData
        {
            return TenantData::from(['id' => $id, 'name' => 'Acme']);
        }
    });

    expect($api->tenancy()->find('01H...'))
        ->name->toBe('Acme');
});
```

## Middleware pipeline

Every outbound request flows through:

1. **Correlation-id injection** — reads
   `Academorix\Foundation\Support\CorrelationId::current()` and stamps
   `X-Correlation-ID` (or whatever `sdk.api.correlation_id.header` is set to).

2. **Retry** — 5xx and 429 responses trigger exponential backoff + jitter, up to
   `sdk.api.retry.max_attempts`. Respects `Retry-After` on 429 when configured.

3. **Logging** — structured logs with method / URL / status / duration_ms /
   redacted headers. Level configurable via `sdk.api.logging.level` (`off` /
   `errors` / `all`).

4. **Throw-on-failure** — every non-2xx response is converted to the matching
   typed exception (see the hierarchy above).

## Configuration reference

Every knob defaults to a sane production value. Full list in
`config/sdk-api.php`; here are the ones you'll touch most:

| Env                          | Default                      | What it does                        |
| ---------------------------- | ---------------------------- | ----------------------------------- |
| `SDK_API_BASE_URL`           | `http://api.academorix.test` | Base URL of the api.                |
| `SDK_API_TOKEN`              | —                            | Bearer token or API key value.      |
| `SDK_API_AUTH_STRATEGY`      | `bearer`                     | `bearer` / `api-key` / `none`.      |
| `SDK_API_TIMEOUT_REQUEST`    | `10.0`                       | Full round-trip timeout, seconds.   |
| `SDK_API_TIMEOUT_CONNECT`    | `3.0`                        | TCP handshake timeout, seconds.     |
| `SDK_API_RETRY_ENABLED`      | `true`                       | Toggle the retry middleware.        |
| `SDK_API_RETRY_MAX_ATTEMPTS` | `3`                          | Total attempts including the first. |
| `SDK_API_LOG_LEVEL`          | `errors`                     | `off` / `errors` / `all`.           |
| `SDK_API_FAKE`               | `false`                      | Bind `ApiFake` — for tests.         |
