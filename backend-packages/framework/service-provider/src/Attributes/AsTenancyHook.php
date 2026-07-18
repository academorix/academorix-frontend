<?php

declare(strict_types=1);

namespace Academorix\ServiceProvider\Attributes;

use Academorix\ServiceProvider\Bootstrappers\TenancyHookBootstrapper;
use Academorix\ServiceProvider\Contracts\TenancyHookInterface;
use Academorix\ServiceProvider\Registry\TenancyHookRegistry;
use Attribute;

/**
 * Class-level marker registering a class with the shared
 * {@see TenancyHookRegistry}.
 *
 * ## NOT the same as `#[AsBootstrapper]`
 *
 * `#[AsTenancyHook]` marks per-tenant lifecycle classes — fires on
 * every tenant init / end, never cached. `#[AsBootstrapper]` marks
 * app-boot discovery classes — fires once, cached under
 * `bootstrapper.*`. Two attributes, two registries, two dispatchers.
 * ADR 0020 enumerates the split; use the wrong one and the type
 * system catches it at hydrate time.
 *
 * ## Discovery
 *
 * At framework boot the meta-{@see TenancyHookBootstrapper}
 * scans every class carrying this attribute, verifies it implements
 * {@see TenancyHookInterface},
 * and registers it into the {@see TenancyHookRegistry}.
 *
 * ## Priority ranges (see `.kiro/steering/tenancy-hooks.md`)
 *
 *  * `0..99`     — framework-level (cache prefix, DB search path, log context)
 *  * `100..199`  — ancillary infra (sentry tenant tag, correlation-id enrichment)
 *  * `200..299`  — permission / auth wiring (spatie team, guard mapping)
 *  * `300+`      — domain-specific (feature-flag warming per tenant, ...)
 *
 * @see TenancyHookInterface Consumer contract.
 * @see TenancyHookRegistry    Populated registry.
 * @see AsBootstrapper       Sibling app-boot marker (ADR 0020).
 *
 * @category TenancyHook
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsTenancyHook
{
    /**
     * @param  int  $priority  Execution priority — lower runs first on init, LAST on end (symmetric teardown).
     * @param  bool  $enabled  Feature-flag toggle; set to `false` to keep the class in place but skip registration.
     */
    public function __construct(
        public int $priority = 100,
        public bool $enabled = true,
    ) {}
}
