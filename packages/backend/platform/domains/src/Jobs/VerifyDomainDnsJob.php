<?php

declare(strict_types=1);

namespace Stackra\Domains\Jobs;

use Stackra\Domains\Contracts\Data\DomainInterface;
use Stackra\Domains\Contracts\Data\DomainRecordInterface;
use Stackra\Domains\Contracts\Repositories\DomainRecordRepositoryInterface;
use Stackra\Domains\Contracts\Repositories\DomainRepositoryInterface;
use Stackra\Domains\Contracts\Services\DomainVerifierInterface;
use Stackra\Domains\Events\DomainVerificationFailed;
use Stackra\Domains\Events\DomainVerified;
use Stackra\Domains\Jobs\IssueCertificateJob;
use Stackra\Domains\Models\DomainRecord;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Diff every expected {@see DomainRecord} for a Domain against real
 * DNS. When every record reports `matches`, flip
 * `Domain.verified_at` + fire {@see DomainVerified}. When
 * `verification_attempts` hits the cap, fire {@see DomainVerificationFailed}.
 *
 * Delegates the actual DNS lookup to the bound
 * {@see DomainVerifierInterface}. The default `NullDomainVerifier`
 * returns `unknown` for every check — real deployments bind a
 * concrete verifier.
 *
 * `ShouldBeUnique` — single in-flight per domain.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[Queue('dns')]
#[Timeout(30)]
#[Tries(8)]
#[Backoff(30, 60, 300, 900, 3600, 10800, 21600, 43200)]
final class VerifyDomainDnsJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $domainId)
    {
    }

    #[UniqueFor(60)]
    public function uniqueId(): string
    {
        return 'domain:' . $this->domainId;
    }

    /**
     * Execute the check. Updates every DomainRecord row + the parent
     * Domain accordingly.
     */
    public function handle(
        DomainRepositoryInterface $domains,
        DomainRecordRepositoryInterface $records,
        DomainVerifierInterface $verifier,
    ): void {
        $domain = $domains->find($this->domainId);
        if ($domain === null) {
            return;
        }

        $maxAttempts = (int) \config('domains.verification.max_attempts', 100);

        foreach ($records->findByDomain($this->domainId) as $record) {
            $this->diffRecord($record, $verifier);
        }

        if ($records->allMatchingForDomain($this->domainId)) {
            $domain->update([
                DomainInterface::ATTR_VERIFIED_AT             => \now(),
                DomainInterface::ATTR_VERIFICATION_ATTEMPTS   => 0,
                DomainInterface::ATTR_VERIFICATION_LAST_ERROR => null,
            ]);

            DomainVerified::dispatch($domain->refresh());
            IssueCertificateJob::dispatch($this->domainId);

            return;
        }

        // Not all matching — increment attempts + reschedule.
        $attempts = (int) $domain->{DomainInterface::ATTR_VERIFICATION_ATTEMPTS} + 1;
        $domain->update([DomainInterface::ATTR_VERIFICATION_ATTEMPTS => $attempts]);

        if ($attempts >= $maxAttempts) {
            DomainVerificationFailed::dispatch(
                $domain->refresh(),
                (string) $domain->{DomainInterface::ATTR_VERIFICATION_LAST_ERROR},
            );

            return;
        }

        // Retry with backoff — Laravel picks the next `Backoff` slot.
        $this->release($this->backoff[$attempts - 1] ?? 3600);
    }

    /**
     * Update ONE DomainRecord row from the verifier's observation.
     */
    private function diffRecord(DomainRecord $record, DomainVerifierInterface $verifier): void
    {
        $observed = $verifier->verify($record);

        $record->update([
            DomainRecordInterface::ATTR_STATUS          => $observed['status'],
            DomainRecordInterface::ATTR_LAST_SEEN_VALUE => $observed['last_seen_value'],
            DomainRecordInterface::ATTR_TTL_SECONDS     => $observed['ttl_seconds'],
            DomainRecordInterface::ATTR_LAST_CHECK_AT   => \now(),
            DomainRecordInterface::ATTR_LAST_ERROR      => $observed['last_error'],
            DomainRecordInterface::ATTR_LAST_MATCHED_AT => $observed['status'] === 'matches' ? \now() : $record->{DomainRecordInterface::ATTR_LAST_MATCHED_AT},
        ]);
    }

    public function failed(\Throwable $e): void
    {
    }
}
