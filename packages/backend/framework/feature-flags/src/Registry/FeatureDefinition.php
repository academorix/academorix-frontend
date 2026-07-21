<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Registry;

use Stackra\FeatureFlags\Attributes\AsFeatureFlag;
use Stackra\FeatureFlags\Enums\FlagKind;

/**
 * Frozen registry entry for one discovered feature flag.
 *
 * Produced once at `package:discover` by `FeatureFlagDiscovery`
 * from a reflected `#[AsFeatureFlag]` attribute plus the FQN of
 * the declaring class. Stored in `FeatureFlagRegistry` under the
 * flag `name` key; read by every resolver layer, admin action,
 * and the persistence upsert into `feature_definitions`.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final readonly class FeatureDefinition
{
    /**
     * @param  string       $name         Stable public identifier — matches `feature_definitions.name`.
     * @param  string|null  $description  Free-form description shown on admin surfaces.
     * @param  FlagKind     $kind         Registry-level classification (enum instance, not backing string).
     * @param  bool         $defaultOff   Terminal `DefaultLayer` decision — `true` = fail-closed.
     * @param  int|null     $cacheTtl     Per-flag cache TTL in seconds; `null` inherits `config('feature-flags.cache_ttl')`.
     * @param  string       $className    FQN of the class that declared `#[AsFeatureFlag]`.
     */
    public function __construct(
        public string $name,
        public ?string $description,
        public FlagKind $kind,
        public bool $defaultOff,
        public ?int $cacheTtl,
        public string $className,
    ) {}

    /**
     * Hydrate a definition from a reflected `#[AsFeatureFlag]` attribute.
     *
     * @param  AsFeatureFlag  $attribute  Reflected attribute instance.
     * @param  string         $className  FQN of the class carrying the attribute.
     * @return self
     */
    public static function fromAttribute(AsFeatureFlag $attribute, string $className): self
    {
        return new self(
            name: $attribute->name,
            description: $attribute->description,
            kind: $attribute->kind,
            defaultOff: $attribute->defaultOff,
            cacheTtl: $attribute->cacheTtl,
            className: $className,
        );
    }
}
