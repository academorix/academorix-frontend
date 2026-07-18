<?php

declare(strict_types=1);

namespace Academorix\Domains\Contracts\Services;

use Academorix\Domains\Models\Domain;
use Academorix\Domains\Services\NullCertificateProvisioner;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the certificate provisioner (ACME / Let's Encrypt / ZeroSSL).
 *
 * The default {@see NullCertificateProvisioner} is a safe no-op —
 * consumer apps override by binding their own concrete class through
 * this interface's `#[Bind]` attribute.
 *
 * `#[Bind]` follows the Laravel-canonical placement (`.kiro/steering/
 * php-attributes.md` §Container attributes): the attribute lives on
 * the ABSTRACT (this interface); the argument IS the CONCRETE
 * ({@see NullCertificateProvisioner}). Consumers type-hint the
 * interface; the container resolves to the concrete.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[Bind(NullCertificateProvisioner::class)]
interface CertificateProvisionerInterface
{
    /**
     * Request a certificate for a verified {@see Domain}.
     *
     * Implementations return the issue outcome as a snapshot the
     * calling job applies onto the Domain row (ssl_status /
     * ssl_issued_at / ssl_expires_at).
     *
     * @return array{
     *     ssl_status: string,
     *     ssl_issued_at: \DateTimeInterface|null,
     *     ssl_expires_at: \DateTimeInterface|null,
     * }
     */
    public function issue(Domain $domain): array;

    /**
     * Rotate an existing certificate before it expires. Same return
     * shape as {@see issue()}.
     *
     * @return array{
     *     ssl_status: string,
     *     ssl_issued_at: \DateTimeInterface|null,
     *     ssl_expires_at: \DateTimeInterface|null,
     * }
     */
    public function rotate(Domain $domain): array;

    /**
     * Revoke a certificate. Called on domain deletion or on demand.
     */
    public function revoke(Domain $domain): void;
}
