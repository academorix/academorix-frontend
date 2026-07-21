<?php

/**
 * @file packages/exceptions/src/Http/UnprocessableEntityException.php
 *
 * @description
 * HTTP 422 — the request is syntactically valid but *semantically*
 * rejected for a reason that isn't field-level validation.
 *
 * Example: booking a time slot that overlaps with an existing session.
 * The payload is well-formed, every field passed validation rules,
 * but the business rule that "slots cannot overlap" fires. That's
 * this exception, not {@see ValidationException}.
 *
 * Category is `Business`, not `Validation`, so dashboards separate
 * rule violations from input-shape rejections. Both use 422, but
 * clients that care can branch on `error.code`.
 *
 * ## Translation key
 *
 *   exceptions::http.unprocessable
 *
 * @see \Stackra\Exceptions\Exception  Base class.
 * @see ValidationException  Sibling class for field-level 422s.
 * @see \Stackra\Exceptions\Domain\BusinessRuleException  Preferred when the failure has a stable rule identifier.
 */

declare(strict_types=1);

namespace Stackra\Exceptions\Http;

use Stackra\Exceptions\Exception;
use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

class UnprocessableEntityException extends Exception
{
    /**
     * Machine-readable code — clients that need to distinguish
     * "field-shape wrong" from "business-rule wrong" branch on this
     * literal vs. `http.validation`. Treat as public API.
     */
    public const CODE = 'http.unprocessable';

    /**
     * Class-level translation key pointing at
     * `lang/en/http.php → unprocessable`.
     */
    public const TRANSLATION_KEY = 'exceptions::http.unprocessable';

    /**
     * `Info` severity — semantic rejections are normal user flow.
     * Never pageable.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Info;

    /**
     * `Business` category — this class is for rule violations, not
     * shape rejections. Dashboards use the category (not the status
     * code) to separate the two.
     */
    protected ErrorCategory $category = ErrorCategory::Business;

    /**
     * 422 — same status as `ValidationException` because RFC 9110
     * only gives us the one code for "semantically wrong". Clients
     * differentiate via `error.code`.
     */
    protected int $httpStatus = Response::HTTP_UNPROCESSABLE_ENTITY;
}
