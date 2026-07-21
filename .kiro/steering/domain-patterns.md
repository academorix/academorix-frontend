---
inclusion: fileMatch
fileMatchPattern: "**/*.php"
---

# Domain patterns — controllers, services, repositories, models, jobs

Per-layer conventions for the layered architecture declared in
`package-architecture.md`. Read that file first — it establishes the golden rule
(controller → service → repository → model) and the canonical package layout.
This file is the "how" for each layer.

## 1. Controllers

- One invokable controller per use case (`__invoke`) is preferred. Resource
  controllers acceptable when the actions are cohesive CRUD on a single entity.
- Mark the class with `#[AsController]` from `Stackra\Routing\Attributes` —
  the Routing package's `RouteRegistrar` discovers it at boot. NO route file
  needed.
- Extend `Stackra\Routing\BaseController` — it brings the traits
  (`InteractsWithAuth`, `InteractsWithRequest`, `InteractsWithResponse`,
  `InteractsWithPagination`, `InteractsWithResources`,
  `InteractsWithBulkOperations`, `InteractsWithDataTransformation`,
  `InteractsWithServices`) that every controller uses.
- Type-hint the **input `Data`** object — `spatie/laravel-data` auto-resolves +
  validates it from the request. See `data-first.md`.
- Inject services via the constructor. Never `app()` / `resolve()`.
- Return an **output `Data`** object (or a `JsonResponse` when an explicit
  status matters).
- Authorise via the `permissions` / `ability` / `role` fields on the HTTP-verb
  attribute (`#[Get]`, `#[Post]`, ...). Never inline role checks inside
  `__invoke()`.
- `final` — no controller subclassing.
- Fill in the OpenAPI fields (`summary`, `tags`, `responseSchema`,
  `responseCode`) — Scramble / the Routing package builds live OpenAPI from
  them.

```php
<?php

declare(strict_types=1);

namespace Stackra\Auth\Controllers;

use Stackra\Auth\Data\{AuthTokenData, LoginData};
use Stackra\Auth\Enums\AuthPermission;
use Stackra\Auth\Services\AuthenticationService;
use Stackra\Routing\Attributes\{AsController, Middleware, Post, Prefix};
use Stackra\Routing\BaseController;
use Illuminate\Http\JsonResponse;

/**
 * Authenticates credentials and issues a Sanctum bearer token.
 */
#[AsController]
#[Prefix('api/v1/auth')]
#[Middleware(['api', 'throttle:login'])]
final class LoginController extends BaseController
{
    /**
     * @param  AuthenticationService  $authentication  Login orchestration.
     */
    public function __construct(
        private readonly AuthenticationService $authentication,
    ) {}

    /**
     * @param  LoginData  $data  Validated credentials (auto-hydrated).
     * @return JsonResponse  Issued token + compact user representation.
     */
    #[Post(
        uri: '/login',
        name: 'auth.login',
        summary: 'Authenticate with email + password',
        tags: ['Auth'],
        requestSchema: 'Login',
        responseSchema: AuthTokenData::class,
        responseCode: 200,
    )]
    public function __invoke(LoginData $data): JsonResponse
    {
        $issued = $this->authentication->login($data);

        return response()->json(AuthTokenData::from($issued), JsonResponse::HTTP_OK);
    }
}
```

## 2. Services

- One service per cohesive use-case group. Implementation `<Concept>Service`;
  contract `<Concept>ServiceInterface` in `Contracts/`.
- Inject repository **contracts** and other services. No Eloquent, no HTTP, no
  `request()`, no direct `Auth::` / `Session::` calls.
- Accept input `Data` (or scalars / value objects); return domain results
  (models, value objects, or output `Data`).
- Throw domain / Stackra exceptions on failure paths. Never return
  `['success' => false, 'error' => '...']` shapes.
- Wrap multi-write operations in `DB::transaction()`.
- `final` — services are leaves in the dependency graph.

```php
final class AuthenticationService implements AuthenticationServiceInterface
{
    /**
     * @param  UserRepositoryInterface  $users     User persistence boundary.
     * @param  AccountLockoutService    $lockout   Brute-force lockout policy.
     * @param  LoginRiskScorer          $risk      Rule-based risk scoring.
     */
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly AccountLockoutService $lockout,
        private readonly LoginRiskScorer $risk,
    ) {}

    /**
     * Verify credentials and issue an access token.
     *
     * @throws \Stackra\Exceptions\Auth\AuthenticationException
     * @throws \Stackra\Exceptions\Domain\TenantException
     */
    public function login(LoginData $data): IssuedToken
    {
        // Business orchestration only — data access via $this->users.
    }
}
```

