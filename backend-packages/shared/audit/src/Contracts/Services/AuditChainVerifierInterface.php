<?php

declare(strict_types=1);

namespace Academorix\Audit\Contracts\Services;

use Academorix\Audit\Models\Audit;
use Academorix\Audit\Services\DefaultAuditChainVerifier;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Scoped;

/**
 * Contract for the tamper-evident chain verifier.
 *
 * The default {@see DefaultAuditChainVerifier} walks the `audits`
 * table in creation order, recomputes each row's expected
 * `chain_hash`, and compares to the stored value. On mismatch it
 * emits {@see \Academorix\Audit\Events\AuditChainBroken}.
 *
 * Bound `#[Scoped]` — the verifier holds per-run counters
 * (`verified`, `broken`, `first_break_at`) that must reset between
 * requests. Under Octane, `#[Singleton]` would carry stale counters
 * across every subsequent verification request.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[Bind(DefaultAuditChainVerifier::class)]
#[Scoped]
interface AuditChainVerifierInterface
{
    /**
     * Walk the audit chain for one tenant (or every tenant when
     * `$tenantId === null`) and produce a verification summary.
     *
     * Emits {@see \Academorix\Audit\Events\AuditChainBroken} on the
     * FIRST broken link and continues walking so the summary counts
     * every downstream mismatch.
     *
     * @param  string|null  $tenantId  Tenant to verify, or null for
     *   the whole platform. Platform-plane audits (tenant_id = NULL)
     *   are always included when this is null.
     * @return array{verified: int, broken: int, first_break_at: \DateTimeInterface|null}
     */
    public function verify(?string $tenantId = null): array;

    /**
     * Compute the canonical chain hash for a single audit row.
     *
     * The hash covers every payload column that participates in the
     * chain: `id`, `tenant_id`, `event`, `auditable_type`,
     * `auditable_id`, `user_type`, `user_id`, `old_values`,
     * `new_values`, `created_at`, plus the previous row's
     * `chain_hash` (empty string for the first row).
     *
     * @param  Audit       $audit     The row to hash.
     * @param  Audit|null  $previous  The immediately-preceding row in
     *   creation order, or `null` when this is the first row of the
     *   chain.
     * @return string  Hex-encoded digest (128 chars for SHA-512).
     */
    public function computeChainHash(Audit $audit, ?Audit $previous): string;
}
