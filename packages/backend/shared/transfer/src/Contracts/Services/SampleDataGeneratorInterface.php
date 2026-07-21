<?php

declare(strict_types=1);

namespace Stackra\Transfer\Contracts\Services;

use Stackra\Transfer\Models\XferJob;
use Stackra\Transfer\Services\NullSampleDataGenerator;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the sample-data generator.
 *
 * Runs a `#[SampleData(factory: ...)]`-configured factory to insert
 * fixture rows for the target entity within the current tenant scope.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Bind(NullSampleDataGenerator::class)]
interface SampleDataGeneratorInterface
{
    /**
     * Generate sample data for the entity referenced by the job.
     *
     * @param  XferJob  $job  Persisted, `kind = sample`.
     * @return int  Number of rows generated.
     */
    public function generate(XferJob $job): int;
}
