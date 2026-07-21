<?php

/**
 * @file src/Attributes/BypassScope.php
 *
 * @description
 * Escape hatch attribute that documents WHY a method (typically a
 * controller action, console command, or repository method) reads
 * across scope boundaries. Ships intent in code so security review
 * can audit every occurrence.
 *
 * The attribute is a marker only — it does NOT flip the global
 * scope off by itself. The consumer method must explicitly call
 * `withoutGlobalScope(ScopedGlobalScope::class)` on each query.
 * Requiring both keeps the escape hatch conspicuous in code review;
 * the attribute is the "why" and the method call is the "how".
 */

declare(strict_types=1);

namespace Stackra\Scope\Attributes;

use Attribute;

/**
 * Document a legitimate scope-bypass. The attribute has no runtime
 * effect on the global scope; the method still needs to call
 * `withoutGlobalScope(ScopedGlobalScope::class)`. What this marker
 * DOES do is:
 *
 *   - Give code review a searchable anchor (`grep BypassScope`
 *     enumerates every bypass in the codebase).
 *   - Feed the compliance report generator so cross-scope reads
 *     land on an auditable list.
 *   - Provide `reason` — mandatory prose explaining the business
 *     justification. Reviewers reject bypasses without one.
 *
 * ## Usage
 *
 * ```php
 * use Stackra\Scope\Attributes\BypassScope;
 * use Stackra\Scope\Eloquent\ScopedGlobalScope;
 *
 * final class TenantAuditController
 * {
 *     #[BypassScope(reason: 'Support audit — GDPR erasure evidence spans all tenants.')]
 *     public function __invoke(): JsonResponse
 *     {
 *         $rows = Invoice::query()
 *             ->withoutGlobalScope(ScopedGlobalScope::class)
 *             ->get();
 *
 *         // ...
 *     }
 * }
 * ```
 *
 * ## `IS_REPEATABLE`
 *
 * A method may need to justify a bypass on multiple grounds
 * (compliance audit + a specific ADR). Repeatable so both can be
 * declared independently for the audit trail.
 */
#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
final readonly class BypassScope
{
    /**
     * Create a new BypassScope attribute instance.
     *
     * @param  string  $reason  Mandatory prose justification.
     *                          Reviewed on every PR. Empty
     *                          strings are rejected by the
     *                          compliance report generator.
     * @param  string|null  $adrRef  Optional reference to an ADR
     *                               (e.g. 'ADR-0021') that authorises
     *                               this class of bypass. Useful when
     *                               the same reason recurs across
     *                               multiple methods.
     */
    public function __construct(
        public string $reason,
        public ?string $adrRef = null,
    ) {}
}
