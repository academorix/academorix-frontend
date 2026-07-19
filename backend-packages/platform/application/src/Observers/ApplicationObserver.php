<?php

declare(strict_types=1);

namespace Academorix\Application\Observers;

use Academorix\Application\Contracts\Data\ApplicationInterface;
use Academorix\Application\Events\ApplicationDisabled;
use Academorix\Application\Events\ApplicationEnabled;
use Academorix\Application\Exceptions\SystemRowImmutableException;
use Academorix\Application\Models\Application;
use Illuminate\Support\Facades\Event;

/**
 * Model observer for {@see Application}.
 *
 * Wired via `#[ObservedBy(ApplicationObserver::class)]` on the model.
 * Two jobs: emit lifecycle events on state transitions, and refuse
 * mutations on `is_system = true` rows.
 *
 * @category Application
 *
 * @since    0.1.0
 */
final class ApplicationObserver
{
    /**
     * Refuse mutations on system rows outside a sanctioned scope.
     *
     * (Application doesn't currently expose an `allowSystemMutation()`
     * scope — system rows are seeded only via bootstrappers that
     * short-circuit around Eloquent. If tests need to fixture a
     * system Application, add the scope on the model.)
     *
     * @throws SystemRowImmutableException  When the write touches a system row.
     */
    public function saving(Application $application): void
    {
        // Only guard mutations to existing system rows — the initial
        // creation of an `is_system = true` row is legitimate (seeder /
        // bootstrapper path).
        if (! $application->exists) {
            return;
        }

        if ($application->getOriginal(ApplicationInterface::ATTR_IS_SYSTEM) !== true) {
            return;
        }

        throw SystemRowImmutableException::forAction(
            model: Application::class,
            action: 'update',
            rowId: (string) $application->getKey(),
        );
    }

    /**
     * Refuse deletes on system rows.
     *
     * @throws SystemRowImmutableException
     */
    public function deleting(Application $application): void
    {
        if ($application->{ApplicationInterface::ATTR_IS_SYSTEM} !== true) {
            return;
        }

        throw SystemRowImmutableException::forAction(
            model: Application::class,
            action: 'delete',
            rowId: (string) $application->getKey(),
        );
    }

    /**
     * Emit `ApplicationEnabled` on soft-delete restore.
     */
    public function restored(Application $application): void
    {
        Event::dispatch(new ApplicationEnabled($application));
    }

    /**
     * Emit `ApplicationDisabled` on soft-delete.
     */
    public function deleted(Application $application): void
    {
        Event::dispatch(new ApplicationDisabled($application));
    }
}
