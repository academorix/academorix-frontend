<?php

declare(strict_types=1);

namespace Stackra\Audit\Services;

use Stackra\Audit\Contracts\Data\AuditInterface;
use Stackra\Audit\Contracts\Services\AuditChainVerifierInterface;
use Stackra\Audit\Events\AuditChainBroken;
use Stackra\Audit\Events\AuditChainVerified;
use Stackra\Audit\Models\Audit;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Scoped;
use Psr\Log\LoggerInterface;

/**
 * Default tamper-evident chain verifier.
 *
 * ## Walk protocol
 *
 * The verifier iterates every audit row in creation order (with
 * `id` as the deterministic tie-breaker) and, for each row,
 * recomputes the expected `chain_hash` from the row's canonical
 * serialisation + the previous row's stored `chain_hash`. When the
 * recomputed hash disagrees with the stored value, it emits
 * {@see AuditChainBroken} on the FIRST break and continues walking
 * so the run's summary counts every downstream mismatch.
 *
 * ## Sample size
 *
 * A single job invocation walks at most `audit.chain.verify_sample_per_run`
 * rows (default 10,000). Larger tenants split into multiple runs
 * scheduled by the retention module — this bound keeps the verifier
 * from monopolising a queue worker.
 *
 * ## Canonical serialisation
 *
 * The hash covers a stable list of columns in a fixed order. Adding
 * a column to the audit table WITHOUT extending
 * {@see self::canonicalPayload()} would silently break the chain for
 * every existing row — so the payload column list is a compatibility
 * contract, not an implementation detail.
 *
 * ## Bound scoped
 *
 * `#[Scoped]` — the verifier holds mutable per-run counters
 * (`verified` / `broken` / `first_break_at`). Under Octane, a
 * `#[Singleton]` verifier would carry stale counters from the last
 * request into the next.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultAuditChainVerifier implements AuditChainVerifierInterface
{
    public function __construct(
        #[Config('audit.chain.algorithm')]
        private readonly string $algorithm,
        #[Config('audit.chain.verify_sample_per_run')]
        private readonly int $sampleSize,
        #[Log('audit')]
        private readonly LoggerInterface $log,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function verify(?string $tenantId = null): array
    {
        $verified      = 0;
        $broken        = 0;
        $firstBreakAt  = null;
        $startedAt     = \microtime(true);

        // Cursor by chunks so a large tenant doesn't materialise
        // every row into memory. The chunk size mirrors the sample
        // cap — one query per run in the common case.
        $query = Audit::query()->orderBy(AuditInterface::ATTR_CREATED_AT)->orderBy(AuditInterface::ATTR_ID);
        if ($tenantId !== null) {
            $query->where(AuditInterface::ATTR_TENANT_ID, $tenantId);
        }

        /** @var Audit|null $previous */
        $previous = null;
        $walked   = 0;

        $query->limit($this->sampleSize)->each(function (Audit $row) use (&$verified, &$broken, &$firstBreakAt, &$previous, &$walked): void {
            $walked++;

            // Row didn't participate in the chain (e.g., disabled per
            // `#[Auditable(chainEnabled: false)]`) — skip without
            // counting either way.
            $storedHash = $row->{AuditInterface::ATTR_CHAIN_HASH};
            if ($storedHash === null || $storedHash === '') {
                $previous = $row;
                return;
            }

            $expected = $this->computeChainHash($row, $previous);

            if (\hash_equals($expected, (string) $storedHash)) {
                // Stamp the row so the platform surface can distinguish
                // "verified once" from "never walked". `updateQuietly`
                // keeps the observer from re-running on our own writes.
                $row->{AuditInterface::ATTR_CHAIN_VERIFIED_AT} = \now();
                $row->saveQuietly();

                $verified++;
                $previous = $row;
                return;
            }

            $broken++;
            // First-break event only — downstream mismatches are noise
            // once a break is announced. Ops triage from the first row.
            if ($firstBreakAt === null) {
                $firstBreakAt = \now();
                AuditChainBroken::dispatch($row, $firstBreakAt);
            }

            // Continue walking WITHOUT stamping `chain_verified_at`.
            // The row remains in the "pending re-verification" bucket
            // the repository's `findChainBreaks()` surfaces.
            $previous = $row;
        });

        $durationMs = (int) ((\microtime(true) - $startedAt) * 1000);

        $this->log->info('audit chain verification complete', [
            'tenant_id'   => $tenantId,
            'walked'      => $walked,
            'verified'    => $verified,
            'broken'      => $broken,
            'duration_ms' => $durationMs,
        ]);

        AuditChainVerified::dispatch($verified, $broken);

        return [
            'verified'       => $verified,
            'broken'         => $broken,
            'first_break_at' => $firstBreakAt,
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function computeChainHash(Audit $audit, ?Audit $previous): string
    {
        $previousHash = $previous === null
            ? ''
            : (string) $previous->{AuditInterface::ATTR_CHAIN_HASH};

        return \hash($this->algorithm, $this->canonicalPayload($audit) . '|' . $previousHash);
    }

    /**
     * Canonical serialisation of an audit row. The column list here
     * is a compatibility contract — adding a column would break the
     * chain for every existing row unless we also version it. Order
     * matters; JSON keys are sorted deterministically in the encoded
     * payload.
     */
    private function canonicalPayload(Audit $audit): string
    {
        $shape = [
            'id'             => (string) $audit->{AuditInterface::ATTR_ID},
            'tenant_id'      => $audit->{AuditInterface::ATTR_TENANT_ID},
            'event'          => (string) $audit->{AuditInterface::ATTR_EVENT},
            'auditable_type' => (string) $audit->{AuditInterface::ATTR_AUDITABLE_TYPE},
            'auditable_id'   => (string) $audit->{AuditInterface::ATTR_AUDITABLE_ID},
            'user_type'      => $audit->{AuditInterface::ATTR_USER_TYPE},
            'user_id'        => $audit->{AuditInterface::ATTR_USER_ID},
            'old_values'     => $audit->{AuditInterface::ATTR_OLD_VALUES},
            'new_values'     => $audit->{AuditInterface::ATTR_NEW_VALUES},
            'created_at'     => $audit->{AuditInterface::ATTR_CREATED_AT}?->toIso8601String(),
        ];

        // JSON_UNESCAPED_UNICODE + JSON_UNESCAPED_SLASHES keep the
        // payload byte-identical across PHP versions — the chain is
        // meaningless if the hash depends on json_encode()'s current
        // escaping defaults.
        return (string) \json_encode(
            $shape,
            \JSON_UNESCAPED_UNICODE | \JSON_UNESCAPED_SLASHES | \JSON_THROW_ON_ERROR,
        );
    }
}
