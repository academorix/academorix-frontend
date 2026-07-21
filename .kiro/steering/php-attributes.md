---
inclusion: fileMatch
fileMatchPattern: "**/*.php"
---

# PHP attributes — attribute-first code

We are an **attribute-first** codebase. When there is an attribute for a
concern, prefer it over the equivalent property, method, or runtime bootstrap.
Attributes make the class's public surface readable at a glance and let static
analysis + IDEs surface the same signals that runtime does.

## Decision — when to use an attribute

1. **Is there a shipped attribute for this concern?** Use it.
2. **Would multiple classes want the same declarative signal?** Author an
   attribute (see the "Custom attributes" section below).
3. **Is the concern conditional or dynamic per instance?** Keep it as a method /
   runtime call. Attributes are compile-time-ish metadata; don't force runtime
   behaviour into them.
4. **Does the concern live on a specific method or property?** Attributes prefer
   that placement over class-level flags with guard clauses inside the method
   body.

Anti-pattern list at the end.

## Catalogue overview

| Package            | Namespace                           | Count                             |
| ------------------ | ----------------------------------- | --------------------------------- |
| Laravel Framework  | `Illuminate\...`                    | 72                                |
| Laravel MCP        | `Laravel\Mcp\Server\...`            | 17                                |
| Stackra Routing | `Stackra\Routing\Attributes\...` | 28                                |
| PHP native         | root `#[...]`                       | ~10                               |
| Pest 4             | `Pest\...`                          | describe-style API, no attributes |

Grouped catalogues follow, one section per concern.

---

`

## Stackra Routing attributes (`Stackra\Routing\Attributes\...`)

**This is our primary controller-authoring surface.** Routes are defined ON THE
CONTROLLER, not in `routes/*.php` files. There is no `routes/api.php`, no
`RouteServiceProvider` on the app side. The Routing package's `RouteRegistrar`
discovers controllers via `#[AsController]` through the unified
`Stackra\Foundation\Contracts\DiscoversAttributes` contract and registers
routes at boot.

Every route attribute is a **composite** — routing + OpenAPI + authorization
metadata in a single declaration.

### Class-level

| Attribute                                 | Purpose                                                                         | Repeatable |
| ----------------------------------------- | ------------------------------------------------------------------------------- | ---------- |
| `#[AsController]`                         | Marks class for controller discovery. Optional `group`, `prefix`, `middleware`. | no         |
| `#[Prefix(prefix)]`                       | URI prefix for every route on the class.                                        | yes        |
| `#[Middleware(list)]`                     | Middleware for every route on the class. Extends Spatie's.                      | yes        |
| `#[Group(prefix?, domain?, as?, where?)]` | Grouped configuration — shared prefix / domain / name-prefix / constraints.     | yes        |
| `#[Domain(domain)]`                       | Fixed domain constraint.                                                        | yes        |
| `#[DomainFromConfig(configKey)]`          | Domain resolved from `config($key)` at boot.                                    | yes        |
| `#[Resource(name)]`                       | Full RESTful resource (7 routes). Class-level only.                             | no         |
| `#[ApiResource(name)]`                    | API resource (5 routes — no `create` / `edit`).                                 | no         |

### Method-level — HTTP verbs

All extend Spatie's route attributes and layer on `summary`, `description`,
`tags`, `parameters`, `requestSchema`, `responseSchema`, `responseType`,
`responseCode`, `permissions`, `permissionLogic`, `ability`, `role`. Every one
is `IS_REPEATABLE`.

| Attribute                                   | Verb           | Composite fields on top of Spatie |
| ------------------------------------------- | -------------- | --------------------------------- |
| `#[Get(uri, name?, ...)]`                   | GET            | OpenAPI + auth                    |
| `#[Post(uri, name?, requestSchema?, ...)]`  | POST           | OpenAPI + auth + request body     |
| `#[Put(uri, name?, requestSchema?, ...)]`   | PUT            | OpenAPI + auth + request body     |
| `#[Patch(uri, name?, requestSchema?, ...)]` | PATCH          | OpenAPI + auth + request body     |
| `#[Delete(uri, name?, ...)]`                | DELETE         | OpenAPI + auth                    |
| `#[Options(uri, name?, ...)]`               | OPTIONS        | OpenAPI + auth                    |
| `#[Any(uri, name?, ...)]`                   | any verb       | OpenAPI + auth                    |
| `#[Route(methods, uri, name?, ...)]`        | custom / multi | OpenAPI + auth                    |

### Method-level — constraints

| Attribute                     | Purpose                                 |
| ----------------------------- | --------------------------------------- |
| `#[Where(param, regex)]`      | Custom regex constraint on a parameter. |
| `#[WhereUuid(param)]`         | Param must be a UUID.                   |
| `#[WhereUlid(param)]`         | Param must be a ULID.                   |
| `#[WhereAlpha(param)]`        | Alphabetic only.                        |
| `#[WhereAlphaNumeric(param)]` | Alphanumeric only.                      |
| `#[WhereNumber(param)]`       | Numeric only.                           |
| `#[WhereIn(param, values[])]` | Enum-style whitelist.                   |

### Method-level — advanced

| Attribute                   | Purpose                                             |
| --------------------------- | --------------------------------------------------- |
| `#[Defaults(param, value)]` | Default value for a route parameter.                |
| `#[ScopeBindings]`          | Implicit child-model binding scoped to parent.      |
| `#[WithTrashed]`            | Include soft-deleted models in route model binding. |
| `#[Fallback]`               | Fallback route (matches when nothing else does).    |

### Middleware discovery

| Attribute                                              | Purpose                                                                                                                                                                 |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#[AsMiddleware(alias, groups?, priority?, enabled?)]` | Marks a class as middleware. Auto-discovered by the Routing package; registers the alias with the router and appends to the named middleware groups sorted by priority. |

### Canonical controller shape

```php
<?php

declare(strict_types=1);

namespace Stackra\Billing\Controllers;

use Stackra\Billing\Data\{CreateInvoiceData, InvoiceData};
use Stackra\Billing\Enums\BillingPermission;
use Stackra\Billing\Services\InvoicingService;
use Stackra\Routing\Attributes\{
    ApiResource,
    AsController,
    Delete,
    Get,
    Middleware,
    Post,
    Prefix,
    WhereUuid,
};
use Stackra\Routing\BaseController;

#[AsController]
#[Prefix('api/v1/invoices')]
#[Middleware(['api', 'auth:sanctum', 'exception-context'])]
final class InvoiceController extends BaseController
{
    public function __construct(
        private readonly InvoicingService $invoicing,
    ) {}

    #[Get(
        uri: '/',
        name: 'invoices.index',
        summary: 'List invoices for the current tenant',
        tags: ['Billing'],
        permissions: [BillingPermission::Read],
        responseSchema: InvoiceData::class,
        responseType: 'paginated',
        responseCode: 200,
    )]
    public function index(): array
    {
        return $this->invoicing->list();
    }

    #[Post(
        uri: '/',
        name: 'invoices.store',
        summary: 'Create an invoice',
        tags: ['Billing'],
        permissions: [BillingPermission::Create],
        requestSchema: 'CreateInvoice',
        responseSchema: InvoiceData::class,
        responseCode: 201,
    )]
    public function store(CreateInvoiceData $data): InvoiceData
    {
        return InvoiceData::from($this->invoicing->create($data));
    }

    #[Get('/{id}', name: 'invoices.show')]
    #[WhereUuid('id')]
    public function show(string $id): InvoiceData
    {
        return InvoiceData::from($this->invoicing->find($id));
    }

    #[Delete('/{id}', name: 'invoices.destroy')]
    #[WhereUuid('id')]
    public function destroy(string $id): \Illuminate\Http\Response
    {
        $this->invoicing->delete($id);

        return response()->noContent();
    }
}
```

### What we DON'T do

- **No `routes/api.php` / `routes/web.php`** at the package level. Controllers
  own their own routes.
- **No `RouteServiceProvider`** in packages. The Routing package runs one
  boot-time scan for the whole app.
- **No manual `Route::get(...)`** anywhere. Every URL is declared via a
  controller attribute.
- **No route caching workarounds** — the Routing package's registrar builds
  routes from the same compile-time attribute manifest every other package uses
  (via `DiscoversAttributes`), which is already the fastest path.

---

## PHP native attributes

Always available; no import needed. Use these liberally.

| Attribute                   | Target                            | Purpose                                                                                                                           |
| --------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `#[Override]`               | method                            | Signals the method overrides a parent. PHP 8.3+ enforces at runtime. Use on every override.                                       |
| `#[SensitiveParameter]`     | parameter                         | Redacts the argument from stack traces. Mandatory on password / token / secret parameters. `SensitiveDataMasker` also honours it. |
| `#[Deprecated]`             | class, method, function, constant | PHP 8.4+ marks the target as deprecated with `since` / `reason` / `replacement`. Emits `E_USER_DEPRECATED` on use.                |
| `#[NoDiscard]`              | method, function                  | PHP 8.5+ warns when the return value is discarded. Use on `->withX()` fluent setters where dropping the return is a bug.          |
| `#[AllowDynamicProperties]` | class                             | Escape hatch for legacy code that needs dynamic properties. Avoid; declare properties explicitly.                                 |
| `#[ReturnTypeWillChange]`   | method                            | Suppresses "return type mismatch" for a method the interface changed. Escape hatch during PHP-version bumps only.                 |

```php
final class UserService
{
    public function login(
        string $email,
        #[SensitiveParameter] string $password,
    ): AuthToken {
        // $password will never appear in stack traces or `var_dump()` output.
    }

    #[Override]
    public function boot(): void
    {
        parent::boot();
    }
}
```

---

## Laravel Container attributes (`Illuminate\Container\Attributes`)

Contextual DI — inject the right thing into the right parameter without
hand-wiring the container.

### Class-level

| Attribute                          | Purpose                                                                                                                                                                            | Signature                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `#[Bind(concrete, environments?)]` | Placed on the ABSTRACT (interface / abstract class we own). Argument IS the CONCRETE. Registers `bind($carrier, $arg)`. Repeatable per environment. See "Bind vs Overrides" below. | `Bind(class-string $concrete, string\|array\|UnitEnum $environments = ['*'])` |
| `#[Singleton]`                     | Register as singleton — one instance per app lifecycle.                                                                                                                            | no args                                                                       |
| `#[Scoped]`                        | Register as scoped — one instance per resolution scope (request / worker).                                                                                                         | no args                                                                       |

Preferred over calling `$this->app->bind(...)` inside a service provider.
Auto-discovered when the containing service provider scans the package's `src/`
(see below for our discovery pattern).

```php
// Pattern A (canonical): #[Bind] on the ABSTRACT.
// Registers `bind(InvoicerInterface, StripeInvoicer)`.

use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Singleton;

#[Bind(StripeInvoicer::class)]
#[Singleton]
interface InvoicerInterface
{
    // ...
}
```

### Bind vs Overrides — two directions, two attributes

Two container-binding attributes ship in the codebase. They register the same
shape (`$app->bind($abstract, $concrete)`) but from opposite sides — picked
based on which class you can annotate:

| Concern                          | Attribute                                   | Where it lives              | Argument                | Registers                              |
| -------------------------------- | ------------------------------------------- | --------------------------- | ----------------------- | -------------------------------------- |
| Both sides owned by us           | `Illuminate\Container\Attributes\Bind`      | On the ABSTRACT (interface) | The concrete class      | `bind($this_interface, $arg_concrete)` |
| Abstract is vendor / third-party | `Stackra\Container\Attributes\Overrides` | On the CONCRETE (subclass)  | The abstract we replace | `bind($arg_abstract, $this_concrete)`  |

Choose by ownership, not by taste:

- **Own the interface?** → `#[Bind]` on the interface. The abstract-side is
  where the wiring decision belongs; it stays next to the contract.
- **Overriding a vendor / third-party class you can't touch?** → `#[Overrides]`
  on your concrete. Same net effect; the attribute goes on the file you actually
  own.

```php
// Pattern A example — Laravel canonical, own both sides.
use Illuminate\Container\Attributes\Bind;

#[Bind(EloquentUserRepository::class)]
interface UserRepositoryInterface { /* ... */ }

