<?php

/**
 * @file packages/exceptions/src/Domain/DomainException.php
 *
 * @description
 * Base for exceptions coming from the domain layer — the business
 * rules that live inside packages, not the HTTP boundary. Default
 * status is 422 because most domain violations map cleanly to
 * "unprocessable entity"; specific subclasses (5xx invariants,
 * 400 tenancy) override the status.
 *
 * ## Why NOT extend PHP's built-in `\DomainException`
 *
 * `\DomainException extends \LogicException`, which many static
 * analysers treat as "programmer bug" and encourage silencing. Our
 * domain exceptions are recoverable, expected control flow — the
 * subclass tree here is intentionally rooted at
 * {@see \Stackra\Exceptions\StackraException} (a
 * `RuntimeException`) so that signal isn't confused.
 *
 * ## Translation key
 *
 *   exceptions::domain.rule_violated
 *
 * ## When to subclass this vs. instantiate directly
 *
 * Prefer a subclass with a named factory whenever the failure has a
 * stable name — dashboards can chart the top violated rules. Fall
 * back to this generic form only when the failure is genuinely
 * one-off.
 *
 * @see BusinessRuleException  Preferred when the rule has a stable identifier.
 * @see InvariantViolationException  For "this should be impossible" bug states.
 * @see TenantException  For tenancy scope violations.
 */

declare(strict_types=1);

namespace Stackra\Exceptions\Domain;

use Stackra\Exceptions\StackraException;
use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

class DomainException extends StackraException
{
    /**
     * Machine-readable code — the generic fallback for domain rule
     * failures. Prefer a more specific subclass code where
     * possible.
     */
    public const CODE = 'domain.rule_violated';

    /**
     * Class-level translation key pointing at
     * `lang/en/domain.php → rule_violated`. Overridable per-instance
     * via
     * {@see \Stackra\Exceptions\Concerns\TranslatesMessages::withTranslationKey()}.
     */
    public const TRANSLATION_KEY = 'exceptions::domain.rule_violated';

    /**
     * `Info` severity — a domain rule firing is normal user flow,
     * not an ops incident. Elevate at the callsite when a specific
     * rule is genuinely suspicious.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Info;

    /**
     * `Business` category — the canonical bucket for domain-layer
     * failures. Distinct from `Validation` (input shape) and
     * `Conflict` (state-shape).
     */
    protected ErrorCategory $category = ErrorCategory::Business;

    /**
     * 422 — the standard "server understood the request but the
     * content is semantically invalid" status. Subclasses may
     * override (5xx for invariants, 400 for tenancy).
     */
    protected int $httpStatus = Response::HTTP_UNPROCESSABLE_ENTITY;
}
