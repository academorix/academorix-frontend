<?php

declare(strict_types=1);

namespace Academorix\ServiceProvider\Support;

use Academorix\ServiceProvider\Contracts\TenancyHookInterface;
use Academorix\ServiceProvider\Dispatchers\TenancyHookDispatcher;
use Illuminate\Contracts\Container\Container;

/**
 * Value object handed to every {@see TenancyHookInterface}
 * invocation.
 *
 * ## What this class owns
 *
 *  * `container` — the request-scoped container so hooks can
 *    resolve additional collaborators without reaching for facades.
 *  * `tenant` — the current tenant (nullable so central-context
 *    invocations pass `null` without a special sentinel).
 *  * `metadata` — free-form bag for cross-hook communication.
 *    Rarely used, but reserved so hook authors don't need to add
 *    another class when a signal must flow between hooks.
 *
 * `final readonly` — the context is immutable per invocation.
 * Hook authors never mutate it; the dispatcher constructs one per
 * `fireInit()` / `fireEnd()` call.
 *
 * @see TenancyHookInterface Consumer contract.
 * @see TenancyHookDispatcher Constructs one per fire.
 *
 * @category TenancyHook
 *
 * @since    0.1.0
 */
final readonly class TenantHookContext
{
    /**
     * @param  Container  $container  Request-scoped container for on-demand collaborator resolution.
     * @param  object|null  $tenant  Active tenant, or `null` when the invocation targets the central context.
     * @param  array<string, mixed>  $metadata  Free-form bag for cross-hook signalling; empty by default.
     */
    public function __construct(
        public Container $container,
        public ?object $tenant = null,
        public array $metadata = [],
    ) {}
}
