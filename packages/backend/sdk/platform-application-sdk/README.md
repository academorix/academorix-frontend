# stackra-platform/application-sdk

Wire-visible SDK surface for the **`application`** module of the **Platform**
service. Ships:

- `src/Data/` — Spatie Data response DTOs (`ApplicationData`,
  `BusinessTypeData`).
- `src/Payloads/` — Spatie Data request-body DTOs (create + update payloads for
  both aggregates).
- `src/Requests/` — Saloon HTTP-transport request classes (one per endpoint).
- `src/Resources/` — fluent domain façades wrapping the requests (top-level
  `ApplicationSdkResource` + per-aggregate `ApplicationsResource`,
  `ApplicationsAdminResource`, `BusinessTypesResource`) (`ApplicationsResource`,
  `ApplicationsAdminResource`, `BusinessTypesResource`).
- `src/Enums/` — wire-visible enums (`BusinessTypeKey`).
- `src/ApplicationSdkResource.php` — the discovery-marked top-level resource
  (`#[AsSdkResource(name: 'application', service: 'platform')]`).

Consumed only over HTTP via the umbrella client:

```php
use Stackra\PlatformSdk\Client\PlatformSdk;

$platform = app(PlatformSdk::class);

// Public / central surface — no auth required.
$sports = $platform->application()->applications()->show('sports');

// Platform-admin surface — bearer token required.
$apps = $platform->application()->applicationsAdmin()->list();

// Every mutation supports `Idempotency-Key`.
$new = $platform->application()->applicationsAdmin()->create(
    new CreateApplicationPayload(
        slug: 'ticketing',
        name: 'Ticketing',
        centralHost: 'ticketing.stackra.app',
        platformAdminHost: 'admin.ticketing.stackra.app',
    ),
    idempotencyKey: 'idem-1',
);
```

## Endpoint coverage

| Verb   | Path                           | Audience         | Payload / Response                               |
| ------ | ------------------------------ | ---------------- | ------------------------------------------------ |
| GET    | `/api/v1/applications`         | `central`        | Paginated `ApplicationData[]`                    |
| GET    | `/api/v1/applications/{slug}`  | `central`        | `ApplicationData`                                |
| GET    | `/api/v1/applications`         | `platform-admin` | Paginated `ApplicationData[]`                    |
| GET    | `/api/v1/applications/{id}`    | `platform-admin` | `ApplicationData`                                |
| POST   | `/api/v1/applications`         | `platform-admin` | `CreateApplicationPayload` → `ApplicationData`   |
| PATCH  | `/api/v1/applications/{id}`    | `platform-admin` | `UpdateApplicationPayload` → `ApplicationData`   |
| DELETE | `/api/v1/applications/{id}`    | `platform-admin` | `204 No Content`                                 |
| GET    | `/api/v1/business-types`       | `platform-admin` | Paginated `BusinessTypeData[]`                   |
| GET    | `/api/v1/business-types/{key}` | `platform-admin` | `BusinessTypeData`                               |
| POST   | `/api/v1/business-types`       | `platform-admin` | `CreateBusinessTypePayload` → `BusinessTypeData` |
| PATCH  | `/api/v1/business-types/{key}` | `platform-admin` | `UpdateBusinessTypePayload` → `BusinessTypeData` |
| DELETE | `/api/v1/business-types/{key}` | `platform-admin` | `204 No Content`                                 |

## Folder convention

```
src/
├── ApplicationSdkResource.php   # #[AsSdkResource]-marked entry point
├── Data/                        # response DTOs (read side)
├── Payloads/                    # request-body DTOs (write side)
│   ├── Applications/
│   └── BusinessTypes/
├── Requests/                    # Saloon HTTP-transport classes
│   ├── Applications/
│   └── BusinessTypes/
├── Resources/                   # fluent domain façades — top-level SdkResource + per-aggregate Resources
└── Enums/                       # wire-visible enums
```

Renamed from the reference monolith SDK: `Requests/` → `Payloads/` (write-side
DTOs) and `Saloon/` → `Requests/` (HTTP-transport classes). Folders describe
what code IS, not which library it uses.

## Quality gates

```bash
composer install --prefer-dist --no-interaction
composer test        # Pest v4, 90%+ coverage
composer lint        # Pint clean
composer analyse     # PHPStan level max
```
