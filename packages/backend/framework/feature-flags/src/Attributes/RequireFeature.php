<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Attributes;

use Attribute;

/**
 * Gate an action class (or specific method) behind a feature flag.
 *
 * The `RouteRegistrar` in `stackra/routing` appends the
 * `feature:<name>` middleware to any route emitted from a class or
 * method carrying this attribute. `RequireFeatureMiddleware` then
 * evaluates the flag through `FeatureCheckerInterface`; a `false`
 * decision raises `FeatureDisabledException`, whose HTTP status is
 * driven by the deciding `ResolutionSource` (Requirement 5.4-5.6).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD)]
final readonly class RequireFeature
{
    /**
     * @param  string       $name      Stable dot-separated flag identifier — matches a row on `feature_definitions.name`.
     * @param  string|null  $fallback  Optional route name to redirect to on denial (documentation-only in v1).
     */
    public function __construct(
        public string $name,
        public ?string $fallback = null,
    ) {}
}
