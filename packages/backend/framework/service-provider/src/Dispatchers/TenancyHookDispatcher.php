<?php

declare(strict_types=1);

namespace Stackra\ServiceProvider\Dispatchers;

use Stackra\ServiceProvider\Contracts\TenancyHookInterface;
use Stackra\ServiceProvider\Registry\TenancyHookRegistry;
use Stackra\ServiceProvider\Support\TenantHookContext;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Container\Container;
use Psr\Log\LoggerInterface;
use Throwable;

/**
 * Fires every registered {@see TenancyHookInterface} on tenant
 * init + tenant end.
 *
 * ## What this class owns
 *
 *  * `fireInit()` — iterate the registry in priority-ascending
 *    order, resolve each hook through the container, call
 *    `onTenantInitialized()`. Errors logged + swallowed per hook.
 *  * `fireEnd()`  — iterate in priority-DESCENDING order for
 *    symmetric teardown, call `onTenantEnded()`. Errors logged +
 *    swallowed per hook.
 *  * `TenantHookContext` construction — one per fire, capturing
 *    the current container, the tenant, and optional metadata.
 *
 * ## Why `#[Scoped]`
 *
 * The dispatcher touches per-request state (the tenant, the
 * request-scoped container). Scoped bindings reset between
 * requests under Octane so a stale reference to the previous
 * request's tenant cannot leak. See `.kiro/steering/octane-first-di.md`
 * for the rule set.
 *
 * ## Where this fires from
 *
 * Tenancy initialization code (middleware, artisan tenant-scope
 * commands, queue tenant-aware job handlers) resolves this
 * dispatcher and calls `fireInit()` / `fireEnd()` around the
 * tenant-scoped block:
 *
 * ```php
 * $this->dispatcher->fireInit($tenant);
 * try {
 *     return $next($request);
 * } finally {
 *     $this->dispatcher->fireEnd($tenant);
 * }
 * ```
 *
 * TODO(phase-10-tenancy-init): the current tenancy module
 * (`apps/api/src/modules/tenancy/`) delegates tenancy resolution
 * to `stancl/tenancy` — the `InitializeTenancyByDomain` middleware
 * dispatches `Stancl\Tenancy\Events\TenancyInitialized` /
 * `TenancyEnded` events. Phase 10 (api tenancy modernization,
 * task 10.15) wires a listener that resolves this dispatcher and
 * calls `fireInit($event->tenancy->tenant)` /
 * `fireEnd($event->tenancy->tenant)` on those events. Until then,
 * per-tenant hook registrations WILL NOT FIRE — the framework
 * primitive exists but the invocation site is a Phase 10
 * deliverable. Phase 8 (ai-service tenancy module) mirrors the
 * same wiring for the AI service's tenancy middleware.
 *
 * @see TenancyHookInterface  Contract for every registered hook.
 * @see TenancyHookRegistry   Registry iterated per fire.
 * @see TenantHookContext     Payload every callback receives.
 *
 * @category TenancyHook
 *
 * @since    0.1.0
 */
#[Scoped]
final class TenancyHookDispatcher
{
    /**
     * @param  TenancyHookRegistry  $registry  Ordered hook catalogue.
     * @param  Container  $container  Resolves each hook class.
     * @param  LoggerInterface  $log  Structured logger for per-hook errors + fire summary.
     */
    public function __construct(
        private readonly TenancyHookRegistry $registry,
        private readonly Container $container,
        #[Log] private readonly LoggerInterface $log,
    ) {}

    /**
     * Fire {@see TenancyHookInterface::onTenantInitialized()} on
     * every registered hook in priority-ASCENDING order.
     *
     * @param  object|null  $tenant  Active tenant, or `null` for central-context entry.
     * @param  array<string, mixed>  $metadata  Optional free-form bag passed through to the context.
     */
    public function fireInit(?object $tenant, array $metadata = []): void
    {
        $ctx = new TenantHookContext(
            container: $this->container,
            tenant: $tenant,
            metadata: $metadata,
        );

        $fired = 0;
        $errors = 0;

        foreach ($this->registry->all() as $class) {
            try {
                $hook = $this->resolve($class);
                $hook->onTenantInitialized($ctx);
                $fired++;
            } catch (Throwable $e) {
                $errors++;
                $this->log->error('tenancy hook onTenantInitialized failed', [
                    'class' => $class,
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        $this->log->info('tenancy hooks fired: init', [
            'tenant' => $tenant !== null && method_exists($tenant, 'getKey')
                ? $tenant->getKey()
                : null,
            'fired' => $fired,
            'errors' => $errors,
        ]);
    }

    /**
     * Fire {@see TenancyHookInterface::onTenantEnded()} on every
     * registered hook in priority-DESCENDING order (symmetric
     * teardown).
     *
     * @param  object|null  $tenant  Tenant that is ending, or `null` when reverting to central context.
     * @param  array<string, mixed>  $metadata  Optional free-form bag passed through to the context.
     */
    public function fireEnd(?object $tenant, array $metadata = []): void
    {
        $ctx = new TenantHookContext(
            container: $this->container,
            tenant: $tenant,
            metadata: $metadata,
        );

        $fired = 0;
        $errors = 0;

        foreach ($this->registry->allReversed() as $class) {
            try {
                $hook = $this->resolve($class);
                $hook->onTenantEnded($ctx);
                $fired++;
            } catch (Throwable $e) {
                $errors++;
                $this->log->error('tenancy hook onTenantEnded failed', [
                    'class' => $class,
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        $this->log->info('tenancy hooks fired: end', [
            'tenant' => $tenant !== null && method_exists($tenant, 'getKey')
                ? $tenant->getKey()
                : null,
            'fired' => $fired,
            'errors' => $errors,
        ]);
    }

    /**
     * Resolve a hook class through the container.
     *
     * @param  class-string<TenancyHookInterface>  $class
     */
    private function resolve(string $class): TenancyHookInterface
    {
        /** @var TenancyHookInterface $hook */
        $hook = $this->container->make($class);

        return $hook;
    }
}
