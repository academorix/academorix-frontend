<?php

declare(strict_types=1);

namespace Stackra\Approvals\Exceptions;

use Stackra\Exceptions\StackraException;
use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;

/**
 * Raised when a rule-engine evaluation exceeds the 250 ms hard cap
 * enforced by
 * {@see \Stackra\Approvals\Services\ExpressionLanguageAdapter}.
 *
 * The cap protects approval intake latency from a runaway
 * template. Writer path: rejects the offending `when_expression` /
 * `selector` before it lands in `approval_templates`. Runtime path:
 * fail-closed — no template matches this call site rather than a
 * hung approval intake.
 *
 * ## Classification
 *
 * - **HTTP 422** on the writer path (client sent an unusable rule).
 * - **HTTP 500** at runtime if a previously-accepted rule regresses
 *   past the cap. Investigate: usually a selector function got
 *   slower, not the template.
 * - **Severity `Warning`** — noteworthy but not error-grade; the
 *   evaluator's fail-closed behaviour keeps the platform healthy.
 * - **Category `Business`** — a domain-declared SLA, not
 *   infrastructure.
 *
 * @category Approvals
 *
 * @since    0.1.0
 */
final class ApprovalExpressionTimeoutException extends StackraException
{
    public const CODE = 'approvals.expression.timeout';
    public const TRANSLATION_KEY = 'approvals::errors.expression_timeout';

    protected int $httpStatus = 422;
    protected ErrorSeverity $severity = ErrorSeverity::Warning;
    protected ErrorCategory $category = ErrorCategory::Business;

    /**
     * Convenience factory used by the adapter's raise path.
     *
     * @param  string  $expression  The offending expression source.
     * @param  float   $elapsedSec  Actual wall-clock time in seconds.
     * @param  float   $capSec      The configured deadline in seconds.
     */
    public static function forExpression(string $expression, float $elapsedSec, float $capSec): self
    {
        return (new self(sprintf(
            'Approval expression exceeded %.0f ms deadline (took %.0f ms).',
            $capSec * 1000,
            $elapsedSec * 1000,
        )))->withContext([
            'elapsed_ms' => (int) round($elapsedSec * 1000),
            'cap_ms'     => (int) round($capSec * 1000),
            'hash'       => hash('sha256', $expression),
        ]);
    }
}
