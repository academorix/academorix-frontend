<?php

declare(strict_types=1);

namespace Academorix\Integrations\Contracts\Services;

use Academorix\Integrations\Services\NullIntegrationSecretsCipher;
use Illuminate\Container\Attributes\Bind;

/**
 * Encrypt / decrypt the `tenant_integrations.config` JSONB blob.
 *
 * The blob NEVER stores plaintext secrets — every read + write of the
 * `config` column routes through this contract via
 * {@see \Academorix\Integrations\Casts\IntegrationConfig}.
 *
 * The default {@see NullIntegrationSecretsCipher} is a pass-through
 * so the module boots without a KMS backend. PRODUCTION MUST OVERRIDE
 * with a KMS-backed cipher before enabling real integrations.
 *
 * `#[Bind]` follows the Laravel-canonical placement (`.kiro/steering/
 * php-attributes.md` §Container attributes): the attribute lives on
 * the ABSTRACT (this interface); the argument IS the CONCRETE
 * ({@see NullIntegrationSecretsCipher}). Consumers type-hint the
 * interface; the container resolves to the concrete.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[Bind(NullIntegrationSecretsCipher::class)]
interface IntegrationSecretsCipherInterface
{
    /**
     * Encrypt every leaf of the config array. Return shape is
     * implementation-defined — the default pass-through returns the
     * input; a real cipher returns a KMS-envelope shape like
     * `['ciphertext' => '...', 'iv' => '...', 'tag' => '...',
     * 'kms_key_id' => '...']`.
     *
     * @param  array<string, mixed>  $config  Plaintext config payload.
     * @return array<string, mixed>          Encrypted-at-rest shape.
     */
    public function encrypt(array $config): array;

    /**
     * Decrypt a config payload produced by {@see self::encrypt()}.
     *
     * @param  array<string, mixed>  $config  Encrypted payload.
     * @return array<string, mixed>          Plaintext config.
     */
    public function decrypt(array $config): array;
}
