<?php

declare(strict_types=1);

namespace Academorix\FeatureFlagsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire DTO for a feature-rollout row.
 *
 * @category FeatureFlagsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
#[MapOutputName(SnakeCaseMapper::class)]
final class FeatureRolloutData extends Data
{
    /**
     * @param  string       $id           Prefixed ULID.
     * @param  string       $tenantId     Owning tenant id.
     * @param  string       $flag         Stable flag identifier.
     * @param  string       $scopeLevel   `scope_definitions.slug`.
     * @param  int          $percentage   Rollout coverage in `[0, 100]`.
     * @param  string|null  $notes        Optional operator note.
     * @param  string|null  $startsAt     ISO-8601 timestamp; null = unbounded start.
     * @param  string|null  $endsAt       ISO-8601 timestamp; null = unbounded end.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $flag,
        public string $scopeLevel,
        public int $percentage,
        public ?string $notes,
        public ?string $startsAt,
        public ?string $endsAt,
    ) {}
}
