<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for the admin subscription creation endpoint
 * `POST /api/v1/newsletters/{newsletter}/subscriptions`.
 *
 * `consentEvidence` is REQUIRED — admins can only add subscribers
 * for whom they can prove valid consent.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class AdminCreateSubscriptionRequestData extends Data
{
    /**
     * @param  array<string, mixed>  $consentEvidence
     * @param  list<string>|null     $tags
     */
    public function __construct(
        #[Required, Email, Max(320)]
        public string $email,

        #[Required, ArrayType]
        public array $consentEvidence,

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
