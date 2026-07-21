<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Data;

use Stackra\FeatureFlags\Contracts\Data\FeatureInterface;
use Stackra\FeatureFlags\Models\Feature;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Output DTO for a {@see Feature} — the flag catalog entry.
 *
 * Emitted on the wire as snake_case via `#[MapOutputName]`. Every
 * field is a scalar so the DTO survives cache round-trips
 * (Property 7).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class FeatureFlagData extends Data
{
    /**
     * @param  string       $id           Prefixed ULID.
     * @param  string       $name         Stable dot-separated flag identifier.
     * @param  string|null  $description  Free-form description shown on admin surfaces.
     * @param  string       $kind         Backing value of `FlagKind`.
     * @param  bool         $defaultOff   Whether the class-default returns false.
     * @param  int|null     $cacheTtl     Per-flag cache TTL in seconds; null inherits config.
     */
    public function __construct(
        public string $id,
        public string $name,
        public ?string $description,
        public string $kind,
        public bool $defaultOff,
        public ?int $cacheTtl,
    ) {}

    /**
     * Hydrate from a {@see Feature} model.
     *
     * @param  Feature  $model  Persisted catalog row.
     * @return self
     */
    public static function fromModel(Feature $model): self
    {
        return new self(
            id: (string) $model->getKey(),
            name: (string) $model->getAttribute(FeatureInterface::ATTR_NAME),
            description: self::nullableString($model, FeatureInterface::ATTR_DESCRIPTION),
            kind: (string) $model->getAttribute(FeatureInterface::ATTR_KIND),
            defaultOff: (bool) $model->getAttribute(FeatureInterface::ATTR_DEFAULT_OFF),
            cacheTtl: $model->getAttribute(FeatureInterface::ATTR_CACHE_TTL) === null
                ? null
                : (int) $model->getAttribute(FeatureInterface::ATTR_CACHE_TTL),
        );
    }

    /**
     * Read a nullable string attribute.
     *
     * @param  Feature  $model  Row to read from.
     * @param  string   $key    Column key.
     * @return string|null
     */
    private static function nullableString(Feature $model, string $key): ?string
    {
        $value = $model->getAttribute($key);

        return $value === null ? null : (string) $value;
    }
}
