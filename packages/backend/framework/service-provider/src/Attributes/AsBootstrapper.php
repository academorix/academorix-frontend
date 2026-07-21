<?php

declare(strict_types=1);

namespace Stackra\ServiceProvider\Attributes;

use Stackra\ServiceProvider\Bootstrappers\AbstractBootstrapper;
use Stackra\ServiceProvider\Bootstrappers\BootstrapperDiscoveryBootstrapper;
use Stackra\ServiceProvider\Contracts\BootstrapperInterface;
use Stackra\ServiceProvider\Registry\BootstrapperRegistry;
use Attribute;

/**
 * Class-level marker registering a class with the shared
 * {@see BootstrapperRegistry}.
 *
 * ## Two-track registration — pick one path per bootstrapper
 *
 *  * Preferred for internal modules: declare the class in the
 *    concrete provider's `protected array $bootstrappers = []` — the
 *    provider IS a stable, editable manifest.
 *  * Preferred for third-party modules + orphaned bootstrappers:
 *    carry this attribute. The framework's own meta-bootstrapper,
 *    {@see BootstrapperDiscoveryBootstrapper},
 *    scans every class carrying this attribute and registers them.
 *
 * The registry deduplicates by FQCN, so both paths converge safely
 * even when a class registers itself via both.
 *
 * ## NOT the same as `#[AsTenancyHook]`
 *
 * `#[AsBootstrapper]` marks app-boot discovery classes (cached under
 * `bootstrapper.*`). `#[AsTenancyHook]` marks per-tenant lifecycle
 * classes (never cached — see ADR 0020). The two attributes live in
 * the same namespace but they are DIFFERENT concepts — importing the
 * wrong one is a type error the moment the container tries to hydrate
 * it. Read ADR 0020 before authoring either.
 *
 * @see AbstractBootstrapper Base class the marked target extends.
 * @see BootstrapperRegistry       Populated registry.
 * @see AsTenancyHook           Sibling marker (per-tenant lifecycle).
 *
 * @category Bootstrapper
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsBootstrapper
{
    /**
     * @param  int  $priority  Execution priority — lower runs first. Matches {@see BootstrapperInterface::priority()}; defaults to 100 for domain modules.
     * @param  bool  $enabled  Feature-flag toggle. Set to `false` to keep the class in the codebase but skip registration (useful during migrations).
     * @param  string  $module  Optional module owner tag. When left empty, the discovery step derives the module from the class FQCN's second namespace segment (e.g. `Stackra\AI\...` → `AI`).
     */
    public function __construct(
        public int $priority = 100,
        public bool $enabled = true,
        public string $module = '',
    ) {}
}
