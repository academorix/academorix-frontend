<?php

declare(strict_types=1);

/**
 * Cacheable Attribute
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
 * Cacheable Attribute for Repository Classes.
 *
 * Declares caching configuration for a repository. When applied, the
 * repository's read operations are automatically cached and invalidated
 * on the specified model events.
 *
 * ```php
 * #[Cacheable(ttl: 1800, store: 'redis', tags: true)]
 * class ProductRepository extends Repository {}
 * ```
 *
 * Cache invalidation is triggered automatically when the model fires
 * any of the events listed in `invalidateOn`.
 *
 * ```php
 * // Custom invalidation events:
 * #[Cacheable(invalidateOn: ['created', 'updated'])]
 * class SettingRepository extends Repository {}
 * ```
 *
 * @category Attributes
 *
 * @since    2.0.0
 *
 * @see \Illuminate\Contracts\Cache\Repository
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class Cacheable
{
    /**
     * @param  int  $ttl  Cache time-to-live in seconds (default: 3600 = 1 hour).
     * @param  string|null  $store  Cache store name (null = application default).
     * @param  bool  $tags  Whether to use cache tags if the driver supports them.
     * @param  array<string>  $invalidateOn  Model events that trigger cache invalidation.
     */
    public function __construct(
        public int $ttl = 3600,
        public ?string $store = null,
        public bool $tags = true,
        public array $invalidateOn = ['created', 'updated', 'deleted'],
    ) {}
}