## 3. Actions (optional)

Use an Action for a **single discrete operation** worth naming
(`IssueAccessToken`, `RevokeUserSessions`, `SendInvoiceEmail`). Services
orchestrate; Actions execute one step.

- Named `<Verb><Noun>` — `IssueAccessToken`, not `TokenIssuer`.
- Single `public function handle(...)` method.
- `final` and injected via the container.
- If a use case is one write, an Action alone is fine — no wrapping service
  needed.

```php
final class IssueAccessToken
{
    public function __construct(
        private readonly Clock $clock,
    ) {}

    public function handle(User $user, string $deviceName): IssuedToken
    {
        $token = $user->createToken($deviceName);

        return new IssuedToken(
            plainText: $token->plainTextToken,
            issuedAt: $this->clock->now(),
            tokenId: $token->accessToken->id,
        );
    }
}
```

## 4. Repositories + Contracts

Every repository AND every CRUD-style service is a contract (interface) plus an
implementation, Magento 2 / Laravel convention:

- **Interface** carries an `Interface` suffix and lives in `Contracts/`.
- **Implementation** carries a clean domain name (NO `Eloquent` / `Doctrine` /
  `Db` prefix) and lives in `Repositories/`.
- The layer above depends on the **interface**, never the concrete.
- Both are bound to their implementations via `#[Bind]` on the concrete —
  auto-registered by `AbstractModuleServiceProvider`'s attribute scanner.
- Repositories are the **only** classes allowed to call Eloquent / query
  builder.
- Default ordering is explicit (`latest()`, `orderByDesc('id')`) — never rely on
  implicit row order.

```php
<?php

declare(strict_types=1);

namespace Stackra\User\Contracts;

use Stackra\User\Models\User;

/**
 * Persistence boundary for {@see User} records.
 *
 * The layer above (services / actions) depends on this interface
 * and NEVER on the concrete `UserRepository`. That's the seam
 * that makes services unit-testable without a DB.
 */
interface UserRepositoryInterface
{
    /**
     * Find a user by email address.
     *
     * @param  string  $email  Email to match — normalised (lowered) inside.
     * @return User|null  The user, or null when none matches.
     */
    public function findByEmail(string $email): ?User;

    /**
     * Persist a new user.
     *
     * @param  array<string, mixed>  $attributes  Mass-assignable.
     * @return User  The created + persisted user.
     */
    public function create(array $attributes): User;
}
```

```php
<?php

declare(strict_types=1);

namespace Stackra\User\Repositories;

use Stackra\User\Contracts\UserRepositoryInterface;
use Stackra\User\Models\User;
use Illuminate\Container\Attributes\Bind;

/**
 * Database-backed {@see UserRepositoryInterface}.
 *
 * `#[Bind]` wires this concrete to the contract without a manual
 * `$this->app->bind(...)` inside the service provider — the
 * package provider's attribute scanner picks it up at boot.
 */
#[Bind(UserRepositoryInterface::class)]
final class UserRepository implements UserRepositoryInterface
{
    public function findByEmail(string $email): ?User
    {
        return User::query()
            ->where('email', strtolower($email))
            ->first();
    }

    public function create(array $attributes): User
    {
        return User::query()->create($attributes);
    }
}
```

## 5. Models — attribute-first

Use PHP 8 attributes for every model configuration knob. See `php-attributes.md`
for the full catalogue. Cheat sheet:

| Attribute               | Replaces                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `#[Table(name)]`        | `$table`, `$primaryKey`, `$keyType`, `$incrementing`, `$timestamps`, `$dateFormat` |
| `#[Fillable(...)]`      | `$fillable`                                                                        |
| `#[Hidden(...)]`        | `$hidden` (for secrets)                                                            |
| `#[Appends(...)]`       | `$appends`                                                                         |
| `#[Connection(name)]`   | `$connection`                                                                      |
| `#[UseFactory(class)]`  | `newFactory()` override                                                            |
| `#[UsePolicy(class)]`   | `AuthServiceProvider::$policies` map                                               |
| `#[ObservedBy(class)]`  | `Model::observe(...)` in a provider                                                |
| `#[ScopedBy(class)]`    | Global-scope registration in `boot()`                                              |
| `#[Scope]` on a method  | `scopeXxx()` prefixed method                                                       |
| `#[CollectedBy(class)]` | `newCollection()` override                                                         |

