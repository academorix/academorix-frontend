<?php

declare(strict_types=1);

namespace Academorix\Domains\Services;

use Academorix\Domains\Contracts\Services\CertificateProvisionerInterface;
use Academorix\Domains\Enums\SslStatus;
use Academorix\Domains\Models\Domain;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default no-op implementation of
 * {@see CertificateProvisionerInterface}.
 *
 * Every call returns `ssl_status = pending` — the module boots
 * without an ACME dependency. Consumer apps override by binding a
 * real provisioner (`LetsEncryptProvisioner`, `AcmeShellProvisioner`)
 * through the interface's `#[Bind]` attribute.
 *
 * `#[Singleton]` — the provisioner is stateless; the container
 * reuses the same instance for every call in the worker process.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[Singleton]
final class NullCertificateProvisioner implements CertificateProvisionerInterface
{
    /**
     * {@inheritDoc}
     */
    public function issue(Domain $domain): array
    {
        return [
            'ssl_status'     => SslStatus::Pending->value,
            'ssl_issued_at'  => null,
            'ssl_expires_at' => null,
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function rotate(Domain $domain): array
    {
        return $this->issue($domain);
    }

    /**
     * {@inheritDoc}
     */
    public function revoke(Domain $domain): void
    {
        // No-op — nothing to revoke without a real provisioner.
    }
}
