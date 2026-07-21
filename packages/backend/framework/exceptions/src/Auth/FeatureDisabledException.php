<?php

/**
 * @file packages/exceptions/src/Auth/FeatureDisabledException.php
 *
 * @description
 * HTTP 403 — a feature flag or plan gate blocked the request. Distinct
 * from {@see ForbiddenException} because the "fix" is different:
 *
 *   - `auth.forbidden`         → talk to your admin / gain a permission.
 *   - `auth.feature_disabled`  → enable a flag or upgrade a plan.
 *
 * Clients typically route this code to a "learn more" screen or an
 * upgrade CTA rather than showing a permissions-error toast.
 *
 * ## Category vs. severity
 *
 * Category is `FeatureFlag` (not `Authorization`) so dashboards can
 * separate "flag-off traffic" from "denied by policy" — two very
 * different signals for product analytics.
 *
 * Severity is `Info` — feature-flag denials are expected traffic,
 * not errors.
 *
 * ## Translation keys
 *
 *   exceptions::auth.feature_disabled        (class default)
 *   exceptions::auth.feature_disabled_flag   ({@see forFlag()})
 *
 * @see ForbiddenException  Sibling class for policy-driven 403s.
 */

declare(strict_types=1);

namespace Stackra\Exceptions\Auth;

use Stackra\Exceptions\StackraException;
use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

class FeatureDisabledException extends StackraException
{
    /**
     * Machine-readable code. Distinct from `auth.forbidden` so
     * clients can route this to an upgrade CTA instead of a
     * "permission denied" toast.
     */
    public const CODE = 'auth.feature_disabled';

    /**
     * Class-level translation key pointing at
     * `lang/en/auth.php → feature_disabled`. Named factories may
     * override with more specific keys (e.g. one that carries the
     * flag name).
     */
    public const TRANSLATION_KEY = 'exceptions::auth.feature_disabled';

    /**
     * `Info` severity — feature-flag traffic is normal shape, not
     * an error. Bumping to `Warning` would drown dashboards during
     * feature rollouts.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Info;

    /**
     * Dedicated `FeatureFlag` category — kept separate from
     * `Authorization` so product analytics can chart
     * "flag-off traffic" as a distinct signal from "denied by
     * policy".
     */
    protected ErrorCategory $category = ErrorCategory::FeatureFlag;

    /**
     * 403 — the request is understood and would succeed for an
     * account with the flag enabled. Not a validation problem, not
     * an auth problem.
     */
    protected int $httpStatus = Response::HTTP_FORBIDDEN;

    /**
     * Named factory: the given flag is not enabled for the current
     * tenant / user.
     *
     * The flag name goes into context (safe — flag names are a
     * documented part of the API) and is available as `:flag` in
     * the translated user message if the locale opts to reveal it.
     *
     * @param  string  $flag  Feature flag identifier as declared in
     *                        your feature-flag config
     *                        (e.g. `ai-tutor`, `beta.analytics`).
     * @return static The fluent instance with the flag name in
     *                context and translation parameters, plus the
     *                more specific `feature_disabled_flag`
     *                translation key.
     */
    public static function forFlag(string $flag): static
    {
        return static::make("Feature \"{$flag}\" is disabled for the current tenant.")
            ->withContext(['flag' => $flag])
            ->withTranslationParameters(['flag' => $flag])
            ->withTranslationKey('exceptions::auth.feature_disabled_flag');
    }
}
