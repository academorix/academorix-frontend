<?php

declare(strict_types=1);

namespace Academorix\Application\Events;

use Academorix\Application\Models\Application;
use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when an Application is restored from soft-delete.
 *
 * Fires from {@see \Academorix\Application\Observers\ApplicationObserver::restored()}.
 * `ShouldDispatchAfterCommit` — listeners fire only after the
 * enclosing transaction commits (per `.kiro/steering/domain-patterns.md`
 * §7). Consumers: audit trail, downstream cache invalidation,
 * per-service JWKS re-cache.
 *
 * `#[AsEvent(name: 'application.application.enabled')]` marks this class
 * for the events package's boot-time discovery.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'application.application.enabled')]
final readonly class ApplicationEnabled implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Application  $application  The row that was enabled.
     */
    public function __construct(public Application $application)
    {
    }
}
