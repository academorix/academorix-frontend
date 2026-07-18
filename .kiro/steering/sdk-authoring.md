---
inclusion: manual
---

# SDK authoring standard — per-module SDK sub-packages

The canonical shape every per-module SDK sub-package under
`packages/sdk/<service>-<module>-sdk/` follows. Read before authoring a new
module SDK. Referenced by the SDK generator (`php artisan sdk:generate`, Stage 3
of `.kiro/specs/platform-service-implementation/`) — the generator's output MUST
match this shape byte-for-byte, and hand-authored pilots MUST match the shape
the generator would emit.

## Precedence

1. This file wins over generic Laravel-package guidance for SDK-shaped packages.
2. `.kiro/steering/docblocks.md` still applies — enterprise day-1 docblock
   discipline on every symbol.
3. `.kiro/steering/data-first.md` still applies — Spatie Data everywhere, no
   `FormRequest`, no `JsonResource`.
4. `.kiro/steering/php-attributes.md` still applies — attribute-first validation
   on payloads, `#[AsSdkResource]` on the entry.

## Package identity

- **Location:** `packages/sdk/<service>-<module>-sdk/`. Never inside
  `apps/<service>-service/src/modules/`. Per-module SDKs are shared packages
  consumed by every service, every product monolith, and the frontend — they
  belong alongside the kernel + service umbrellas in `packages/sdk/`.
- **Composer name:** `academorix-<service>/<module>-sdk`. Examples:
  `academorix-platform/application-sdk`, `academorix-platform/workspaces-sdk`,
  `academorix-identity/oauth-sdk`.
- **PSR-4 root:** `Academorix\<Service><Module>Sdk\` — PascalCase concatenation
  of service and module. Example: `Academorix\PlatformApplicationSdk\`.
- **Type:** `library`. **License:** `proprietary`.

## Folder layout — enforced convention

```
packages/sdk/<service>-<module>-sdk/
├── composer.json
├── phpstan.neon
├── phpunit.xml
├── README.md
├── src/
│   ├── Data/                   # response DTOs (read-side)
│   ├── Payloads/               # request-body DTOs (write-side)
│   │   └── <Aggregate>/        # one folder per aggregate
│   ├── Requests/               # Saloon HTTP-request transport classes
│   │   └── <Aggregate>/
│   ├── Resources/              # fluent domain façades — top + peers
│   ├── Enums/                  # wire enums (only if the schemas declare any)
│   └── Exceptions/             # domain-typed SDK exceptions (only if needed)
└── tests/
    ├── Pest.php
    ├── TestCase.php
    ├── Feature/
    │   ├── Data/               # one file per Data class
    │   ├── Payloads/           # one file per Payload class
    │   └── Resources/          # one file per Resource class
    └── Unit/
        └── Requests/           # one file per Saloon Request class
            └── <Aggregate>/
```

**All Resources — top-level entry AND peer Resources — live in the `Resources/`
folder together.** The top-level Resource is distinguished by its
`#[AsSdkResource(name, service)]` attribute, not by folder placement.

**Do NOT use `SubResources/`.** The prefix is misleading: peer resources (e.g.
`ApplicationsResource` and `BusinessTypesResource`) are NOT sub-resources of
each other in REST terms — they're peers. The kernel provides
`Resources/BaseSdkResource.php`; the module's own resource classes belong in the
same category folder.

**Do NOT use `Saloon/`.** Folder names describe what code IS, not which library
it uses. Saloon Request subclasses live in `Requests/`.

**Do NOT use `Requests/` for input DTOs.** That name is reserved for the
HTTP-request transport folder. Input DTOs live in `Payloads/`.

## Per-file contract

### `Data/*Data.php` — response DTOs (read-side)

- `final class` extending `Spatie\LaravelData\Data`.
- Class-level `#[MapInputName(SnakeCaseMapper::class)]` — server sends
  snake_case; DTO stores camelCase.
- Every column from the schema's `x-database.columns` becomes a property EXCEPT
  columns in `x-wire.hidden`.
- Every property is `public readonly`.
- Nullable columns: `?T $name = null`.
- Include a static `fromRecord(array $row): self` returning `self::from($row)`
  for explicit construction from raw wire responses (envelope-unwrap
  responsibility stays on the Request class).

### `Payloads/<Aggregate>/*Payload.php` — request-body DTOs (write-side)

- `final class` extending `Spatie\LaravelData\Data`.
- Class-level `#[MapName(SnakeCaseMapper::class)]` — bidirectional camelCase ↔
  snake_case.
- **Create payloads** — concrete required properties, standard validation
  attributes: `#[Required, StringType, Max(...), Regex(...)]`, etc.
