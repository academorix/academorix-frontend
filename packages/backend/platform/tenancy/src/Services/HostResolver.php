<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Services;

use Stackra\Application\Models\Application;
use Illuminate\Container\Attributes\Singleton;

/**
 * Pure host-parsing utility.
 *
 * Given an incoming request host + the resolved Application, split
 * the host into `(applicationHost, tenantSlug|null)` and classify it
 * as central / platform-admin / tenant.
 *
 * Stateless — `#[Singleton]`.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[Singleton]
final class HostResolver
{
    /**
     * Classify a host relative to an Application.
     *
     * Returns:
     *   - `'central'`  — host == application.central_host
     *   - `'admin'`    — host == application.platform_admin_host
     *   - `'tenant'`   — host is `{slug}.{application.central_host}`
     *   - `'unknown'`  — no match
     */
    public function classify(string $host, Application $application): string
    {
        $host        = self::normalize($host);
        $centralHost = self::normalize((string) $application->central_host);
        $adminHost   = self::normalize((string) $application->platform_admin_host);

        if ($host === $centralHost) {
            return 'central';
        }

        if ($host === $adminHost) {
            return 'admin';
        }

        if ($centralHost !== '' && \str_ends_with($host, '.' . $centralHost)) {
            return 'tenant';
        }

        return 'unknown';
    }

    /**
     * Extract the tenant slug from a `{slug}.{application.central_host}` host.
     *
     * Returns `null` when the host is not a tenant subdomain.
     */
    public function extractTenantSlug(string $host, Application $application): ?string
    {
        $host        = self::normalize($host);
        $centralHost = self::normalize((string) $application->central_host);

        if ($centralHost === '' || ! \str_ends_with($host, '.' . $centralHost)) {
            return null;
        }

        $slug = \substr($host, 0, -\strlen('.' . $centralHost));

        return $slug !== '' ? $slug : null;
    }

    /**
     * Normalise a host string — trim + lowercase + strip port.
     */
    private static function normalize(string $host): string
    {
        $host = \strtolower(\trim($host));
        $colonPos = \strpos($host, ':');

        return $colonPos === false ? $host : \substr($host, 0, $colonPos);
    }
}
