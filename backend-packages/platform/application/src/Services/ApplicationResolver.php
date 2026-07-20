<?php

declare(strict_types=1);

namespace Academorix\Application\Services;

use Academorix\Application\Contracts\Repositories\ApplicationRepositoryInterface;
use Academorix\Application\Models\Application;
use Illuminate\Container\Attributes\Scoped;

/**
 * Request-scoped Application context.
 *
 * Populated by {@see \Academorix\Application\Middleware\ResolveApplication}
 * on every request that carries a resolvable host / `X-Application-Id`
 * header. Every domain module reads through this resolver — never
 * `request()->attribute` scans, never facade lookups.
 *
 * `#[Scoped]` per `.kiro/steering/octane-first-di.md` §2 — the context
 * IS request-scoped and Octane's `flushState()` discards it between
 * requests.
 *
 * Consumers type-hint the concrete class directly — no interface
 * layer here because the resolver IS the abstraction. The container
 * auto-resolves concrete classes so no `#[Bind]` wiring is required.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[Scoped]
final class ApplicationResolver
{
    private ?Application $application = null;

    public function __construct(
        private readonly ApplicationRepositoryInterface $applications,
    ) {}

    /**
     * Bind the current Application for the rest of the request.
     * Called from `ResolveApplication` middleware after host resolution.
     */
    public function bind(Application $application): void
    {
        $this->application = $application;
    }

    /**
     * Bind by primary-key lookup — used by console commands + queue
     * workers to re-establish context from a stored id.
     */
    public function bindById(string $id): void
    {
        $this->application = $this->applications->findOrFail($id);
    }

    /**
     * Bind by host lookup — the common middleware path.
     */
    public function bindByHost(string $host): ?Application
    {
        $this->application = $this->applications->findByHost($host);
        return $this->application;
    }

    /**
     * The current Application id, or `null` when no context is bound.
     * Read by `BelongsToApplication::resolveApplicationIdForFill()`.
     */
    public function currentId(): ?string
    {
        return $this->application?->getKey();
    }

    /**
     * The current Application model, or `null`.
     */
    public function current(): ?Application
    {
        return $this->application;
    }

    /**
     * Assert-flavoured accessor — throws when no context is bound.
     *
     * @throws \RuntimeException  When no Application is bound to this scope.
     */
    public function currentOrFail(): Application
    {
        return $this->application
            ?? throw new \RuntimeException(
                'No Application bound to the current request scope — '
                .'is `resolve.application` middleware applied to this route?',
            );
    }
}
