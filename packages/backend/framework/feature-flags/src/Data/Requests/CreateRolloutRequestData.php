<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `POST /api/v1/feature-flags/rollouts`.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateRolloutRequestData extends Data
{
    /**
     * @param  string       $flag        Stable dot-separated flag identifier.
     * @param  string       $scopeLevel  `scope_definitions.slug` — the level the rollout targets.
     * @param  int          $percentage  Rollout coverage in `[0, 100]`.
     * @param  string|null  $tenantId    Explicit tenant id; must equal current tenant.
     * @param  string|null  $notes       Optional operator note.
     * @param  string|null  $startsAt    Optional ISO-8601 start.
     * @param  string|null  $endsAt      Optional ISO-8601 end.
     */
    public function __construct(
        #[Required, StringType, Max(191)]
        public string $flag,

        #[Required, StringType, Max(64)]
        public string $scopeLevel,

        #[Required, IntegerType, Between(0, 100)]
        public int $percentage,

        #[Nullable, StringType, Max(30)]
        public ?string $tenantId = null,

        #[Nullable, StringType, Max(500)]
        public ?string $notes = null,

        #[Nullable, StringType]
        public ?string $startsAt = null,

        #[Nullable, StringType]
        public ?string $endsAt = null,
    ) {}
}
