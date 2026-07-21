<?php

declare(strict_types=1);

/**
 * Horizon Tag Attribute.
 *
 * Marks a class as a custom Horizon job tag for automatic discovery
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
 * Horizon Tag Attribute.
 *
 * Marks a class as a custom Horizon job tag for automatic discovery.
 *
 * ## Usage:
 * ```php
 * #[HorizonTag(
 *     name: 'order-processing',
 *     description: 'Tags for order processing jobs'
 * )]
 * class OrderProcessingTag
 * {
 *     public function tags($job): array
 *     {
 *         return [
 *             'order',
 *             'order:' . $job->order->id,
 *             'customer:' . $job->order->customer_id,
 *         ];
 *     }
 * }
 * ```
 *
 * ## Discovery:
 * Tags are automatically discovered from:
 * - packages/*src/Horizon/Tags
 * - app/Horizon/Tags
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class HorizonTag
{
    /**
     * Create a new Horizon tag attribute.
     *
     * @param string      $name        Unique tag identifier
     * @param string|null $description Optional description of the tag
     * @param bool        $enabled     Whether the tag is enabled (default: true)
     */
    public function __construct(
        public readonly string $name,
        public readonly ?string $description = null,
        public readonly bool $enabled = true,
    ) {}
}
