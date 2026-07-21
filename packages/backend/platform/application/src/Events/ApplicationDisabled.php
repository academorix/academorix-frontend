<?php

declare(strict_types=1);

namespace Stackra\Application\Events;

use Stackra\Application\Models\Application;
use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when an Application is soft-deleted.
 *
 * Fires from {@see \Stackra\Application\Observers\ApplicationObserver::deleted()}.
 * `ShouldDispatchAfterCommit` — the dispatcher defers firing until the
 * enclosing transaction commits. Consumers should DISABLE — never delete
 * — downstream state (Tenants, Roles, Permissions) since the Application
 * can be restored.
 *
 * `#[AsEvent(name: 'application.application.disabled')]` marks this class
 * for the events package's boot-time discovery. Every listener carrying
 * a matching `#[OnEvent(ApplicationDisabled::class)]` is wired to the
 * dispatcher automatically.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'application.application.disabled')]
final readonly class ApplicationDisabled implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Application  $application  The row that was disabled.
     */
    public function __construct(public Application $application)
    {
    }
}