// Pattern B example — Stackra, vendor override.
use Stackra\Container\Attributes\Overrides;
use Spatie\RouteAttributes\RouteRegistrar as SpatieRouteRegistrar;

#[Overrides(SpatieRouteRegistrar::class)]
class RouteRegistrar extends SpatieRouteRegistrar { /* ... */ }
```

Both attributes honour `#[Singleton]` / `#[Scoped]` and both accept an
`environments` argument for env-scoped bindings. `#[Overrides]` is
`IS_REPEATABLE` (a single concrete can substitute for more than one abstract);
Laravel's `#[Bind]` is `IS_REPEATABLE` too (typically used for per-environment
variants of the same interface).

Never place `#[Illuminate\Container\Attributes\Bind]` on a concrete class with
an interface as its argument — that inverts the signature semantics (`$concrete`
no longer points at a concrete). Use `#[Overrides]` for Pattern B and keep
Laravel's `#[Bind]` for Pattern A.

### Parameter-level (contextual injection)

Every one of these implements `ContextualAttribute` and resolves via a
`resolve()` method the container invokes.

| Attribute                                 | Injects                                           | Example                                                 |
| ----------------------------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| `#[Config(key, default?)]`                | `config($key, $default)`                          | `#[Config('services.stripe.secret')] string $stripeKey` |
| `#[Cache(store?, memo?)]`                 | `cache()->store($store)`                          | `#[Cache('redis')] Repository $cache`                   |
| `#[Storage(disk?)]`                       | `Storage::disk($disk)`                            | `#[Storage('s3')] Filesystem $files`                    |
| `#[Log(channel?, name?)]`                 | `Log::channel($channel)`                          | `#[Log('security')] LoggerInterface $log`               |
| `#[Auth(guard?)]`                         | `Auth::guard($guard)`                             | `#[Auth('sanctum')] Guard $guard`                       |
| `#[DB(connection?)]` / `#[Database(...)]` | `DB::connection($name)`                           | `#[DB('reporting')] Connection $db`                     |
| `#[Authenticated(guard?)]`                | current authenticated user via guard              | `#[Authenticated] User $user`                           |
| `#[CurrentUser]`                          | alias for `#[Authenticated]` on the default guard | `#[CurrentUser] User $user`                             |
| `#[RouteParameter(name?)]`                | `$request->route($name)`                          | `#[RouteParameter('id')] int $userId`                   |
| `#[Context(key, default?, hidden?)]`      | Laravel Log Context repository lookup             | `#[Context('tenant_id')] string $tenantId`              |
| `#[Give(class, params?)]`                 | force resolution of a specific concrete           | `#[Give(FakeInvoicer::class)] Invoicer $inv`            |
| `#[Tag(tag)]`                             | `$container->tagged($tag)`                        | `#[Tag('stackra.formatters')] iterable $formatters`  |

Prefer these over `$this->app->make(...)` inside methods. Constructor promotion
with contextual attributes reads like a dependency manifest.

```php
public function __construct(
    #[Config('services.stripe.secret')] private readonly string $stripeKey,
    #[Log('billing')] private readonly LoggerInterface $log,
    #[Cache('redis')] private readonly Repository $cache,
    #[CurrentUser] private readonly User $user,
) {}
```

---

## Eloquent attributes (`Illuminate\Database\Eloquent\Attributes`)

Replace the old `$fillable` / `$hidden` / `$table` property declarations with
typed class-level attributes.

### Model definition

