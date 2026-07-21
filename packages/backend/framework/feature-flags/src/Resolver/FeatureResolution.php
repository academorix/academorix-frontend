<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Resolver;

use Stackra\FeatureFlags\Enums\ResolutionSource;

/**
 * Outcome of a single flag evaluation — value plus deciding layer name.
 *
 * Produced by every `ResolverLayer::apply()` implementation and by
 * the composed `FeatureResolver`. Consumers branch on `$source`:
 * `RequireFeatureMiddleware` maps `plan_gate` to HTTP 402 and
 * every other source to HTTP 403 (Requirement 5.4-5.6); admin API
 * responses serialise `value` and `source` as sibling fields.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final readonly class FeatureResolution
{
    /**
     * @param  bool    $value   The resolved decision — `true` when the flag is on for the caller.
     * @param  string  $source  Backing string of the deciding {@see ResolutionSource} case.
     */
    public function __construct(
        public bool $value,
        public string $source,
    ) {}

    /**
     * Kill-switch terminator — always `(false, kill_switch)`.
     *
     * @return self
     */
    public static function killSwitch(): self
    {
        return new self(false, ResolutionSource::KillSwitch->value);
    }

    /**
     * Override decision — value delegated to the deciding row.
     *
     * @param  bool  $value  `true` for `decision = allow`, `false` for `decision = deny`.
     * @return self
     */
    public static function override(bool $value): self
    {
        return new self($value, ResolutionSource::Override->value);
    }

    /**
     * Rollout decision — value delegated to the bucket hash check.
     *
     * @param  bool  $value  `true` when `bucket < percentage`, `false` otherwise.
     * @return self
     */
    public static function rollout(bool $value): self
    {
        return new self($value, ResolutionSource::Rollout->value);
    }

    /**
     * Plan-gate decision — value delegated to the entitlement lookup.
     *
     * @param  bool  $value  `true` when the plan grants the matching entitlement.
     * @return self
     */
    public static function planGate(bool $value): self
    {
        return new self($value, ResolutionSource::PlanGate->value);
    }

    /**
     * Default-off terminator — always `(false, default)`.
     *
     * @return self
     */
    public static function defaultOff(): self
    {
        return new self(false, ResolutionSource::Default->value);
    }

    /**
     * Default-on terminator — always `(true, default)`.
     *
     * @return self
     */
    public static function defaultOn(): self
    {
        return new self(true, ResolutionSource::Default->value);
    }
}
