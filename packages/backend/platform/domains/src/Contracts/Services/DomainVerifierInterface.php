<?php

declare(strict_types=1);

namespace Stackra\Domains\Contracts\Services;

use Stackra\Domains\Models\DomainRecord;
use Stackra\Domains\Services\NullDomainVerifier;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the DNS-verification service.
 *
 * The default {@see NullDomainVerifier} is a safe no-op — consumer
 * apps override by binding their own concrete class (`Route53Verifier`,
 * `CloudflareVerifier`, `SystemDnsVerifier`) through this interface's
 * `#[Bind]` attribute.
 *
 * `#[Bind]` follows the Laravel-canonical placement (`.kiro/steering/
 * php-attributes.md` §Container attributes): the attribute lives on
 * the ABSTRACT (this interface); the argument IS the CONCRETE
 * ({@see NullDomainVerifier}). Consumers type-hint the interface;
 * the container resolves to the concrete.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[Bind(NullDomainVerifier::class)]
interface DomainVerifierInterface
{
    /**
     * Look up a DomainRecord against real DNS.
     *
     * Returns a mutation snapshot of what the verifier saw — the
     * verification job applies these onto the {@see DomainRecord}
     * row (status / last_seen_value / ttl_seconds / last_check_at /
     * last_error).
     *
     * @param  DomainRecord  $record  The expected record row.
     * @return array{
     *     status: string,
     *     last_seen_value: string|null,
     *     ttl_seconds: int|null,
     *     last_error: string|null,
     * }
     */
    public function verify(DomainRecord $record): array;
}