| Attribute                                                                 | Replaces                                                                           | Signature                                 |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------- |
| `#[Table(name, key?, keyType?, incrementing?, timestamps?, dateFormat?)]` | `$table`, `$primaryKey`, `$keyType`, `$incrementing`, `$timestamps`, `$dateFormat` | Named args — pass only the ones you need. |
| `#[Fillable(...columns)]`                                                 | `protected $fillable = [...]`                                                      | Variadic strings or a single array.       |
| `#[Guarded(...columns)]`                                                  | `protected $guarded = [...]`                                                       | Same shape as `Fillable`.                 |
| `#[Unguarded]`                                                            | `protected $guarded = []`                                                          | No args.                                  |
| `#[Hidden(...columns)]`                                                   | `protected $hidden = [...]`                                                        | Variadic.                                 |
| `#[Visible(...columns)]`                                                  | `protected $visible = [...]`                                                       | Variadic.                                 |
| `#[Appends(...columns)]`                                                  | `protected $appends = [...]`                                                       | Variadic.                                 |
| `#[DateFormat(format)]`                                                   | `protected $dateFormat`                                                            | Single string.                            |
| `#[Connection(name)]`                                                     | `protected $connection`                                                            | Single string.                            |
| `#[Touches(...relations)]`                                                | `protected $touches = [...]`                                                       | Variadic.                                 |
| `#[WithoutIncrementing]`                                                  | `public $incrementing = false`                                                     | No args.                                  |
| `#[WithoutTimestamps]`                                                    | `public $timestamps = false`                                                       | No args.                                  |

### Wiring related classes to the model

| Attribute                         | Purpose                                                                      | Signature                  |
| --------------------------------- | ---------------------------------------------------------------------------- | -------------------------- |
| `#[UseFactory(class)]`            | Bind a factory to the model without following the default naming convention. | `class-string<Factory>`    |
| `#[UsePolicy(class)]`             | Bind a policy for `Gate::policy` auto-discovery.                             | `class-string`             |
| `#[UseResource(class)]`           | Default `Resource` class for single-model serialisation.                     | `class-string`             |
| `#[UseResourceCollection(class)]` | Default `ResourceCollection`.                                                | `class-string`             |
| `#[UseEloquentBuilder(class)]`    | Custom eloquent builder for the model.                                       | `class-string`             |
| `#[CollectedBy(collectionClass)]` | Replace `newCollection()`.                                                   | `class-string<Collection>` |
| `#[ObservedBy(classes)]`          | Attach observer(s). Repeatable.                                              | `string\|array`            |
| `#[ScopedBy(classes)]`            | Attach global scope(s). Repeatable.                                          | `string\|array`            |

### Method-level

| Attribute       | Purpose                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `#[Scope]`      | Marks a public method as a query scope. Replaces the old `scopeXxx()` prefix — call the method as `Model::xxx()` directly. |
| `#[Boot]`       | Marks a static method that runs at model boot. Replaces the `boot()` override.                                             |
| `#[Initialize]` | Marks a method that runs on every new instance. Replaces the `initialize()` override.                                      |

### Factories

| Attribute            | Purpose                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `#[UseModel(class)]` | Bind a factory to its model when following the default naming convention isn't wanted. Placed on the Factory class. |

Model example — every configuration knob is an attribute:

```php
use Illuminate\Database\Eloquent\Attributes\{
    Appends,
    Connection,
    Fillable,
    Hidden,
    ObservedBy,
    ScopedBy,
    Table,
    UseFactory,
    UsePolicy,
};

#[Table(name: 'invoices', keyType: 'string')]
#[Connection('billing')]
#[Fillable('customer_id', 'amount_cents', 'currency', 'status')]
#[Hidden('stripe_customer_id', 'stripe_charge_id')]
#[Appends('is_overdue')]
#[UseFactory(InvoiceFactory::class)]
#[UsePolicy(InvoicePolicy::class)]
#[ObservedBy([InvoiceObserver::class, AuditObserver::class])]
#[ScopedBy(TenantScope::class)]
final class Invoice extends Model
{
    #[Scope]
    public function overdue(Builder $query): void
    {
        $query->where('due_at', '<', now());
    }
}
```

---

## Console attributes (`Illuminate\Console\Attributes`)

Replace the `protected $signature` / `$description` / `$help` / `$aliases` /
`$hidden` properties on `Command` subclasses.

| Attribute                           | Replaces                         | Signature                                   |
| ----------------------------------- | -------------------------------- | ------------------------------------------- |
| `#[Signature(signature, aliases?)]` | `$signature`, `$aliases`         | `string $signature, ?array $aliases = null` |
| `#[Description(text)]`              | `$description`                   | `string`                                    |
| `#[Help(text)]`                     | `$help`                          | `string`                                    |
| `#[Usage(...examples)]`             | (new) usage examples in `--help` | variadic strings                            |
| `#[Aliases(...aliases)]`            | `$aliases` (standalone)          | variadic strings                            |
| `#[Hidden]`                         | `$hidden = true`                 | no args                                     |

```php
#[Signature('billing:refund {invoice} {--partial=}')]
#[Description('Refund an invoice fully or partially.')]
#[Usage('billing:refund INV-42', 'billing:refund INV-42 --partial=500')]
#[Aliases('refund')]
final class RefundCommand extends Command
{
    public function handle(): int { /* ... */ }
}
```

---

## FormRequest attributes (`Illuminate\Foundation\Http\Attributes`)

Replace the `protected $stopOnFirstFailure` / `$errorBag` / `$redirectRoute`
overrides.

| Attribute                        | Replaces                     | Signature            |
| -------------------------------- | ---------------------------- | -------------------- |
| `#[StopOnFirstFailure]`          | `$stopOnFirstFailure = true` | no args              |
| `#[ErrorBag(name)]`              | `$errorBag`                  | `string`             |
| `#[RedirectTo(url)]`             | `$redirect`                  | `string`             |
| `#[RedirectToRoute(route)]`      | `$redirectRoute`             | `string`             |
| `#[FailOnUnknownFields(value?)]` | equivalent hand-rolled check | `bool $value = true` |

```php
#[StopOnFirstFailure]
#[FailOnUnknownFields]
#[RedirectToRoute('billing.index')]
final class UpdateInvoiceRequest extends FormRequest
{
    public function rules(): array { /* ... */ }
}
```

---

## Http Resource attributes (`Illuminate\Http\Resources\Attributes`)

| Attribute            | Purpose                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| `#[Collects(class)]` | Bind a Resource class to a specific `ResourceCollection`. Replaces the `public $collects` property.    |
| `#[PreserveKeys]`    | Preserve keys when the resource is used inside a `Collection`. Replaces `public $preserveKeys = true`. |

---

## Queue attributes (`Illuminate\Queue\Attributes`)

For jobs — replaces the top-cluster of public properties that control retry /
backoff / uniqueness. Every one takes precedence over its property counterpart
when both are present.

| Attribute                           | Replaces                                               | Signature                                                                  |
| ----------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| `#[Timeout(seconds)]`               | `$timeout`                                             | `int`                                                                      |
| `#[Tries(count)]`                   | `$tries`                                               | `int`                                                                      |
| `#[MaxExceptions(count)]`           | `$maxExceptions`                                       | `int`                                                                      |
| `#[Backoff(...seconds)]`            | `$backoff`                                             | variadic ints or single array — supports both scalar + progressive backoff |
| `#[Delay(seconds)]`                 | `->delay(...)` on dispatch                             | `int`                                                                      |
| `#[Queue(name)]`                    | `$queue`                                               | `string`                                                                   |
| `#[Connection(name)]`               | `$connection`                                          | `string`                                                                   |
| `#[FailOnTimeout]`                  | `$failOnTimeout = true`                                | no args                                                                    |
| `#[DebounceFor(seconds, maxWait?)]` | Trailing-edge debounce.                                | `int $debounceFor, ?int $maxWait`                                          |
| `#[UniqueFor(seconds)]`             | `$uniqueFor` on `ShouldBeUnique`.                      | `int`                                                                      |
| `#[DeleteWhenMissingModels]`        | `$deleteWhenMissingModels = true`                      | no args                                                                    |
| `#[WithoutRelations]`               | Strip eager-loaded relations when serialising the job. | no args                                                                    |

