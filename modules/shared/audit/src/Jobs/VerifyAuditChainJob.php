<?php

declare(strict_types=1);

namespace Academorix\Audit\Jobs;

use Academorix\Audit\Contracts\Services\AuditChainVerifierInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Walk the audit chain and emit
 * {@see \Academorix\Audit\Events\AuditChainVerified} plus (on first
 * break) {@see \Academorix\Audit\Events\AuditChainBroken}.
 *
 * ## Retry stance
 *
 * `#[Tries(2)]` — the walk is largely deterministic (same rows,
 * same hash, same result). Two attempts covers transient database
 * blips; anything worse is a real backend outage that a third retry
 * won't fix.
 *
 * ## Idempotency
 *
 * The verifier stamps `chain_verified_at` on rows it verified.
 * A re-run visits those rows again but the hash comparison is a
 * pure function — same input, same result. No side-effect duplication.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[Queue('default')]
#[Timeout(1800)]
#[Tries(2)]
final class VerifyAuditChainJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string|null  $tenantId  Tenant to verify, or `null` for
     *   the whole platform.
     */
    public function __construct(public readonly ?string $tenantId = null)
    {
    }

    public function handle(AuditChainVerifierInterface $verifier): void
    {
        $verifier->verify($this->tenantId);
    }

    /**
     * Terminal failure hook. We don't retry beyond the attribute
     * budget; ops picks up the failure via the queue monitor.
     */
    public function failed(\Throwable $e): void
    {
        // Intentionally empty — the queue monitor + Sentry cover
        // observability. A `throw` here would hit the fail-safe DLQ
        // twice, which is worse than one recorded terminal failure.
    }
}
