<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Attributes;

use Academorix\FeatureFlags\Enums\FlagKind;
use Attribute;

/**
 * Register a class as a feature flag.
 *
 * Scanned at `package:discover` by `FeatureFlagDiscovery`, which
 * upserts a row into `feature_definitions` and registers the flag
 * with Pennant. When the class exposes `resolve(mixed $scope): bool`,
 * that method is wired as Pennant's class-based resolver; otherwise
 * the composed `FeatureResolver` runs. When `before(mixed $scope)`
 * is present, it is wired as Pennant's early-return callback.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsFeatureFlag
{
    /**
     * @param  string       $name         Stable dot-separated identifier (e.g. `hierarchy.multi_branch`).
     * @param  string|null  $description  Free-form description shown on admin surfaces.
     * @param  FlagKind     $kind         Registry-level classification; drives admin grouping.
     * @param  bool         $defaultOff   When `true` the class-default layer returns `false`. Fail-safe default.
     * @param  int|null     $cacheTtl     Per-flag cache TTL in seconds; `null` falls back to `config('feature-flags.cache_ttl')`.
     */
    public function __construct(
        public string $name,
        public ?string $description = null,
        public FlagKind $kind = FlagKind::PlanGate,
        public bool $defaultOff = true,
        public ?int $cacheTtl = null,
    ) {}
}
