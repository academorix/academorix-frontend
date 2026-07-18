<?php

declare(strict_types=1);

namespace Academorix\Storage\Data\Requests;

use Academorix\Storage\Enums\SignedUrlPurpose;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `POST /api/v1/files/{file}/signed-url`.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class IssueSignedUrlRequestData extends Data
{
    /**
     * @param  SignedUrlPurpose  $purpose      Purpose (drives TTL policy).
     * @param  int|null          $ttlSeconds   Optional TTL override; capped.
     * @param  string|null       $variantKey   Optional variant target.
     * @param  string|null       $ipLock       Optional CIDR IP lock.
     * @param  string|null       $userLock     Optional user id lock.
     */
    public function __construct(
        #[Required, Enum(SignedUrlPurpose::class)]
        public SignedUrlPurpose $purpose,

        #[Between(1, 2_592_000)]
        public ?int $ttlSeconds = null,

        #[StringType, Max(64)]
        public ?string $variantKey = null,

        #[StringType, Max(128)]
        public ?string $ipLock = null,

        #[StringType, Max(64)]
        public ?string $userLock = null,
    ) {
    }
}
