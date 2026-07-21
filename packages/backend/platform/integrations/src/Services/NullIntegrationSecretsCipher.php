<?php

declare(strict_types=1);

namespace Stackra\Integrations\Services;

use Stackra\Integrations\Contracts\Services\IntegrationSecretsCipherInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default no-op implementation of
 * {@see IntegrationSecretsCipherInterface}.
 *
 * Pass-through — the `config` payload is stored EXACTLY as authored,
 * unencrypted. The module boots without a KMS backend so tests +
 * fixture-first flows work without provisioning real keys.
 *
 * PRODUCTION MUST OVERRIDE. Bind a KMS-backed cipher through the
 * interface's `#[Bind]` attribute before enabling real integrations.
 *
 * `#[Singleton]` — the cipher is stateless; the container reuses the
 * same instance for every encrypt/decrypt call in the worker process.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[Singleton]
final class NullIntegrationSecretsCipher implements IntegrationSecretsCipherInterface
{
    /**
     * {@inheritDoc}
     *
     * Returns the payload unchanged.
     */
    public function encrypt(array $config): array
    {
        return $config;
    }

    /**
     * {@inheritDoc}
     *
     * Returns the payload unchanged.
     */
    public function decrypt(array $config): array
    {
        return $config;
    }
}
