<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Data;

use Academorix\FeatureFlags\Contracts\Data\FeatureKillSwitchInterface;
use Academorix\FeatureFlags\Models\FeatureKillSwitch;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Output DTO for a {@see FeatureKillSwitch}.
 *
 * Emitted on the wire as snake_case. Platform-scoped — no
 * `tenant_id` field; tenant targeting lives on the
 * `(scope_level, scope_value)` pair.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class FeatureKillSwitchData extends Data
{
    /**
     * @param  string       $id           Prefixed ULID.
     * @param  string       $flag         Stable flag identifier.
     * @param  string       $scopeLevel   `scope_definitions.slug`.
     * @param  string|null  $scopeValue   Entity id at `scopeLevel`; null = every value at that level.
     * @param  string|null  $reason       Operator-supplied reason.
     * @param  string       $enabledAt    ISO-8601 timestamp — activation instant.
     * @param  string|null  $disabledAt   ISO-8601 timestamp; null = no upper bound.
     */
    public function __construct(
        public string $id,
        public string $flag,
        public string $scopeLevel,
        public ?string $scopeValue,
        public ?string $reason,
        public string $enabledAt,
        public ?string $disabledAt,
    ) {}

    /**
     * Hydrate from a {@see FeatureKillSwitch} model.
     *
     * @param  FeatureKillSwitch  $model  Persisted kill-switch row.
     * @return self
     */
    public static function fromModel(FeatureKillSwitch $model): self
    {
        return new self(
            id: (string) $model->getKey(),
            flag: (string) $model->getAttribute(FeatureKillSwitchInterface::ATTR_FLAG),
            scopeLevel: (string) $model->getAttribute(FeatureKillSwitchInterface::ATTR_SCOPE_LEVEL),
            scopeValue: self::nullableString($model, FeatureKillSwitchInterface::ATTR_SCOPE_VALUE),
            reason: self::nullableString($model, FeatureKillSwitchInterface::ATTR_REASON),
            enabledAt: (string) $model->getAttribute(FeatureKillSwitchInterface::ATTR_ENABLED_AT),
            disabledAt: self::nullableString($model, FeatureKillSwitchInterface::ATTR_DISABLED_AT),
        );
    }

    /**
     * Read a nullable string attribute.
     *
     * @param  FeatureKillSwitch  $model  Row to read from.
     * @param  string             $key    Column key.
     * @return string|null
     */
    private static function nullableString(FeatureKillSwitch $model, string $key): ?string
    {
        $value = $model->getAttribute($key);

        return $value === null ? null : (string) $value;
    }
}
