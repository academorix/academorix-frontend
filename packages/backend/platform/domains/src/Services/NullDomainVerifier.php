<?php

declare(strict_types=1);

namespace Stackra\Domains\Services;

use Stackra\Domains\Contracts\Services\DomainVerifierInterface;
use Stackra\Domains\Enums\DnsRecordStatus;
use Stackra\Domains\Models\DomainRecord;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default no-op implementation of {@see DomainVerifierInterface}.
 *
 * Every check returns `status = unknown` so verification never
 * spuriously succeeds without a real DNS backend. Consumer apps
 * override by binding a real verifier (`Route53Verifier`,
 * `SystemDnsVerifier`) through the interface's `#[Bind]` attribute
 * — this default lives so the module boots without a hard DNS
 * dependency.
 *
 * `#[Singleton]` — the verifier is stateless; the container reuses
 * the same instance for every check in the worker process.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[Singleton]
final class NullDomainVerifier implements DomainVerifierInterface
{
    /**
     * {@inheritDoc}
     */
    public function verify(DomainRecord $record): array
    {
        return [
            'status'          => DnsRecordStatus::Unknown->value,
            'last_seen_value' => null,
            'ttl_seconds'     => null,
            'last_error'      => 'NullDomainVerifier — no DNS backend bound.',
        ];
    }
}
