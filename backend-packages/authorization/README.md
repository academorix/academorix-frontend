# academorix/authorization

Attribute-driven controller authorization for every Academorix
package. Ships five attributes and a reflection-cached middleware
that enforces them BEFORE the controller body runs — no models,
no migrations, no coupling to a specific role/permission backend.

The heavier `packages/access` package ports the full admin
surface (Role + Permission Eloquent models, migrations, admin
controllers, spatie/laravel-permission wiring, super-admin
Gate::before). Every domain package can require this lightweight
package on its own to declare auth requirements without dragging
those tables in.

## The attribute surface

| Attribute                    | Semantics                                | Target        |
| ---------------------------- | ---------------------------------------- | ------------- |
| `#[RequirePermission(...)]`  | AND — user must hold every listed perm   | class, method |
| `#[RequireAnyPermission(...)]` | OR — user must hold at least one         | class, method |
| `#[RequireRole(...)]`        | AND — user must hold every listed role   | class, method |
| `#[RequireAnyRole(...)]`     | OR — user must hold at least one role    | class, method |
| `#[AllowGuest]`              | Bypasses the "must be authenticated" gate | class, method |

Every attribute is **repeatable**. Stacking two `#[RequirePermission]`
attributes on the same target enforces the compound AND — useful
when the permissions come from different domains and you want
grep-friendly declarations.

Every attribute accepts BOTH backed enums (implementers of
`Academorix\Authorization\Contracts\PermissionEnum`) and raw
strings. Prefer enums — they carry IDE navigation, rename safety,
and PHPStan verification that string literals cannot match.

## Quick start

```php
use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Authorization\Attributes\AllowGuest;
use Academorix\Users\Enums\UserPermission;

#[RequirePermission(UserPermission::View)]
final class UserController extends CrudController
{
    #[AllowGuest]
    public function healthcheck(): JsonResponse
    {
        return $this->apiResponse(['status' => 'ok']);
    }

    #[RequirePermission(UserPermission::Delete)]
    public function destroy(int|string $id): JsonResponse
    {
        return parent::destroy($id);
    }
}
```

- `healthcheck()` — `#[AllowGuest]` short-circuits the auth check.
  Guests pass; authenticated callers still need `user.view` from
  the class-level attribute.
- `destroy()` — requires `user.view` AND `user.delete` (compound
  from class + method).
- Every other inherited action from `CrudController` requires
  `user.view` (class-level only).

## Wiring the middleware

The service provider registers the middleware under the alias
`authorize.action`. Consumers push it onto the `api` group in
`bootstrap/app.php` — placement between `Authenticate` and
`SubstituteBindings` is deliberate: we want `$request->user()`
resolved BEFORE we run, but we want to fail 403 BEFORE
route-model-binding queries the database.

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->api(prepend: [
        \Academorix\Foundation\Http\Middleware\AssignCorrelationId::class,
        \Academorix\Authorization\Middleware\AuthorizeControllerAction::class,
    ]);
})
```

## Failure semantics

| Situation                                             | Response                      |
| ----------------------------------------------------- | ----------------------------- |
| Controller carries no `Require*` and no `#[AllowGuest]` | Passes through — no auth check |
| Controller has `Require*`, guest, no `#[AllowGuest]`  | `AuthenticationException` (401) |
| Controller has `Require*`, guest, `#[AllowGuest]` present | Passes through                |
| Missing a permission from `#[RequirePermission]`       | `AuthorizationException` (403) |
| Missing every permission in `#[RequireAnyPermission]`  | `AuthorizationException` (403) |
| Missing a role from `#[RequireRole]`                   | `AuthorizationException` (403) |
| Missing every role in `#[RequireAnyRole]`              | `AuthorizationException` (403) |

Failures produce standard Laravel exceptions — the `academorix/exceptions`
handler renders them into the shared JSON envelope with the
right HTTP status.

## Super-admin bypass

Permission checks route through Laravel's Gate (`$user->can()`).
`packages/access` wires a `Gate::before` hook that returns `true`
for every ability when the user holds the `super_admin` role.

**Role checks do NOT bypass.** `hasAllRoles()` / `hasAnyRole()`
consult spatie/laravel-permission directly — a super-admin who
lacks the requested role is denied. This is deliberate: super-admin
grants every ability but should NOT auto-grant every role
(otherwise a super-admin could bypass a `#[RequireRole('auditor')]`
gate on a compliance controller).

## Contributor contracts

Domain packages that ship permissions or roles implement one of
the two contributor contracts. `packages/access` iterates the
container tags at boot and seeds the database.

```php
// packages/users/src/Access/UserPermissionContributor.php
use Academorix\Authorization\Contracts\PermissionContributor;
use Academorix\Users\Enums\UserPermission;

final class UserPermissionContributor implements PermissionContributor
{
    public function permissions(): array
    {
        return [UserPermission::class];
    }
}
```

```php
// From the same package's service provider:
$this->app->tag(
    [UserPermissionContributor::class],
    PermissionContributor::CONTAINER_TAG,
);
```

The `packages/access` package's boot listener iterates the tag,
expands every enum's cases, and upserts them into
spatie/laravel-permission's `permissions` table.

## Two-layer authorization (recommended pattern)

Combine `#[RequirePermission]` / `#[RequireRole]` (route-level,
runs in middleware BEFORE the controller body) with
`#[UsePolicy]` from `packages/crud` (record-level, runs INSIDE
each CRUD action against a Laravel policy class). Defense-in-depth:

- Middleware fails fast on missing permissions — no DB touch.
- Policy runs on records the middleware waved through — catches
  owner / tenant / status invariants that middleware can't see.

```php
#[UseService(UserServiceInterface::class)]
#[UseData(class: UserData::class)]
#[UsePolicy(User::class)]                          // record-level
#[RequirePermission(UserPermission::Manage)]       // route-level
final class UserController extends CrudController {}
```

## Package layout

```
packages/authorization/
├── src/
│   ├── Attributes/
│   │   ├── AllowGuest.php
│   │   ├── RequireAnyPermission.php
│   │   ├── RequireAnyRole.php
│   │   ├── RequirePermission.php
│   │   └── RequireRole.php
│   ├── Contracts/
│   │   ├── PermissionContributor.php
│   │   ├── PermissionEnum.php
│   │   └── RoleContributor.php
│   ├── Enums/
│   │   └── Guard.php
│   ├── Middleware/
│   │   └── AuthorizeControllerAction.php
│   └── Providers/
│       └── AuthorizationServiceProvider.php
├── tests/
└── composer.json
```

## Related packages

- `packages/access` — the full role/permission admin surface.
  Depends on this package for the attribute + middleware API.
- `packages/crud` — ships `#[UsePolicy]` for record-level auth.
  Complements the route-level story here.
- `packages/foundation` — ships the `DiscoversAttributes` contract
  used by `packages/access` to seed contributor tags.
