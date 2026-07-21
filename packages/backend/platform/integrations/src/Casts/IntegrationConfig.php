<?php

declare(strict_types=1);

namespace Stackra\Integrations\Casts;

use Stackra\Integrations\Contracts\Services\IntegrationSecretsCipherInterface;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Cast for the `tenant_integrations.config` JSONB column.
 *
 * Every read decrypts via the container-resolved
 * {@see IntegrationSecretsCipherInterface}; every write encrypts
 * through the same seam. The cast falls back to raw JSON when the
 * container is not yet booted (fresh migrations, tinker without a
 * bound cipher) so schema operations never break on missing bindings.
 *
 * @implements CastsAttributes<array<string, mixed>, array<string, mixed>>
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
final class IntegrationConfig implements CastsAttributes
{
    /**
     * Decrypt on hydrate.
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>|null
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?array
    {
        if ($value === null || $value === '') {
            return null;
        }

        $decoded = \is_array($value) ? $value : \json_decode((string) $value, true);
        if (! \is_array($decoded)) {
            return null;
        }

        try {
            /** @var IntegrationSecretsCipherInterface $cipher */
            $cipher = \app(IntegrationSecretsCipherInterface::class);

            return $cipher->decrypt($decoded);
        } catch (\Throwable) {
            // Container not booted (migrations, seeders w/o full bind
            // chain) — return the raw JSON so schema tooling keeps
            // working.
            return $decoded;
        }
    }

    /**
     * Encrypt on save.
     *
     * @param  array<string, mixed>|null  $value
     * @param  array<string, mixed>       $attributes
     * @return array<string, string>
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        $payload = \is_array($value) ? $value : [];

        try {
            /** @var IntegrationSecretsCipherInterface $cipher */
            $cipher    = \app(IntegrationSecretsCipherInterface::class);
            $encrypted = $cipher->encrypt($payload);
        } catch (\Throwable) {
            // Same fail-soft as `get()` — container may not be booted
            // during migrations; persist the raw shape so the row
            // still writes.
            $encrypted = $payload;
        }

        return [$key => (string) \json_encode($encrypted)];
    }
}
