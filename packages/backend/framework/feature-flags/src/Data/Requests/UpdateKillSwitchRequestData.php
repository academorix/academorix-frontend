<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `PUT /api/v1/feature-flags/kill-switches/{id}`.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateKillSwitchRequestData extends Data
{
    /**
     * @param  string|null  $enabledAt   Optional new activation timestamp.
     * @param  string|null  $disabledAt  Optional new deactivation timestamp; empty string clears.
     * @param  string|null  $reason      Optional new operator note.
     */
    public function __construct(
        #[Nullable, StringType]
        public ?string $enabledAt = null,

        #[Nullable, StringType]
        public ?string $disabledAt = null,

        #[Nullable, StringType, Max(500)]
        public ?string $reason = null,
    ) {}
}
