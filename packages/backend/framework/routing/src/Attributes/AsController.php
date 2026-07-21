<?php

/**
 * @file packages/framework/routing/src/Attributes/AsController.php
 *
 * @description
 * **DEPRECATED (ADR 0016 — Actions-only architecture).**
 * Marker attribute for the legacy multi-method Controller
 * pattern. New code MUST use
 * {@see \Stackra\Routing\Attributes\AsAction} on a
 * single-invoke action class instead.
 *
 * ## Why deprecated
 *
 * ADR 0016 collapses the "Controller + Service + Repository"
 * layering into "Action + Repository" — one class per endpoint,
 * one entry point (`__invoke()`), zero indirection. `#[AsController]`
 * marked multi-method classes; that shape violates the
 * single-responsibility invariant every action must uphold.
 *
 * ## Migration path
 *
 * Before (deprecated):
 * ```php
 * #[AsController]
 * class TenantController
 * {
 *     #[Get('/api/v1/tenants')]
 *     public function index() { … }
 *
 *     #[Post('/api/v1/tenants')]
 *     public function store(CreateTenantRequestData $data) { … }
 * }
 * ```
 *
 * After (ADR 0016 canonical — one class per endpoint):
 * ```php
 * #[AsAction(name: 'tenants.list')]
 * #[Get('/api/v1/tenants')]
 * final class ListTenants
 * {
 *     use AsController;
 *     public function __invoke() { … }
 * }
 *
 * #[AsAction(name: 'tenants.create')]
 * #[Post('/api/v1/tenants')]
 * final class CreateTenant
 * {
 *     use AsController;
 *     public function __invoke(CreateTenantRequestData $data) { … }
 * }
 * ```
 *
 * Each action inherits the same HTTP surface via the
 * {@see \Stackra\Routing\Concerns\AsController} trait — the
 * trait shares the short name with this attribute but lives in a
 * different namespace, so both coexist in the codebase during
 * the migration window.
 *
 * ## Migration timeline
 *
 *   - **Now** — Domain modules MUST NOT add new
 *     `#[AsController]` targets. The
 *     `architecture.no_base_controller` +
 *     `architecture.action_has_as_action_attribute` rules enforce
 *     this at CI time.
 *
 *   - **Framework packages** — May keep pre-existing
 *     `#[AsController]` targets during their migration window.
 *     The `RouteRegistrar` will continue to discover both
 *     `#[AsController]` and `#[AsAction]` classes until the
 *     next major version.
 *
 *   - **Next major** — The attribute + the `Stackra\Routing\Controller`
 *     base class are both removed. Any lingering usage becomes
 *     a compile error.
 *
 * ## What this attribute still does (during the migration window)
 *
 * The `RouteRegistrar` recognises `#[AsController]` at discovery
 * time and applies the `$group`, `$prefix`, and `$middleware`
 * hints to every route attribute on the class's methods —
 * identical behaviour to the pre-ADR-0016 implementation. That
 * gives existing consumers time to migrate without breaking
 * routes.
 *
 * @see \Stackra\Routing\Attributes\AsAction  Replacement — single-invoke action classes.
 * @see \Stackra\Routing\Concerns\AsController Replacement — HTTP-surface trait for actions.
 * @see \Stackra\Routing\Controller           Legacy base class (also deprecated by ADR 0016).
 *
 * @deprecated since 3.0 — per ADR 0016 use `#[AsAction]` on a `final class` action with `use AsController;` for the HTTP surface. Slated for removal in the next major.
 */

declare(strict_types=1);

namespace Stackra\Routing\Attributes;

use Attribute;

/**
 * DEPRECATED marker for the legacy multi-method Controller
 * pattern. Emits no PHP-side deprecation notice at construction
 * time to avoid noise in existing test suites — the deprecation
 * is enforced by PHPStan + the architecture rule
 * `architecture.no_base_controller`.
 *
 * @deprecated since 3.0 — use `#[AsAction]` instead. See the file docblock.
 */
#[Attribute(Attribute::TARGET_CLASS)]
class AsController
{
    /**
     * @param  string|null              $group       Optional route-group name applied to every method's route on the class.
     * @param  string|null              $prefix      Optional URL prefix prepended to every method's route.
     * @param  array<string>|string     $middleware  Middleware alias(es) applied to every route on the class.
     */
    public function __construct(
        public ?string $group = null,
        public ?string $prefix = null,
        public array|string $middleware = [],
    ) {
    }
}
