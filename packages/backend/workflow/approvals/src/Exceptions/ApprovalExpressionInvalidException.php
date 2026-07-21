<?php

declare(strict_types=1);

namespace Stackra\Approvals\Exceptions;

use Stackra\Exceptions\Exception;
use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\ExpressionLanguage\SyntaxError;
use Throwable;

/**
 * Raised when a rule-engine expression fails to parse or references
 * an unknown selector function.
 *
 * Every approval template stores a `when_expression` and a set of
 * approver `selector` strings. Both flow through
 * {@see \Stackra\Approvals\Services\ExpressionLanguageAdapter::compile}
 * on write — a bad expression is rejected at the API boundary
 * before it can silently break approval intake at runtime.
 *
 * ## Classification
 *
 * - **HTTP 422** — client sent a shape the domain refuses.
 * - **Severity `Warning`** — refused writes are noteworthy but not
 *   alertable.
 * - **Category `Business`** — a domain-authored rule failed
 *   validation.
 *
 * @category Approvals
 *
 * @since    0.1.0
 */
final class ApprovalExpressionInvalidException extends Exception
{
    public const CODE = 'approvals.expression.invalid';
    public const TRANSLATION_KEY = 'approvals::errors.expression_invalid';

    protected int $httpStatus = 422;
    protected ErrorSeverity $severity = ErrorSeverity::Warning;
    protected ErrorCategory $category = ErrorCategory::Business;

    /**
     * Factory for parser failures.
     *
     * @param  string       $expression  The offending expression source.
     * @param  SyntaxError  $inner       Symfony's parser diagnostic.
     */
    public static function fromSyntaxError(string $expression, SyntaxError $inner): self
    {
        return (new self(sprintf(
            'Approval expression is malformed: %s',
            $inner->getMessage(),
        ), 0, $inner))->withContext([
            'hash'   => hash('sha256', $expression),
            'reason' => 'syntax',
        ]);
    }

    /**
     * Factory for runtime evaluation failures — a syntactically
     * valid expression that blew up at eval time (usually because a
     * selector function received unexpected shape).
     *
     * @param  string     $expression  The offending expression source.
     * @param  Throwable  $inner       The runtime failure.
     */
    public static function fromEvaluationError(string $expression, Throwable $inner): self
    {
        return (new self(sprintf(
            'Approval expression evaluation failed: %s',
            $inner->getMessage(),
        ), 0, $inner))->withContext([
            'hash'   => hash('sha256', $expression),
            'reason' => 'runtime',
        ]);
    }
}
