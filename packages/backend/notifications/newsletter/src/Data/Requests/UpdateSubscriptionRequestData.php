<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `PATCH /api/v1/newsletters/{newsletter}/subscriptions/{subscription}`.
 *
 * `email` and `consent_evidence` are NEVER editable — the action
 * refuses those keys even when submitted, since changing them would
 * corrupt the consent audit trail.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateSubscriptionRequestData extends Data
{
    /**
     * @param  list<string>|null  $tags
     */
    public function __construct(
        #[StringType, Max(120)]
        public ?string $firstName = null,

        #[StringType, Max(120)]
        public ?string $lastName = null,

        #[StringType, Max(12)]
        public ?string $locale = null,

        #[ArrayType]
        public ?array $tags = null,
    ) {
    }
}
