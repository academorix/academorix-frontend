<?php

declare(strict_types=1);

namespace Stackra\Audit\Events;

use Stackra\Audit\Models\Audit;
use Stackra\Events\Attributes\AsEvent;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when the chain verifier detects the first broken row of
 * a run. CRITICAL — potential tampering.
 *
 * Emitted at most ONCE per verifier run — the verifier tracks
 * `first_break_at` internally and suppresses subsequent dispatches so
 * the notifications channel doesn't get flooded when a whole tail of
 * the chain diverges.
 *
 * Listeners:
 *
 *   - notifications::DispatchAuditChainBrokenNotification — pages the
 *     compliance officer.
 *   - observability::AlertingListener — fires a PagerDuty incident.
 *   - compliance::AuditChainBrokenListener — locks the tenant's
 *     writable audit surface until an operator clears the incident.
 *
 * The event is queued on `notifications-critical` per the module's
 * `events.json` blueprint. See the module manifest for the full
 * consumer chain.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'audit.audit.chain_broken')]
final readonly class AuditChainBroken
{
    use Dispatchable;

    /**
     * @param  Audit               $firstBrokenAudit  The first row of
     *   the run whose stored `chain_hash` disagreed with the recomputed
     *   hash. The row's `id` anchors the triage.
     * @param  \DateTimeInterface  $detectedAt        Timestamp of the
     *   detection — pinned so downstream systems know the earliest
     *   moment the chain lost integrity.
     */
    public function __construct(
        public Audit $firstBrokenAudit,
        public \DateTimeInterface $detectedAt,
    ) {
    }
}
