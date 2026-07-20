<?php

/**
 * @file packages/exceptions/src/Domain/BusinessRuleException.php
 *
 * @description
 * A named business rule was violated. Carries a stable `rule_id`
 * that ties back to a rule catalogue (docs, tests, dashboards).
 *
 * Prefer this over the generic {@see DomainException} whenever the
 * failure has a documented name — the extra structure lets:
 *
 *   - Dashboards chart "top 10 violated rules this week".
 *   - Tests assert on `rule_id` without brittle message matching.
 *   - Localised UIs render rule-specific error copy.
 *
 * ## Naming convention for `rule_id`
 *
 *   <package>.<subdomain>.<rule_name>
 *
 * Examples: `billing.trial_only_once`, `sessions.no_overlap`,
 * `attendance.locked_after_close`.
 *
 * ## Translation keys
 *
 *   exceptions::domain.business_rule        (class default)
 *   exceptions::domain.business_rule_named  ({@see ruleFailed()})
 *
 * @see DomainException  Parent class carrying the 422 / Business / Info defaults.
 */

declare(strict_types=1);

namespace Academorix\Exceptions\Domain;

class BusinessRuleException extends DomainException
{
    /**
     * Machine-readable code — clients that surface rule violations
     * in-line (rather than as toasts) branch on this literal to
     * fall through to `context.rule_id`.
     */
    public const CODE = 'domain.business_rule';

    /**
     * Class-level translation key pointing at
     * `lang/en/domain.php → business_rule`. The
     * {@see ruleFailed()} factory overrides with a more specific
     * key that carries the rule identifier in the message.
     */
    public const TRANSLATION_KEY = 'exceptions::domain.business_rule';

    /**
     * Named factory: identify the rule that fired.
     *
     * `$description` is the developer-facing message; falls back to
     * a generic "Business rule [{id}] failed." when omitted. The
     * client-facing message is the translated
     * `exceptions::domain.business_rule_named` value with
     * `:rule_id` interpolated.
     *
     * @param  string  $ruleId       Stable rule identifier following
     *                               the `<package>.<subdomain>.<rule_name>`
     *                               convention. Kept in context for
     *                               dashboards and interpolated
     *                               into the user-facing
     *                               translation.
     * @param  string  $description  Developer-facing message ending
     *                               up on `Throwable::getMessage()`.
     *                               Empty string means "use a
     *                               generic template".
     * @return static The fluent instance carrying the rule id in
     *                context and translation parameters.
     */
    public static function ruleFailed(string $ruleId, string $description = ''): static
    {
        $message = $description !== '' ? $description : "Business rule [{$ruleId}] failed.";

        return static::make($message)
            ->withContextValue('rule_id', $ruleId)
            ->withTranslationParameters(['rule_id' => $ruleId])
            ->withTranslationKey('exceptions::domain.business_rule_named');
    }
}
