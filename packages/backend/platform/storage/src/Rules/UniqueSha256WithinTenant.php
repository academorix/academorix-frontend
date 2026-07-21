<?php

declare(strict_types=1);

namespace Stackra\Storage\Rules;

use Stackra\Storage\Contracts\Data\FileInterface;
use Stackra\Storage\Models\File;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Assert no other File in the caller's tenant shares this SHA-256.
 *
 * Used on the upload path when the consumer opts out of dedup
 * (`#[FileKind(dedupable: false)]`) — the module still refuses to
 * import the same content twice.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class UniqueSha256WithinTenant implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            return;
        }

        try {
            /** @var TenantContextInterface $ctx */
            $ctx    = \app(TenantContextInterface::class);
            $tenant = $ctx->current();
        } catch (\Throwable) {
            // fail-soft on missing binding — the middleware would
            // have failed the request already.
            return;
        }

        if ($tenant === null) {
            return;
        }

        $exists = File::query()
            ->where(FileInterface::ATTR_TENANT_ID, (string) $tenant->getKey())
            ->where(FileInterface::ATTR_SHA256, $value)
            ->exists();

        if ($exists) {
            $fail(__('storage::validation.unique_sha256_within_tenant'));
        }
    }
}