```php
#[Queue('billing')]
#[Timeout(120)]
#[Tries(5)]
#[Backoff(10, 30, 60, 120)]
#[FailOnTimeout]
#[DebounceFor(30, maxWait: 300)]
final class SyncStripeInvoiceJob implements ShouldQueue, ShouldBeUnique
{
    public function __construct(public readonly string $invoiceId) {}

    #[UniqueFor(600)]
    public function uniqueId(): string { return $this->invoiceId; }
}
```

---

## Routing / Controller attributes (`Illuminate\Routing\Attributes\Controllers`)

Attach middleware and gates directly to invokable / method controllers without
touching the route file. Great fit for our single-action invokables.

| Attribute                                        | Target          | Purpose                                               | Signature                                                   |
| ------------------------------------------------ | --------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| `#[Middleware(class, only?, except?)]`           | class or method | Attach middleware — repeatable.                       | `Closure\|string $middleware, ?array $only, ?array $except` |
| `#[Authorize(ability, models?, only?, except?)]` | class or method | Attach `Authorize` middleware for a gate. Repeatable. | `UnitEnum\|string $ability, array\|string\|null $models`    |

```php
#[Middleware('throttle:api')]
#[Middleware('signed', only: ['store'])]
#[Authorize('billing.write')]
final class UpdateInvoiceController
{
    public function __invoke(UpdateInvoiceRequest $request, Invoice $invoice): JsonResponse
    { /* ... */ }
}
```

Prefer these over `->middleware(...)` chains in `routes/api.php` for
controller-scoped middleware — the route file stays focused on URL → controller
mapping.

---

## Laravel MCP attributes (`Laravel\Mcp\Server\Attributes`)

For MCP servers, tools, and resources. Use when authoring MCP surfaces under any
app's `mcp/` directory.

### Server / capability

| Attribute               | Target | Purpose                                 |
| ----------------------- | ------ | --------------------------------------- |
| `#[Name(name)]`         | class  | Machine-readable identifier.            |
| `#[Title(text)]`        | class  | Human-readable title (list views).      |
| `#[Description(text)]`  | class  | Long-form description shown to the LLM. |
| `#[Version(string)]`    | class  | Server version.                         |
| `#[Instructions(text)]` | class  | Guidance the client should show.        |
| `#[Icon(url)]`          | class  | Icon URI.                               |
| `#[MimeType(string)]`   | class  | For resources — declares the MIME type. |
| `#[Uri(pattern)]`       | class  | URI template for resource routing.      |
| `#[AppMeta(...)]`       | class  | App-specific metadata.                  |
| `#[RendersApp]`         | class  | Marker — this capability renders a UI.  |

### Tool call annotations (`Laravel\Mcp\Server\Tools\Annotations`)

| Attribute          | Meaning to the client                                            |
| ------------------ | ---------------------------------------------------------------- |
| `#[IsReadOnly]`    | Tool does not mutate state.                                      |
| `#[IsDestructive]` | Tool deletes / overwrites data — client warns before invocation. |
| `#[IsIdempotent]`  | Same input yields same effect; safe to retry.                    |
| `#[IsOpenWorld]`   | Tool reaches beyond the local scope (web, external services).    |

### Annotations (`Laravel\Mcp\Server\Annotations`)

| Attribute                  | Purpose                                                   |
| -------------------------- | --------------------------------------------------------- |
| `#[Audience(role)]`        | Who the resource / tool is for (user / assistant / etc.). |
| `#[Priority(int)]`         | Ranking hint for the client.                              |
| `#[LastModified(iso8601)]` | Freshness metadata.                                       |

```php
#[Name('list_invoices')]
#[Title('List invoices')]
#[Description('Returns invoices for the current tenant, filtered by status.')]
#[IsReadOnly]
#[IsIdempotent]
final class ListInvoicesTool implements Tool
{
    public function handle(Request $request): Stringable
    { /* ... */ }
}
```

---

## Custom attributes — Stackra conventions

Prefer authoring an attribute over another property or `boot()` hook whenever
the concern is:

- **Declarative** — describes a static fact about the class.
- **Discoverable** — a scanner / provider / IDE benefits from finding it via
  reflection.
- **Cross-cutting** — multiple classes will want the same signal.

### Naming + placement

- Namespace: `Stackra\<Package>\Attributes\` — e.g.
  `Stackra\Exceptions\Attributes\ReportsAt`.
- One attribute per file, matching the class name.
- Every attribute file carries the same `@file` + `@description` docblock as the
  rest of the codebase.
- Target constants explicit — always spell out
  `Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE` etc. Never omit the
  argument.
- `final` when it makes sense; leave open only when subclassing is expected
  (like Laravel's `Middleware` → `Authorize`).

### Repeatable when the concept naturally lists

If a class can have "multiple X", the attribute is `IS_REPEATABLE`:
`#[ObservedBy]`, `#[ScopedBy]`, `#[Middleware]`, `#[Authorize]`, `#[Bind]` — all
repeatable. Don't force callers to build arrays when the language supports
stacking.

### Contextual injection

If your attribute is meant for parameter injection, implement
`Illuminate\Contracts\Container\ContextualAttribute` and expose a
`public static function resolve(self $attribute, Container $container): mixed`.
The container auto-invokes it during resolution.

### Auto-discovery

The `Stackra\Foundation\Providers\AbstractModuleServiceProvider` scans each
package's `src/` at boot when the package declares an `autoScan` list.
Attributes discovered on classes get processed by handlers registered per
attribute class. Prefer scan-based registration over hard-coded `->singleton()`
calls in the provider whenever the count is likely to grow.

---

## Anti-patterns

| Anti-pattern                                                                                                     | Preferred alternative                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `protected $fillable = [...]` on a Model                                                                         | `#[Fillable(...)]`                                                                                                                                                         |
| `protected $signature = '...'` on a Command                                                                      | `#[Signature(...)]`                                                                                                                                                        |
| `$this->app->singleton(Foo::class, Bar::class)` inside a provider                                                | `#[Bind(Bar::class)]` + `#[Singleton]` on `interface Foo` (Pattern A) — or `#[Overrides(Foo::class)]` + `#[Singleton]` on `Bar` when Foo is vendor/third-party (Pattern B) |
| `Log::channel('security')->info(...)` scattered through a service                                                | `#[Log('security')] LoggerInterface $log` in the constructor                                                                                                               |
| A `routes/api.php` file with `Route::get(...)` for domain endpoints                                              | `#[AsController]` + `#[Get('/...')]` on the controller — Routing package auto-discovers it                                                                                 |
| A `RouteServiceProvider` in a package                                                                            | None — Stackra Routing handles route registration at the app level via one boot-time scan                                                                               |
| `->middleware('auth:sanctum')` in a route file for a specific controller                                         | `#[Middleware('auth:sanctum')]` on the controller class                                                                                                                    |
| Hand-registering middleware inside `Kernel::$routeMiddleware` (Laravel 10-) or `bootstrap/app.php` (Laravel 11+) | `#[AsMiddleware(alias: 'x', groups: ['api'], priority: 50)]` on the middleware class                                                                                       |
| `public $tries = 5;` on a job                                                                                    | `#[Tries(5)]`                                                                                                                                                              |
| Hand-rolled password redaction in log output                                                                     | `#[SensitiveParameter]` on the parameter                                                                                                                                   |
| A method that overrides but doesn't declare it                                                                   | `#[Override]`                                                                                                                                                              |
| A boolean class flag toggled by `if (env('X'))`                                                                  | `#[Bind(Concrete::class, environments: ['prod'])]` on the interface — the container swaps concretes by env at boot                                                         |
| Manual `scopeXxx()` methods on models                                                                            | `#[Scope]` on the method (drop the prefix)                                                                                                                                 |
| Global scope registered in `boot()`                                                                              | `#[ScopedBy(TenantScope::class)]`                                                                                                                                          |
| Observer wired via `Model::observe(...)` in a provider                                                           | `#[ObservedBy(Observer::class)]`                                                                                                                                           |
| `class_exists()` guard before wiring behaviour                                                                   | attribute + scanner that only fires for classes with the attribute                                                                                                         |

