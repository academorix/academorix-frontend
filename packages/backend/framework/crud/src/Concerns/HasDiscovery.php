<?php

declare(strict_types=1);

/**
 * Has Discovery Trait
 *
 * Provides Discovery capabilities to models and classes that use this trait.
 * Encapsulates reusable Discovery logic for the Framework module.
 *
 * @category Concerns
 *
 * @since    1.0.0
 */
namespace Academorix\Crud\Concerns;

use Academorix\Crud\Concerns\Discovery\HasDiscoverableCriteria;
use Academorix\Crud\Concerns\Discovery\HasDiscoverableRepositories;
use Academorix\Crud\Concerns\Discovery\HasDiscoverableScopes;

/**
 * HasDiscovery Trait.
 *
 * Composite trait that provides automatic discovery and registration of
 * Criteria, Scopes, and Repository configurations via academorix/discovery.
 *
 * Delegates to focused sub-traits:
 * - HasDiscoverableCriteria: discovers #[AsCriteria] classes
 * - HasDiscoverableScopes: discovers #[AsScope] classes
 * - HasDiscoverableRepositories: discovers #[AsRepository] classes
 *
 * All attribute resolution happens at boot time (cached) — zero
 * runtime reflection. Octane-safe.
 *
 * @category Concerns
 *
 * @since    2.0.0
 */
trait HasDiscovery
{
    use HasDiscoverableCriteria;
    use HasDiscoverableRepositories;
    use HasDiscoverableScopes;
}
