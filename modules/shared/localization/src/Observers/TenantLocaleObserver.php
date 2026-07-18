<?php

declare(strict_types=1);

namespace Academorix\Localization\Observers;

use Academorix\Localization\Contracts\Data\TenantLocaleInterface;
use Academorix\Localization\Events\LanguageDisabledForTenant;
use Academorix\Localization\Events\LanguageEnabledForTenant;
use Academorix\Localization\Exceptions\TenantLocaleDefaultRequiredException;
use Academorix\Localization\Models\TenantLocale;

/**
 * Lifecycle side effects for {@see TenantLocale}.
 *
 * Enforces two hard invariants + wires domain events:
 *  1. At most one row per tenant may have `is_default=true`. When a
 *     row's `is_default` flips to true, every other row for the
 *     same tenant flips to false in the same transaction.
 *  2. At most one row per tenant may have `is_fallback=true`. Same
 *     enforcement shape.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class TenantLocaleObserver
{
    /**
     * `saving` — enforce the mutual-exclusivity invariants BEFORE
     * the write reaches storage. Fires for both create + update.
     */
    public function saving(TenantLocale $tenantLocale): void
    {
        $tenantId = $tenantLocale->{TenantLocaleInterface::ATTR_TENANT_ID};
        if ($tenantId === null || $tenantId === '') {
            return;
        }

        // Invariant 1 — only one default per tenant. Demote peers
        // when this row is marked default AND either the row is new
        // OR the row toggled the flag on this save.
        $flippedDefault =
            (bool) $tenantLocale->{TenantLocaleInterface::ATTR_IS_DEFAULT} === true
            && ($tenantLocale->wasChanged(TenantLocaleInterface::ATTR_IS_DEFAULT)
                || $tenantLocale->isDirty(TenantLocaleInterface::ATTR_IS_DEFAULT)
                || ! $tenantLocale->exists);

        if ($flippedDefault) {
            TenantLocale::query()
                ->where(TenantLocaleInterface::ATTR_TENANT_ID, $tenantId)
                ->where(TenantLocaleInterface::ATTR_ID, '!=', (string) ($tenantLocale->getKey() ?? ''))
                ->where(TenantLocaleInterface::ATTR_IS_DEFAULT, true)
                ->update([TenantLocaleInterface::ATTR_IS_DEFAULT => false]);
        }

        // Invariant 2 — only one fallback per tenant. Same shape.
        $flippedFallback =
            (bool) $tenantLocale->{TenantLocaleInterface::ATTR_IS_FALLBACK} === true
            && ($tenantLocale->wasChanged(TenantLocaleInterface::ATTR_IS_FALLBACK)
                || $tenantLocale->isDirty(TenantLocaleInterface::ATTR_IS_FALLBACK)
                || ! $tenantLocale->exists);

        if ($flippedFallback) {
            TenantLocale::query()
                ->where(TenantLocaleInterface::ATTR_TENANT_ID, $tenantId)
                ->where(TenantLocaleInterface::ATTR_ID, '!=', (string) ($tenantLocale->getKey() ?? ''))
                ->where(TenantLocaleInterface::ATTR_IS_FALLBACK, true)
                ->update([TenantLocaleInterface::ATTR_IS_FALLBACK => false]);
        }
    }

    /**
     * `deleting` — refuse when the row is the tenant's default. The
     * caller must promote another locale to default first.
     *
     * @throws TenantLocaleDefaultRequiredException  When trying to delete the default row.
     */
    public function deleting(TenantLocale $tenantLocale): void
    {
        if ((bool) $tenantLocale->{TenantLocaleInterface::ATTR_IS_DEFAULT} === true) {
            throw TenantLocaleDefaultRequiredException::forLocale(
                (string) $tenantLocale->getKey(),
            );
        }
    }

    /**
     * `created` — fire the domain event so downstream observers
     * (activity feed, cache priming) can react.
     */
    public function created(TenantLocale $tenantLocale): void
    {
        LanguageEnabledForTenant::dispatch(
            (string) $tenantLocale->{TenantLocaleInterface::ATTR_TENANT_ID},
            (string) $tenantLocale->{TenantLocaleInterface::ATTR_LANGUAGE_ID},
            (bool) $tenantLocale->{TenantLocaleInterface::ATTR_IS_DEFAULT},
        );
    }

    /**
     * `deleted` — fire the mirror domain event.
     */
    public function deleted(TenantLocale $tenantLocale): void
    {
        LanguageDisabledForTenant::dispatch(
            (string) $tenantLocale->{TenantLocaleInterface::ATTR_TENANT_ID},
            (string) $tenantLocale->{TenantLocaleInterface::ATTR_LANGUAGE_ID},
        );
    }
}
