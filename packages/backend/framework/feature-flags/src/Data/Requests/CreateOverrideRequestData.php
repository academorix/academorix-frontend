<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `POST /api/v1/feature-flags/overrides`.
 *
 * Wire snake_case, PHP camelCase — bridged by `#[MapInputName]`.
 * Cross-tenant writes are rejected at the action layer before this
 * DTO reaches the repository (Requirement 19.3).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateOverrideRequestData extends Data
{
    /**
     * @param  string       $flag        Stable dot-separated flag identifier.
     * @param  string       $scopeLevel  `scope_definitions.slug`.
     * @param  string       $scopeValue  Entity id at `scopeLevel`.
     * @param  string       $decision    `allow` or `deny`.
     * @param  string|null  $tenantId    Explicit tenant id; must equal current tenant.
     * @param  string|null  $reason      Optional operator note.
     * @param  string|null  $expiresAt   Optional ISO-8601 expiry timestamp.
     */
    public function __construct(
        #[Required, StringType, Max(191)]
        public string $flag,

        #[Required, StringType, Max(64)]
        public string $scopeLevel,

        #[Required, StringType, Max(191)]
        public string $scopeValue,

        #[Required, In(['allow', 'deny'])]
        public string $decision,

        #[Nullable, StringType, Max(30)]
        public ?string $tenantId = null,

        #[Nullable, StringType, Max(500)]
        public ?string $reason = null,

        #[Nullable, StringType]
        public ?string $expiresAt = null,
    ) {}
}
