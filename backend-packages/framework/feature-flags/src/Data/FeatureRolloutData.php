<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Data;

use Academorix\FeatureFlags\Contracts\Data\FeatureRolloutInterface;
use Academorix\FeatureFlags\Models\FeatureRollout;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Output DTO for a {@see FeatureRollout}.
 *
 * Emitted on the wire as snake_case. There is NO `scope_value`
 * field — a rollout targets a level, not a specific subject.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class FeatureRolloutData extends Data
{
    /**
     * @param  string       $id           Prefixed ULID.
     * @param  string       $tenantId     Owning tenant id.
     * @param  string       $flag         Stable flag identifier.
     * @param  string       $scopeLevel   `scope_definitions.slug` — level the rollout targets.
     * @param  int          $percentage   Rollout coverage in `[0, 100]`.
     * @param  string|null  $notes        Optional operator note.
     * @param  string|null  $startsAt     ISO-8601 timestamp; null = unbounded start.
     * @param  string|null  $endsAt       ISO-8601 timestamp; null = unbounded end.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $flag,
        public string $scopeLevel,
        public int $percentage,
        public ?string $notes,
        public ?string $startsAt,
        public ?string $endsAt,
    ) {}

    /**
     * Hydrate from a {@see FeatureRollout} model.
     *
     * @param  FeatureRollout  $model  Persisted rollout row.
     * @return self
     */
    public static function fromModel(FeatureRollout $model): self
    {
        return new self(
            id: (string) $model->getKey(),
            tenantId: (string) $model->getAttribute(FeatureRolloutInterface::ATTR_TENANT_ID),
            flag: (string) $model->getAttribute(FeatureRolloutInterface::ATTR_FLAG),
            scopeLevel: (string) $model->getAttribute(FeatureRolloutInterface::ATTR_SCOPE_LEVEL),
            percentage: (int) $model->getAttribute(FeatureRolloutInterface::ATTR_PERCENTAGE),
            notes: self::nullableString($model, FeatureRolloutInterface::ATTR_NOTES),
            startsAt: self::nullableTimestamp($model, FeatureRolloutInterface::ATTR_STARTS_AT),
            endsAt: self::nullableTimestamp($model, FeatureRolloutInterface::ATTR_ENDS_AT),
        );
    }

    /**
     * Read a nullable string attribute.
     *
     * @param  FeatureRollout  $model  Row to read from.
     * @param  string          $key    Column key.
     * @return string|null
     */
    private static function nullableString(FeatureRollout $model, string $key): ?string
    {
        $value = $model->getAttribute($key);

        return $value === null ? null : (string) $value;
    }

    /**
     * Read a nullable timestamp attribute as an ISO-8601 string.
     *
     * @param  FeatureRollout  $model  Row to read from.
     * @param  string          $key    Column key.
     * @return string|null
     */
    private static function nullableTimestamp(FeatureRollout $model, string $key): ?string
    {
        $value = $model->getAttribute($key);
        if ($value === null) {
            return null;
        }

        return \method_exists($value, 'toIso8601String') ? (string) $value->toIso8601String() : (string) $value;
    }
}
