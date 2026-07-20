<?php

declare(strict_types=1);

namespace Academorix\Approvals\Contracts\Services;

use Academorix\Approvals\Models\ApprovalTemplate;
use Academorix\Approvals\Services\ApprovalTemplateResolver;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the "which template applies here?" resolver.
 *
 * On every approvable-action call site, the middleware asks this
 * service which {@see ApprovalTemplate} (if any) governs the
 * write. Multiple templates may match a single action key — the
 * resolver returns the one with the HIGHEST `priority`, breaking
 * ties by newest `version`. Its `when_expression` (if any) must
 * evaluate truthy against the caller's payload before the template
 * is considered.
 *
 * Concrete: {@see ApprovalTemplateResolver}.
 *
 * @category Approvals
 *
 * @since    0.1.0
 */
#[Bind(ApprovalTemplateResolver::class)]
interface ApprovalTemplateResolverInterface
{
    /**
     * Return the single template that applies to `$actionKey` for
     * the active tenant given the caller's payload, or `null` when
     * no template matches.
     *
     * Resolution order:
     *  1. Load every active template row keyed on
     *     `(tenant_id = $tenantId, action_key = $actionKey)`.
     *  2. Sort by `priority` DESC then `version` DESC.
     *  3. For each candidate, evaluate `when_expression` against
     *     `$payload`. First truthy match wins.
     *  4. When `when_expression` is null, treat as unconditional
     *     match.
     *
     * @param  string                $tenantId    Owning tenant.
     * @param  string                $actionKey   Discovered from `#[AsApprovableAction]`.
     * @param  array<string, mixed>  $payload     Rule-engine payload (actor / subject / context / tenant).
     *
     * @return ApprovalTemplate|null  The winning template, or null when nothing applies.
     */
    public function resolveFor(string $tenantId, string $actionKey, array $payload): ?ApprovalTemplate;
}
