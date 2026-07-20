<?php

declare(strict_types=1);

namespace Academorix\Compliance\Database\Factories;

use Academorix\Compliance\Contracts\Data\RetentionRunInterface;
use Academorix\Compliance\Models\RetentionRun;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see RetentionRun}.
 *
 * @extends Factory<RetentionRun>
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
final class RetentionRunFactory extends Factory
{
    /**
     * @var class-string<RetentionRun>
     */
    protected $model = RetentionRun::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            RetentionRunInterface::ATTR_ID           => 'rtr_' . Str::ulid()->toBase32(),
            RetentionRunInterface::ATTR_TENANT_ID    => 'ten_' . Str::ulid()->toBase32(),
            RetentionRunInterface::ATTR_STARTED_AT   => \now(),
            RetentionRunInterface::ATTR_STATUS       => 'running',
            RetentionRunInterface::ATTR_TRIGGER      => 'nightly',
            RetentionRunInterface::ATTR_PURGED_COUNT => 0,
        ];
    }

    /**
     * Completed state.
     */
    public function completed(): static
    {
        return $this->state(fn (): array => [
            RetentionRunInterface::ATTR_STATUS      => 'completed',
            RetentionRunInterface::ATTR_FINISHED_AT => \now(),
            RetentionRunInterface::ATTR_PURGED_COUNT => 100,
        ]);
    }
}
