<?php

/**
 * @file packages/framework/routing/src/Controller.php
 *
 * @description
 * Legacy base controller class. **Deprecated by ADR 0016**
 * (Actions-only architecture). Preserved so pre-migration code
 * continues to compile — new code MUST NOT extend this class.
 *
 * The full HTTP surface (request accessors, response builders,
 * auth helpers, pagination, resource transformation, bulk
 * operations) is now packaged in the
 * {@see \Stackra\Routing\Concerns\HttpAction} trait; that
 * trait is the recommended way to opt into the surface for a
 * single-invoke action class.
 *
 * ## Migration path
 *
 * Before (deprecated):
 * ```php
 * final class TenantController extends Controller {
 *     public function store(CreateTenantRequestData $data) { ... }
 * }
 * ```
 *
 * After (ADR 0016 canonical):
 * ```php
 * #[AsAction(name: 'tenants.create')]
 * #[Post('/api/v1/tenants')]
 * final class CreateTenant {
 *     use HttpAction;
 *     public function __invoke(CreateTenantRequestData $data) { ... }
 * }
 * ```
 *
 * ## Why this class remains
 *
 *   - Framework primitives that ship pre-migration Controllers
 *     (health-check endpoints, telemetry probes, third-party
 *     package glue) still extend this class.
 *   - The `NoBaseControllerRule` architecture rule targets domain
 *     modules under `apps/{app}/src/modules/{domain}/` — the rule
 *     doesn't fire on framework packages, so the class staying
 *     doesn't create a violation.
 *
 * ## Composition
 *
 * The class extends `Illuminate\Routing\Controller` (for
 * middleware definitions attached at the class level via Laravel
 * conventions) and `use`s {@see HttpAction} to inherit the same
 * request/response/auth surface as an action. That way a
 * pre-migration `Controller` subclass and a post-migration
 * `HttpAction`-using action expose IDENTICAL helper method
 * names — the migration is truly mechanical.
 *
 * @see \Stackra\Routing\Concerns\HttpAction Canonical composite trait for new code.
 * @see \Stackra\Routing\Attributes\AsAction Marker attribute for action discovery.
 * @deprecated since 3.0 — per ADR 0016, use `HttpAction` trait on a `final class` action instead.
 */

declare(strict_types=1);

namespace Stackra\Routing;

use Stackra\Routing\Concerns\AsController;
use Illuminate\Routing\Controller as LaravelController;

/**
 * Backwards-compatible base controller. Domain modules MUST NOT
 * extend this class (enforced by
 * `architecture.no_base_controller`). Framework primitives may
 * extend it during their migration window.
 */
abstract class Controller extends LaravelController
{
    // Every helper the legacy Controller exposed now lives on
    // the shared AsController trait, so subclasses of Controller
    // still see the same method surface without duplication.
    use AsController;
}
