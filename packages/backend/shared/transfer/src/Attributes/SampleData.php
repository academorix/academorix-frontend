<?php

declare(strict_types=1);

namespace Stackra\Transfer\Attributes;

use Attribute;

/**
 * Marks an Eloquent model as sample-data-generatable via the transfer engine.
 *
 * Discovered at boot by the framework's generic hydration pump
 * ({@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper})
 * via the `#[HydratesFrom(SampleData::class)]` declaration on
 * {@see \Stackra\Transfer\Contracts\Services\EntityRegistryInterface::register()}.
 *
 * ## Example
 *
 * ```php
 * #[SampleData(
 *     entityKey: 'athletes',
 *     factory: AthleteFactory::class,
 *     defaultCount: 25,
 *     maxCount: 500,
 * )]
 * final class Athlete extends Model {}
 * ```
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class SampleData
{
    /**
     * @param  string        $entityKey     Stable machine-readable key.
     * @param  class-string  $factory       Factory class used to fabricate rows.
     * @param  int           $defaultCount  Default number of rows generated when caller omits `count`.
     * @param  int           $maxCount      Hard cap on the caller-supplied `count`.
     */
    public function __construct(
        public string $entityKey,
        public string $factory,
        public int $defaultCount = 10,
        public int $maxCount = 500,
    ) {
    }
}
