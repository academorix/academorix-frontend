<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Resolver;

use Stackra\FeatureFlags\Resolver\Layers\DefaultLayer;
use Stackra\FeatureFlags\Resolver\Layers\KillSwitchLayer;
use Stackra\FeatureFlags\Resolver\Layers\OverrideLayer;
use Stackra\FeatureFlags\Resolver\Layers\PlanGateLayer;
use Stackra\FeatureFlags\Resolver\Layers\ResolverLayer;
use Stackra\FeatureFlags\Resolver\Layers\RolloutLayer;

/**
 * Composes the fixed KillSwitch → Override → Rollout → PlanGate → Default chain.
 *
 * Walks the five layers in order and returns the first non-null
 * decision. Every non-package consumer routes through
 * `PennantFeatureChecker`, which calls `resolve()` exactly once
 * per evaluation (Requirement 3.1). The `DefaultLayer` is the
 * terminator — it never returns null, so `resolve()` always
 * returns a concrete resolution.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class FeatureResolver
{
    /**
     * @var list<ResolverLayer>  Layers in fixed precedence order.
     */
    private readonly array $layers;

    /**
     * @param  KillSwitchLayer  $killSwitch  Layer 1 — matches `feature_kill_switches`.
     * @param  OverrideLayer    $override    Layer 2 — matches `feature_overrides`.
     * @param  RolloutLayer     $rollout     Layer 3 — matches `feature_rollouts`.
     * @param  PlanGateLayer    $planGate    Layer 4 — matches tenant entitlements.
     * @param  DefaultLayer     $default     Terminator — reads `defaultOff` from the definition.
     */
    public function __construct(
        KillSwitchLayer $killSwitch,
        OverrideLayer $override,
        RolloutLayer $rollout,
        PlanGateLayer $planGate,
        DefaultLayer $default,
    ) {
        $this->layers = [$killSwitch, $override, $rollout, $planGate, $default];
    }

    /**
     * Walk the layer chain and return the first non-null decision.
     *
     * The terminator is guaranteed to produce a resolution, so
     * this method always returns a concrete result — the fallback
     * `FeatureResolution::defaultOff()` at the tail is defensive
     * and unreachable in production.
     *
     * @param  ResolutionContext  $context  Frozen inputs for this evaluation.
     * @return FeatureResolution            The composed decision + deciding source.
     */
    public function resolve(ResolutionContext $context): FeatureResolution
    {
        foreach ($this->layers as $layer) {
            $resolution = $layer->apply($context);
            if ($resolution !== null) {
                return $resolution;
            }
        }

        return FeatureResolution::defaultOff();
    }
}
