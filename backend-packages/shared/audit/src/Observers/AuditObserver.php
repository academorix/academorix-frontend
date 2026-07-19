<?php

declare(strict_types=1);

namespace Academorix\Audit\Observers;

use Academorix\Audit\Contracts\Data\AuditInterface;
use Academorix\Audit\Contracts\Services\AuditChainVerifierInterface;
use Academorix\Audit\Events\AuditRecorded;
use Academorix\Audit\Models\Audit;
use Illuminate\Contracts\Container\BindingResolutionException;
use Illuminate\Support\Facades\Facade;

/**
 * Lifecycle side effects on {@see Audit}.
 *
 * ## Responsibilities
 *
 *   - `creating` — compute `chain_hash` for this row from the
 *     previous row's `chain_hash` + this row's canonical
 *     serialisation. Skipped when the chain is disabled by config
 *     OR the verifier can't be resolved (fail-soft).
 *   - `created`  — emit {@see AuditRecorded}.
 *
 * ## Why not use owen-it's own `AuditCreated` event?
 *
 * The vendor's event fires INSIDE the `Auditable` trait — a client
 * that composes `HasAudit` never sees it directly. Our
 * {@see AuditRecorded} is dispatched from the row's own observer so
 * every audit-row lifecycle listener has the same subscription seam.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
final class AuditObserver
{
    /**
     * `creating` — compute the chain hash from the previous row.
     *
     * Runs BEFORE `HasPrefixedUlid::bootHasPrefixedUlid` fires the
     * id. That's intentional — trait registration order is
     * (BelongsToTenantOptional, HasFactory, HasMetadata,
     * HasPrefixedUlid), and Eloquent runs `creating` listeners in
     * registration order. The id assignment is idempotent enough
     * that we can read it back safely BUT we don't rely on it here.
     */
    public function creating(Audit $audit): void
    {
        // Config knob — non-enterprise tenants skip the chain
        // entirely. Reading through `config()` (not `env()`) so the
        // cached config layer wins under Octane.
        if (\config('audit.chain.enabled_default', true) !== true) {
            return;
        }

        $verifier = $this->resolveVerifier();
        if ($verifier === null) {
            // Fail-soft — no verifier bound (rare boot ordering
            // issue). Leave `chain_hash` NULL; the verifier will
            // treat this row as "did not participate" on the next
            // walk and skip it.
            return;
        }

        // Find the row with the greatest `created_at` — the current
        // chain tip. Same tie-breaker as the verifier (`id` DESC).
        // We deliberately search across every tenant when the audit
        // is a platform-plane operation (tenant_id NULL).
        $previous = Audit::query()
            ->when(
                $audit->{AuditInterface::ATTR_TENANT_ID},
                fn ($q, $tenantId) => $q->where(AuditInterface::ATTR_TENANT_ID, $tenantId),
                fn ($q) => $q->whereNull(AuditInterface::ATTR_TENANT_ID),
            )
            ->orderByDesc(AuditInterface::ATTR_CREATED_AT)
            ->orderByDesc(AuditInterface::ATTR_ID)
            ->first();

        $audit->{AuditInterface::ATTR_CHAIN_HASH} = $verifier->computeChainHash($audit, $previous);
    }

    /**
     * `created` — emit {@see AuditRecorded}.
     */
    public function created(Audit $audit): void
    {
        AuditRecorded::dispatch($audit);
    }

    /**
     * Resolve the bound chain verifier without forcing a container-
     * boot exception on the caller. Matches the fail-soft pattern
     * the cast uses.
     */
    private function resolveVerifier(): ?AuditChainVerifierInterface
    {
        try {
            $app = Facade::getFacadeApplication();
        } catch (\Throwable) {
            return null;
        }

        if ($app === null || ! $app->bound(AuditChainVerifierInterface::class)) {
            return null;
        }

        try {
            /** @var AuditChainVerifierInterface $verifier */
            $verifier = $app->make(AuditChainVerifierInterface::class);
            return $verifier;
        } catch (BindingResolutionException) {
            return null;
        }
    }
}