- **Update payloads** — partial-update semantics via `Optional` sentinels: every
  property is `T|Optional|null $name = new Optional()`. Spatie's `->toArray()`
  strips `Optional` values so unmentioned fields don't clear server data.
- **NO `rules()` method. NO `messages()` method.** Validation attributes on
  properties only.
- One file per operation × aggregate: `CreateApplicationPayload`,
  `UpdateApplicationPayload`, etc.

### `Requests/<Aggregate>/*Request.php` — HTTP transport (Saloon)

- Extend `Academorix\ApiSdk\Requests\BaseSdkRequest` from the kernel.
- Concrete classes declare ONLY what varies per endpoint: verb, path builder,
  payload, response DTO type.
- Never re-implement retry policy, correlation-ID header, bearer auth, or
  timeout logic — the kernel connector handles all of that.
- **Every mutation (POST/PATCH/PUT/DELETE) supports `Idempotency-Key`.**
  Constructor takes `?string $idempotencyKey = null`; header set via
  `defaultHeaders()` when non-null. Reads (GET) do not.
- Response envelope handling in `createDtoFromResponse()`: unwrap
  `payload['data']` when present, fall back to the whole body otherwise.

Canonical shape:

```php
final class UpdateApplicationRequest extends BaseSdkRequest implements HasBody
{
    use HasJsonBody;

    protected Method $method = Method::PATCH;

    public function __construct(
        public readonly string $id,
        public readonly UpdateApplicationPayload $payload,
        public readonly ?string $idempotencyKey = null,
    ) {}

    public function resolveEndpoint(): string
    {
        return '/api/v1/applications/' . rawurlencode($this->id);
    }

    /** @return array<string, mixed> */
    protected function defaultBody(): array
    {
        return $this->payload->toArray();
    }

    /** @return array<string, string> */
    protected function defaultHeaders(): array
    {
        return $this->idempotencyKey !== null
            ? ['Idempotency-Key' => $this->idempotencyKey]
            : [];
    }

    public function createDtoFromResponse(Response $response): ApplicationData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return ApplicationData::from($body);
    }
}
```

### `Resources/<Module>SdkResource.php` — the module entry point

- `final class` extending `Academorix\ApiSdk\Resources\BaseSdkResource`.
- Carries **`#[AsSdkResource(name: '<module>', service: '<service>')]`** — the
  discovery attribute the service umbrella scans for at boot.
- Owns NO HTTP calls. Its only job: lazily construct + cache the peer Resources
  and expose them via typed accessor methods.
- Lazy-cache pattern: nullable property per peer, `??=` assignment in the
  accessor.

Canonical shape:

```php
#[AsSdkResource(name: 'application', service: 'platform')]
final class ApplicationSdkResource extends BaseSdkResource
{
    private ?ApplicationsResource $applications = null;
    private ?BusinessTypesResource $businessTypes = null;

    public function applications(): ApplicationsResource
    {
        return $this->applications ??= new ApplicationsResource($this->connector());
    }

    public function businessTypes(): BusinessTypesResource
    {
        return $this->businessTypes ??= new BusinessTypesResource($this->connector());
    }
}
```

### `Resources/<Aggregate>Resource.php` — peer Resources

- `final readonly class` (stateless holder of a connector reference).
- NO `#[AsSdkResource]` attribute — only the top-level Resource has it.
- Constructor takes a single `ApiConnector` from the kernel.
- One public method per endpoint. Method names domain-oriented, not
  HTTP-verb-oriented (`show()` / `list()` / `create()` / `update()` /
  `delete()`, not `getShow()` / `postCreate()`).
- Every mutation method takes an optional `?string $idempotencyKey = null` last
  argument and threads it into the Saloon Request.
- Every method returns a typed DTO (never `array`, never `mixed`).
- Full docblocks per `docblocks.md`.

**When to split into multiple peer Resources per aggregate.** Split into
`<Aggregate>Resource` (public) + `<Aggregate>AdminResource` (admin) when the
aggregate has both audiences. Never split for other reasons.

### `Enums/*.php` — wire enums

- Backed enums (`: string`) for closed-set wire values.
- Compose `use Enum;` from `academorix/enum`.
- Only author enums for values that appear in `x-database.columns.*.enum` in the
  schema — do not author enums the schema doesn't declare.

### `Exceptions/*.php` — domain-typed errors

- Only if the module has specific error codes worth typing (e.g.,
  `ApplicationSlugTakenException`). Extend
  `Academorix\ApiSdk\Exceptions\ApiRequestException` (or a closer kernel base).
- If none needed, do not create the folder.

## Docblock discipline (per `docblocks.md`)

- Every file, every symbol — class, interface, method (public + protected
  - private), property, constant.
