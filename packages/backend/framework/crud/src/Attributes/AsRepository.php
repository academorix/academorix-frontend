<?php

declare(strict_types=1);

/**
 * As Repository Attribute
 *
 * PHP 8 attribute for compile-time metadata annotation in the Framework module.
 * Discovered by the compiler to configure runtime behavior automatically.
 *
 * @category Attributes
 *
 * @since    1.0.0
 */
namespace Stackra\Crud\Attributes;

use Attribute;

/**
 * AsRepository Attribute.
 *
 * Marks a class as a repository for automatic discovery via
 * stackra/discovery. The HasDiscovery trait scans for
 * classes with this attribute and pre-resolves all their configuration
 * attributes (#[UseModel], #[WithRelations], #[OrderBy], etc.) into
 * the RepositoryConfigRegistry at boot time.
 *
 * This eliminates runtime reflection — Octane-safe.
 *
 * @since 2.0.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsRepository
{
    /**
     * @param  int  $priority  Boot priority (lower = earlier). Default: 100.
     */
    public function __construct(
        public int $priority = 100,
    ) {}
}
