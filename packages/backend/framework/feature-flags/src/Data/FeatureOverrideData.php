<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Data;

use Stackra\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
use Stackra\FeatureFlags\Models\FeatureOverride;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Output DTO for a {@see FeatureOverride}.
 *
 * Emitted on the wire as snake_case.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
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

    /**
     * Hydrate from a {@see FeatureOverride} model.
     *
     * @param  FeatureOverride  $model  Persisted override row.
     * @return self
     */
    public static function fromModel(FeatureOverride $model): self
    {
        $expiresAt = $model->getAttribute(FeatureOverrideInterface::ATTR_EXPIRES_AT);

        return new self(
            id: (string) $model->getKey(),
            tenantId: (string) $model->getAttribute(FeatureOverrideInterface::ATTR_TENANT_ID),
            flag: (string) $model->getAttribute(FeatureOverrideInterface::ATTR_FLAG),
            scopeLevel: (string) $model->getAttribute(FeatureOverrideInterface::ATTR_SCOPE_LEVEL),
            scopeValue: (string) $model->getAttribute(FeatureOverrideInterface::ATTR_SCOPE_VALUE),
            decision: (string) $model->getAttribute(FeatureOverrideInterface::ATTR_DECISION),
            reason: self::nullableString($model, FeatureOverrideInterface::ATTR_REASON),
            expiresAt: $expiresAt === null ? null : (string) $expiresAt,
        );
    }

    /**
     * Read a nullable string attribute.
     *
     * @param  FeatureOverride  $model  Row to read from.
     * @param  string           $key    Column key.
     * @return string|null
     */
    private static function nullableString(FeatureOverride $model, string $key): ?string
    {
        $value = $model->getAttribute($key);

        return $value === null ? null : (string) $value;
    }
}
