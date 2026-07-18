<?php

declare(strict_types=1);

/**
 * Debugbar Collector Attribute.
 *
 * Marks a class as a Debugbar collector for automatic discovery and
 * registration by the DebugbarCompiler.
 *
 * @category Attributes
 *
 * @since    1.0.0
 *
 * @see \Academorix\Debugbar\Compiler\DebugbarCompiler
 */

namespace Academorix\Debugbar\Attributes;

use Attribute;

/**
 * Debugbar AsCollector Attribute.
 *
 * Marks a class as a Debugbar collector for automatic discovery and registration.
 *
 * ## Purpose:
 * This attribute enables automatic discovery and registration of custom Debugbar
 * collectors without manual configuration in the service provider.
 *
 * ## Features:
 * - ✅ Automatic collector discovery via Discovery facade
 * - ✅ Configurable enabled state
 * - ✅ Custom collector name
 * - ✅ Priority-based registration order
 * - ✅ Additional configuration options
 *
 * ## Usage:
 * ```php
 * use Academorix\Debugbar\Attributes\AsCollector;
 * use DebugBar\DataCollector\DataCollector;
 *
 * #[AsCollector(
 *     name: 'custom',
 *     enabled: true,
 *     priority: 100
 * )]
 * class CustomCollector extends DataCollector
 * {
 *     public function collect(): array
 *     {
 *         return ['data' => 'value'];
 *     }
 *
 *     public function getName(): string
 *     {
 *         return 'custom';
 *     }
 * }
 * ```
 *
 * ## Configuration:
 * - **name**: Collector name (default: auto-generated from class name)
 * - **enabled**: Whether the collector is enabled (default: true)
 * - **priority**: Registration priority (higher = earlier, default: 100)
 * - **config**: Additional configuration options (default: [])
 *
 * ## Discovery:
 * Collectors are automatically discovered and registered by the DebugbarServiceProvider
 * when using the HasDiscovery trait.
 *
 * @since 1.0.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsCollector
{
    /**
     * Create a new Debugbar collector attribute.
     *
     * @param string|null          $name     Collector name (auto-generated if null)
     * @param bool                 $enabled  Whether the collector is enabled
     * @param int                  $priority Registration priority (higher = earlier)
     * @param array<string, mixed> $config   Additional configuration options
     */
    public function __construct(
        public ?string $name = null,
        public bool $enabled = true,
        public int $priority = 100,
        public array $config = [],
    ) {}
}
