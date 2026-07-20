<?php

declare(strict_types=1);

namespace Academorix\FeatureFlagsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire DTO for a feature-override row.
 *
 * @category FeatureFlagsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
#[MapOutputName(SnakeCaseMapper::class)]
final class FeatureOverrideData extends Data
{
    /**
     * @param  string       $id          Prefixed ULID.
     * @param  string       $tenantId    Owning tenant id.
     * @param  string       $flag        Stable flag identifier.
     * @param  string       $scopeLevel  `scope_definitions.slug`.
     * @param  string       $scopeValue  Concrete entity id at `scopeLevel`.
     * @param  string       $decision    `allow` or `deny`.
     * @param  string|null  $reason      Optional operator note.
     * @param  string|null  $expiresAt   ISO-8601 timestamp; null means never.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $flag,
        public string $scopeLevel,
        public string $scopeValue,
        public string $decision,
        public ?string $reason,
        public ?string $expiresAt,
    ) {}
}