## Rules of thumb

1. **New file gets attributes.** When you create a new controller, model, job,
   command, form request, or service — reach for the attribute first, property
   second.
2. **Refactor when nearby.** If you're editing a class and see a property that
   has an attribute equivalent, migrate it in the same commit.
3. **Never mix.** Don't set the same knob via both attribute and property on the
   same class — the attribute wins silently and the property is dead weight.
4. **Static analysis IS the contract.** PHPStan level max + Larastan check
   attribute arguments. If the analyser doesn't see the attribute, it doesn't
   exist for review purposes — no runtime silent-fixups.
5. **When authoring: one attribute, one concern.** Splitting `#[Retryable]` into
   `#[Tries]` + `#[Backoff]` is what Laravel did; follow that shape.

## References

- Laravel 13.x — `vendor/laravel/framework/src/Illuminate/**/Attributes/*.php`
- Laravel MCP —
  `vendor/laravel/mcp/src/Server/{Attributes,Annotations,Tools/Annotations}/*.php`
- Stackra Routing — `packages/Routing/src/Attributes/*.php` (extends Spatie
  route-attributes; adds OpenAPI + auth)
- Spatie route-attributes —
  `vendor/spatie/laravel-route-attributes/src/Attributes/*.php` (the base
  classes Stackra Routing extends)
- Discovery contract —
  `packages/foundation/src/Contracts/DiscoversAttributes.php` (uniform API every
  package uses)
- Discovery implementation —
  `packages/foundation/src/Discovery/AttributeDiscovery.php` (wraps
  `olvlvl/composer-attribute-collector`)
- PHP native attribute docs —
  [php.net/manual/en/language.attributes.php](https://www.php.net/manual/en/language.attributes.php)

---

## How attributes actually execute (the processing flow)

Attributes are **metadata**. They do nothing on their own — they need a reader.
This section maps every attribute family to the code that reads it and the
lifecycle moment when reading happens. Never wire attribute logic into HTTP
middleware; that's the wrong seam.

### Lifecycle map — who reads what, and when

| Attribute family                                                                                                                                                                                                       | Reader                                             | Lifecycle moment                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------- |
| Eloquent config (`#[Fillable]`, `#[Table]`, `#[Hidden]`, `#[Guarded]`, `#[Visible]`, `#[Appends]`, `#[Connection]`, `#[DateFormat]`)                                                                                   | `HasAttributes` trait on the model                 | First model boot per class (cached)      |
| Eloquent method (`#[Scope]`, `#[Boot]`, `#[Initialize]`)                                                                                                                                                               | Model boot / query builder                         | Model boot / query resolution            |
| Eloquent wiring (`#[UseFactory]`, `#[UsePolicy]`, `#[UseResource]`, `#[UseResourceCollection]`, `#[ObservedBy]`, `#[ScopedBy]`, `#[CollectedBy]`)                                                                      | Framework traits + `AuthServiceProvider`           | Model boot / gate registration           |
| Container parameter (`#[Config]`, `#[Cache]`, `#[Storage]`, `#[Auth]`, `#[Log]`, `#[DB]`, `#[CurrentUser]`, `#[RouteParameter]`, `#[Context]`, `#[Give]`, `#[Tag]`)                                                    | `Container` via `ContextualAttribute::resolve()`   | Parameter resolution (per `make()` call) |
| Container class-level (`#[Bind]`, `#[Singleton]`, `#[Scoped]`)                                                                                                                                                         | Our `AbstractModuleServiceProvider` scanner        | Service-provider `register()`            |
| Stackra Routing class-level (`#[AsController]`, `#[Prefix]`, `#[Middleware]`, `#[Group]`, `#[Domain]`, `#[Resource]`, `#[ApiResource]`)                                                                             | `Stackra\Routing\RouteRegistrar`                | Routing package boot (once)              |
| Stackra Routing method-level (`#[Get]`, `#[Post]`, `#[Put]`, `#[Patch]`, `#[Delete]`, `#[Options]`, `#[Any]`, `#[Route]`, `#[Where*]`, `#[Defaults]`, `#[ScopeBindings]`, `#[WithTrashed]`, `#[Fallback]`)          | `Stackra\Routing\RouteRegistrar` per controller | Routing package boot (once)              |
| Stackra Middleware discovery (`#[AsMiddleware]`)                                                                                                                                                                    | Routing package's `HasMiddleware` concern          | Routing package boot (once)              |
| Console (`#[Signature]`, `#[Description]`, `#[Help]`, `#[Aliases]`, `#[Usage]`, `#[Hidden]`)                                                                                                                           | `Command` base class                               | Command instantiation                    |
| Queue (`#[Timeout]`, `#[Tries]`, `#[Backoff]`, `#[Queue]`, `#[Connection]`, `#[Delay]`, `#[FailOnTimeout]`, `#[MaxExceptions]`, `#[UniqueFor]`, `#[DebounceFor]`, `#[DeleteWhenMissingModels]`, `#[WithoutRelations]`) | Queue worker / dispatcher                          | Job dispatch / retry                     |
| FormRequest (`#[StopOnFirstFailure]`, `#[ErrorBag]`, `#[FailOnUnknownFields]`, `#[RedirectTo]`, `#[RedirectToRoute]`)                                                                                                  | FormRequest base class                             | Request validation                       |
| Http Resource (`#[Collects]`, `#[PreserveKeys]`)                                                                                                                                                                       | `JsonResource` base class                          | Resource serialisation                   |
| MCP (`#[Name]`, `#[Title]`, `#[Description]`, ...)                                                                                                                                                                     | `laravel/mcp` server registrar                     | MCP server boot                          |
| PHP native (`#[SensitiveParameter]`, `#[Override]`, `#[Deprecated]`, `#[NoDiscard]`)                                                                                                                                   | PHP engine + reporters                             | Runtime error / var dump / reflection    |

### Discovery strategy — one contract for every package

**Never write HTTP middleware to inspect attributes.** Middleware is
per-request; attributes are compile-time static. Reflection at request time is
expensive and unnecessary.

Every package that needs to find "which classes / methods / properties /
parameters carry attribute X?" resolves ONE contract from the container:

```php
use Stackra\Foundation\Contracts\DiscoversAttributes;

final class MyServiceProvider extends AbstractModuleServiceProvider
{
    protected function bootBespoke(): void
    {
        /** @var DiscoversAttributes $discovery */
        $discovery = $this->app->make(DiscoversAttributes::class);

        foreach ($discovery->forClass(MyAttribute::class) as $target) {
            // $target->className   → class-string
            // $target->attribute   → MyAttribute instance
            $registry->register($target->className, $target->attribute);
        }
    }
}
```

The contract exposes four methods:

| Method               | Yields                                 | Value object                                                                |
| -------------------- | -------------------------------------- | --------------------------------------------------------------------------- |
| `forClass(FQCN)`     | every class carrying the attribute     | `ClassTarget` — `className`, `attribute`                                    |
| `forMethod(FQCN)`    | every method carrying the attribute    | `MethodTarget` — `className`, `methodName`, `attribute`                     |
| `forProperty(FQCN)`  | every property carrying the attribute  | `PropertyTarget` — `className`, `propertyName`, `attribute`                 |
| `forParameter(FQCN)` | every parameter carrying the attribute | `ParameterTarget` — `className`, `methodName`, `parameterName`, `attribute` |

Every method returns an `iterable` — consumers iterate lazily.

### Under the hood

`Stackra\Foundation\Discovery\AttributeDiscovery` — the production
implementation of `DiscoversAttributes` — delegates to
`olvlvl/composer-attribute-collector`:

- The collector walks the PSR-4 tree at `composer dump-autoload` time and writes
  a static `vendor/attributes.php` manifest.
- Runtime scan is O(1): a static array lookup, no filesystem traversal, no live
  reflection. Octane-safe by construction.
- When the manifest hasn't been written yet (fresh clone before any composer
  command, slim test harness with vendor stripped), the wrapper catches the
  failure and returns an empty iterable so consumers see "no hits" instead of a
  fatal boot.

