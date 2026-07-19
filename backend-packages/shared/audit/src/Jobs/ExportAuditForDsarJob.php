<?php

declare(strict_types=1);

namespace Academorix\Audit\Jobs;

use Academorix\Audit\Contracts\Repositories\AuditRepositoryInterface;
use Academorix\Audit\Data\AuditData;
use Academorix\Audit\Exceptions\AuditExportFailedException;
use Illuminate\Bus\Queueable;
use Illuminate\Container\Attributes\Log;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Psr\Log\LoggerInterface;

/**
 * Produce a DSAR (Data Subject Access Request) export bundle for one
 * subject across a date window.
 *
 * ## Contract
 *
 * The job runs on the `compliance` queue — a dedicated queue with
 * its own worker pool so a hot backlog never starves compliance
 * requests. `#[Tries(2)]` keeps retries bounded: a DSAR is a
 * regulatory obligation with SLA teeth, so blocking on a
 * multi-attempt queue is worse than surfacing a failure and letting
 * the operator retry manually.
 *
 * ## Placeholder implementation
 *
 * The signed-download bundle is produced by the storage module (out
 * of this module's scope). This job:
 *
 *   1. Queries the audit rows via {@see AuditRepositoryInterface::findForDsar()}.
 *   2. Maps each row to a wire-visible {@see AuditData}.
 *   3. Logs the payload count + subject id for the compliance
 *      audit trail (yes, the DSAR itself creates an audit event —
 *      that recursion is deliberate + one-level-deep).
 *
 * Consumer apps override this handler to write to the storage
 * module + emit a "bundle ready" notification. The queue name +
 * timeout stay stable.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[Queue('compliance')]
#[Timeout(1800)]
#[Tries(2)]
final class ExportAuditForDsarJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string  $userId  Subject id.
     * @param  string  $from    ISO 8601 window start.
     * @param  string  $to      ISO 8601 window end.
     * @param  string  $format  `json` or `csv`.
     */
    public function __construct(
        public readonly string $userId,
        public readonly string $from,
        public readonly string $to,
        public readonly string $format = 'json',
    ) {
    }

    public function handle(
        AuditRepositoryInterface $audits,
        #[Log('audit')] LoggerInterface $log,
    ): void {
        try {
            $rows = $audits->findForDsar(
                $this->userId,
                new \DateTimeImmutable($this->from),
                new \DateTimeImmutable($this->to),
            );
        } catch (\Throwable $e) {
            throw new AuditExportFailedException(
                'Failed to gather DSAR audit rows: ' . $e->getMessage(),
                previous: $e,
            );
        }

        // Map to wire shape — the AuditData constructor handles
        // redaction based on the currently-authenticated caller.
        // For a DSAR bundle we WANT the platform-admin view, which
        // is why the enclosing action gates on ExportDsar permission.
        $payload = $rows->map(static fn ($row) => AuditData::fromModel($row)->toArray())->all();

        $log->info('audit dsar export prepared', [
            'user_id' => $this->userId,
            'from'    => $this->from,
            'to'      => $this->to,
            'format'  => $this->format,
            'rows'    => \count($payload),
        ]);

        // Handoff to the storage module is a follow-up milestone.
        // For now, the log entry above IS the compliance signal —
        // ops picks up the bundle via the queue monitor + the
        // storage module's manual export UI.
    }

    public function failed(\Throwable $e): void
    {
    }
}
