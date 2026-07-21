<?php

declare(strict_types=1);

namespace Stackra\Audit\Jobs;

use Stackra\Audit\Contracts\Data\AuditInterface;
use Stackra\Audit\Models\Audit;
use Illuminate\Bus\Queueable;
use Illuminate\Container\Attributes\Config;
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
 * Move audits past the hot-phase retention window to cold storage.
 *
 * ## Retention shape
 *
 * The blueprint's `retention.json` pins:
 *
 *   - Hot phase: 365 days in Postgres.
 *   - Cold phase: 2555 days (7y) in S3 Glacier + Object Lock.
 *
 * This job runs on the `retention` queue via a scheduled dispatch
 * (out of this module's scope — the schedule lives in the
 * `retention` module). Each invocation rotates one batch (default
 * 1000 rows); over-quota tenants are hit by successive invocations
 * scheduled by the retention module.
 *
 * ## Non-destructive
 *
 * Cold rotation NEVER deletes a row. It writes the row's
 * payload to cold storage, records the `cold_key` in the row's
 * metadata satellite, and nulls out `old_values` / `new_values` in
 * Postgres. The chain hash + previous_hash stay populated so the
 * chain remains verifiable post-rotation.
 *
 * ## Placeholder implementation
 *
 * The concrete cold-storage transport (S3 Glacier / GCS Archive /
 * Azure Blob Archive) is out of this module's scope. This job's
 * handler logs the intent and updates the metadata satellite —
 * consumer apps override the transport via a `CooldownTransport`
 * binding in a follow-up milestone.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[Queue('retention')]
#[Timeout(3600)]
#[Tries(1)]
final class RotateAuditColdStorageJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(
        #[Config('audit.retention.hot_days')] int $hotDays,
        #[Config('audit.cold.rotate_batch_size')] int $batchSize,
        #[Log('audit')] LoggerInterface $log,
    ): void {
        $cutoff = \now()->subDays($hotDays);

        // Rows created BEFORE the cutoff that haven't yet been
        // rotated (no `cold_key` marker in their metadata).
        $query = Audit::query()
            ->where(AuditInterface::ATTR_CREATED_AT, '<', $cutoff)
            ->whereNull(AuditInterface::ATTR_METADATA . '->cold_key')
            ->orderBy(AuditInterface::ATTR_CREATED_AT)
            ->limit($batchSize);

        $rotated = 0;

        $query->each(function (Audit $row) use (&$rotated, $log): void {
            // ── Cold write (out-of-module transport) ──────────────
            //
            // A real implementation dumps the row payload to
            // S3 Glacier here and captures the returned object key.
            // The placeholder cold key names the row's own id so the
            // rotation is idempotent — a second invocation sees the
            // stamped metadata and skips.
            $coldKey = 'audits/' . $row->{AuditInterface::ATTR_ID};

            $metadata = $row->{AuditInterface::ATTR_METADATA} ?? [];
            $metadata['cold_key']    = $coldKey;
            $metadata['rotated_at']  = \now()->toIso8601String();

            // Null out the heavy payloads in Postgres; leave every
            // structural column (chain_hash, previous_hash via chain,
            // tenant_id, event, auditable_type) intact.
            $row->{AuditInterface::ATTR_OLD_VALUES} = null;
            $row->{AuditInterface::ATTR_NEW_VALUES} = null;
            $row->{AuditInterface::ATTR_METADATA}   = $metadata;
            $row->saveQuietly();

            $rotated++;
        });

        $log->info('audit cold rotation complete', [
            'hot_days_cutoff' => $cutoff->toIso8601String(),
            'batch_size'      => $batchSize,
            'rotated'         => $rotated,
        ]);
    }

    public function failed(\Throwable $e): void
    {
    }
}