Callers never touch olvlvl directly. Swapping the backend is a one-line rebind
of `DiscoversAttributes::class` in a service provider — every consumer keeps
working against the contract.

### Why the wrapper vs. raw olvlvl

- **Testability** — one contract to swap for a fake instead of wiring closures
  per usage. Every package's discovery test binds an anonymous
  `DiscoversAttributes` implementation with fixture target rows. See
  `packages/events/tests/Unit/EventDiscoveryTest.php` for the canonical pattern.
- **Uniform value objects** — one `ClassTarget` / `MethodTarget` type instead of
  the four slightly-different anonymous-object shapes olvlvl emits per target
  kind.
- **Refactor safety** — renaming an olvlvl field only touches the wrapper. Every
  consumer stays put.
- **Backend independence** — every consumer depends on foundation's contract,
  not olvlvl. Dropping olvlvl for a different backend (nikic/php-parser scan,
  reflection walk, homegrown compiler) is a one-line rebind.

### Custom attribute + handler pattern

Every custom attribute pairs with an **attribute handler** that receives the
target + attribute instance and does the wiring:

```php
// packages/foundation/src/Attributes/AsQueryFilter.php
#[Attribute(Attribute::TARGET_CLASS)]
final class AsQueryFilter
{
    public function __construct(public string $field) {}
}

// packages/foundation/src/Attributes/Handlers/AsQueryFilterHandler.php
final class AsQueryFilterHandler
{
    public function handle(string $target, AsQueryFilter $attribute, Container $container): void
    {
        $container->tag($target, "query.filter.{$attribute->field}");
    }
}
```

The scanner in `AbstractModuleServiceProvider::registerBespoke()` consumes the
unified contract:

```php
/** @var DiscoversAttributes $discovery */
$discovery = $this->app->make(DiscoversAttributes::class);

foreach ($discovery->forClass(AsQueryFilter::class) as $target) {
    $this->app->make(AsQueryFilterHandler::class)
        ->handle($target->className, $target->attribute, $this->app);
}
```

This is idiomatic Laravel — no framework hook to fight, no runtime cost per
request.

### Discovery in the wild — where the contract is consumed

Every compile-time attribute-driven binding across the monorepo goes through
`DiscoversAttributes`:

| Package                         | What it discovers                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `packages/routing`              | `#[AsController]` (RouteRegistrar), `#[AsMiddleware]`                                                                        |
| `packages/events`               | `#[OnEvent]`, `#[ListensFor]`, `#[AfterCommit]`, `#[Broadcastable]`, `#[BroadcastOn]`, `#[BroadcastAs]`, `#[BroadcastQueue]` |
| `packages/ai`                   | `#[AsAiTool]` (ToolDiscoveryBootstrapper)                                                                                    |
| `packages/crud`                 | `#[AsCriteria]`, `#[AsScope]`, `#[AsRepository]`                                                                             |
| `packages/scheduling` (planned) | `#[Schedule]`, `#[Cron]`, `#[WithoutOverlapping]`, ...                                                                       |

Two exceptions that deliberately do NOT use `DiscoversAttributes`:

- **`packages/architecture`** — regex-based source scanner. Its job is to lint
  every file including ones that don't carry any attribute, so olvlvl's "targets
  by attribute" index is the wrong shape.
- **`packages/tenancy`** — request-time reflection with a class- metadata memo.
  Runtime scope (per-request tenant check), not compile-time discovery.

### When to reach for middleware instead

Middleware is right when the concern is **per-request** and needs the actual
`Request` object:

- Rate limiting keyed by request attributes.
- Setting response headers per request.
- Authentication / authorization gates that depend on runtime request data.

Attributes are right when the concern is **compile-time metadata**:

- "This interface binds to that concrete" — `#[Bind]` on the interface (Pattern
  A). "This concrete overrides that vendor abstract" — `#[Overrides]` on the
  concrete (Pattern B).
- "This job times out after 120s" — `#[Timeout]`.
- "This controller method requires `billing.write`" — `#[Authorize]`.

The overlap is `#[Authorize]` on a controller: the attribute declares intent at
boot, and the router injects `AuthorizeMiddleware` into the route stack. The
middleware exists — it just isn't authored per-attribute. That's the pattern:
attributes drive middleware assembly, not the other way around.

---

## Spatie Laravel Data attributes (`Spatie\LaravelData\Attributes\...`)

**Every Data class in this codebase uses PHP attributes for validation, mapping,
casting, and computed values — never inline `rules()` methods, never runtime
validator arrays, never `FormRequest` classes for validated DTOs.**

Rule of thumb: if a Data class has a `public function rules(): array` or
`protected function messages(): array`, it's wrong. Replace with attributes on
the constructor properties.

### Class-level

| Attribute                            | Purpose                                                                                     | Signature                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------- | --------------------------- |
| `#[MapInputName(mapper)]`            | Map wire → PHP property names on input (e.g. snake_case → camelCase).                       | `class-string\|string`      |
| `#[MapOutputName(mapper)]`           | Map PHP → wire property names on output.                                                    | `class-string\|string`      |
| `#[MapName(mapper)]`                 | Bi-directional map (input + output).                                                        | `class-string\|string`      |
| `#[Strict]`                          | Reject unknown fields on input.                                                             | no args                     |
| `#[Validation]`                      | Class-level validation rules that don't map to a specific property.                         | array of rule strings       |
| `#[MergeValidationRules]`            | Merge attribute rules with rules from `rules()` method. Escape hatch during migration only. | no args                     |
| `#[WithoutValidation]`               | Class-level opt-out of validation. Use with extreme care.                                   | no args                     |
| `#[WithTransformer(class, ...args)]` | Force a transformer for every property.                                                     | `class-string<Transformer>` |
| `#[WithCast(class, ...args)]`        | Force a cast for every property.                                                            | `class-string<Cast>`        |

### Property-level — validation (import from `Spatie\LaravelData\Attributes\Validation`)

The full validation surface — every Laravel validator has an attribute
equivalent. Import from `Spatie\LaravelData\Attributes\Validation\{...}`.

#### Presence + type

| Attribute                         | Laravel rule                  | Signature |
| --------------------------------- | ----------------------------- | --------- |
| `#[Required]`                     | `required`                    | no args   |
| `#[RequiredIf(field, value)]`     | `required_if`                 | strings   |
| `#[RequiredUnless(field, value)]` | `required_unless`             | strings   |
| `#[RequiredWith(...fields)]`      | `required_with`               | variadic  |
| `#[RequiredWithAll(...fields)]`   | `required_with_all`           | variadic  |
| `#[RequiredWithout(...fields)]`   | `required_without`            | variadic  |
| `#[Nullable]`                     | `nullable`                    | no args   |
| `#[Sometimes]`                    | `sometimes`                   | no args   |
| `#[Filled]`                       | `filled`                      | no args   |
| `#[Present]`                      | `present`                     | no args   |
| `#[Prohibited]`                   | `prohibited`                  | no args   |
| `#[StringType]`                   | `string`                      | no args   |
| `#[IntegerType]`                  | `integer`                     | no args   |
| `#[Numeric]`                      | `numeric`                     | no args   |
| `#[Decimal(min, max?)]`           | `decimal:min,max`             | ints      |
| `#[BooleanType]`                  | `boolean`                     | no args   |
| `#[ArrayType]`                    | `array`                       | no args   |
| `#[ListType]`                     | Zero-indexed sequential array | no args   |
| `#[Json]`                         | `json`                        | no args   |
| `#[File]`                         | `file`                        | no args   |
| `#[Image]`                        | `image`                       | no args   |

