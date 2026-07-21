<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Support;

/**
 * Deterministic `(flag, scope_value) -> bucket` mapping for the `RolloutLayer`.
 *
 * The single source of truth for Requirement 3.4, 13.1, 13.2, 13.3
 * and Properties 4 (monotonicity) and 5 (determinism). Algorithm:
 *
 *   1. Concatenate `$flag . ':' . $scopeValue`.
 *   2. SHA-256 the concatenation (64 hex chars).
 *   3. Take the first 8 hex chars — a big-endian unsigned 32-bit slice.
 *   4. Modulo 100 → bucket in `[0, 100)`.
 *
 * Pure function — no time input, no random seed, no per-instance
 * state. Determinism (Property 5) and monotonicity (Property 4)
 * both fall out of the algorithm.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class RolloutHasher
{
    /**
     * Static-only utility — instances are not meaningful.
     */
    private function __construct() {}

    /**
     * Compute the bucket a `(flag, scope_value)` pair falls into.
     *
     * @param  string  $flag        Stable flag identifier.
     * @param  string  $scopeValue  Caller's concrete `ScopeValue` at the target scope level.
     * @return int                  Bucket in the closed-open range `[0, 100)`.
     */
    public static function bucket(string $flag, string $scopeValue): int
    {
        $digest = hash('sha256', $flag . ':' . $scopeValue);
        $head   = substr($digest, 0, 8);

        return intval($head, 16) % 100;
    }

    /**
     * Return whether the caller falls inside a rollout at `$percentage`% coverage.
     *
     * Strict `<` so `percentage = 0` denies everyone and `percentage = 100`
     * admits everyone. Monotonic in `$percentage` — raising a rollout
     * never revokes a subject previously in the bucket.
     *
     * @param  string  $flag        Stable flag identifier.
     * @param  string  $scopeValue  Caller's `ScopeValue` at the target scope level.
     * @param  int     $percentage  Rollout coverage in `[0, 100]`.
     * @return bool
     */
    public static function inBucket(string $flag, string $scopeValue, int $percentage): bool
    {
        assert(
            $percentage >= 0 && $percentage <= 100,
            'RolloutHasher::inBucket: $percentage must be in [0, 100], got ' . $percentage,
        );

        return self::bucket($flag, $scopeValue) < $percentage;
    }
}