Rules:

- Always define `#[Fillable(...)]` OR `#[Guarded(...)]` — never `$fillable = []`
  implicit.
- Always add `#[Hidden(...)]` for any column that carries secrets or PII. The
  `Redactor` runs on top, but the model's own hidden list is the FIRST line of
  defence.
- Cast in the `casts()` method; enum / state / date casts belong there. Never
  use the old `$casts` array.
- Rich `@property` docblock for every DB column + cast — drives IDE + PHPStan +
  Larastan.
- Keep `use HasFactory` and add `#[UseFactory(...)]`; drop the manual
  `newFactory()`.
- Tenant-owned models use `Stancl\Tenancy\Database\Concerns\BelongsToTenant`
  - `HasUuids`; `tenant_id` is NOT in `#[Fillable]` (auto-filled in tenant
    context; set explicitly in central context).
- Relations are typed and documented: `@return HasMany<Related, $this>`.
- Local query scopes use `#[Scope]`; NO business logic on the model.

```php
#[Table('branches', keyType: 'string')]
#[Connection('billing')]
#[Fillable('organization_id', 'name', 'status')]
#[Hidden('external_reference')]
#[UseFactory(BranchFactory::class)]
#[UsePolicy(BranchPolicy::class)]
#[ObservedBy([BranchObserver::class, AuditObserver::class])]
#[ScopedBy(TenantScope::class)]
final class Branch extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use HasUuids;

    /**
     * Only branches whose status is `Active`.
     */
    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('status', BranchStatus::Active);
    }

    /**
     * @return HasMany<Session, $this>
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['status' => BranchStatus::class];
    }
}
```

## 6. Enums

- Backed enums (`: string`) — always. Never pure enums.
- **TitleCase** cases.
- Add behaviour via methods (`label()`, `color()`).
- Keep a `values()` helper when the enum is used in validation `in:` rules.

```php
enum BranchStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Archived = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Inactive => 'Inactive',
            self::Archived => 'Archived',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
```

## 7. Events + Listeners

- **Auto-discovery is OFF.** Map each event to its listeners in the package's
  `EventServiceProvider` (or the main provider's `$listen` map) — explicit,
  `event:cache` safe.
- Events fired inside a transaction implement `ShouldDispatchAfterCommit`.
- Listeners doing non-trivial work `implements ShouldQueue` and set
  `public $afterCommit = true`.
- Events are **immutable data carriers** — `readonly` promoted properties.

```php
final class BranchCreated implements ShouldDispatchAfterCommit
{
    public function __construct(public readonly Branch $branch) {}
}
```

## 8. Jobs — tenant-aware, retry-configured

- `implements ShouldQueue`; use
  `Dispatchable, InteractsWithQueue, Queueable, SerializesModels`.
- Configure retry / backoff / timeout via **attributes** (see
  `php-attributes.md`), not properties:

  ```php
  #[Queue('billing')]
  #[Timeout(120)]
  #[Tries(3)]
  #[Backoff(10, 30, 60)]
  #[FailOnTimeout]
  ```

- `retry_after` (queue config) MUST exceed `#[Timeout]`.
- Add `ShouldBeUnique` + `#[UniqueFor(seconds)]` when duplicates are possible.
- Always implement `failed(\Throwable $e): void` — even if the body is empty,
  log intent to reason later.
- **Tenancy.** Jobs dispatched inside a tenant context are re-scoped to that
  tenant on the worker by stancl's queue bootstrapper (enabled in
  `config/tenancy.php`). Pass tenant-scoped model IDs, NOT cross-tenant queries.
  Jobs that must run centrally are dispatched outside any tenant context.
- `final` — no job subclassing.

```php
#[Queue('billing')]
#[Timeout(60)]
#[Tries(3)]
#[Backoff(10, 30, 60)]
#[FailOnTimeout]
final class GeocodeBranchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly string $branchId) {}

    public function handle(BranchRepositoryInterface $branches, Geocoder $geocoder): void
    {
        $branch = $branches->findOrFail($this->branchId);

        // ...
    }

    public function failed(\Throwable $e): void
    {
        // Report / compensate. Never `throw` from here.
    }
}
```