#### Length / size / range

| Attribute                    | Laravel rule             | Signature |
| ---------------------------- | ------------------------ | --------- |
| `#[Min(size)]`               | `min:size`               | int       |
| `#[Max(size)]`               | `max:size`               | int       |
| `#[Size(size)]`              | `size:size`              | int       |
| `#[Between(min, max)]`       | `between:min,max`        | ints      |
| `#[Gt(field\|value)]`        | `gt:`                    | mixed     |
| `#[Gte(field\|value)]`       | `gte:`                   | mixed     |
| `#[Lt(field\|value)]`        | `lt:`                    | mixed     |
| `#[Lte(field\|value)]`       | `lte:`                   | mixed     |
| `#[Multiple(step)]`          | `multiple_of`            | numeric   |
| `#[Digits(count)]`           | `digits:count`           | int       |
| `#[DigitsBetween(min, max)]` | `digits_between:min,max` | ints      |

#### Format / content

| Attribute                       | Laravel rule           |
| ------------------------------- | ---------------------- |
| `#[Email]`                      | `email`                |
| `#[Url]`                        | `url`                  |
| `#[Ip]` / `#[Ipv4]` / `#[Ipv6]` | `ip` / `ipv4` / `ipv6` |
| `#[MacAddress]`                 | `mac_address`          |
| `#[Uuid]`                       | `uuid`                 |
| `#[Ulid]`                       | `ulid`                 |
| `#[AlphaDash]`                  | `alpha_dash`           |
| `#[Alpha]`                      | `alpha`                |
| `#[AlphaNumeric]`               | `alpha_num`            |
| `#[Regex(pattern)]`             | `regex:`               |
| `#[NotRegex(pattern)]`          | `not_regex:`           |
| `#[Hex]`                        | `hex`                  |
| `#[HexColor]`                   | `hex_color`            |
| `#[Timezone]`                   | `timezone`             |
| `#[Confirmed]`                  | `confirmed`            |

#### Domain — dates / times

| Attribute                | Laravel rule      |
| ------------------------ | ----------------- |
| `#[Date]`                | `date`            |
| `#[DateFormat(format)]`  | `date_format`     |
| `#[DateEquals(date)]`    | `date_equals`     |
| `#[Before(date)]`        | `before`          |
| `#[BeforeOrEqual(date)]` | `before_or_equal` |
| `#[After(date)]`         | `after`           |
| `#[AfterOrEqual(date)]`  | `after_or_equal`  |

#### Domain — sets / enums / DB

| Attribute                                 | Laravel rule |
| ----------------------------------------- | ------------ |
| `#[In(...values)]`                        | `in`         |
| `#[NotIn(...values)]`                     | `not_in`     |
| `#[Enum(class)]`                          | `Rule::enum` |
| `#[Exists(table, column?, ...)]`          | `exists`     |
| `#[Unique(table, column?, ignore?, ...)]` | `unique`     |
| `#[Distinct]`                             | `distinct`   |
| `#[Different(field)]`                     | `different`  |
| `#[Same(field)]`                          | `same`       |
| `#[InArray(field)]`                       | `in_array`   |

#### Custom / escape hatch

| Attribute                                        | Purpose                                                                                                                    |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `#[Rule(rule, message?)]`                        | Any raw Laravel rule string — for exotic validators without a dedicated attribute. Includes optional per-property message. |
| `#[BooleanLike]` / `#[Accepted]` / `#[Declined]` | Truthy / accepted / declined                                                                                               |

### Property-level — mapping + casting

| Attribute                            | Purpose                                                                                                      | Signature                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ | --------------------------- |
| `#[MapInputName(name)]`              | Field-level input mapping (overrides class-level mapper).                                                    | `string\|class-string`      |
| `#[MapOutputName(name)]`             | Field-level output mapping.                                                                                  | `string\|class-string`      |
| `#[MapName(name)]`                   | Bi-directional field-level mapping.                                                                          | `string\|class-string`      |
| `#[WithCast(class, ...args)]`        | Cast raw input into the property's PHP type.                                                                 | `class-string<Cast>`        |
| `#[WithCastable(class, ...args)]`    | Cast into a class that implements `Castable`.                                                                | `class-string`              |
| `#[WithTransformer(class, ...args)]` | Transform property value on output.                                                                          | `class-string<Transformer>` |
| `#[Computed]`                        | Property is computed post-construction; skipped on input, included on output.                                | no args                     |
| `#[Hidden]`                          | Property hidden on output entirely.                                                                          | no args                     |
| `#[Sensitive]`                       | Value redacted on output (`***`).                                                                            | no args                     |
| `#[DataCollectionOf(class)]`         | For `array` properties that hold a list of Data objects — declares the item type for hydration + validation. | `class-string<Data>`        |

### Mappers (`Spatie\LaravelData\Mappers\...`)

| Mapper               | Behaviour                               |
| -------------------- | --------------------------------------- |
| `SnakeCaseMapper`    | `firstName` ↔ `first_name`              |
| `StudlyCaseMapper`   | `first_name` ↔ `FirstName`              |
| `CamelCaseMapper`    | `first_name` ↔ `firstName`              |
| `LowerCaseMapper`    | Everything lowercase                    |
| `UpperCaseMapper`    | Everything uppercase                    |
| `ProvidedNameMapper` | Uses the exact name — no transformation |

Custom mappers implement `NameMapper` — very rarely needed.

### Canonical Data class shape

```php
<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `POST /api/v1/feature-flags/overrides`.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateOverrideRequestData extends Data
{
    /**
     * @param  string       $flag         Stable dot-separated flag identifier.
     * @param  string       $scopeLevel   `scope_definitions.slug` for the target level.
     * @param  string       $scopeValue   Concrete `ScopeValue` at `$scopeLevel`.
     * @param  string       $decision     One of `allow` / `deny`.
     * @param  string|null  $reason       Optional operator note.
     */
    public function __construct(
        #[Required, StringType, Max(191)]
        public string $flag,

        #[Required, StringType, Max(64)]
        public string $scopeLevel,

        #[Required, StringType, Max(191)]
        public string $scopeValue,

        #[Required, In(['allow', 'deny'])]
        public string $decision,

        #[StringType, Max(500)]
        public ?string $reason = null,
    ) {}
}
```

### Output DTOs — same rules

Output DTOs (returned from actions to the wire) use `#[MapOutputName]` instead
of `#[MapInputName]`, and typically skip validation attributes:

```php
#[MapOutputName(SnakeCaseMapper::class)]
final class FeatureOverrideData extends Data
{
    /**
     * @param  string       $id          Prefixed ULID.
     * @param  string       $tenantId    Owning tenant.
     * @param  string       $flag        Stable flag identifier.
     * @param  string       $decision    `allow` or `deny`.
     * @param  string|null  $expiresAt   ISO-8601 timestamp; null means never.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $flag,
        public string $decision,
        public ?string $expiresAt,
    ) {}

    public static function fromModel(FeatureOverride $o): self
    {
        return new self(
            id: (string) $o->getKey(),
            tenantId: (string) $o->getAttribute(FeatureOverrideInterface::ATTR_TENANT_ID),
            flag: (string) $o->getAttribute(FeatureOverrideInterface::ATTR_FLAG),
            decision: (string) $o->getAttribute(FeatureOverrideInterface::ATTR_DECISION),
            expiresAt: $o->expires_at?->toIso8601String(),
        );
    }
}
```

### Data-class anti-patterns

