<?php

/**
 * @file packages/framework/routing/src/Attributes/AsAction.php
 *
 * @description
 * Discovery marker for single-purpose action classes — the class
 * of route target introduced by ADR 0016 (Actions-only
 * architecture, supersedes ADR 0013).
 *
 * ## What an "action" is
 *
 * An action is a single-responsibility class that:
 *
 *   1. Carries this attribute + exactly one HTTP-verb route
 *      attribute (`#[Get]`, `#[Post]`, `#[Put]`, `#[Patch]`,
 *      `#[Delete]`).
 *   2. Exposes exactly one entry point — `__invoke()` OR
 *      `handle()`. `__invoke()` is the router-preferred name and
 *      makes the class callable as `$container->make(Foo::class)($args)`
 *      in tests.
 *   3. Receives its collaborators via constructor DI, using
 *      attribute-first patterns (`#[UseRepository]`, `#[Bind]`,
 *      `#[Config]`, `#[Singleton]`, `#[Scoped]`).
 *   4. Receives its input as a strongly-typed Spatie Data class
 *      argument on the entry method — Laravel's route-binding +
 *      spatie/laravel-data validation take care of hydration.
 *   5. Returns either a Spatie Data class (rendered to JSON by
 *      the response builder) or a `Response` when a bespoke
 *      status / body is required.
 *
 * ## What an action REPLACES
 *
 *   - `Services/` — orchestration moves INTO the action. If two
 *     actions share orchestration, extract to a private support
 *     class in `Support/` — not to a Service. The action is the
 *     transaction script.
 *   - `Controllers/` — no more `TenantController::store()`. A
 *     `CreateTenant` action IS the endpoint.
 *
 * ## Discovery
 *
 * `RouteRegistrar` walks `#[AsAction]` at boot the same way it
 * walks `#[AsController]`, but treats action classes as "single-
 * invoke" — the route target is `ClassName::class` (not
 * `[ClassName::class, 'method']`). Laravel's routing already
 * supports invokable-class targets natively.
 *
 * ## Example
 *
 * ```php
 * use Stackra\Routing\Attributes\{AsAction, Post};
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
 *     public function __construct(
 *         private readonly TenantRepositoryInterface $tenants,
 *     ) {}
 *
 *     public function __invoke(CreateTenantRequestData $data): TenantData
 *     {
 *         $tenant = $this->tenants->create($data->toArray());
 *
 *         return TenantData::from($tenant);
 *     }
 * }
 * ```
 *
 * @see \Stackra\Routing\Attributes\AsController Legacy multi-method target (kept for backwards compat during migration; new code MUST use AsAction).
 * @see \Stackra\Routing\RouteRegistrar Discovery consumer.
 */

declare(strict_types=1);

namespace Stackra\Routing\Attributes;

use Attribute;

/**
 * Marker attribute for single-purpose action classes.
 *
 * TARGET_CLASS because an action is one class, one endpoint, one
 * invocation. Not repeatable — an action that maps to more than
 * one route isn't a single action.
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsAction
{
    /**
     * @param  string|null  $name
     *   Optional stable route name — same semantics as Laravel's
     *   `Route::name(...)`. When null, the router derives the
     *   name from the class' short name in kebab-case
     *   (`CreateTenant` → `create-tenant`).
     *
     * @param  int  $priority
     *   Discovery priority — lower runs first. Convention:
     *
     *     -   0..49  — critical / structural (auth, health).
     *     -  50..149 — normal domain actions.
     *     - 150..∞   — experimental.
     *
     * @param  bool  $enabled
     *   When `false`, the action is skipped at discovery time.
     *   Useful for feature-flagging an in-progress action
     *   without deleting the class.
     */
    public function __construct(
        public ?string $name = null,
        public int $priority = 100,
        public bool $enabled = true,
    ) {
    }
}
