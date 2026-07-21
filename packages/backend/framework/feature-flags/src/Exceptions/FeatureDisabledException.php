<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Exceptions;

use Stackra\Exceptions\Exception;
use Stackra\FeatureFlags\Enums\ResolutionSource;
use Stackra\FeatureFlags\Resolver\FeatureResolution;

/**
 * Raised when a required feature is off for the current caller.
 *
 * `RequireFeatureMiddleware` throws this whenever the checker
 * returns a false resolution. The `source` field on the context
 * envelope drives the HTTP status — `plan_gate` yields 402
 * (`feature_flags.payment_required`), `override` yields 403 with
 * `feature_flags.override_denied`, every other source yields 403
 * with `feature_flags.disabled` (Requirement 5.4-5.6).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class FeatureDisabledException extends Exception
{
    /**
     * Default machine-readable error code — used for `kill_switch`, `rollout`, `default` sources.
     */
    public const CODE = 'feature_flags.disabled';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'feature-flags::errors.disabled';

    /**
     * Error code emitted when the deciding source is `plan_gate` — pairs with HTTP 402.
     */
    public const CODE_PAYMENT_REQUIRED = 'feature_flags.payment_required';

    /**
     * Error code emitted when the deciding source is `override` — pairs with HTTP 403.
     */
    public const CODE_OVERRIDE_DENIED = 'feature_flags.override_denied';

    /**
     * Convenience factory used by the middleware's raise path.
     *
     * Selects the correct `(status, code)` pair from the deciding
     * `ResolutionSource`. Every field is recorded in the context
     * envelope so consumers see the flag + source without parsing
     * the message.
     *
     * @param  string  $flag    The flag that was denied.
     * @param  string  $source  Backing value of the deciding {@see ResolutionSource}.
     * @return self
     */
    public static function forFlag(string $flag, string $source): self
    {
        return (new self(sprintf(
            "Feature '%s' is disabled (source: %s).",
            $flag,
            $source,
        )))->withContext(['flag' => $flag, 'source' => $source]);
    }

    /**
     * Convenience factory reading source directly from a resolution.
     *
     * @param  string             $flag        The flag that was denied.
     * @param  FeatureResolution  $resolution  The false resolution returned by the checker.
     * @return self
     */
    public static function forResolution(string $flag, FeatureResolution $resolution): self
    {
        return self::forFlag($flag, $resolution->source);
    }

    /**
     * Return the wire error code for the given deciding source.
     *
     * @param  string  $source  Backing value of {@see ResolutionSource}.
     * @return string           One of the class `CODE_*` constants.
     */
    public static function codeForSource(string $source): string
    {
        return match ($source) {
            ResolutionSource::PlanGate->value => self::CODE_PAYMENT_REQUIRED,
            ResolutionSource::Override->value => self::CODE_OVERRIDE_DENIED,
            default                           => self::CODE,
        };
    }

    /**
     * Return the HTTP status for the given deciding source.
     *
     * @param  string  $source  Backing value of {@see ResolutionSource}.
     * @return int              HTTP status — 402 for `plan_gate`, 403 for every other source.
     */
    public static function httpStatusForSource(string $source): int
    {
        return $source === ResolutionSource::PlanGate->value ? 402 : 403;
    }
}
