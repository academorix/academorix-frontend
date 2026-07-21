<?php

/**
 * @file packages/framework/routing/src/Concerns/AsController.php
 *
 * @description
 * Composite trait that gives any invocable action class the full
 * HTTP request/response/auth surface previously provided by the
 * routing package's abstract `Controller` base class.
 *
 * Per ADR 0016 (Actions-only architecture) domain modules ship
 * single-invoke action classes — never Controllers. Actions
 * shouldn't need to extend a framework base class to gain
 * response builders, pagination helpers, request accessors, or
 * auth utilities. They `use AsController;` and inherit the whole
 * surface via trait composition. That keeps the action's own
 * `extends` clause free (or absent entirely).
 *
 * ## Naming note
 *
 * The trait shares its short name with the `#[AsController]`
 * attribute at `Stackra\Routing\Attributes\AsController`.
 * Namespaces resolve the collision at the class level; a
 * consumer that needs BOTH the attribute and the trait in the
 * same file aliases one of the imports:
 *
 *   use Stackra\Routing\Attributes\AsController as AsControllerAttribute;
 *   use Stackra\Routing\Concerns\AsController;
 *
 * The `#[AsController]` attribute itself is deprecated by
 * ADR 0016 — its use in domain modules is banned; framework
 * primitives keep it during the migration window.
 *
 * ## What this trait bundles
 *
 *   - **InteractsWithApiVersion** — API-version accessors
 *     (`apiVersion()`, `apiVersionIs()`, `apiVersionIn()`,
 *     `apiVersionSatisfies()`, `apiVersionIsDeprecated()`).
 *     Reads the version resolved by the DetectApiVersion
 *     middleware.
 *   - **InteractsWithAuth** — auth helpers (`user()`, `hasRole()`,
 *     `hasPermission()`, `requireUser()`).
 *   - **InteractsWithBulkOperations** — bulk-response builders
 *     (`bulkCreated()`, `bulkUpdated()`, `bulkDeleted()`).
 *   - **InteractsWithDataTransformation** — Spatie Data DTO
 *     hydration via `#[UseData]` on the action.
 *   - **InteractsWithPagination** — paginate + paginated-response
 *     helpers.
 *   - **InteractsWithRequest** — request-data accessors
 *     (`query()`, `input()`, `header()`).
 *   - **InteractsWithResources** — API resource transformation
 *     (`resource()`, `collection()`).
 *   - **InteractsWithResponse** — response builders (`ok()`,
 *     `created()`, `notFound()`, `noContent()`, ...).
 *   - **InteractsWithServices** — service-locator convenience
 *     (kept for legacy transition even though ADR 0016 bans a
 *     Services layer — the trait method is a no-op for pure
 *     actions).
 *   - **Macroable** — extend the surface at runtime via
 *     `SomeAction::macro('customMethod', fn () => ...)`.
 *   - **ValidatesRequests** — Laravel's request-validation
 *     surface (rarely used in actions since validation lives on
 *     the Spatie Data class, but preserved for exceptional cases).
 *   - **AuthorizesRequests** — Laravel's `authorize()` /
 *     `$this->authorizeForUser(...)` — used by policy-driven
 *     actions.
 *
 * ## Usage
 *
 * ```php
 * use Stackra\Routing\Attributes\{AsAction, Post};
 * use Stackra\Routing\Concerns\AsController;
 * use Stackra\Authorization\Attributes\RequirePermission;
 * use Stackra\Tenancy\Contracts\Repositories\TenantRepositoryInterface;
 * use Stackra\Tenancy\Enums\TenancyPermission;
 * use Stackra\ApiTenancySdk\Data\TenantData;
 * use Stackra\ApiTenancySdk\Requests\CreateTenantRequestData;
 *
 * #[AsAction(name: 'tenants.create')]
 * #[Post('/api/v1/tenants')]
 * #[RequirePermission(TenancyPermission::Manage)]
 * final class CreateTenant
 * {
 *     use AsController;
 *
 *     public function __construct(
 *         private readonly TenantRepositoryInterface $tenants,
 *     ) {}
 *
 *     public function __invoke(CreateTenantRequestData $data): mixed
 *     {
 *         $tenant = $this->tenants->create($data->toArray());
 *
 *         // Response builder inherited from InteractsWithResponse.
 *         return $this->created(TenantData::from($tenant));
 *     }
 * }
 * ```
 *
 * ## Why a trait (and not extension of a base class)
 *
 *   - Actions are `final` per ADR 0016. Chaining inheritance
 *     through a framework base defeats that (and Laravel's
 *     `Illuminate\Routing\Controller` isn't final so a subclass
 *     could still be extended by mistake).
 *   - Actions may want to `use` other traits
 *     (`InteractsWithCache`, `BelongsToTenant`, domain-specific
 *     traits). Trait composition beats single inheritance.
 *   - Static analysis (PHPStan) reads trait methods correctly
 *     without navigating up an inheritance chain.
 *   - Route-target discovery via `#[AsAction]` doesn't require
 *     any specific base class. Invokable classes are natively
 *     supported by Laravel's router.
 *
 * ## Interaction with the legacy `Controller` base class
 *
 * `Stackra\Routing\Controller` (deprecated by ADR 0016 for
 * domain modules but kept for backwards compat) `use`s this same
 * trait — so the surface is identical between the two paths.
 * Code that already extends `Controller` gets no functional
 * change; new code uses the trait directly.
 *
 * ## Octane safety
 *
 * Every method the composed traits expose reads from the current
 * request via the `Illuminate\Http\Request` binding — no state
 * captured on `$this`, no static caches, no facades held across
 * requests. Actions are constructed fresh per request by the
 * container (or pooled when marked `#[Singleton]`); either mode
 * is safe.
 *
 * @see \Stackra\Routing\Controller Legacy base class (uses this same trait).
 * @see \Stackra\Routing\Attributes\AsAction Marker attribute for action discovery.
 * @see \Stackra\Routing\Attributes\AsController Deprecated attribute (ADR 0016) — same short name, different namespace.
 */

declare(strict_types=1);

namespace Stackra\Routing\Concerns;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Support\Traits\Macroable;

/**
 * Composite trait — action + controller HTTP surface.
 *
 * Every action that touches the HTTP layer (parses input, emits
 * a response, calls `paginate()`, checks `apiVersion()`) `use`s
 * this trait. Zero-effort onboarding for a new action.
 */
trait AsController
{
    // ---------------------------------------------------------
    // Domain-specific concerns from the routing package.
    // ---------------------------------------------------------
    use InteractsWithApiVersion;
    use InteractsWithAuth;
    use InteractsWithBulkOperations;
    use InteractsWithDataTransformation;
    use InteractsWithPagination;
    use InteractsWithRequest;
    use InteractsWithResources;
    use InteractsWithResponse;
    use InteractsWithServices;

    // ---------------------------------------------------------
    // Laravel-shipped traits every controller / action expects.
    // ---------------------------------------------------------
    use AuthorizesRequests;
    use Macroable;
    use ValidatesRequests;
}
