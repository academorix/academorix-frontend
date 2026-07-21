<?php

declare(strict_types=1);

/**
 * Horizon Metric Attribute.
 *
 * Marks a class as a custom Horizon metric for automatic discovery
 * by the HorizonCompiler.
 *
 * @category Attributes
 *
 * @since    1.0.0
 *
 * @see \Stackra\Horizon\Compiler\HorizonCompiler
 */

namespace Stackra\Horizon\Attributes;

use Attribute;

/**
 * Horizon Metric Attribute.
 *
 * Marks a class as a custom Horizon metric for automatic discovery.
 *
 * ## Usage:
 * ```php
 * #[AsAsMetric(
 *     name: 'custom-throughput',
 *     title: 'Custom Job Throughput',
 *     description: 'Tracks custom job processing metrics'
 * )]
 * class CustomThroughputMetric
 * {
 *     public function calculate(MetricsRepository $metrics): array
 *     {
 *         return [
 *             'throughput' => $metrics->throughput(),
 *             'runtime' => $metrics->runtime(),
 *         ];
 *     }
 * }
 * ```
 *
 * ## Discovery:
 * Metrics are automatically discovered from:
 * - packages/*src/Horizon/Metrics
 * - app/Horizon/Metrics
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsMetric
{
    /**
     * Create a new Horizon metric attribute.
     *
     * @param string      $name        Unique metric identifier
     * @param string      $title       Display title for the metric
     * @param string|null $description Optional description of the metric
     * @param bool        $enabled     Whether the metric is enabled (default: true)
     */
    public function __construct(
        public readonly string $name,
        public readonly string $title,
        public readonly ?string $description = null,
        public readonly bool $enabled = true,
    ) {}
}