- Class docblock uses `## What this class owns` heading for multi-facet classes.
- Every class gets `## Example` with fenced ` ```php ` block using the real
  public import path.
- Every class gets `@category <Service><Module>Sdk` + `@since 0.1.0` —
  Magento-style tags on shared library code.
- Method docblocks: one-line summary + `@param` (only where the type doesn't
  fully self-document) + `@return` + `@throws` for every raise path + `@see` for
  cross-refs.
- Property docblocks: constructor-promoted → document via constructor `@param`;
  class-level (non-promoted) → `@var Type` docblock.
- Constant docblocks: mandatory. One exception per `docblocks.md`: `ATTR_*` on
  `Contracts/Data/*Interface` files (which SDKs don't ship).

## Testing standard

Unit + feature tests per Pest v4 conventions in `.kiro/steering/testing.md`:

- `tests/Feature/Data/<Entity>DataTest.php` — canonical wire payload parses
  correctly; hidden columns never surface.
- `tests/Feature/Payloads/<Op><Aggregate>PayloadTest.php` — validation rules
  fire (required, max lengths, patterns); `Optional` sentinels strip via
  `->toArray()`.
- `tests/Feature/Resources/<Resource>Test.php` — end-to-end within the SDK via
  `MockClient`. Assert HTTP request shape (URL, verb, headers, body) + typed
  response DTO hydration.
- `tests/Unit/Requests/<Aggregate>/<Request>Test.php` — one file per Saloon
  Request. Assert `resolveEndpoint()`, `defaultBody()`, `defaultHeaders()`.
- Descriptive Pest names:
  `it('strips Optional sentinels from partial updates', ...)`.
- Coverage target: **90%+**.

## Anti-patterns — reject in review

| Anti-pattern                                                      | Preferred                                                                                                                                                 |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SubResources/` folder                                            | `Resources/` (one folder for all Resource-shaped classes)                                                                                                 |
| `Saloon/` folder                                                  | `Requests/` (folder describes concern, not library)                                                                                                       |
| `Requests/` folder for input DTOs                                 | `Payloads/` (frees `Requests/` for HTTP transport)                                                                                                        |
| `*RequestData.php` naming for input DTOs                          | `*Payload.php` (drops the double-request)                                                                                                                 |
| Top-level Resource at `src/` root                                 | In `Resources/` alongside peers (discovery is by attribute)                                                                                               |
| Peer Resource with `#[AsSdkResource]`                             | Only the top-level Resource has the attribute                                                                                                             |
| Re-implementing correlation-id / retry / auth in a Saloon Request | Kernel handles it via the connector; concrete Requests declare only verb / path / payload / response DTO                                                  |
| `array` return from a Resource method                             | Typed DTO (`ApplicationData`, `PaginatedResponse<ApplicationData>`)                                                                                       |
| Missing `Idempotency-Key` support on a mutation Request           | Constructor accepts `?string $idempotencyKey = null`                                                                                                      |
| `rules()` method on a Payload                                     | Property-level validation attributes                                                                                                                      |
| Duplicating a Data class for read + write                         | Read side = `Data/<Entity>Data.php` (nullable); write side = `Payloads/<Aggregate>/<Op><Aggregate>Payload.php` (with `Optional` sentinels) — always split |

## Generator alignment (Stages 2-5)

The SDK generator (`php artisan sdk:generate <service>`, Stage 3) emits into
this exact shape. Concrete rules:

- Every server-side class marked `#[SdkResource(...)]` produces one file under
  `Data/`.
- Every server-side class marked `#[SdkPayload(...)]` produces one file under
  `Payloads/<Aggregate>/`.
- Every server-side action marked `#[SdkEndpoint(...)]` produces one file under
  `Requests/<Aggregate>/`.
- Aggregate groupings and peer Resource files are emitted from the union of
  `SdkEndpoint(resource: ...)` values.
- The top-level `<Module>SdkResource.php` is emitted with lazy accessors for
  every distinct aggregate.

CI runs `php artisan sdk:diff` on every PR — if the committed SDK doesn't match
what regeneration would produce from server-side attributes, CI fails. That's
the drift check.

## Related

- `.kiro/steering/docblocks.md` — docblock coverage standard.
- `.kiro/steering/data-first.md` — Spatie Data patterns.
- `.kiro/steering/php-attributes.md` — attribute-first authoring.
- `.kiro/steering/folder-conventions.md` — one-export-per-file + folder
  categories.
- `.kiro/steering/testing.md` — Pest v4 test layout.
- `.kiro/specs/platform-service-implementation/README.md` — the phased build
  plan that consumes this standard.
- `packages/sdk/api-sdk/src/` — the kernel that every module SDK builds on.
- `packages/sdk/platform-application-sdk/` — the pilot reference implementation.
