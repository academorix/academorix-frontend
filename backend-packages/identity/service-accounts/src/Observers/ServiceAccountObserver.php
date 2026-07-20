<?php

declare(strict_types=1);

namespace Academorix\ServiceAccounts\Observers;

use Academorix\ServiceAccounts\Contracts\Data\ServiceAccountInterface;
use Academorix\ServiceAccounts\Exceptions\ServiceAccountImmutableFieldException;
use Academorix\ServiceAccounts\Exceptions\ServiceAccountTenantMutationException;
use Academorix\ServiceAccounts\Models\ServiceAccount;

/**
 * Blueprint-invariant guard for {@see ServiceAccount} lifecycle.
 *
 * Two immutable fields under `saving`:
 *
 *   - `tenant_id` — set at creation, then never again. A SA cannot
 *     re-parent between tenants; the blueprint's D2 lock (tenant
 *     per Application) turns any reparent attempt into a scope
 *     violation. Throws {@see ServiceAccountTenantMutationException}.
 *   - `application_id` — same rule, one Application per SA for its
 *     entire lifetime. Throws
 *     {@see ServiceAccountImmutableFieldException}.
 *
 * The observer only fires on `updating`/`saving` of an existing
 * row — the creation path can populate both columns freely.
 *
 * @category ServiceAccounts
 *
 * @since    0.1.0
 */
final class ServiceAccountObserver
{
    /**
     * Runs before every `save` (create + update). Refuses dirty
     * mutations on the immutable columns for existing rows.
     *
     * @throws ServiceAccountTenantMutationException
     * @throws ServiceAccountImmutableFieldException
     */
    public function saving(ServiceAccount $account): void
    {
        // Fresh rows (creation path) can populate everything — the
        // guardrail is against subsequent MUTATION of the immutable
        // columns.
        if (! $account->exists) {
            return;
        }

        // tenant_id: a null->non-null OR non-null->different swap is
        // both a violation. isDirty() catches both.
        if ($account->isDirty(ServiceAccountInterface::ATTR_TENANT_ID)) {
            throw ServiceAccountTenantMutationException::make(sprintf(
                'Refused to change ServiceAccount tenant_id from %s to %s.',
                var_export($account->getOriginal(ServiceAccountInterface::ATTR_TENANT_ID), true),
                var_export($account->getAttribute(ServiceAccountInterface::ATTR_TENANT_ID), true),
            ))->withHttpStatus(422);
        }

        // application_id: same rule. A Sports SA cannot re-parent to
        // Marketplace.
        if ($account->isDirty(ServiceAccountInterface::ATTR_APPLICATION_ID)) {
            throw ServiceAccountImmutableFieldException::make(sprintf(
                'Refused to change ServiceAccount application_id from %s to %s.',
                var_export($account->getOriginal(ServiceAccountInterface::ATTR_APPLICATION_ID), true),
                var_export($account->getAttribute(ServiceAccountInterface::ATTR_APPLICATION_ID), true),
            ))->withHttpStatus(422);
        }
    }
}
