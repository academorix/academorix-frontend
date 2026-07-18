<?php

declare(strict_types=1);

namespace Academorix\ServiceProvider\Contracts;

use Academorix\ServiceProvider\Attributes\AsTenancyHook;
use Academorix\ServiceProvider\Dispatchers\TenancyHookDispatcher;
use Academorix\ServiceProvider\Registry\TenancyHookRegistry;
use Academorix\ServiceProvider\Support\TenantHookContext;

/**
 * Per-tenant lifecycle contract — fires on every tenant init and
 * every tenant end.
 *
 * ## What this contract owns
 *
 * TenancyHooks apply per-request, per-tenant state to shared
 * runtime services — spatie/permission's team context, log context
 * enrichment, sentry tenant tag, tenant-scoped cache prefixes.
 * They ARE NOT bootstrappers (see ADR 0020): every hook runs on
 * every tenant transition, never gets cached, and must reset its
 * side effects on teardown for Octane safety.
 *
 * ## Symmetric revert contract
 *
 *  * `onTenantInitialized` — snapshot whatever singleton state
 *    you're about to mutate, then apply the new value.
 *  * `onTenantEnded` — restore the snapshot. Never assume a default
 *    — the previous state may have been a nested tenant.
 *
 * Hooks that leave state behind under Octane leak the previous
 * tenant's config to the next request. That is a security bug.
 * Every hook is authored + reviewed as a matched pair.
 *
 * ## Octane-safety rules (from `.kiro/steering/tenancy-hooks.md`)
 *
 *  1. Symmetric — `onTenantInitialized` and `onTenantEnded` are
 *     always paired.
 *  2. Idempotent — both callbacks tolerate being invoked twice
 *     against the same tenant (nested `Tenancy::runInTenant`).
 *  3. No throws — log + swallow. Broken hooks are ops issues,
 *     never request failures.
 *  4. Constructor-inject deps via container attributes; no
 *     facades in the hook body.
 *  5. Accept `null` tenant — central-context invocations pass
 *     `null`. Return early rather than throwing.
 *
 * ## NOT a Bootstrapper
 *
 * `BootstrapperInterface` fires ONCE per framework boot and gets
 * cached. `TenancyHookInterface` fires per-tenant, per-request and
 * never gets cached. ADR 0020 enumerates the split; never conflate.
 *
 * @see TenantHookContext                                            Payload every callback receives.
 * @see AsTenancyHook          Marker attribute for auto-discovery.
 * @see TenancyHookRegistry       Ordered registry.
 * @see TenancyHookDispatcher Fires the callbacks.
 * @see BootstrapperInterface   Sibling app-boot lifecycle (ADR 0020).
 *
 * @category TenancyHook
 *
 * @since    0.1.0
 */
interface TenancyHookInterface
{
    /**
     * Apply tenant-scoped state to shared runtime services.
     *
     * Called by {@see TenancyHookDispatcher::fireInit()}
     * for every registered hook in priority-ascending order. Errors
     * thrown here are caught + logged by the dispatcher — the hook
     * author never needs to guard.
     *
     * @param  TenantHookContext  $ctx  Immutable payload — container, tenant, metadata.
     */
    public function onTenantInitialized(TenantHookContext $ctx): void;

    /**
     * Reset every side effect applied by
     * {@see onTenantInitialized()}.
     *
     * Called by {@see TenancyHookDispatcher::fireEnd()}
     * for every registered hook in priority-DESCENDING order so
     * teardown mirrors setup. Errors thrown here are caught +
     * logged by the dispatcher.
     *
     * @param  TenantHookContext  $ctx  Immutable payload — container, tenant, metadata.
     */
    public function onTenantEnded(TenantHookContext $ctx): void;
}
