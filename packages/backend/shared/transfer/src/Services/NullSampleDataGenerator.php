<?php

declare(strict_types=1);

namespace Stackra\Transfer\Services;

use Stackra\Transfer\Contracts\Services\SampleDataGeneratorInterface;
use Stackra\Transfer\Models\XferJob;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default no-op implementation of {@see SampleDataGeneratorInterface}.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Singleton]
final class NullSampleDataGenerator implements SampleDataGeneratorInterface
{
    /**
     * {@inheritDoc}
     */
    public function generate(XferJob $job): int
    {
        // No-op — no factory-driven generator bound.
        return 0;
    }
}
