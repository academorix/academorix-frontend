<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `PUT /api/v1/feature-flags/overrides/{id}`.
 *
 * Every field is optional — only supplied fields are updated.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateOverrideRequestData extends Data
{
    /**
     * @param  string|null  $decision    Optional new decision — `allow` or `deny`.
     * @param  string|null  $reason      Optional new operator note.
     * @param  string|null  $expiresAt   Optional new expiry timestamp.
     */
    public function __construct(
        #[Nullable, In(['allow', 'deny'])]
        public ?string $decision = null,

        #[Nullable, StringType, Max(500)]
        public ?string $reason = null,

        #[Nullable, StringType]
        public ?string $expiresAt = null,
    ) {}
}
