<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `PUT /api/v1/feature-flags/rollouts/{id}`.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateRolloutRequestData extends Data
{
    /**
     * @param  int|null     $percentage  Optional new percentage in `[0, 100]`.
     * @param  string|null  $notes       Optional new operator note.
     * @param  string|null  $startsAt    Optional new ISO-8601 start.
     * @param  string|null  $endsAt      Optional new ISO-8601 end.
     */
    public function __construct(
        #[Nullable, IntegerType, Between(0, 100)]
        public ?int $percentage = null,

        #[Nullable, StringType, Max(500)]
        public ?string $notes = null,

        #[Nullable, StringType]
        public ?string $startsAt = null,

        #[Nullable, StringType]
        public ?string $endsAt = null,
    ) {}
}