## 9. Scheduling

Register schedules from the package's service provider:

```php
$this->callAfterResolving(Schedule::class, function (Schedule $schedule): void {
    $schedule->job(new PruneExpiredSessionsJob)
        ->hourly()
        ->withoutOverlapping()
        ->onOneServer()
        ->environments(['production', 'staging']);
});
```

Rules:

- `withoutOverlapping()` on any variable-duration task.
- `onOneServer()` on multi-server deployments.
- `environments(['production', 'staging'])` to restrict where the schedule runs.

## 10. Observers, Policies, Notifications, Exceptions, Console

- **Observers** — wired via `#[ObservedBy]` on the model. Keep side effects
  idempotent — an observer may fire twice under retry.
- **Policies** — wired via `#[UsePolicy]` on the model. Authorise every write
  action.
- **Notifications / Mailables** — `implements ShouldQueue`, always queued.
  Respect `HasLocalePreference` on the notifiable so locale-aware copy works.
- **Exceptions** — extend `\Stackra\Exceptions\Exception`. Every
  subclass declares `public const CODE` + `public const TRANSLATION_KEY`
  - severity / category / status defaults. See
    `packages/exceptions/RECOMMENDATIONS.md`.
- **Console commands** — use `#[Signature]` / `#[Description]` / `#[Aliases]`
  attributes (see `php-attributes.md`). Register via the package provider's
  `$commands` array.

## 11. Testing — one file per use case

- **Feature tests** are split by use case, one class per file: `LoginTest`,
  `RegisterTest`, `LogoutTest`, `TwoFactorLoginTest`, `AccountLockoutTest` — NOT
  a single `AuthTest`.
- Namespace `Stackra\<Name>\Tests\Feature`; extend `Tests\TestCase`; use
  `RefreshDatabase` (project convention).
- Test method names describe behaviour:
  `it('locks the account after five failed attempts')`.
- Cover happy path, every failure path, and edge cases.
- **Unit tests** (`tests/Unit`) cover services, actions, repositories (against a
  real / faked boundary), and Data validation in isolation.
- Use factories + factory states; never hand-build models. Use fakes
  (`Event::fake()`, `Queue::fake()`) **after** factory setup.
- Tenant-scoped tests initialise tenancy in `beforeEach` and end it in
  `afterEach`.

## 12. Anti-patterns

| Anti-pattern                                                  | Preferred                                                                                                                                      |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `Model::query()` inside a controller                          | Controller calls a service → repository                                                                                                        |
| Business logic inside a model                                 | Extract to a service / action                                                                                                                  |
| `FormRequest` subclass                                        | `Data` DTO with property-level validation attributes                                                                                           |
| `JsonResource` subclass                                       | `Data` DTO with typed properties, returned directly                                                                                            |
| `array $errors` returned from a service                       | Throw a domain exception; the JSON formatter converts to the wire shape                                                                        |
| `env('X')` inside a service / model / job                     | Read from `config('...')` (which reads env at boot). Env reads bypass config cache.                                                            |
| Global scope registered inside `boot()`                       | `#[ScopedBy(SomeScope::class)]` on the model                                                                                                   |
| Observer registered via `Model::observe()`                    | `#[ObservedBy(SomeObserver::class)]` on the model                                                                                              |
| Multi-file resource controller with 10 actions                | 10 invokable single-action controllers                                                                                                         |
| Public property on a service for state                        | Services are stateless — pass state via method arguments                                                                                       |
| Direct `Cache::` / `Log::` / `DB::` facade calls in a service | Inject the resolved dependency via `#[Cache]` / `#[Log]` / `#[DB]` container attribute                                                         |
| `event(new SomethingCreated(...))` inside a `DB::transaction` | `implements ShouldDispatchAfterCommit` on the event                                                                                            |
| Registering a route in a `routes/*.php` file (there are none) | Controller declares its route via `#[AsController]` + `#[Prefix]` + `#[Get]` / `#[Post]` / ... — Routing package auto-discovers it             |
| Extending `Illuminate\Routing\Controller` directly            | Extend `Stackra\Routing\BaseController` — brings the `InteractsWith*` traits                                                                |
| Manually building an OpenAPI spec file                        | Fill in `summary` / `tags` / `responseSchema` / `responseCode` on the HTTP-verb attribute; Scramble + the Routing package emit OpenAPI at boot |