| Anti-pattern                                                                                | Correct                                                                                |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `public static function rules(): array { return ['flag' => 'required\|string\|max:191']; }` | `#[Required, StringType, Max(191)] public string $flag`                                |
| `public static function messages(): array`                                                  | `#[Required(message: '...')]` or `#[Rule('...', message: '...')]` per property         |
| Wrapping a `FormRequest` around a Data class                                                | Pass the Data class directly to `__invoke` — Spatie auto-validates                     |
| Inline `Validator::make(...)` inside the action                                             | Attributes on the Data class                                                           |
| Manual snake_case handling in `fromModel`                                                   | `#[MapInputName(SnakeCaseMapper::class)]` on the class                                 |
| `#[Rule('required                                                                           | string                                                                                 | max:191')]` string chain | `#[Required, StringType, Max(191)]` — separate attributes are checkable by PHPStan |
| Property with a domain enum typed as `string` on the Data class                             | Type the property as the enum + `#[Enum(FooEnum::class)]` — Spatie casts automatically |
| Nullable property without `#[Nullable]` OR `= null` default                                 | Add one — Spatie treats missing keys as `required` otherwise                           |
| Missing `#[DataCollectionOf(...)]` on an `array` of Data objects                            | Always required — Spatie cannot hydrate the collection without it                      |

### References

- Spatie Laravel Data — `vendor/spatie/laravel-data/src/Attributes/**/*.php`
- Docs: [spatie.be/docs/laravel-data/v4](https://spatie.be/docs/laravel-data/v4)
- Validation reference:
  `vendor/spatie/laravel-data/src/Attributes/Validation/*.php`

---

## Stackra CRUD attributes (`Stackra\Crud\Attributes\...`)

**This is the primary repository-authoring surface.** Repositories extend
`Stackra\Crud\Repositories\Repository` (attribute-first) and configure
themselves via attributes — never via `model()` / `tableName()` overrides. Model
resolution, caching, filtering, sorting, criteria, and event dispatch are all
declarative.

Bind the model interface (`Contracts/Data/<Model>Interface`) to its concrete
model via `#[Bind(Model::class)]`, then reference the interface from
`#[UseModel]` on the repository. The container resolves the interface → concrete
model at construction time.

### Class-level — required

| Attribute                    | Target     | Purpose                                                                                                                                                                                 | Signature                 |
| ---------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `#[AsRepository(priority?)]` | Repository | Marks the class for boot-time discovery. All `#[Use*]` / `#[Cacheable]` / `#[Filterable]` config is pre-resolved into `RepositoryConfigRegistry` (Octane-safe — no runtime reflection). | `int $priority = 100`     |
| `#[UseModel(interface)]`     | Repository | Declares which model interface the repository owns. The interface's `#[Bind(Model::class)]` resolves it to the concrete model. Replaces the `model()` / `modelClass()` override.        | `class-string $interface` |

### Class-level — optional configuration

| Attribute                                          | Target     | Purpose                                                                                                                                                               | Signature                                                                                                            |
| -------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `#[Cacheable(ttl?, store?, tags?, invalidateOn?)]` | Repository | Declarative caching. Reads are cached with TTL/tags; the model observer invalidates on the named events. Skip entirely if the repository shouldn't cache.             | `int $ttl = 3600, ?string $store = null, bool $tags = true, array $invalidateOn = ['created', 'updated', 'deleted']` |
| `#[Filterable(fields)]`                            | Repository | Whitelist request-driven filters. `fields` is either `'*'` (all fields, all operators) or a map `field => list<operator>\|'*'`. Backs `->filter()` on the repository. | `array\|string $fields = '*'`                                                                                        |
| `#[UsePolicy(class)]`                              | Repository | Bind an authorization policy for CRUD gate checks.                                                                                                                    | `class-string`                                                                                                       |
| `#[UseResource(class)]`                            | Repository | Default `JsonResource` for output DTO mapping.                                                                                                                        | `class-string`                                                                                                       |
| `#[UseData(class)]`                                | Repository | Default Spatie Data class for output DTO mapping.                                                                                                                     | `class-string`                                                                                                       |
| `#[UseService(class)]`                             | Repository | Associated domain service for orchestration wiring.                                                                                                                   | `class-string`                                                                                                       |
| `#[UseCriteria(...classes)]`                       | Repository | Criteria classes applied by default on every query. Repeatable.                                                                                                       | variadic `class-string<CriteriaInterface>`                                                                           |
| `#[UseQueryScope(...scopes)]`                      | Repository | Named query scopes (model methods) applied by default. Repeatable.                                                                                                    | variadic string                                                                                                      |
| `#[UseScope(class)]`                               | Repository | Global scope class applied to every query.                                                                                                                            | `class-string<Scope>`                                                                                                |
| `#[OrderBy(column, direction?)]`                   | Repository | Default sort applied when the request specifies none. Repeatable for tie-breakers.                                                                                    | `string $column, string $direction = 'asc'`                                                                          |
| `#[WithRelations(...names)]`                       | Repository | Relations eager-loaded on every read. Repeatable.                                                                                                                     | variadic string                                                                                                      |
| `#[WithCount(...names)]`                           | Repository | Relation counts appended on every read. Repeatable.                                                                                                                   | variadic string                                                                                                      |

### Consumer-side — services / controllers

| Attribute                                       | Target               | Purpose                                                                                                                                                         | Signature              |
| ----------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `#[UseRepository(interface\|model\|shortName)]` | Service / Controller | Declares which repository the class consumes. Resolves via the container from an interface, or via `RepositoryConfigRegistry` from a model class or short name. | `class-string\|string` |

### Canonical repository shape

Every FeatureFlags repository already follows this pattern:

```php
<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureOverrideRepositoryInterface;
use Stackra\FeatureFlags\Models\FeatureOverride;
use Stackra\FeatureFlags\Support\ScopePath;

/**
 * Attribute-first Eloquent implementation of {@see FeatureOverrideRepositoryInterface}.
 *
 * @extends Repository<FeatureOverride>
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(FeatureOverrideInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    FeatureOverrideInterface::ATTR_FLAG        => ['$eq', '$in'],
    FeatureOverrideInterface::ATTR_SCOPE_LEVEL => ['$eq', '$in'],
])]
final class EloquentFeatureOverrideRepository extends Repository implements FeatureOverrideRepositoryInterface
{
    public function findMatching(string $flag, ScopePath $path): ?FeatureOverride
    {
        // Domain query — CRUD comes from Repository, model comes from #[UseModel].
    }
}
```

The model interface it references:

```php
<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Contracts\Data;

use Stackra\FeatureFlags\Models\FeatureOverride;
use Illuminate\Container\Attributes\Bind;

#[Bind(FeatureOverride::class)]
interface FeatureOverrideInterface
{
    public const string TABLE = 'feature_overrides';
    // …
}
```

### CRUD anti-patterns

| Anti-pattern                                                                | Correct                                                                                                     |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `abstract protected function modelClass(): string` on a repository          | `#[UseModel(<Model>Interface::class)]` — no override needed                                                 |
| `abstract protected function tableName(): string` on a repository           | Not needed — `Repository` reads the model's `$table`                                                        |
| Repository extends `AbstractEloquentRepository` in new code                 | Extend `Repository` (attribute-first) — `AbstractEloquentRepository` is the legacy base                     |
| Repository interface lists CRUD methods (`find`, `paginate`, `create`, ...) | Interface holds only domain methods; CRUD comes from `RepositoryInterface` on the concrete via `Repository` |
| Manual `TaggableCacheGuard` wiring in the repository constructor            | `#[Cacheable(ttl: ..., tags: true)]` on the class — invalidation is auto-driven by model observers          |
| `->where('name', ...)` with a string literal                                | `->where(<Model>Interface::ATTR_NAME, ...)` — always via the interface constant                             |
| Repository interface without `#[Bind]`                                      | Add `#[Bind(EloquentXRepository::class)] #[Scoped]` on the interface — DI wiring is attribute-first         |
| Data interface (`<Model>Interface`) without `#[Bind]` pointing to the model | Add `#[Bind(<Model>::class)]` — required for `#[UseModel]` to resolve                                       |
| Service / controller taking the concrete repository in a constructor        | Type-hint the interface — the container binds via `#[Bind]`                                                 |
| Repository declaring `public function rules(): array`                       | Repositories don't validate — validation lives on the Data class via Spatie attributes                      |
