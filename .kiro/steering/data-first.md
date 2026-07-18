---
inclusion: fileMatch
fileMatchPattern: "**/*.php"
---

# Data-first — spatie/laravel-data patterns

We do **not** use Laravel's `FormRequest` for validation. We do **not** use
`JsonResource` / `ResourceCollection` for serialisation. Both are replaced by
`spatie/laravel-data` DTOs — one `Data` class per shape, one shape per boundary.

## Why

- **One class, one shape.** Input validation, transport typing, and output
  serialisation live on the same object. IDEs + PHPStan see the shape
  end-to-end.
- **Attributes carry the rules.** `#[Required]`, `#[Email]`, `#[Max]`,
  `#[Confirmed]` sit on the property, right next to the type. No parallel
  `rules()` array to drift.
- **Non-nullable typed properties are auto-required.** Nullable properties are
  auto-nullable. The rule set is 90% implied by the signature.
- **Controllers stay thin.** The container validates + hydrates the Data object
  before `__invoke()` runs; controllers receive a guaranteed-valid DTO.
- **No manual `Resource::make($model)` on the return path.** Call
  `MyData::from($model)` and return it. Serialisation runs the same shape
  backwards.

## Prerequisite

`spatie/laravel-data` v4+ installed at the app level. Adding it requires user
approval per `AGENTS.md`. Every package that emits Data DTOs declares it under
`require`.

## Naming + placement

- **Input Data** — validated request payload. Named for the action: `LoginData`,
  `UpdateInvoiceData`, `CreateBranchData`. Lives under
  `packages/<name>/src/Data/`.
- **Output Data** — public API representation. Named for the entity: `UserData`,
  `InvoiceData`, `BranchData`. Same folder.
- Value objects and Command / Event payloads that happen to be DTOs also live in
  `Data/`. When a shape doesn't leave the process, keep it as a plain `readonly`
  class instead — Data is for the serialisation boundary.

## Input Data — replaces FormRequest

Declare validation via property-level attributes. Every non-nullable typed
property becomes `required`; every nullable property becomes `nullable`.

Map snake_case request keys to camelCase properties with
`#[MapInputName(SnakeCaseMapper::class)]`. For dynamic rules (DB lookups,
conditional rules) override
`public static function rules(ValidationContext $context): array`.

```php
<?php

declare(strict_types=1);

namespace Academorix\Auth\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated credentials for POST /api/auth/login.
 *
 * `email` and `password` are required by virtue of being
 * non-nullable typed properties. `code` and `deviceName` are
 * optional. The `SnakeCaseMapper` maps request keys
 * `device_name` → property `deviceName`.
 */
#[MapInputName(SnakeCaseMapper::class)]
final class LoginData extends Data
{
    /**
     * @param  string       $email       Account email address.
     * @param  string       $password    Plain-text password. Verified,
     *                                   never persisted, and marked
     *                                   `#[SensitiveParameter]` at the
     *                                   service boundary.
     * @param  string|null  $code        Optional TOTP or recovery code.
     * @param  string|null  $deviceName  Optional label for the issued
     *                                   device session (max 255 chars).
     */
    public function __construct(
        #[Email]
        public string $email,
        public string $password,
        public ?string $code = null,
        #[Max(255)]
        public ?string $deviceName = null,
    ) {}
}
```

### Dynamic rules

For conditional rules or DB-lookup-driven rules, override `static rules()`:

```php
public static function rules(ValidationContext $context): array
{
    return [
        'invoice_number' => [
            'required',
            'string',
            Rule::unique('invoices')->ignore($context->payload['id'] ?? null),
        ],
    ];
}
```

### Available validation attributes

Full list at
[laravel-data validation attributes](https://spatie.be/docs/laravel-data/v4/advanced-usage/validation-attributes).
Common ones we use:

| Attribute                                  | Purpose                                                      |
| ------------------------------------------ | ------------------------------------------------------------ |
| `#[Required]`                              | Only needed when a property is nullable but MUST be present. |
| `#[Email]`, `#[Url]`, `#[Uuid]`, `#[Ulid]` | Format checks.                                               |
| `#[Min(int)]`, `#[Max(int)]`               | Numeric bounds; also length for strings.                     |
| `#[Between(min, max)]`                     | Range.                                                       |
| `#[In(...values)]`, `#[Enum(class)]`       | Whitelist / enum.                                            |
| `#[Regex(pattern)]`                        | Pattern match.                                               |
| `#[Confirmed]`                             | Password confirmation (`_confirmation` sibling).             |
| `#[Unique(table, column?, ignore?)]`       | DB unique constraint.                                        |
| `#[Exists(table, column?)]`                | DB existence check.                                          |
| `#[After(date)]`, `#[Before(date)]`        | Date bounds.                                                 |
| `#[Rule('rule                              | args', message?)]`                                           | Fallback for the long-tail rules. |

Composite class-level attributes for the whole payload:

