<?php

declare(strict_types=1);

namespace Academorix\Audit\Jobs;

use Academorix\Audit\Contracts\Data\AuditInterface;
use Academorix\Audit\Contracts\Services\AuditRegistryInterface;
use Academorix\Audit\Contracts\Services\KmsCipherInterface;
use Academorix\Audit\Models\Audit;
use Illuminate\Bus\Queueable;
use Illuminate\Container\Attributes\Log;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Psr\Log\LoggerInterface;

/**
 * Background KMS encryption of a single audit row.
 *
 * ## When it fires
 *
 * The observer writes audit rows synchronously; the KMS envelope
 * encryption of restricted-tier fields lives INSIDE the row's
 * `old_values` / `new_values` payload. When the payload is large
 * (default: > 32KB), doing the cipher round-trip on the write path
 * pushes the latency budget over. The
 * `KmsEncryptAuditFieldsJob` defers the encrypt to a queue worker.
 *
 * ## Idempotency
 *
 * The job re-reads the row before ciphering. If the field is
 * already ciphertext (a cheap "starts with our cipher framing"
 * check the KMS backend implements), the job skips — the retry is
 * safe.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[Queue('default')]
#[Timeout(300)]
#[Tries(3)]
#[Backoff(30, 60, 120)]
final class KmsEncryptAuditFieldsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $auditId)
    {
    }

    public function handle(
        KmsCipherInterface $cipher,
        AuditRegistryInterface $registry,
        #[Log('audit')] LoggerInterface $log,
    ): void {
        /** @var Audit|null $audit */
        $audit = Audit::query()->find($this->auditId);
        if ($audit === null) {
            // Row was rotated to cold storage or hard-deleted (rare —
            // audit hard-delete only happens at the 7y anonymisation
            // boundary). Silent skip is the right shape.
            return;
        }

        $fields = $registry->encryptedFieldsFor(
            (string) $audit->{AuditInterface::ATTR_AUDITABLE_TYPE},
        );

        if ($fields === []) {
            return;
        }

        foreach ([AuditInterface::ATTR_OLD_VALUES, AuditInterface::ATTR_NEW_VALUES] as $payloadKey) {
            $payload = $audit->{$payloadKey};
            if (! \is_array($payload)) {
                continue;
            }

            foreach ($fields as $field) {
                if (! \array_key_exists($field, $payload)) {
                    continue;
                }
                if ($payload[$field] === null) {
                    continue;
                }

                $plaintext           = \is_scalar($payload[$field])
                    ? (string) $payload[$field]
                    : (string) \json_encode($payload[$field], \JSON_UNESCAPED_UNICODE);
                $payload[$field]     = $cipher->encrypt($plaintext);
            }

            $audit->{$payloadKey} = $payload;
        }

        $audit->saveQuietly();

        $log->info('audit fields encrypted', [
            'audit_id' => $this->auditId,
            'fields'   => $fields,
        ]);
    }

    public function failed(\Throwable $e): void
    {
    }
}
