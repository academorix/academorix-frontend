<?php

declare(strict_types=1);

namespace Academorix\Approvals\Contracts\Services;

use Academorix\Approvals\Services\ExpressionLanguageAdapter;
use Illuminate\Container\Attributes\Bind;

/**
 * Rule-engine contract wrapping `symfony/expression-language`.
 *
 * Every `when_expression` on `approval_templates`, every selector
 * function inside `approval_template_approvers.selector`, and every
 * `on_timeout` policy evaluation flows through this adapter. The
 * concrete honours:
 *
 *  - **250ms hard timeout** per evaluation (SLA guardrail — a
 *    runaway expression cannot stall approval intake).
 *  - **Redis-backed AST cache** keyed on the SHA-256 of the raw
 *    expression + the closed-selector-function set version.
 *  - **Closed selector-function set** — only the
 *    `role/user/permission/owner_of/manager_of/any/all/except`
 *    helpers are exposed; every other identifier is a payload
 *    variable.
 *
 * Concrete: {@see ExpressionLanguageAdapter}.
 *
 * @category Approvals
 *
 * @since    0.1.0
 */
#[Bind(ExpressionLanguageAdapter::class)]
interface ExpressionLanguageAdapterInterface
{
    /**
     * Evaluate an expression against a payload.
     *
     * @param  string                $expression  Symfony expression syntax.
     * @param  array<string, mixed>  $variables   Named payload variables.
     *
     * @return mixed  The expression's return value.
     *
     * @throws \Academorix\Approvals\Exceptions\ApprovalExpressionTimeoutException
     *   When the evaluation exceeds the 250 ms hard cap.
     * @throws \Academorix\Approvals\Exceptions\ApprovalExpressionInvalidException
     *   When the expression fails to parse or references an unknown
     *   selector.
     */
    public function evaluate(string $expression, array $variables): mixed;

    /**
     * Compile-only helper — parses + caches an expression's AST without
     * evaluating it. Used by the template writer path to reject a
     * malformed template BEFORE it lands in `approval_templates`.
     *
     * @param  string  $expression  Symfony expression syntax.
     *
     * @throws \Academorix\Approvals\Exceptions\ApprovalExpressionInvalidException
     *   When the expression fails to parse.
     */
    public function compile(string $expression): void;
}