| Attribute                                      | Purpose                                          |
| ---------------------------------------------- | ------------------------------------------------ |
| `#[MapInputName(SnakeCaseMapper::class)]`      | Map request key case.                            |
| `#[MapOutputName(CamelCaseMapper::class)]`     | Map output key case.                             |
| `#[Computed]` on a property                    | Value computed inside the class, not from input. |
| `#[Hidden]` on a property                      | Excluded from output.                            |
| `#[Lazy]` on a property (or `Lazy::when(...)`) | Include only when explicitly requested.          |

## Output Data — replaces JsonResource

Named for the entity. Built with `Data::from($model)` and
`Data::collect($models)`. Use `Lazy` + `#[WhenLoaded]` for optional relations to
avoid N+1 and over-fetching.

```php
<?php

declare(strict_types=1);

namespace Academorix\User\Data;

use Academorix\User\Models\User;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Lazy;

/**
 * Public API representation of a user.
 *
 * Never exposes `password`, `remember_token`, or any Sanctum PII —
 * those columns are `#[Hidden]` on the model AND omitted from this
 * class. Removing a column from the model's `#[Hidden]` list is
 * NOT sufficient — verify the Data class here doesn't include it.
 */
final class UserData extends Data
{
    /**
     * @param  int              $id           Primary key.
     * @param  string           $name         Display name.
     * @param  string           $email        Contact email.
     * @param  \DateTimeInterface $createdAt  Account creation timestamp.
     * @param  Lazy|OrganizationData $organization  Loaded via `?include=organization`.
     */
    public function __construct(
        public int $id,
        public string $name,
        public string $email,

        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,

        public Lazy|OrganizationData $organization,
    ) {}

    /**
     * Custom mapping from a User model to this DTO. Explicit is
     * safer than `spatie/laravel-data`'s auto-mapping when the
     * DB column names diverge from the exposed property names.
     */
    public static function fromModel(User $user): self
    {
        return new self(
            id: $user->id,
            name: $user->name,
            email: $user->email,
            createdAt: $user->created_at,
            organization: Lazy::whenLoaded(
                'organization',
                $user,
                fn (): OrganizationData => OrganizationData::from($user->organization),
            ),
        );
    }
}
```

Controller returns the DTO directly — `spatie/laravel-data` handles
serialisation:

```php
public function __invoke(int $userId): UserData
{
    return UserData::from($this->users->findOrFail($userId));
}
```

## Command Data — for services + jobs

When a service accepts more than 2 scalar arguments, wrap them in a `Data` DTO.
Domain objects that never leave the process stay as plain `readonly` classes;
Data is for anything that might cross a serialisation boundary (queues, events,
HTTP).

```php
final class CreateInvoiceData extends Data
{
    public function __construct(
        public string $customerId,
        public int $amountCents,
        public string $currency,
        public ?\DateTimeInterface $dueAt = null,
    ) {}
}
```

## Anti-patterns

| Anti-pattern                                                  | Preferred                                                                  |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `FormRequest` subclass with `rules()`                         | `Data` subclass with `#[Required]` / `#[Email]` / `#[Max]` attributes.     |
| `JsonResource` subclass with `toArray($request)`              | `Data` subclass with typed properties.                                     |
| Manual `$request->validate([...])` inside a controller        | Type-hint the Data class in the method signature.                          |
| `Model::find($id)->toArray()` returned from a controller      | `Data::from($model)` returned; hides only the fields we opt into.          |
| Returning associative arrays from services                    | Return `Data` DTOs; strongly typed all the way through.                    |
| Hand-rolled snake / camel case mapping                        | `#[MapInputName]` / `#[MapOutputName]`.                                    |
| Eager-loading everything in output DTOs                       | `Lazy` + `#[WhenLoaded]` + `?include=` query param.                        |
| Adding a `password` field to output `UserData` "just in case" | Never — build the DTO minimum-first. Add fields only when a consumer asks. |

## Testing DTOs

Unit tests live under `tests/Unit/Data/` and use `spatie/laravel-data`'s test
helpers. Assert on the validation rule set the DTO produces without hitting
HTTP:

```php
it('rejects an invoice with negative amount', function (): void {
    expect(fn () => CreateInvoiceData::validate([
        'customer_id' => 'c_123',
        'amount_cents' => -100,
        'currency' => 'USD',
    ]))->toThrow(ValidationException::class);
});
```

Feature tests exercise the controller end-to-end and assert on the output DTO's
shape:

```php
it('returns a UserData shape', function (): void {
    $user = User::factory()->create();

    $this->getJson("/api/v1/users/{$user->id}")
        ->assertOk()
        ->assertJson(fn (AssertableJson $json) => $json
            ->has('id')->has('name')->has('email')->has('createdAt')
            ->missing('password')  // sanity — never leak
            ->etc(),
        );
});
```

## References

- `spatie/laravel-data` docs: https://spatie.be/docs/laravel-data/v4
- Validation attributes:
  https://spatie.be/docs/laravel-data/v4/advanced-usage/validation-attributes
- Mapping input names:
  https://spatie.be/docs/laravel-data/v4/advanced-usage/mapping-property-names
- Lazy properties:
  https://spatie.be/docs/laravel-data/v4/advanced-usage/lazy-properties
