<?php

declare(strict_types=1);

/**
 * @file packages/service-provider/src/Concerns/ManagesLifecycle.php
 *
 * @description
 * Fires {@see ModuleLifecycleEvent} events during the register and
 * boot phases so other parts of the application can react to
 * module boot progress (monitoring dashboards, boot logs, dependency
 * order checks, health probes).
 *
 * ## Attribute-first — Terminatable is gone
 *
 * The historical `Terminatable::terminating()` interface was
 * deleted; post-response cleanup is now driven purely by
 * `#[OnTerminate]` method attributes (see
 * {@see RegistersHooks::registerTerminateAttributes()}). The
 * interface added a second way to do the same thing — every
 * provider that shipped a `terminating()` method could just as
 * well annotate any method with `#[OnTerminate]`. We keep the
 * single, attribute-driven surface.
 *
 * @category Concerns
 *
 * @since    1.0.0
 */

namespace Stackra\ServiceProvider\Concerns;

use Stackra\ServiceProvider\Enums\ModuleLifecycleEvent;

/**
 * Fires module lifecycle events at REGISTERING / REGISTERED /
 * BOOTING / BOOTED transitions.
 *
 * Every event carries the module's identity payload (name,
 * namespace, path) so listeners can filter by module.
 */
trait ManagesLifecycle
{
    /**
     * Fire a module lifecycle event.
     *
     * Dispatches a Laravel event with the module's context data.
     * Other parts of the application can listen to these events
     * for monitoring, logging, or integration purposes.
     *
     * The event name is the enum's string value
     * (`module.registering`, `module.registered`, `module.booting`,
     * `module.booted`) — listeners subscribe by string name via
     * `Event::listen('module.booted', ...)` or by enum value
     * lookup.
     *
     * @param  ModuleLifecycleEvent  $event  The lifecycle event to fire.
     */
    protected function fireEvent(ModuleLifecycleEvent $event): void
    {
        event($event->value, [
            'module' => $this->resolvedModuleName ?: 'unknown',
            'namespace' => $this->resolvedModuleNamespace ?: '',
            'path' => $this->resolvedModulePath ?? null,
        ]);
    }
}
